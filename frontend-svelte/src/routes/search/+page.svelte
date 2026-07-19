<script lang="ts">
	import { page } from '$app/stores';
	import { Loader2, Star } from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';

	type SearchMovie = {
		id: string | number;
		tmdb_id?: string | number;
		title: string;
		poster_path?: string;
		poster_url?: string;
		score?: number;
		rating?: number | string;
		vote_average?: number;
	};

	type SearchPerson = {
		id: string | number;
		tmdb_id?: string | number;
		name: string;
		avatar_url?: string;
		profile_path?: string;
		profile_url?: string;
	};

	function getInitials(name: string) {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	}

	let query = $derived(($page.url.searchParams.get('q') || '').trim());
	let movies = $state<SearchMovie[]>([]);
	let people = $state<SearchPerson[]>([]);
	let isLoading = $state(false);

	$effect(() => {
		let mounted = true;

		async function runSearch(q: string) {
			if (!q) {
				movies = [];
				people = [];
				return;
			}

			isLoading = true;
			try {
				const data = await MovieService.search(q);

				if (!mounted) return;

				const moviesPayload = Array.isArray(data) ? data : data.movies || data.results || [];
				const peoplePayload = data.people || data.persons || [];

				movies = Array.isArray(moviesPayload) ? moviesPayload : [];
				people = Array.isArray(peoplePayload) ? peoplePayload : [];
			} catch (error) {
				console.error('Search failed:', error);
				if (mounted) {
					movies = [];
					people = [];
				}
			} finally {
				if (mounted) isLoading = false;
			}
		}

		runSearch(query);

		return () => {
			mounted = false;
		};
	});

	let hasResults = $derived(movies.length > 0 || people.length > 0);
</script>

<main class="min-h-screen bg-background pt-16">
	<div class="container mx-auto px-4 py-10">
		<div class="mb-8 border-b pb-6">
			<h1 class="text-3xl font-extrabold tracking-tight text-foreground">
				{query ? `Search results for "${query}"` : 'Search'}
			</h1>
		</div>

		{#if isLoading}
			<div class="mt-10 flex items-center justify-center text-muted-foreground">
				<Loader2 class="mr-2 size-5 animate-spin" />
				Searching...
			</div>
		{:else if !hasResults}
			<div class="mt-10">
				<!-- Empty state -->
				<div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-border p-6 text-center text-balance md:p-12">
					<div class="flex max-w-sm flex-col items-center gap-2 text-center">
						<div class="text-lg font-medium tracking-tight">
							{query ? `No results found for "${query}"` : 'Start typing to search'}
						</div>
						<div class="text-muted-foreground text-sm/relaxed">
							Try a different movie or person name.
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="mt-10 space-y-12">
				{#if movies.length > 0}
					<section>
						<h2 class="mb-6 border-l-4 border-primary pl-3 text-xl font-semibold text-foreground">Movies</h2>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
							{#each movies as movie, index (`${movie.tmdb_id || movie.id}-${index}`)}
								{@const movieId = movie.tmdb_id || movie.id}
								{@const score = Number(movie.score ?? movie.vote_average ?? movie.rating ?? 0)}
								
								<a
									href={`/movie?id=${movieId}`}
									class="group block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
								>
									<div class="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
										{#if movie.poster_path || movie.poster_url}
											<img
												src={getImageUrl(movie.poster_path || movie.poster_url, 'w500')}
												alt={movie.title}
												class="object-cover w-full h-full"
												loading="lazy"
											/>
										{/if}
										<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
										<div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
											<Star class="size-3 fill-primary text-primary" />
											<span class="text-xs font-medium text-foreground">{score.toFixed(1)}</span>
										</div>
									</div>
									<p class="mt-2 truncate text-sm font-medium text-foreground group-hover:text-primary">
										{movie.title}
									</p>
								</a>
							{/each}
						</div>
					</section>
				{/if}

				{#if people.length > 0}
					<section>
						<h2 class="text-xl font-semibold text-foreground">People</h2>
						<div class="mt-4 flex gap-5 overflow-x-auto pb-2">
							{#each people as person, index (`${person.tmdb_id || person.id}-${index}`)}
								{@const personId = person.tmdb_id || person.id}
								
								<a
									href={`/person?id=${personId}`}
									class="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
								>
									<div class="flex w-24 flex-col items-center gap-2">
										<Avatar.Root class="size-16">
											<Avatar.Image
												src={getImageUrl(person.avatar_url || person.profile_url || person.profile_path, 'w185')}
												alt={person.name}
											/>
											<Avatar.Fallback class="bg-primary text-primary-foreground">
												{getInitials(person.name)}
											</Avatar.Fallback>
										</Avatar.Root>
										<p class="text-center text-sm font-medium text-foreground">
											{person.name}
										</p>
									</div>
								</a>
							{/each}
						</div>
					</section>
				{/if}
			</div>
		{/if}
	</div>
</main>
