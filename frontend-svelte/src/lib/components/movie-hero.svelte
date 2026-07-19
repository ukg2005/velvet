<script lang="ts">
	import { Check, Plus, Star, Clock, Calendar, Globe } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		title,
		original_title,
		backdrop_path,
		poster_path,
		release_date,
		runtime,
		rating,
		score,
		omdbRatings,
		vote_count,
		original_language,
		tagline,
		isLogged,
		userRating,
		isInWatchlist = false,
		isUpdatingWatchlist = false,
		onLogMovie,
		onAddToWatchlist
	} = $props<{
		title: string;
		original_title: string;
		backdrop_path: string;
		poster_path: string;
		release_date: string;
		runtime: string;
		rating: string;
		score: number;
		omdbRatings?: {
			imdbRating?: string;
			Metascore?: string;
			Ratings?: Record<string, string>;
		};
		vote_count: number;
		original_language: string;
		tagline?: string;
		isLogged: boolean;
		userRating?: number | null;
		isInWatchlist?: boolean;
		isUpdatingWatchlist?: boolean;
		onLogMovie: () => void;
		onAddToWatchlist?: () => void;
	}>();

	const languageNames: Record<string, string> = {
		en: 'English',
		es: 'Spanish',
		fr: 'French',
		de: 'German',
		ja: 'Japanese',
		ko: 'Korean',
		zh: 'Chinese'
	};

	let year = $derived(release_date ? new Date(release_date).getFullYear() : null);
	let languageName = $derived(languageNames[original_language] || original_language.toUpperCase());
</script>

<div class="relative h-screen min-h-[520px] w-full overflow-hidden">
	{#if backdrop_path}
		<img
			src={backdrop_path}
			alt={`${title} backdrop`}
			class="object-cover w-full h-full"
			style="object-position: center 26%;"
		/>
	{/if}

	<!-- Minimal overlays -->
	<div class="absolute inset-0 bg-black/15 pointer-events-none" />
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 20%, transparent 50%)"
	></div>
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, transparent 60%)"
	></div>
	<div
		class="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
		style="background: linear-gradient(to top, var(--background) 0%, transparent 100%)"
	></div>

	<!-- Content anchored to the bottom -->
	<div class="absolute bottom-0 left-0 right-0 z-10">
		<div class="container mx-auto px-4 pb-6">
			<div class="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
				<!-- Poster -->
				<div class="relative mx-auto shrink-0 md:mx-0">
					<div
						class="relative aspect-[2/3] w-44 overflow-hidden rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 md:w-56 transition-transform duration-500 hover:scale-[1.02] bg-muted flex items-center justify-center"
					>
						{#if poster_path}
							<img src={poster_path} alt={`${title} poster`} class="object-cover w-full h-full" />
						{:else}
							<span class="text-muted-foreground text-sm font-medium">No Poster</span>
						{/if}
					</div>
					<!-- Score badge -->
					<div
						class="absolute -bottom-3 -right-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:size-16"
					>
						<div class="flex items-center gap-0.5">
							<Star class="size-3 fill-current md:size-4" />
							<span class="text-lg font-bold md:text-xl">{score}</span>
						</div>
					</div>
				</div>

				<!-- Info -->
				<div class="flex flex-1 flex-col space-y-3 pb-4 text-center md:pb-6 md:text-left">
					<!-- Title + tagline -->
					<div>
						<h1
							class="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
						>
							{title}
						</h1>
						{#if original_title !== title}
							<p class="mt-1 text-sm text-muted-foreground">Original title: {original_title}</p>
						{/if}
					</div>

					<!-- Year · runtime · language -->
					<div
						class="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start"
					>
						<span class="flex items-center gap-1">
							<Calendar class="size-4" />
							{year}
						</span>
						<span class="hidden size-1 rounded-full bg-muted-foreground md:block"></span>
						<span class="flex items-center gap-1">
							<Clock class="size-4" />
							{runtime}
						</span>
						<span class="hidden size-1 rounded-full bg-muted-foreground md:block"></span>
						<span class="flex items-center gap-1">
							<Globe class="size-4" />
							{languageName}
						</span>
					</div>

					<!-- External ratings -->
					{#if omdbRatings && (omdbRatings.imdbRating || omdbRatings.Metascore || (omdbRatings.Ratings && Object.keys(omdbRatings.Ratings).length > 0))}
						<div class="flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
							{#if omdbRatings.imdbRating && omdbRatings.imdbRating !== 'N/A'}
								<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F5C518] !text-black font-extrabold shadow-sm">
									<span class="text-xs uppercase tracking-tight">IMDb</span>
									<span class="text-sm">{omdbRatings.imdbRating}</span>
								</div>
							{/if}
							{#if omdbRatings.Ratings?.['Rotten Tomatoes']}
								{@const rtScore = parseInt(omdbRatings.Ratings['Rotten Tomatoes'])}
								<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white font-bold shadow-sm backdrop-blur-md">
									<span class="text-base leading-none">
										{rtScore >= 60 ? '🍅' : '🤢'}
									</span>
									<span class="text-sm">{omdbRatings.Ratings['Rotten Tomatoes']}</span>
								</div>
							{/if}
							{#if omdbRatings.Metascore && omdbRatings.Metascore !== 'N/A'}
								<div class="flex items-center justify-center size-8 rounded bg-[#00CE7A] !text-black font-bold text-base shadow-sm">
									{omdbRatings.Metascore}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Action buttons -->
					<div class="flex flex-wrap items-center justify-center gap-3 pt-1 md:justify-start">
						<Button
							onclick={onLogMovie}
							class={isLogged
								? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all'
								: 'shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all hover:scale-105'}
							size="lg"
						>
							{#if isLogged}
								<Check class="size-5 mr-2" />
								Logged {userRating ? `(${userRating.toFixed(1)} ★)` : ''}
							{:else}
								<Plus class="size-5 mr-2" />
								Log Movie
							{/if}
						</Button>

						<Button
							onclick={onAddToWatchlist}
							disabled={isUpdatingWatchlist}
							class="inline-flex items-center justify-center bg-black/50 hover:bg-black/70 text-white hover:text-white border-0 backdrop-blur-sm transition-all h-11 px-6 rounded-md text-sm font-medium"
						>
							{#if isInWatchlist}
								<Check class="size-5 mr-2" />
								In Watchlist
							{:else}
								<Plus class="size-5 mr-2" />
								Add to Watchlist
							{/if}
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
