import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.set('dc_session_access', '', {
		path: '/',
		expires: new Date(0),
	})

	cookies.set('dc_session_refresh', '', {
		path: '/',
		expires: new Date(0),
	})

	throw redirect(302, '/')
}
