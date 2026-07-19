<script lang="ts">
	import { onMount } from 'svelte';
	import { Compass, SlidersHorizontal, Star } from 'lucide-svelte';
	import { MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import * as Select from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton';

	const GENRES = [
		{ id: 'all', name: 'All Genres' },
		{ id: '28', name: 'Action' },
		{ id: '35', name: 'Comedy' },
		{ id: '18', name: 'Drama' },
		{ id: '27', name: 'Horror' },
		{ id: '10749', name: 'Romance' },
		{ id: '878', name: 'Science Fiction' },
		{ id: '53', name: 'Thriller' }
	];

	const DECADES = [
		{ id: 'all', name: 'All Decades' },
		{ id: '2020', name: '2020s', min: '2020-01-01', max: '2029-12-31' },
		{ id: '2010', name: '2010s', min: '2010-01-01', max: '2019-12-31' },
		{ id: '2000', name: '2000s', min: '2000-01-01', max: '2009-12-31' },
		{ id: '1990', name: '1990s', min: '1990-01-01', max: '1999-12-31' },
		{ id: '1980', name: '1980s', min: '1980-01-01', max: '1989-12-31' }
	];

	const SORTS = [
		{ id: 'popularity.desc', name: 'Popularity' },
		{ id: 'vote_average.desc', name: 'Highest Rated' },
		{ id: 'primary_release_date.desc', name: 'Newest Releases' }
	];

	let movies = $state<any[]>([]);
	let isLoading = $state(true);

	let genre = $state('all');
	let decade = $state('all');
	let sort = $state('popularity.desc');

	$effect(() => {
		let mounted = true;

		async function fetchMovies() {
			isLoading = true;
			try {
				const filters: any = { sort_by: sort };
				if (genre && genre !== 'all') filters.with_genres = genre;

				if (decade && decade !== 'all') {
					const dec = DECADES.find((d) => d.id === decade);
					if (dec) {
						filters['primary_release_date.gte'] = dec.min;
						filters['primary_release_date.lte'] = dec.max;
					}
				}

				const data = await MovieService.explore(filters);
				if (!mounted) return;

				const results = Array.isArray(data) ? data : data?.movies || data?.results || [];
				movies = results;
			} catch (error) {
				console.error(error);
			} finally {
				if (mounted) isLoading = false;
			}
		}

		fetchMovies();

		return () => {
			mounted = false;
		};
	});
</script>

<main class="min-h-screen bg-background pt-16">
	<div class="container mx-auto max-w-7xl px-4 py-8">
		<div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-6">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight flex items-center gap-3">
					<Compass class="size-8 text-primary" />
					Explore
				</h1>
				<p class="text-muted-foreground mt-2">Discover new films by genre, decade, and popularity.</p>
			</div>

			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2">
					<SlidersHorizontal class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-muted-foreground">Filters:</span>
				</div>

				<Select.Root type="single" bind:value={sort}>
					<Select.Trigger class="w-[140px] bg-card">
						{SORTS.find(s => s.id === sort)?.name || 'Sort by'}
					</Select.Trigger>
					<Select.Content preventScroll={false}>
						{#each SORTS as s}
							<Select.Item value={s.id}>{s.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={genre}>
					<Select.Trigger class="w-[140px] bg-card">
						{GENRES.find(g => g.id === genre)?.name || 'Genre'}
					</Select.Trigger>
					<Select.Content preventScroll={false}>
						{#each GENRES as g}
							<Select.Item value={g.id}>{g.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={decade}>
					<Select.Trigger class="w-[140px] bg-card">
						{DECADES.find(d => d.id === decade)?.name || 'Decade'}
					</Select.Trigger>
					<Select.Content preventScroll={false}>
						{#each DECADES as d}
							<Select.Item value={d.id}>{d.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		{#if isLoading}
			<div class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{#each Array(18) as _}
					<div class="flex flex-col gap-2">
						<Skeleton class="aspect-[2/3] w-full rounded-xl" />
						<Skeleton class="h-4 w-3/4" />
					</div>
				{/each}
			</div>
		{:else if movies.length === 0}
			<div class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50">
				<p class="text-lg font-medium text-muted-foreground">No movies found matching your criteria.</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{#each movies as movie (movie.tmdb_id || movie.id)}
					{@const poster = movie.poster_url || movie.poster_path}
					<div class="group relative">
						<a href={`/movie?id=${movie.tmdb_id || movie.id}`} class="block">
							<div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40">
								<img
									src={getImageUrl(poster, 'w500')}
									alt={movie.title}
									class="object-cover w-full h-full"
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
									<span class="text-[11px] font-semibold text-muted-foreground/70 line-clamp-3 leading-tight">{movie.title}</span>
								</div>
								<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
								{#if movie.rating > 0 || movie.vote_average > 0}
									<div class="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
										<Star class="size-3 fill-amber-400 text-amber-400" />
										<span class="text-xs font-semibold text-white">
											{Number(movie.rating || movie.vote_average).toFixed(1)}
										</span>
									</div>
								{/if}
							</div>
						</a>
						<h3 class="mt-2 truncate text-sm font-semibold transition-colors group-hover:text-primary px-0.5">
							{movie.title}
						</h3>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>
