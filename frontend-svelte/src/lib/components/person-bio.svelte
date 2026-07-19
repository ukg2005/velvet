<script lang="ts">
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		bio: string;
	}

	let { bio }: Props = $props();

	let isExpanded = $state(false);
	let shouldTruncate = $derived(bio ? bio.length > 500 : false);

	let displayBio = $derived(
		shouldTruncate && !isExpanded ? bio.slice(0, 500) + '...' : bio
	);
</script>

<section>
	<h2 class="mb-3 text-lg font-semibold text-foreground">Biography</h2>

	<div class="rounded-xl bg-card p-5 ring-1 ring-border">
		<p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
			{displayBio}
		</p>

		{#if shouldTruncate}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (isExpanded = !isExpanded)}
				class="mt-3 h-auto p-0 text-primary hover:text-primary/80"
			>
				{#if isExpanded}
					Show Less <ChevronUp class="ml-1 h-4 w-4" />
				{:else}
					Read More <ChevronDown class="ml-1 h-4 w-4" />
				{/if}
			</Button>
		{/if}
	</div>
</section>
