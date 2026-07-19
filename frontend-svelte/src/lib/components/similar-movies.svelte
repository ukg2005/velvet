<script lang="ts">
	import { Star, Film } from 'lucide-svelte';

	interface SimilarMovie {
		id: string | number;
		title: string;
		poster_path: string;
		release_date: string;
		score: number;
	}

	let { movies } = $props<{
		movies: SimilarMovie[];
	}>();

	let preparedMovies = $derived(
		movies.map((movie) => {
			const parsedYear = movie.release_date ? new Date(movie.release_date).getFullYear() : NaN;
			return {
				...movie,
				year: Number.isFinite(parsedYear) ? parsedYear : 'N/A'
			};
		})
	);
</script>

<section class="mt-10 md:mt-14 text-left">
	<div class="flex items-center gap-2">
		<Film class="size-5 text-primary" />
		<h2 class="text-xl font-semibold text-foreground">Similar Movies</h2>
	</div>

	<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
		{#each preparedMovies as movie, index (movie.id)}
			{@const poster = movie.poster_path}
			<a href={`/movie?id=${movie.id}`} class="group cursor-pointer">
				<div
					class="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary"
				>
					<img
						src={poster}
						alt={movie.title}
						class="object-cover w-full h-full"
						loading={index < 4 ? 'eager' : 'lazy'}
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
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
					></div>
					<!-- Score badge on hover -->
					<div
						class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<Star class="size-3 fill-primary text-primary" />
						<span class="text-xs font-medium text-foreground">{movie.score.toFixed(1)}</span>
					</div>
				</div>
				<div class="mt-2 space-y-0.5">
					<p class="truncate text-sm font-medium text-foreground group-hover:text-primary">
						{movie.title}
					</p>
					<p class="text-xs text-muted-foreground">{movie.year}</p>
				</div>
			</a>
		{/each}
	</div>
</section>
