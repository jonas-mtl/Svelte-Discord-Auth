import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const returnCode = url.searchParams.get('href')

	throw redirect(302, `/${returnCode}`)
}
