import type { Handle } from '@sveltejs/kit'

import {
	VITE_DISCORD_CLIENT_ID,
	VITE_DISCORD_API_URL,
	VITE_DISCORD_CLIENT_SECRET,
	VITE_DISCORD_REDIRECT_URI,
	ENCRYPTION_KEY,
} from '$env/static/private'

import DB, { Roles } from '$lib/Schemas/userProfile.js'
import CryptoJS from 'crypto-js'

function redirect(location: string) {
	return new Response(undefined, {
		status: 303,
		headers: { location },
	})
}

export const handle: Handle = async ({ event, resolve }) => {
	// get cookies from browser
	const sessionAccess = event.cookies.get('dc_session_access')
	if (!sessionAccess) {
		const sessionRefresh = event.cookies.get('dc_session_refresh')
		if (sessionRefresh) {
			const dataObject = {
				client_id: VITE_DISCORD_CLIENT_ID,
				client_secret: VITE_DISCORD_CLIENT_SECRET,
				grant_type: 'refresh_token',
				refresh_token: sessionRefresh,
			}
			// performing a fetch request to Discord's token endpoint
			const discordCodeRequest = await fetch(
				'https://discord.com/api/oauth2/token',
				{
					method: 'POST',
					body: new URLSearchParams(dataObject),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				}
			)

			const discordCodeRequestJSON = await discordCodeRequest.json()

			if (discordCodeRequestJSON.error) {
				return await resolve(event)
			} else {
				// fetch userdata
				const discordUserDataRequest = await fetch(
					`${VITE_DISCORD_API_URL}/users/@me`,
					{
						headers: {
							Authorization: `Bearer ${discordCodeRequestJSON.access_token}`,
						},
					}
				)
				const discordUserDataRequestJSON = await discordUserDataRequest.json()

				// set user store
				if (discordUserDataRequestJSON) {
					event.locals.user = {
						discordUserDataRequestJSON,
					}
				}

				// set new cookies
				event.cookies.set(
					'dc_session_access',
					discordCodeRequestJSON.access_token,
					{
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: process.env.NODE_ENV === 'production',
						maxAge: discordCodeRequestJSON.expires_in,
					}
				)

				event.cookies.set(
					'dc_session_refresh',
					discordCodeRequestJSON.refresh_token,
					{
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: process.env.NODE_ENV === 'production',
						maxAge: 30 * 24 * 60 * 60 * 1000,
					}
				)

				return await resolve(event)
			}
		} else {
			// protected routes
			if (
				event.url.href.includes('/profile?token=') &&
				event.url.href.includes('expires=') &&
				event.url.href.includes('refresh=')
			) {
				const urlToken = event.url.searchParams.get('token')

				const urlExpires = event.url.searchParams.get('expires')

				const urlRefresh = event.url.searchParams.get('refresh')!

				const decryptUrlToken = CryptoJS.AES.decrypt(
					urlToken!.toString().replaceAll(' ', '+'),
					ENCRYPTION_KEY
				).toString(CryptoJS.enc.Utf8)

				const decryptRefreshToken = CryptoJS.AES.decrypt(
					urlRefresh!.toString().replaceAll(' ', '+'),
					ENCRYPTION_KEY
				).toString(CryptoJS.enc.Utf8)

				///profile?token=U2FsdGVkX1/m5RvFjl6DbpLCusyphYzCKWNvxivX7qdCaPbbCRsgs+MPNGuUzwuD&expires=604800&refresh=U2FsdGVkX1+tpynMlpk1zLCp55o2YzxT4urvDJ4PWoDCdV33T/qzhUp5C+vIVIKb
				const discordUserDataRequest = await fetch(
					`${VITE_DISCORD_API_URL}/users/@me`,
					{
						headers: {
							Authorization: `Bearer ${decryptUrlToken}`,
						},
					}
				)
				const discordUserDataRequestJSON = await discordUserDataRequest.json()

				// set user store
				if (!discordUserDataRequestJSON.message) {
					event.cookies.set('dc_session_access', `${decryptUrlToken}`, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: process.env.NODE_ENV === 'production',
						maxAge: parseInt(`${urlExpires}`),
					})

					event.cookies.set('dc_session_refresh', `${decryptRefreshToken}`, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: process.env.NODE_ENV === 'production',
						maxAge: 30 * 24 * 60 * 60 * 1000,
					})

					event.locals.user = {
						discordUserDataRequestJSON,
					}
				} else {
					return redirect('/')
				}
			} else if (event.url.href.includes('/profile')) {
				return redirect('/')
			}
			//http://localhost:5173/profile?token=vANSko0fh26vvXuVlIvCoUEX17uyt1
			return await resolve(event)
		}
	} else {
		// fetch userdata
		const discordUserDataRequest = await fetch(
			`${VITE_DISCORD_API_URL}/users/@me`,
			{
				headers: {
					Authorization: `Bearer ${sessionAccess}`,
				},
			}
		)
		const discordUserDataRequestJSON = await discordUserDataRequest.json()

		// set user store
		if (discordUserDataRequestJSON) {
			event.locals.user = {
				discordUserDataRequestJSON,
			}
		}
	}

	// load page as normal
	return await resolve(event)
}
