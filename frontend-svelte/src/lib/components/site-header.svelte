<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, Plus, User, Film, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import LogMovieModal from './log-movie-modal.svelte';

	type Suggestion =
		| { kind: 'movie'; id: string | number; tmdb_id?: string | number; title: string; poster_path?: string; poster_url?: string; year?: string | number; release_date?: string }
		| { kind: 'person'; id: string | number; tmdb_id?: string | number; name: string; profile_path?: string; profile_url?: string; avatar_url?: string };

	let pathname = $derived($page.url.pathname);
	let isOnHeroPage = $derived(pathname === '/movie' || pathname === '/home');

	let searchQuery = $state('');
	let suggestions = $state<Suggestion[]>([]);
	let isSuggestionsOpen = $state(false);
	let isSearchLoading = $state(false);
	let activeIdx = $state(-1);
	let isScrolled = $state(false);

	let isLogModalOpen = $state(false);
	let currentMovie = $state<{ title: string; poster_path: string } | null>(null);

	let searchRef = $state<HTMLElement>();
	let inputRef = $state<HTMLInputElement>();
	let debounceTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		const onScroll = () => (isScrolled = window.scrollY > 10);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	onMount(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (searchRef && !searchRef.contains(e.target as Node)) {
				isSuggestionsOpen = false;
				activeIdx = -1;
			}
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	});

	$effect(() => {
		let mounted = true;
		async function hydrateCurrentMovie() {
			if (pathname !== '/movie') {
				if (mounted) currentMovie = null;
				return;
			}
			const movieId = $page.url.searchParams.get('id');
			if (!movieId) {
				if (mounted) currentMovie = null;
				return;
			}
			try {
				const data = await MovieService.getMovie(movieId);
				if (!mounted) return;
				currentMovie = { title: data.title || 'Movie', poster_path: getImageUrl(data.poster_url || data.poster_path, 'w500') };
			} catch {
				if (mounted) currentMovie = null;
			}
		}
		hydrateCurrentMovie();
		return () => { mounted = false; };
	});

	function fetchSuggestions(q: string) {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (!q.trim()) {
			suggestions = [];
			isSuggestionsOpen = false;
			return;
		}
		debounceTimer = setTimeout(async () => {
			isSearchLoading = true;
			try {
				const data = await MovieService.search(q);
				const movies: Suggestion[] = (Array.isArray(data) ? data : data.movies || data.results || [])
					.slice(0, 5)
					.map((m: any) => ({ kind: 'movie', id: m.id, tmdb_id: m.tmdb_id, title: m.title, poster_path: m.poster_path, poster_url: m.poster_url, release_date: m.release_date, year: m.year }));
				const people: Suggestion[] = (data.people || data.persons || [])
					.slice(0, 3)
					.map((p: any) => ({ kind: 'person', id: p.id, tmdb_id: p.tmdb_id, name: p.name, profile_path: p.profile_path, profile_url: p.profile_url, avatar_url: p.avatar_url }));
				
				const merged = [...movies, ...people];
				suggestions = merged;
				isSuggestionsOpen = merged.length > 0;
				activeIdx = -1;
			} catch {
				suggestions = [];
				isSuggestionsOpen = false;
			} finally {
				isSearchLoading = false;
			}
		}, 280);
	}

	function handleInputChange(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		searchQuery = v;
		fetchSuggestions(v);
	}

	function navigateToSuggestion(s: Suggestion) {
		isSuggestionsOpen = false;
		searchQuery = '';
		suggestions = [];
		if (s.kind === 'movie') goto(`/movie?id=${s.tmdb_id || s.id}`);
		else goto(`/person?id=${s.tmdb_id || s.id}`);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isSuggestionsOpen) {
			if (e.key === 'Enter' && searchQuery.trim()) {
				goto(`/search?q=${encodeURIComponent(searchQuery)}`);
				isSuggestionsOpen = false;
			}
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = Math.min(activeIdx + 1, suggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = Math.max(activeIdx - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIdx >= 0 && suggestions[activeIdx]) {
				navigateToSuggestion(suggestions[activeIdx]);
			} else if (searchQuery.trim()) {
				goto(`/search?q=${encodeURIComponent(searchQuery)}`);
				isSuggestionsOpen = false;
			}
		} else if (e.key === 'Escape') {
			isSuggestionsOpen = false;
			activeIdx = -1;
			inputRef?.blur();
		}
	}

	function clearSearch() {
		searchQuery = '';
		suggestions = [];
		isSuggestionsOpen = false;
		inputRef?.focus();
	}
	
	let filteredMovies = $derived(suggestions.filter(s => s.kind === 'movie'));
	let filteredPeople = $derived(suggestions.filter(s => s.kind === 'person'));
</script>

{#if pathname !== '/'}
	<header
		class={[
			'fixed top-0 z-50 w-full transition-all duration-300',
			isScrolled || !isOnHeroPage
				? 'bg-background/95 backdrop-blur-md border-b border-white/10 shadow-md'
				: 'bg-background/40 backdrop-blur-md border-b border-white/5'
		].join(' ')}
	>
		<div class="container mx-auto px-4 flex h-16 max-w-7xl items-center justify-between gap-4">
			<!-- Logo -->
			<a href="/home" class="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
				<span class="font-semibold text-xl sm:text-2xl tracking-widest text-primary">velvet</span>
			</a>

			<!-- Search with suggestions -->
			<div class="flex-1 max-w-md mx-4 hidden md:block" bind:this={searchRef}>
				<div class="relative group">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
					<input
						bind:this={inputRef}
						type="text"
						placeholder="Search movies, people, lists..."
						class="w-full h-10 pl-9 pr-8 rounded-md text-sm bg-white/8 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background/60 transition-all backdrop-blur-sm"
						value={searchQuery}
						oninput={handleInputChange}
						onkeydown={handleKeyDown}
						onfocus={() => suggestions.length > 0 && (isSuggestionsOpen = true)}
						autocomplete="off"
					/>
					{#if searchQuery}
						<button onclick={clearSearch} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
							<X class="size-3.5" />
						</button>
					{/if}

					<!-- Suggestions dropdown -->
					{#if isSuggestionsOpen && suggestions.length > 0}
						<div class="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[60]">
							{#if isSearchLoading}
								<div class="px-4 py-2 text-xs text-muted-foreground">Searching…</div>
							{/if}

							<!-- Group: Movies -->
							{#if filteredMovies.length > 0}
								<div>
									<div class="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Movies</div>
									{#each filteredMovies as s}
										{@const globalIdx = suggestions.indexOf(s)}
										{@const year = s.kind === 'movie' ? (s.year || (s.release_date ? new Date(s.release_date).getFullYear() : null)) : null}
										{@const posterSrc = s.kind === 'movie' ? getImageUrl(s.poster_path || s.poster_url, 'w92') : null}
										<button
											onpointerdown={() => navigateToSuggestion(s)}
											class={[
												'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
												activeIdx === globalIdx ? 'bg-primary/10 text-foreground' : 'hover:bg-white/5 text-foreground'
											].join(' ')}
										>
											<div class="relative size-9 rounded overflow-hidden shrink-0 bg-muted">
												{#if posterSrc}
													<img src={posterSrc} alt={s.title} class="object-cover w-full h-full" sizes="36px" />
												{:else}
													<Film class="size-4 text-muted-foreground m-auto mt-2.5" />
												{/if}
											</div>
											<div class="min-w-0">
												<p class="text-sm font-medium truncate">{s.title}</p>
												{#if year}<p class="text-xs text-muted-foreground">{year}</p>{/if}
											</div>
										</button>
									{/each}
								</div>
							{/if}

							<!-- Group: People -->
							{#if filteredPeople.length > 0}
								<div class="border-t border-white/6">
									<div class="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">People</div>
									{#each filteredPeople as s}
										{@const globalIdx = suggestions.indexOf(s)}
										{@const avatarSrc = s.kind === 'person' ? getImageUrl(s.avatar_url || s.profile_url || s.profile_path, 'w92') : null}
										<button
											onpointerdown={() => navigateToSuggestion(s)}
											class={[
												'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
												activeIdx === globalIdx ? 'bg-primary/10 text-foreground' : 'hover:bg-white/5 text-foreground'
											].join(' ')}
										>
											<div class="relative size-9 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
												{#if avatarSrc}
													<img src={avatarSrc} alt={s.name} class="object-cover w-full h-full" sizes="36px" />
												{:else}
													<User class="size-4 text-muted-foreground" />
												{/if}
											</div>
											<p class="text-sm font-medium truncate">{s.name}</p>
										</button>
									{/each}
								</div>
							{/if}

							<!-- Footer: full search -->
							<div class="border-t border-white/6 px-3 py-2">
								<button
									onpointerdown={() => { goto(`/search?q=${encodeURIComponent(searchQuery)}`); isSuggestionsOpen = false; }}
									class="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									See all results for <span class="font-medium text-foreground">"{searchQuery}"</span> →
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Navigation Actions -->
			<nav class="flex items-center gap-2 sm:gap-4 shrink-0">
				<a href="/explore" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Explore</a>
				<a href="/watchlist" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Watchlist</a>
				<a href="/lists" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Lists</a>

				<Button size="sm" class="hidden sm:flex font-medium bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-colors" onclick={() => isLogModalOpen = true}>
					<Plus class="mr-2 size-4" />
					Log Film
				</Button>

				<!-- Mobile search toggle -->
				<Button variant="ghost" size="icon" class="md:hidden">
					<Search class="size-5" />
					<span class="sr-only">Search</span>
				</Button>

				<!-- Log mobile -->
				<Button size="icon" class="sm:hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" onclick={() => isLogModalOpen = true}>
					<Plus class="size-5" />
					<span class="sr-only">Log Film</span>
				</Button>

				<Button variant="outline" size="icon" class="rounded-full transition-colors ml-1 border-border hover:bg-accent" href="/profile">
					<User class="size-5 text-foreground/80" />
					<span class="sr-only">Profile</span>
				</Button>
			</nav>
		</div>

		<LogMovieModal bind:open={isLogModalOpen} movie={currentMovie} />
	</header>
{/if}
