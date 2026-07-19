<script lang="ts">
	import { onMount } from 'svelte';
	import HomeHero from '$lib/components/home-hero.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Star, TrendingUp, Trophy } from 'lucide-svelte';
	import { MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';

	interface Movie {
		id: string | number;
		tmdb_id?: string | number;
		title: string;
		poster_path?: string;
		poster_url?: string;
		backdrop_path?: string;
		backdrop_url?: string;
		score?: number;
		vote_average?: number;
		rating?: number | string;
		release_date?: string;
		year?: number;
	}

	let trendingMovies = $state<Movie[]>([]);
	let topRatedMovies = $state<Movie[]>([]);
	let featuredMovie = $state<Movie | null>(null);
	let isLoading = $state(true);

	$effect(() => {
		auth.requireAuth();
	});

	onMount(() => {
		let mounted = true;
		async function fetchMovies() {
			try {
				const [trending, topRated] = await Promise.all([
					MovieService.getTrending(),
					MovieService.getTopRated()
				]);

				if (!mounted) return;

				const trendingData = Array.isArray(trending) ? trending : trending.movies || trending.results || [];
				const topRatedData = Array.isArray(topRated) ? topRated : topRated.movies || topRated.results || [];

				trendingMovies = trendingData;
				topRatedMovies = topRatedData;

				if (trendingData.length > 0) {
					const featured = trendingData[0];
					featuredMovie = featured;

					const tmdbId = featured.tmdb_id || featured.id;
					if (tmdbId) {
						MovieService.getMovie(tmdbId)
							.then((detailed) => {
								if (mounted && detailed) featuredMovie = { ...featured, ...detailed };
							})
							.catch((err) => console.log('Could not fetch detailed backdrop cover:', err));
					}
				}
			} catch (error) {
				console.error('Failed to fetch movies:', error);
			} finally {
				if (mounted) isLoading = false;
			}
		}

		fetchMovies();
		return () => { mounted = false; };
	});
</script>

{#snippet movieRow(title: string, movies: Movie[], Icon: any)}
	{#if !movies || movies.length === 0}
		<div class="py-12 flex justify-center text-muted-foreground">
			No movies found.
		</div>
	{:else}
		<section class="py-6">
			<div class="mb-4 flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary/10">
					<Icon class="size-4 text-primary" />
				</div>
				<h2 class="text-xl font-bold tracking-tight text-foreground">{title}</h2>
			</div>
			<div class="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/50 scrollbar-track-transparent pt-2">
				{#each movies as movie (movie.id)}
					{@const score = Number(movie.score ?? movie.vote_average ?? movie.rating ?? 0)}
					{@const year = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown')}
					{@const poster = movie.poster_path || movie.poster_url}
					<a
						href={`/movie?id=${movie.tmdb_id || movie.id}`}
						class="group shrink-0 w-36 sm:w-40 md:w-48 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
					>
						<div class="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
							<img
								src={getImageUrl(poster, 'w342')}
								alt={movie.title || 'Movie Poster'}
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
							<div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
								<Star class="size-3 fill-primary text-primary" />
								<span class="text-xs font-medium text-foreground">{score.toFixed(1)}</span>
							</div>
						</div>
						<h3 class="mt-3 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary md:text-base">{movie.title}</h3>
						<p class="text-xs text-muted-foreground">{year}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

{#if isLoading}
	<main class="min-h-screen bg-background">
		<div class="h-[70vh] w-full bg-muted animate-pulse border-b border-border/50" />
		<div class="container mx-auto mt-4 px-4 sm:mt-10">
			<div class="mb-6 flex items-center justify-between border-b pb-4">
				<h2 class="text-2xl font-bold tracking-tight">Discover</h2>
				<div class="flex gap-2">
					<Skeleton class="h-10 w-24 rounded-md" />
					<Skeleton class="h-10 w-24 rounded-md" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pt-4">
				{#each Array(12) as _}
					<div class="flex flex-col gap-2">
						<Skeleton class="aspect-[2/3] w-full rounded-lg" />
						<Skeleton class="h-4 w-3/4 mt-1" />
						<Skeleton class="h-3 w-1/4" />
					</div>
				{/each}
			</div>
		</div>
	</main>
{:else}
	<main class="min-h-screen bg-background">
		{#if featuredMovie}
			{@const featuredScore = Number(featuredMovie.score ?? featuredMovie.vote_average ?? featuredMovie.rating ?? 0)}
			<HomeHero
				movieId={featuredMovie.tmdb_id || featuredMovie.id}
				title={featuredMovie.title}
				backdrop_path={getImageUrl(featuredMovie.backdrop_path || featuredMovie.backdrop_url || featuredMovie.poster_path || featuredMovie.poster_url, 'original')}
				poster_path={getImageUrl(featuredMovie.poster_path || featuredMovie.poster_url, 'w500')}
				score={featuredScore.toFixed(1)}
			/>
		{/if}

		<div class="container mx-auto mt-4 px-4 sm:mt-10">
			<Tabs.Root value="trending" class="w-full">
				<div class="flex items-center justify-between border-b pb-4">
					<h2 class="text-2xl font-bold tracking-tight">Discover</h2>
					<Tabs.List>
						<Tabs.Trigger value="trending" class="flex items-center gap-2 px-4">
							<TrendingUp class="size-4" />
							<span>Trending</span>
						</Tabs.Trigger>
						<Tabs.Trigger value="top-rated" class="flex items-center gap-2 px-4">
							<Trophy class="size-4" />
							<span>Top Rated</span>
						</Tabs.Trigger>
					</Tabs.List>
				</div>
				
				<Tabs.Content value="trending" class="mt-0 animate-in fade-in-50 zoom-in-95 duration-300">
					{@render movieRow('Trending This Week', trendingMovies, TrendingUp)}
				</Tabs.Content>
				
				<Tabs.Content value="top-rated" class="mt-0 animate-in fade-in-50 zoom-in-95 duration-300">
					{@render movieRow('All-Time Highest Rated', topRatedMovies, Trophy)}
				</Tabs.Content>
			</Tabs.Root>
		</div>

		<div class="h-16" />
	</main>
{/if}
