<script lang="ts">
	import { Clapperboard, Star } from 'lucide-svelte';

	interface MovieCredit {
		id: string | number;
		title: string;
		character?: string;
		job?: string;
		release_date: string;
		poster_path: string;
		rating: number;
	}

	interface Props {
		creditsByDepartment: Record<string, MovieCredit[]>;
	}

	let { creditsByDepartment }: Props = $props();

	let departments = $derived(
		Object.keys(creditsByDepartment).sort((a, b) => {
			if (a === 'Acting') return -1;
			if (b === 'Acting') return 1;
			return creditsByDepartment[b].length - creditsByDepartment[a].length;
		})
	);

	let activeTab = $state('');

	// Sync activeTab when departments load
	$effect(() => {
		if (departments.length > 0 && (!activeTab || !departments.includes(activeTab))) {
			activeTab = departments[0];
		}
	});

	let isAnimating = $state(false);

	function handleTabChange(tab: string) {
		if (tab === activeTab) return;
		isAnimating = true;
		setTimeout(() => {
			activeTab = tab;
			setTimeout(() => {
				isAnimating = false;
			}, 50);
		}, 150);
	}

	let activeCredits = $derived(creditsByDepartment[activeTab] || []);
</script>

<section>
	<h2 class="mb-6 text-xl font-semibold text-foreground">Filmography</h2>

	<!-- Tabs -->
	<div class="mb-6 flex flex-wrap gap-2">
		{#each departments as dep}
			<button
				onclick={() => handleTabChange(dep)}
				class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 {activeTab === dep
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
					: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
			>
				<Clapperboard class="h-4 w-4" />
				{dep}
				<span
					class="rounded-full px-2 py-0.5 text-xs {activeTab === dep
						? 'bg-primary-foreground/20 text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					{creditsByDepartment[dep].length}
				</span>
			</button>
		{:else}
			<div class="text-sm text-muted-foreground">No credits departments found.</div>
		{/each}
	</div>

	<!-- Credits Grid -->
	<div
		class="transition-all duration-200 {isAnimating
			? 'opacity-0 translate-y-2'
			: 'opacity-100 translate-y-0'}"
	>
		{#if activeCredits.length > 0}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{#each activeCredits as credit, index (activeTab + '-' + credit.id + '-' + (credit.character || credit.job || 'credit') + '-' + index)}
					{@const poster = credit.poster_path}
					<a
						href="/movie?id={credit.id}"
						class="group block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					>
						<div class="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
							<img
								src={poster}
								alt={credit.title}
								class="h-full w-full object-cover"
								loading="lazy"
								onerror={(e) => { 
									const img = e.currentTarget;
									img.style.display = 'none'; 
									const next = img.nextElementSibling;
									if (next) (next as any).style.display = 'flex';
								}}
							/>
							<div 
								class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800/80 to-neutral-950/90 p-3 text-center {poster ? '' : '!flex'}" 
								style={poster ? "display: none;" : ""}
							>
								<svg class="size-8 text-muted-foreground/40 mb-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>
								</svg>
								<span class="text-[11px] font-semibold text-muted-foreground/70 line-clamp-3 leading-tight">{credit.title}</span>
							</div>
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
							<!-- Rating badge on hover -->
							{#if credit.rating > 0}
								<div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Star class="size-3 fill-primary text-primary" />
									<span class="text-xs font-medium text-foreground">
										{credit.rating.toFixed(1)}
									</span>
								</div>
							{/if}
						</div>

						<div class="mt-2 space-y-0.5">
							<p class="truncate text-sm font-medium text-foreground">
								{credit.title}
							</p>
							<p class="truncate text-xs text-muted-foreground">
								{credit.character || credit.job} {#if credit.release_date}({credit.release_date}){/if}
							</p>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="rounded-xl bg-card p-12 text-center ring-1 ring-border">
				<p class="text-muted-foreground">
					No {activeTab} credits available.
				</p>
			</div>
		{/if}
	</div>
</section>
