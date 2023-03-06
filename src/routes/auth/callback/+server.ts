import {
	VITE_DISCORD_CLIENT_ID,
	VITE_DISCORD_API_URL,
	VITE_DISCORD_CLIENT_SECRET,
	VITE_DISCORD_REDIRECT_URI,
	ENCRYPTION_KEY,
	ENABLE_DB,
} from '$env/static/private';

import { redirect } from '@sveltejs/kit';
import CryptoJS from 'crypto-js';

import type { IUser } from '$lib/Schemas/userProfile.js';
import DB, { Roles } from '$lib/Schemas/userProfile.js';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ url, cookies, locals }: any) {
	// redirect user if logged in
	if (locals.user) {
		throw redirect(302, '/');
	}

	const returnCode = url.searchParams.get('code');
	const hrefUrl = url.searchParams.get('href');

	// fetch access & refresh token
	const dataObject = {
		client_id: VITE_DISCORD_CLIENT_ID,
		client_secret: VITE_DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		redirect_uri: VITE_DISCORD_REDIRECT_URI,
		code: returnCode,
		scope: 'identify email guilds',
	};

	const discordCodeRequest = await fetch(
		'https://discord.com/api/oauth2/token',
		{
			method: 'POST',
			body: new URLSearchParams(dataObject as any),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		}
	);

	const discordCodeRequestJSON = await discordCodeRequest.json();

	// fetch userdata
	const discordUserDataRequest = await fetch(
		`${VITE_DISCORD_API_URL}/users/@me`,
		{
			headers: {
				Authorization: `Bearer ${discordCodeRequestJSON.access_token}`,
			},
		}
	);
	const discordUserDataRequestJSON = await discordUserDataRequest.json();

	if (ENABLE_DB === 'true') {
		// check if user exists in database
		let dbUser: IUser;

		dbUser = (await DB.findOne({
			userID: discordUserDataRequestJSON.id,
		}).catch(() => {})) as IUser;

		// create or update database user
		if (!dbUser) {
			dbUser = (await DB.create({
				userID: discordUserDataRequestJSON.id,
				accessToken: discordCodeRequestJSON.access_token,
				refreshToken: discordCodeRequestJSON.refresh_token,
				dcData: discordUserDataRequestJSON,
				role: Roles.USER,
			}).catch(async (err: Error) => {
				console.log(err);
			})) as IUser;
		} else {
			dbUser = (await dbUser
				.updateOne({
					userID: discordUserDataRequestJSON.id,
					accessToken: discordCodeRequestJSON.access_token,
					refreshToken: discordCodeRequestJSON.refresh_token,
					dcData: discordUserDataRequestJSON,
					role: Roles.USER,
				})
				.catch(async (err: Error) => {
					console.log(err);
				})) as IUser;
		}
	}

	// set cookies
	cookies.set('dc_session_access', discordCodeRequestJSON.access_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: discordCodeRequestJSON.expires_in,
	});

	cookies.set('dc_session_refresh', discordCodeRequestJSON.refresh_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 30 * 24 * 60 * 60 * 1000,
	});

	// redirect the user
	const urlRedirect = `/${
		hrefUrl != undefined ? hrefUrl : 'profile'
	}?token=${CryptoJS.AES.encrypt(
		discordCodeRequestJSON.access_token,
		ENCRYPTION_KEY
	)}&expires=${
		discordCodeRequestJSON.expires_in
	}&refresh=${CryptoJS.AES.encrypt(
		discordCodeRequestJSON.refresh_token,
		ENCRYPTION_KEY
	)}`;

	throw redirect(302, urlRedirect);
}
