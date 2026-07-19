<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, Film, Clock, Star, TrendingUp, Loader2 } from 'lucide-svelte';
	import { StatService } from '$lib/services';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];
	const YEARS = ['all', '2026', '2025', '2024', '2023'];

	let stats = $state<any>(null);
	let isLoading = $state(true);
	let selectedYear = $state('all');

	$effect(() => {
		auth.requireAuth();
	});

	async function fetchStats(year: string) {
		isLoading = true;
		try {
			stats = await StatService.getStats(year === 'all' ? null : year);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load stats');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => fetchStats(selectedYear));

	$effect(() => {
		const y = selectedYear;
		fetchStats(y);
	});

	// Derived chart data
	let decadeData = $derived(
		stats ? Object.entries(stats.decades || {}).map(([name, count]) => ({ name, count })) : []
	);
	let maxDecadeCount = $derived(
		decadeData.length > 0 ? Math.max(...decadeData.map((d: any) => Number(d.count))) : 1
	);
</script>

<svelte:head>
	<title>Your Stats · Velvet</title>
</svelte:head>

{#if isLoading}
	<main class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</main>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<div class="container mx-auto max-w-5xl px-4 py-12 space-y-8">
			<!-- Header -->
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<a
						href="/profile"
						class="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all shadow-sm"
					>
						<ArrowLeft class="size-5" />
					</a>
					<div>
						<h1 class="text-3xl font-extrabold tracking-tight">Your Stats Dashboard</h1>
						<p class="text-muted-foreground text-sm mt-1">A deep dive into your viewing habits.</p>
					</div>
				</div>
				<!-- Year filter -->
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-muted-foreground">Filter by Year:</span>
					<select
						bind:value={selectedYear}
						class="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary"
					>
						{#each YEARS as y (y)}
							<option value={y}>{y === 'all' ? 'All-Time' : y}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if !stats}
				<div
					class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center"
				>
					<p class="text-muted-foreground">Log more movies to see your stats.</p>
				</div>
			{:else}
				<!-- Overview row -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					{#each [
						{ icon: Film, label: 'Total Films', value: stats.overview?.total_movies || 0 },
						{ icon: Clock, label: 'Total Hours', value: stats.overview?.total_hours || 0 },
						{ icon: Star, label: 'Avg Rating', value: Number(stats.overview?.avg_rating || 0).toFixed(1) },
						{ icon: TrendingUp, label: 'This Year', value: stats.comparison?.this_year || 0, sub: `${stats.comparison?.growth > 0 ? '+' : ''}${stats.comparison?.growth ?? 0} vs last year` }
					] as card (card.label)}
						<div class="rounded-xl border border-primary/10 bg-card p-5 shadow-lg">
							<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
								<card.icon class="size-4 text-primary" />
								{card.label}
							</div>
							<div class="text-3xl font-bold">{card.value}</div>
							{#if card.sub}
								<p class="text-xs text-muted-foreground mt-1">{card.sub}</p>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Charts row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Decades chart (custom SVG bar chart) -->
					<div class="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
						<h2 class="text-lg font-semibold mb-4">Decades Breakdown</h2>
						{#if decadeData.length > 0}
							<div class="space-y-3">
								{#each decadeData as d (d.name)}
									<div class="flex items-center gap-3">
										<span class="w-12 shrink-0 text-xs text-muted-foreground text-right"
											>{d.name}</span
										>
										<div class="relative flex-1 h-6 rounded-sm bg-muted overflow-hidden">
											<div
												class="h-full rounded-sm bg-primary transition-all duration-500"
												style="width: {Math.round((Number(d.count) / maxDecadeCount) * 100)}%"
											></div>
										</div>
										<span class="w-6 shrink-0 text-xs font-medium text-foreground">{d.count}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="flex h-40 items-center justify-center text-muted-foreground text-sm">
								Not enough data yet
							</div>
						{/if}
					</div>

					<!-- Top genres -->
					<div class="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
						<h2 class="text-lg font-semibold mb-4">Top Genres</h2>
						{#if stats.top_genres?.length > 0}
							<div class="space-y-2">
								{#each stats.top_genres.slice(0, 6) as genre, i (i)}
									<div class="flex items-center justify-between py-1">
										<div class="flex items-center gap-2">
											<div
												class="size-3 rounded-full"
												style="background-color: {COLORS[i % COLORS.length]}"
											></div>
											<span class="text-sm font-medium"
												>{genre.movie__genres__name || genre.name || 'Unknown'}</span
											>
										</div>
										<span class="text-sm text-muted-foreground"
											>{genre.c || genre.count} films</span
										>
									</div>
								{/each}
							</div>
						{:else}
							<div class="flex h-40 items-center justify-center text-muted-foreground text-sm">
								Not enough data yet
							</div>
						{/if}
					</div>
				</div>

				<!-- Actors & Directors row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
						<h2 class="text-lg font-semibold mb-4">Most Watched Actors</h2>
						{#if stats.top_actors?.length > 0}
							<div class="space-y-3 max-h-72 overflow-y-auto pr-1">
								{#each stats.top_actors as actor, i (i)}
									<div class="flex items-center justify-between">
										<span class="font-medium text-sm"
											>{actor.movie__castmembership__person__name}</span
										>
										<span class="text-muted-foreground text-xs">{actor.count} films</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">Log some movies to see actors.</p>
						{/if}
					</div>

					<div class="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
						<h2 class="text-lg font-semibold mb-4">Most Watched Directors</h2>
						{#if stats.top_directors?.length > 0}
							<div class="space-y-3 max-h-72 overflow-y-auto pr-1">
								{#each stats.top_directors as director, i (i)}
									<div class="flex items-center justify-between">
										<span class="font-medium text-sm"
											>{director.movie__crewmembership__person__name}</span
										>
										<span class="text-muted-foreground text-xs">{director.count} films</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">Log some movies to see directors.</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</main>
{/if}
