<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Bookmark, Heart, Loader2, Star, X } from 'lucide-svelte';
	import { LogService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	type MovieItem = {
		tmdb_id: number;
		title: string;
		poster_path: string;
		year?: string | number;
		rating?: number;
	};

	function normalizeList(payload: any): MovieItem[] {
		const items = Array.isArray(payload)
			? payload
			: payload?.results || payload?.movies || payload?.logs || [];
		return items
			.map((item: any) => {
				const movie = item?.movie || item;
				const tmdbId = Number(movie?.tmdb_id || movie?.id || item?.tmdb_id);
				if (!Number.isFinite(tmdbId)) return null;
				return {
					tmdb_id: tmdbId,
					title: movie?.title || movie?.original_title || 'Untitled',
					poster_path: getImageUrl(movie?.poster_url || movie?.poster_path, 'w500'),
					year: movie?.year || movie?.release_date?.slice?.(0, 4),
					rating: Number(movie?.rating ?? movie?.vote_average ?? 0)
				};
			})
			.filter(Boolean) as MovieItem[];
	}

	let isLoading = $state(true);
	let watchlist = $state<MovieItem[]>([]);
	let favorites = $state<MovieItem[]>([]);

	$effect(() => {
		auth.requireAuth();
	});

	onMount(async () => {
		try {
			const [watchlistRes, likedRes] = await Promise.all([
				LogService.getWatchlist(),
				LogService.getLiked()
			]);
			watchlist = normalizeList(watchlistRes);
			favorites = normalizeList(likedRes);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load watchlist/favorites');
		} finally {
			isLoading = false;
		}
	});

	async function removeFromWatchlist(tmdbId: number) {
		const removed = watchlist.find((m) => m.tmdb_id === tmdbId);
		watchlist = watchlist.filter((m) => m.tmdb_id !== tmdbId);
		try {
			await LogService.toggleStatus(tmdbId, 'watchlist');
			toast.success('Removed from watchlist');
		} catch (err) {
			console.error(err);
			if (removed) watchlist = [...watchlist, removed];
			toast.error('Failed to update watchlist');
		}
	}

	async function removeFromFavorites(tmdbId: number) {
		const removed = favorites.find((m) => m.tmdb_id === tmdbId);
		favorites = favorites.filter((m) => m.tmdb_id !== tmdbId);
		try {
			await LogService.toggleStatus(tmdbId, 'liked');
			toast.success('Removed from favorites');
		} catch (err) {
			console.error(err);
			if (removed) favorites = [...favorites, removed];
			toast.error('Failed to update favorites');
		}
	}
</script>

<svelte:head>
	<title>Watchlist & Favorites · Velvet</title>
</svelte:head>

{#if isLoading}
	<main class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</main>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<div class="container mx-auto max-w-6xl px-4 py-12 space-y-14">
			<!-- Page Header -->
			<header>
				<h1 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
					Watchlist & Favorites
				</h1>
				<p class="mt-2 text-base text-muted-foreground">Your saved movies, all in one place.</p>
			</header>

			<!-- Watchlist Section -->
			<section>
				<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
					<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
						<Bookmark class="size-5 text-primary" />
					</div>
					<div>
						<h2 class="text-xl font-bold tracking-tight text-foreground">Watchlist</h2>
						<p class="text-sm text-muted-foreground">
							{watchlist.length}
							{watchlist.length === 1 ? 'movie' : 'movies'} saved
						</p>
					</div>
				</div>

				{#if watchlist.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center"
					>
						<div class="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
							<Bookmark class="size-8 text-muted-foreground/40" />
						</div>
						<p class="text-base font-medium text-muted-foreground">Your watchlist is empty</p>
						<p class="mt-1 text-sm text-muted-foreground/60">
							Bookmark movies from any movie page to watch later.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{#each watchlist as movie (movie.tmdb_id)}
							<div class="group relative flex flex-col">
								<a
									href="/movie?id={movie.tmdb_id}"
									class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40"
								>
									{#if movie.poster_path}
										<img
											src={movie.poster_path}
											alt={movie.title}
											class="absolute inset-0 h-full w-full object-cover"
											loading="lazy"
										/>
									{/if}
									<!-- Gradient overlay -->
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									></div>
									<!-- Rating badge -->
									{#if movie.rating && movie.rating > 0}
										<div
											class="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
										>
											<Star class="size-3 fill-amber-400 text-amber-400" />
											<span class="text-xs font-semibold text-white"
												>{movie.rating.toFixed(1)}</span
											>
										</div>
									{/if}
									<!-- Remove button -->
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											removeFromWatchlist(movie.tmdb_id);
										}}
										class="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive hover:text-white"
										title="Remove from watchlist"
									>
										<X class="size-4" />
									</button>
								</a>
								<div class="mt-3 space-y-0.5 px-0.5">
									<h3
										class="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
									>
										{movie.title}
									</h3>
									{#if movie.year}
										<p class="text-xs text-muted-foreground">{movie.year}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Favorites Section -->
			<section>
				<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
					<div class="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
						<Heart class="size-5 text-rose-500" />
					</div>
					<div>
						<h2 class="text-xl font-bold tracking-tight text-foreground">Favorites</h2>
						<p class="text-sm text-muted-foreground">
							{favorites.length}
							{favorites.length === 1 ? 'movie' : 'movies'} liked
						</p>
					</div>
				</div>

				{#if favorites.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center"
					>
						<div class="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
							<Heart class="size-8 text-muted-foreground/40" />
						</div>
						<p class="text-base font-medium text-muted-foreground">No favorites yet</p>
						<p class="mt-1 text-sm text-muted-foreground/60">
							Like movies from any movie page to add them here.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{#each favorites as movie (movie.tmdb_id)}
							<div class="group relative flex flex-col">
								<a
									href="/movie?id={movie.tmdb_id}"
									class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-rose-500/10 group-hover:ring-rose-500/40"
								>
									{#if movie.poster_path}
										<img
											src={movie.poster_path}
											alt={movie.title}
											class="absolute inset-0 h-full w-full object-cover"
											loading="lazy"
										/>
									{/if}
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									></div>
									{#if movie.rating && movie.rating > 0}
										<div
											class="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
										>
											<Star class="size-3 fill-amber-400 text-amber-400" />
											<span class="text-xs font-semibold text-white"
												>{movie.rating.toFixed(1)}</span
											>
										</div>
									{/if}
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											removeFromFavorites(movie.tmdb_id);
										}}
										class="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive hover:text-white"
										title="Remove from favorites"
									>
										<X class="size-4" />
									</button>
								</a>
								<div class="mt-3 space-y-0.5 px-0.5">
									<h3
										class="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-rose-400"
									>
										{movie.title}
									</h3>
									{#if movie.year}
										<p class="text-xs text-muted-foreground">{movie.year}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	</main>
{/if}
