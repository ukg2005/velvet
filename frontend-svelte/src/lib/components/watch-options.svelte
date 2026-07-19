<script lang="ts">
	import { Tv, ShoppingCart, DollarSign } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	interface WatchOption {
		provider: string;
		type: 'stream' | 'rent' | 'buy';
		logo: string;
		link?: string;
	}

	let { options } = $props<{
		options: WatchOption[];
	}>();

	let streamOptions = $derived(options.filter((o) => o.type === 'stream'));
	let rentOptions = $derived(options.filter((o) => o.type === 'rent'));
	let buyOptions = $derived(options.filter((o) => o.type === 'buy'));
</script>

{#snippet OptionGroup(title: string, opts: WatchOption[], type: 'stream' | 'rent' | 'buy')}
	{#if opts.length > 0}
		<div class="space-y-3 text-left">
			<div class="flex items-center gap-2">
				{#if type === 'stream'}
					<Tv class="size-4" />
				{:else if type === 'rent'}
					<DollarSign class="size-4" />
				{:else if type === 'buy'}
					<ShoppingCart class="size-4" />
				{/if}

				<h3 class="text-sm font-medium text-foreground">{title}</h3>
				<Badge
					variant="secondary"
					class={type === 'stream'
						? 'bg-primary/20 text-primary hover:bg-primary/30'
						: type === 'rent'
							? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
							: 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'}
				>
					{opts.length}
				</Badge>
			</div>
			<div class="flex flex-wrap gap-3">
				{#each opts as option (option.provider)}
					<a
						href={option.link || '#'}
						target={option.link ? '_blank' : undefined}
						rel={option.link ? 'noopener noreferrer' : undefined}
						class="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary hover:bg-card/80"
					>
						<div
							class="relative size-10 overflow-hidden rounded-md flex items-center justify-center bg-muted"
						>
							{#if option.logo}
								<img src={option.logo} alt={option.provider} class="object-cover w-full h-full" />
							{:else}
								<span class="text-xs font-bold text-muted-foreground">{option.provider[0]}</span>
							{/if}
						</div>
						<span class="text-sm font-medium text-foreground group-hover:text-primary">
							{option.provider}
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<section class="mt-10 md:mt-14 text-left">
	<h2 class="text-xl font-semibold text-foreground">Where to Watch</h2>
	<div class="mt-6 space-y-6">
		{@render OptionGroup('Stream', streamOptions, 'stream')}
		{@render OptionGroup('Rent', rentOptions, 'rent')}
		{@render OptionGroup('Buy', buyOptions, 'buy')}
	</div>
</section>
