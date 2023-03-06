import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { IUser } from '$lib/Schemas/userProfile.js'
import DB, { Roles } from '$lib/Schemas/userProfile.js'

export const load: PageServerLoad = async ({ locals }: any) => {
	// redirect user if not logged in

	const dbUser = (await DB.findOne({
		userID: locals.user.discordUserDataRequestJSON.id,
	}).catch(() => {})) as IUser
	console.log(dbUser)

	// create or update database user

	if (!locals.user) {
		throw redirect(302, '/')
	}
}
