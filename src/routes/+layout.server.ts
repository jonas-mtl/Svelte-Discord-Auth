import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { VITE_HOST } from '$env/static/private'

// get `locals.user` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ locals, url }) => {
	return {
		user: locals.user,
	}
}
