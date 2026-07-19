<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Film,
		Star,
		User,
		BarChart2,
		Heart,
		Loader2,
		Pencil,
		Plus,
		X,
		MapPin,
		LogOut,
		Search,
		History,
		Check
	} from 'lucide-svelte';
	import { LogService, ListService, MovieService, AuthService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	type ProfileMovie = {
		tmdb_id: number;
		title: string;
		poster: string;
		score: number;
	};

	const FAVORITE_LIMIT = 4;
	const FAVORITES_KEY = 'profile_favorites_v1';

	function normalizeMovies(payload: any): ProfileMovie[] {
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
					poster: getImageUrl(movie?.poster || movie?.poster_url || movie?.poster_path, 'w500'),
					score: Number(movie?.rating ?? movie?.vote_average ?? movie?.score ?? 0)
				};
			})
			.filter(Boolean) as ProfileMovie[];
	}

	// ── State ──
	let user = $state<any>(null);
	let favorites = $state<ProfileMovie[]>([]);
	let recentMovies = $state<any[]>([]);
	let userLists = $state<any[]>([]);
	let ratingData = $state<{ rating: string; count: number }[]>([]);

	let isLoadingProfile = $state(true);
	let isLoadingFav = $state(true);

	// Edit profile dialog
	let editDialogOpen = $state(false);
	let editForm = $state({ username: '', bio: '', display_name: '', location: '' });
	let isSavingProfile = $state(false);

	// Favorites editing
	let isEditingFavorites = $state(false);
	let favSearch = $state('');
	let favSearchResults = $state<ProfileMovie[]>([]);
	let isSearchingFav = $state(false);

	// Logout confirmation
	let logoutDialogOpen = $state(false);

	$effect(() => {
		auth.requireAuth();
	});

	// Derived
	let favoriteIds = $derived(new Set(favorites.map((m) => m.tmdb_id)));
	let favoriteSlots = $derived(
		Array.from({ length: FAVORITE_LIMIT }, (_, i) => favorites[i] || null)
	);
	let maxRating = $derived(Math.max(...ratingData.map((d) => d.count), 1));

	onMount(async () => {
		// Load favorites from localStorage first
		try {
			const stored = localStorage.getItem(FAVORITES_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) favorites = normalizeMovies(parsed).slice(0, FAVORITE_LIMIT);
			}
		} catch {
			// ignore
		}

		// If no stored favorites, seed from liked list
		if (favorites.length === 0) {
			try {
				const likedPayload = await LogService.getLiked();
				favorites = normalizeMovies(likedPayload).slice(0, FAVORITE_LIMIT);
			} catch (err) {
				console.error(err);
			}
		}
		isLoadingFav = false;

		// Load profile data concurrently
		await Promise.allSettled([loadUser(), loadLogs(), loadLists()]);
		isLoadingProfile = false;
	});

	async function loadUser() {
		try {
			const currentUser = await AuthService.me();
			user = currentUser;
			editForm = {
				username: currentUser.username || '',
				bio: currentUser.bio || '',
				display_name: currentUser.display_name || '',
				location: currentUser.location || ''
			};
		} catch (err) {
			console.error(err);
		}
	}

	async function loadLogs() {
		try {
			const logsPayload = await LogService.getLogs();
			const logs = Array.isArray(logsPayload)
				? logsPayload
				: logsPayload?.logs || logsPayload?.results || [];

			recentMovies = logs
				.filter((log: any) => log.movie)
				.slice(0, 5)
				.map((log: any) => ({
					id: log.movie.tmdb_id,
					title: log.movie.title,
					poster: getImageUrl(log.movie.poster_url || log.movie.poster_path, 'w500'),
					user_rating: log.rating || 0,
					logged_at: log.logged_at
				}));

			const bins: Record<string, number> = {
				'0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
				'3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
			};
			logs.forEach((log: any) => {
				if (log.rating && log.rating > 0) {
					const r = Number(log.rating).toFixed(1);
					if (bins[r] !== undefined) bins[r]++;
				}
			});
			ratingData = Object.entries(bins).map(([rating, count]) => ({ rating, count }));
		} catch (err) {
			console.error(err);
		}
	}

	async function loadLists() {
		try {
			const listsPayload = await ListService.getLists();
			const lists = Array.isArray(listsPayload)
				? listsPayload
				: listsPayload?.lists || listsPayload?.results || [];
			userLists = lists.slice(0, 3).map((l: any) => {
				const entries = l.entries || l.items || [];
				const covers = entries
					.slice(0, 4)
					.map((e: any) => {
						const movie = e.movie || e;
						return getImageUrl(movie?.poster_url || movie?.poster_path, 'w342');
					})
					.filter(Boolean);
				return {
					id: l.id,
					title: l.title || l.name || 'Untitled',
					movieCount: l.count ?? entries.length,
					coverImages: covers
				};
			});
		} catch (err) {
			console.error(err);
		}
	}

	// Save favorites to localStorage whenever they change
	$effect(() => {
		if (!isLoadingFav) {
			localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, FAVORITE_LIMIT)));
		}
	});

	async function runFavSearch() {
		if (!favSearch.trim()) {
			favSearchResults = [];
			return;
		}
		isSearchingFav = true;
		try {
			const payload = await MovieService.search(favSearch.trim());
			const movies = Array.isArray(payload) ? payload : payload?.movies || payload?.results || [];
			favSearchResults = normalizeMovies(movies).slice(0, 12);
		} catch {
			toast.error('Search failed');
		} finally {
			isSearchingFav = false;
		}
	}

	function addFavorite(movie: ProfileMovie) {
		if (favoriteIds.has(movie.tmdb_id)) return;
		if (favorites.length >= FAVORITE_LIMIT) {
			toast.error(`You can only keep ${FAVORITE_LIMIT} favorites.`);
			return;
		}
		favorites = [...favorites, movie];
	}

	function removeFavorite(tmdbId: number) {
		favorites = favorites.filter((m) => m.tmdb_id !== tmdbId);
	}

	async function saveProfile() {
		isSavingProfile = true;
		try {
			const updated = await AuthService.updateProfile(editForm);
			user = updated;
			editDialogOpen = false;
			toast.success('Profile updated successfully');
		} catch {
			toast.error('Failed to update profile');
		} finally {
			isSavingProfile = false;
		}
	}

	async function handleLogout() {
		try {
			await AuthService.logout();
			auth.isAuthenticated = false;
			goto('/');
		} catch {
			// Tokens are already cleared
			goto('/');
		}
	}

	let favSearchDebounce: ReturnType<typeof setTimeout>;
	$effect(() => {
		const q = favSearch;
		if (favSearchDebounce) clearTimeout(favSearchDebounce);
		if (!q.trim()) {
			favSearchResults = [];
			return;
		}
		favSearchDebounce = setTimeout(() => runFavSearch(), 400);
	});
</script>

<svelte:head>
	<title>Profile · Velvet</title>
</svelte:head>

{#if isLoadingProfile && !user}
	<main class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</main>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<div class="container mx-auto max-w-5xl px-4 py-10 space-y-10">

			<!-- ── Profile Header ── -->
			<section class="flex flex-col sm:flex-row items-start gap-6">
				<div
					class="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-md"
				>
					<User class="size-10 text-primary" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-2xl font-extrabold tracking-tight truncate">
							{user?.display_name || user?.username || 'Your Profile'}
						</h1>
						<button
							onclick={() => (editDialogOpen = true)}
							class="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer"
						>
							<Pencil class="size-3" />
							Edit
						</button>
					</div>
					{#if user?.location}
						<div class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
							<MapPin class="size-3.5" />
							{user.location}
						</div>
					{/if}
					{#if user?.bio}
						<p class="mt-3 text-sm text-muted-foreground max-w-lg">{user.bio}</p>
					{/if}
				</div>
				<div class="flex gap-2 shrink-0">
					<a
						href="/stats"
						class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
					>
						<BarChart2 class="size-4" />
						Stats
					</a>
					<a
						href="/history"
						class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
					>
						<History class="size-4" />
						History
					</a>
					<button
						onclick={() => (logoutDialogOpen = true)}
						class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
					>
						<LogOut class="size-4" />
						Sign Out
					</button>
				</div>
			</section>

			<!-- ── Favorites ── -->
			<section>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Heart class="size-5 text-rose-500" />
						<h2 class="text-xl font-bold">Favorite Films</h2>
					</div>
					<button
						onclick={() => (isEditingFavorites = !isEditingFavorites)}
						class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
					>
						{#if isEditingFavorites}
							<Check class="size-3" />
							Done
						{:else}
							<Pencil class="size-3" />
							Edit
						{/if}
					</button>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{#each favoriteSlots as slot, i (i)}
						{#if slot}
							<div class="group relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-md">
								<img
									src={slot.poster}
									alt={slot.title}
									class="h-full w-full object-cover"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
								></div>
								<p
									class="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white opacity-0 transition-opacity line-clamp-2 group-hover:opacity-100"
								>
									{slot.title}
								</p>
								{#if isEditingFavorites}
									<button
										onclick={() => removeFavorite(slot.tmdb_id)}
										class="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
									>
										<X class="size-3.5" />
									</button>
								{/if}
							</div>
						{:else}
							<button
								onclick={() => (isEditingFavorites = true)}
								class="flex aspect-[2/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-card/50 transition-colors hover:border-primary hover:bg-primary/5"
							>
								<Plus class="size-6 text-muted-foreground/50" />
								<span class="mt-2 text-xs text-muted-foreground/60">Add film</span>
							</button>
						{/if}
					{/each}
				</div>

				{#if isEditingFavorites}
					<div class="mt-5 space-y-3">
						<div class="relative">
							<Search
								class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
							/>
							<input
								type="text"
								placeholder="Search for a movie to add..."
								bind:value={favSearch}
								class="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary"
							/>
							{#if isSearchingFav}
								<Loader2
									class="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground"
								/>
							{/if}
						</div>
						{#if favSearchResults.length > 0}
							<div
								class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto"
							>
								{#each favSearchResults as movie (movie.tmdb_id)}
									<button
										onclick={() => addFavorite(movie)}
										disabled={favoriteIds.has(movie.tmdb_id)}
										class="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-primary disabled:opacity-40"
									>
										<div class="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
											{#if movie.poster}
												<img src={movie.poster} alt={movie.title} class="h-full w-full object-cover" />
											{/if}
										</div>
										<p class="text-xs font-medium leading-snug line-clamp-2">{movie.title}</p>
										{#if favoriteIds.has(movie.tmdb_id)}
											<div
												class="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/20"
											>
												<span class="text-xs font-semibold text-primary">Added</span>
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<!-- ── Recent Activity ── -->
			<section>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Film class="size-5 text-primary" />
						<h2 class="text-xl font-bold">Recent Activity</h2>
					</div>
					<a href="/history" class="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
						View all →
					</a>
				</div>
				{#if recentMovies.length === 0}
					<div
						class="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50"
					>
						<p class="text-sm text-muted-foreground">No recent activity. Start logging movies!</p>
					</div>
				{:else}
					<div class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
						{#each recentMovies as movie (movie.id)}
							<a href="/movie?id={movie.id}" class="group shrink-0 w-28">
								<div
									class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all group-hover:ring-primary/40 group-hover:shadow-xl"
								>
									{#if movie.poster}
										<img
											src={movie.poster}
											alt={movie.title}
											class="h-full w-full object-cover"
										/>
									{/if}
									{#if movie.user_rating > 0}
										<div
											class="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5"
										>
											<Star class="size-2.5 fill-amber-400 text-amber-400" />
											<span class="text-[10px] font-bold text-white"
												>{Number(movie.user_rating).toFixed(1)}</span
											>
										</div>
									{/if}
								</div>
								<p class="mt-2 text-xs font-medium truncate text-foreground/80 group-hover:text-primary transition-colors">
									{movie.title}
								</p>
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<!-- ── Rating Distribution ── -->
			{#if ratingData.some((d) => d.count > 0)}
				<section>
					<div class="mb-4 flex items-center gap-2">
						<Star class="size-5 text-amber-400" />
						<h2 class="text-xl font-bold">Rating Distribution</h2>
					</div>
					<div class="rounded-xl border border-border/50 bg-card p-6">
						<div class="flex items-end gap-2 h-32">
							{#each ratingData as d (d.rating)}
								<div class="flex flex-1 flex-col items-center gap-1">
									<div class="w-full relative flex items-end" style="height: 96px;">
										<div
											class="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors cursor-default"
											style="height: {Math.round((d.count / maxRating) * 96)}px; min-height: {d.count > 0 ? '4px' : '0px'};"
											title="{d.rating}★: {d.count}"
										></div>
									</div>
									<span class="text-[9px] text-muted-foreground">{d.rating}</span>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- ── Your Lists ── -->
			{#if userLists.length > 0}
				<section>
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Film class="size-5 text-primary" />
							<h2 class="text-xl font-bold">Your Lists</h2>
						</div>
						<a href="/lists" class="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
							View all →
						</a>
					</div>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each userLists as list (list.id)}
							<a
								href="/lists/{list.id}"
								class="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
							>
								<!-- Cover Stack -->
								<div class="relative flex h-48 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/40 to-muted/90 p-4 border-b border-border/40">
									{#if list.coverImages.length > 0}
										<div class="relative w-[220px] h-36 shrink-0">
											{#each list.coverImages.slice(0, 3) as img, i (i)}
												<div
													class="absolute top-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-[1.02]"
													style="
														left: {i * 40}px;
														z-index: {30 - i * 10};
														opacity: {1 - i * 0.15};
														transform: translateY({i * 4}px) scale({1 - i * 0.06});
														transform-origin: bottom left;
														height: 144px;
														width: 96px;
													"
												>
													<img
														src={img}
														alt="Cover {i}"
														class="h-full w-full object-cover"
													/>
												</div>
											{/each}
										</div>
									{:else}
										<div class="flex flex-col items-center justify-center gap-1.5 text-muted-foreground/30">
											<Film class="size-8" />
											<span class="text-xs font-medium">Empty List</span>
										</div>
									{/if}
								</div>
								<div class="p-4">
									<p class="font-bold text-foreground group-hover:text-primary transition-colors truncate">
										{list.title}
									</p>
									<p class="text-xs text-muted-foreground mt-1">
										{list.movieCount} {list.movieCount === 1 ? 'film' : 'films'}
									</p>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</main>
{/if}

<!-- ── Edit Profile Dialog ── -->
{#if editDialogOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-profile-title"
	>
		<div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
			<h2 id="edit-profile-title" class="text-xl font-bold mb-5">Edit Profile</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveProfile();
				}}
				class="space-y-4"
			>
				<div class="space-y-1.5">
					<label for="edit-display-name" class="text-sm font-medium">Display Name</label>
					<input
						id="edit-display-name"
						type="text"
						bind:value={editForm.display_name}
						placeholder="Your display name"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="edit-username" class="text-sm font-medium">Username</label>
					<input
						id="edit-username"
						type="text"
						bind:value={editForm.username}
						placeholder="username"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="edit-location" class="text-sm font-medium">Location</label>
					<input
						id="edit-location"
						type="text"
						bind:value={editForm.location}
						placeholder="City, Country"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="edit-bio" class="text-sm font-medium">Bio</label>
					<textarea
						id="edit-bio"
						bind:value={editForm.bio}
						placeholder="Tell people about yourself..."
						rows={3}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
					></textarea>
				</div>
				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (editDialogOpen = false)}
						class="flex-1 rounded-lg border border-border py-2 text-sm font-medium transition-colors hover:bg-muted"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSavingProfile}
						class="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						{#if isSavingProfile}
							<Loader2 class="size-4 animate-spin mx-auto" />
						{:else}
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ── Logout Confirmation ── -->
{#if logoutDialogOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center">
			<h2 class="text-xl font-bold mb-2">Sign out?</h2>
			<p class="text-sm text-muted-foreground mb-6">You'll need to log in again to access your account.</p>
			<div class="flex gap-3">
				<button
					onclick={() => (logoutDialogOpen = false)}
					class="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleLogout}
					class="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors"
				>
					Sign Out
				</button>
			</div>
		</div>
	</div>
{/if}
