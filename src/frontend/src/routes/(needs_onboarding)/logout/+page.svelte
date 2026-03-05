<script lang="ts">
	import { user_store } from '$lib/store/user.svelte';
	import { onMount } from 'svelte';

	let formElement = $state<null | HTMLFormElement>(null);

	onMount(() => {
		user_store.unauthenticate();
		formElement?.requestSubmit();
	});
</script>

<form bind:this={formElement} method="POST"></form>
