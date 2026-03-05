<script lang="ts">
	import { user_store } from '$lib/store/user.svelte';
	import { enhance } from '$app/forms';
	let formElement = $state<null | HTMLFormElement>(null);

	$effect.pre(() => {
		user_store.unauthenticate();
		formElement?.requestSubmit();
	});
</script>

<form bind:this={formElement} method="POST" use:enhance></form>
