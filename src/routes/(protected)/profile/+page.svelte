<script lang="ts">
	import { page } from '$app/stores'
</script>

{#if $page.data.user}
	<h2>Wilkommen {$page.data.user.discordUserDataRequestJSON.username}!</h2>
{/if}

{#if $page.data.user.role === 'ADMIN'}
	<form action="/logout" method="POST">
		<button type="submit">Log out</button>
	</form>
{/if}
