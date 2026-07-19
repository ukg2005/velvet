<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { GripVertical, Loader2, Plus, Search, Save, X, Pencil, Settings, Check } from 'lucide-svelte';
	import { ListService, MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	type ListMovie = {
		entryId: number;
		tmdb_id: number;
		title: string;
		year: string | number | null;
		poster_path: string;
		order: number;
	};

	type SearchResult = {
		tmdb_id: number;
		title: string;
		year: string | number | null;
		poster_path: string;
	};

	function normalizeEntries(entries: any[]): ListMovie[] {
		return entries
			.map((e: any, idx: number) => {
				const movie = e.movie || e;
				const tmdbId = Number(movie?.tmdb_id || movie?.id);
				if (!Number.isFinite(tmdbId)) return null;
				return {
					entryId: e.id ?? idx,
					tmdb_id: tmdbId,
					title: movie?.title || movie?.original_title || 'Untitled',
					year: movie?.year ?? movie?.release_date?.slice?.(0, 4) ?? null,
					poster_path: getImageUrl(movie?.poster_url || movie?.poster_path, 'w154'),
					order: e.order ?? idx
				};
			})
			.filter(Boolean) as ListMovie[];
	}

	function normalizeSearchResults(results: any[]): SearchResult[] {
		return results
			.map((m: any) => {
				const tmdbId = Number(m?.tmdb_id || m?.id);
				if (!Number.isFinite(tmdbId)) return null;
				return {
					tmdb_id: tmdbId,
					title: m?.title || m?.original_title || 'Untitled',
					year: m?.year ?? m?.release_date?.slice?.(0, 4) ?? null,
					poster_path: getImageUrl(m?.poster_url || m?.poster_path, 'w154')
				};
			})
			.filter(Boolean) as SearchResult[];
	}

	const listId = $derived($page.params.id);

	let listTitle = $state('');
	let listDesc = $state('');
	let movies = $state<ListMovie[]>([]);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let hasChanges = $state(false);

	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let isSearchDropdownOpen = $state(false);
	let searchDebounceTimer: ReturnType<typeof setTimeout>;

	// Drag state
	let draggedIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);

	let isPublic = $state(false);
	let editDialogOpen = $state(false);
	let editTitle = $state('');
	let editDesc = $state('');
	let isUpdatingDetails = $state(false);

	async function handleUpdateDetails(e: Event) {
		e.preventDefault();
		if (!editTitle.trim()) return;
		isUpdatingDetails = true;
		try {
			const updated = await ListService.updateList(listId, {
				title: editTitle.trim(),
				desc: editDesc.trim(),
				is_public: isPublic
			});
			listTitle = updated.title || editTitle.trim();
			listDesc = updated.desc || editDesc.trim();
			isPublic = updated.is_public ?? isPublic;
			toast.success('List details updated successfully!');
			editDialogOpen = false;
		} catch (err: any) {
			toast.error(err?.response?.data?.detail || 'Failed to update list details');
		} finally {
			isUpdatingDetails = false;
		}
	}

	function openEditDialog() {
		editTitle = listTitle;
		editDesc = listDesc;
		editDialogOpen = true;
	}

	$effect(() => {
		auth.requireAuth();
	});

	onMount(async () => {
		if (!listId) return;
		try {
			const data = await ListService.getList(listId);
			listTitle = data.title || 'Untitled List';
			listDesc = data.desc || '';
			isPublic = data.is_public ?? false;
			movies = normalizeEntries(data.entries || []);
		} catch (err: any) {
			toast.error('Failed to load list');
			console.error(err);
		} finally {
			isLoading = false;
		}
	});

	// Search with debounce
	$effect(() => {
		const q = searchQuery;
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		if (!q.trim() || q.length < 2) {
			searchResults = [];
			return;
		}
		searchDebounceTimer = setTimeout(async () => {
			isSearching = true;
			try {
				const data = await MovieService.search(q);
				const raw = Array.isArray(data) ? data : data?.movies || data?.results || [];
				searchResults = normalizeSearchResults(raw).slice(0, 8);
			} catch {
				searchResults = [];
			} finally {
				isSearching = false;
			}
		}, 400);
	});

	async function handleAddMovie(movie: SearchResult) {
		if (movies.some((m) => m.tmdb_id === movie.tmdb_id)) {
			toast.info('Already in this list');
			return;
		}
		try {
			const res = await ListService.addToList(listId, movie.tmdb_id);
			const entryId = res?.entry_id ?? Date.now();
			movies = [
				...movies,
				{
					entryId: entryId,
					tmdb_id: movie.tmdb_id,
					title: movie.title,
					year: movie.year,
					poster_path: movie.poster_path,
					order: movies.length
				}
			];
			searchQuery = '';
			isSearchDropdownOpen = false;
			toast.success(`${movie.title} added`);
		} catch (err: any) {
			toast.error(err?.response?.data?.warning || err?.response?.data?.error || 'Failed to add movie');
		}
	}

	function handleRemoveMovie(tmdbId: number) {
		movies = movies.filter((m) => m.tmdb_id !== tmdbId);
		hasChanges = true;
	}

	async function handleSave() {
		isSaving = true;
		try {
			const items = movies.map((m, i) => ({ id: m.entryId, order: i }));
			await ListService.reorderList(listId, items);
			hasChanges = false;
			toast.success('List saved!');
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to save changes');
		} finally {
			isSaving = false;
		}
	}

	// Drag and drop
	function onDragStart(e: DragEvent, index: number) {
		draggedIdx = index;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIdx === null || index === draggedIdx) return;
		dragOverIdx = index;
	}

	function onDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIdx === null) return;
		const reordered = [...movies];
		const [dragged] = reordered.splice(draggedIdx, 1);
		reordered.splice(index, 0, dragged);
		movies = reordered;
		if (draggedIdx !== index) hasChanges = true;
		draggedIdx = null;
		dragOverIdx = null;
	}

	function onDragEnd() {
		draggedIdx = null;
		dragOverIdx = null;
	}
</script>

<svelte:head>
	<title>{listTitle || 'List'} · Velvet</title>
</svelte:head>

{#if isLoading}
	<main class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</main>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<div class="container mx-auto max-w-3xl px-4 py-12">
			<!-- Header -->
			<header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-3">
						<h1 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl truncate">
							{listTitle}
						</h1>
						<button
							onclick={openEditDialog}
							class="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer shrink-0"
						>
							<Pencil class="size-3" />
							Edit Details
						</button>
					</div>
					{#if listDesc}
						<p class="mt-2 text-sm text-muted-foreground">{listDesc}</p>
					{/if}
				</div>
				<div class="flex gap-2 shrink-0">
					{#if hasChanges}
						<button
							onclick={handleSave}
							disabled={isSaving}
							class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							{#if isSaving}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<Save class="size-4" />
							{/if}
							Save Changes
						</button>
					{:else}
						<span class="text-sm text-muted-foreground self-center">
							{movies.length}
							{movies.length === 1 ? 'film' : 'films'}
						</span>
					{/if}
				</div>
			</header>

			<!-- Search to add movie -->
			<div class="relative mb-8 z-40">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search for movies to add..."
						class="w-full h-11 pl-9 pr-4 rounded-md border border-border bg-card text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
						bind:value={searchQuery}
						onfocus={() => (isSearchDropdownOpen = true)}
						onblur={() => setTimeout(() => (isSearchDropdownOpen = false), 200)}
					/>
					{#if isSearching}
						<Loader2
							class="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground"
						/>
					{/if}
				</div>

				{#if isSearchDropdownOpen && searchQuery.length > 1}
					<div
						class="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border bg-card shadow-2xl max-h-72 overflow-y-auto z-50"
					>
						{#if searchResults.length > 0}
							{#each searchResults as movie (movie.tmdb_id)}
								<button
									onmousedown={() => handleAddMovie(movie)}
									class="flex w-full items-center gap-3 p-3 text-left hover:bg-accent transition-colors"
								>
									<div class="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
										{#if movie.poster_path}
											<img
												src={movie.poster_path}
												alt={movie.title}
												class="h-full w-full object-cover"
											/>
										{/if}
									</div>
									<div class="flex flex-col min-w-0">
										<span class="font-medium text-sm text-foreground truncate">{movie.title}</span>
										{#if movie.year}
											<span class="text-xs text-muted-foreground">{movie.year}</span>
										{/if}
									</div>
									<Plus class="ml-auto size-4 text-muted-foreground shrink-0" />
								</button>
							{/each}
						{:else if !isSearching}
							<div class="p-4 text-center text-sm text-muted-foreground">No movies found.</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Movie list -->
			{#if movies.length === 0}
				<div class="flex flex-col items-center justify-center py-24 text-center">
					<div class="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
						<GripVertical class="size-8 text-muted-foreground" />
					</div>
					<h2 class="text-xl font-semibold mb-2">This list is empty</h2>
					<p class="text-sm text-muted-foreground">Use the search above to add movies and rank them.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each movies as movie, index (movie.tmdb_id + '-' + index)}
						<div
							draggable="true"
							ondragstart={(e) => onDragStart(e, index)}
							ondragover={(e) => onDragOver(e, index)}
							ondrop={(e) => onDrop(e, index)}
							ondragend={onDragEnd}
							class="group relative flex items-center rounded-xl transition-all duration-200 ease-in-out {draggedIdx ===
							index
								? 'opacity-60 scale-[0.98] ring-2 ring-primary ring-offset-2 ring-offset-background z-20 shadow-xl'
								: dragOverIdx === index
									? 'ring-2 ring-primary/50 shadow-md bg-accent/30 scale-[1.01] z-10'
									: 'border border-border/50 bg-card hover:border-primary/40 hover:shadow-md'}"
						>
							<!-- Drop indicator top -->
							{#if dragOverIdx === index && draggedIdx !== null && draggedIdx > index}
								<div class="absolute -top-1.5 left-0 right-0 h-1 bg-primary rounded-full"></div>
							{/if}
							<!-- Drop indicator bottom -->
							{#if dragOverIdx === index && draggedIdx !== null && draggedIdx < index}
								<div class="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary rounded-full"></div>
							{/if}

							<!-- Drag handle -->
							<div
								class="flex h-20 w-10 shrink-0 cursor-grab items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground group-hover:text-muted-foreground active:cursor-grabbing"
							>
								<GripVertical class="size-5" />
							</div>

							<!-- Rank number -->
							<div
								class="flex w-10 shrink-0 items-center justify-center text-lg font-bold text-muted-foreground group-hover:text-foreground"
							>
								{index + 1}
							</div>

							<!-- Poster -->
							<div
								class="relative my-2 mr-4 aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-muted shadow-sm md:w-14"
							>
								{#if movie.poster_path}
									<img
										src={movie.poster_path}
										alt={movie.title}
										class="absolute inset-0 h-full w-full object-cover"
									/>
								{/if}
							</div>

							<!-- Movie info -->
							<div class="flex min-w-0 flex-1 flex-col justify-center">
								<a
									href="/movie?id={movie.tmdb_id}"
									class="truncate text-base font-semibold text-foreground transition-colors hover:text-primary md:text-lg"
								>
									{movie.title}
								</a>
								{#if movie.year}
									<span class="mt-1 text-sm text-muted-foreground">{movie.year}</span>
								{/if}
							</div>

							<!-- Remove button -->
							<button
								onclick={() => handleRemoveMovie(movie.tmdb_id)}
								class="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
								title="Remove from list"
							>
								<X class="size-4" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
{/if}

<!-- Edit List Details Dialog -->
{#if editDialogOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-list-dialog-title"
	>
		<div
			class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
			role="document"
		>
			<h2 id="edit-list-dialog-title" class="text-xl font-bold mb-4">Edit List Details</h2>
			<form onsubmit={handleUpdateDetails} class="space-y-4 text-left">
				<div class="space-y-2">
					<label for="edit-list-title-input" class="text-sm font-medium">Title</label>
					<input
						id="edit-list-title-input"
						type="text"
						bind:value={editTitle}
						required
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div class="space-y-2">
					<label for="edit-list-desc-input" class="text-sm font-medium">Description (optional)</label>
					<input
						id="edit-list-desc-input"
						type="text"
						bind:value={editDesc}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div class="flex items-center gap-3">
					<button
						id="list-public-toggle"
						type="button"
						role="switch"
						aria-checked={isPublic}
						onclick={() => (isPublic = !isPublic)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isPublic
							? 'bg-primary'
							: 'bg-muted-foreground/30'}"
						aria-label="Make list public"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {isPublic
								? 'translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
					<span class="text-sm text-foreground">
						Make public
					</span>
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
						disabled={isUpdatingDetails || !editTitle.trim()}
						class="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						{#if isUpdatingDetails}
							<Loader2 class="size-4 animate-spin mx-auto" />
						{:else}
							Save Details
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
