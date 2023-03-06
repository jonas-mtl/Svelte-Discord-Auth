import { redirect } from '@sveltejs/kit';

import {
	VITE_DISCORD_CLIENT_ID,
	VITE_DISCORD_REDIRECT_URI,
} from '$env/static/private';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const hrefUrl = url.searchParams.get('href');
	const DISCORD_ENDPOINT = `https://discord.com/api/oauth2/authorize?client_id=${VITE_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
		`${VITE_DISCORD_REDIRECT_URI}${
			hrefUrl != undefined ? `?href=${hrefUrl}&` : ''
		}`
	)}&response_type=code&scope=identify%20email%20guilds`;

	throw redirect(302, DISCORD_ENDPOINT);
};
