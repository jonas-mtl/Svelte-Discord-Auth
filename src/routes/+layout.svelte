<script lang="ts">
	import { page } from '$app/stores';

	import '../styles/app.css';
</script>

<svelte:head>
	<title>SvelteKit Discord Auth</title>
</svelte:head>

<nav>
	{#if !$page.data.user}
		<a href="/auth/login">Login</a>
		<a href="/register">Register</a>
		<a href="/auth/login?href=application">Apply</a>
	{/if}

	{#if $page.data.user}
		<a href="/profile">Profile</a>
		<a href="/application">Apply</a>
		<a href="/auth/logout">Log out</a>
	{/if}
</nav>

<main>
	<slot />
</main>
