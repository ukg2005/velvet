<script lang="ts">
	import '../app.css';
	import SiteHeader from '$lib/components/site-header.svelte';
	// import { Toaster } from '$lib/components/ui/sonner';
	
	let { children } = $props();
</script>

<div class="font-sans antialiased min-h-screen bg-background text-foreground">
	<SiteHeader />
	{@render children()}
	<!-- <Toaster /> -->
</div>
