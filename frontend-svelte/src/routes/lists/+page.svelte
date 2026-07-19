<script lang="ts">
	import { onMount } from 'svelte';
	import { Film, Loader2, Plus, Trash2 } from 'lucide-svelte';
	import { ListService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	type MovieListCover = {
		id: number;
		title: string;
		desc: string;
		movieCount: number;
		is_public: boolean;
		coverImages: string[];
		updatedAt: string;
	};

	function normalizeList(raw: any): MovieListCover {
		const entries: any[] = raw.entries || [];
		const coverImages = entries
			.slice(0, 4)
			.map((e: any) => getImageUrl(e.movie?.poster_url || e.movie?.poster_path, 'w342'))
			.filter(Boolean);

		return {
			id: raw.id,
			title: raw.title || 'Untitled List',
			desc: raw.desc || '',
			movieCount: raw.count ?? entries.length,
			is_public: raw.is_public ?? false,
			coverImages,
			updatedAt: raw.updated_at
				? new Date(raw.updated_at).toLocaleDateString(undefined, {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					})
				: 'Recently'
		};
	}

	let lists = $state<MovieListCover[]>([]);
	let isLoading = $state(true);

	// Create list dialog state
	let dialogOpen = $state(false);
	let newTitle = $state('');
	let newDesc = $state('');
	let isPublic = $state(false);
	let isCreating = $state(false);

	$effect(() => {
		auth.requireAuth();
	});

	onMount(async () => {
		try {
			const data = await ListService.getLists();
			const raw: any[] = Array.isArray(data) ? data : data?.results || data?.lists || [];
			lists = raw.map(normalizeList);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load lists');
		} finally {
			isLoading = false;
		}
	});

	async function handleCreateList(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		isCreating = true;
		try {
			const created = await ListService.createList({
				title: newTitle.trim(),
				desc: newDesc.trim(),
				is_public: isPublic
			});
			toast.success(`"${created.title || newTitle}" created!`);
			lists = [normalizeList(created), ...lists];
			dialogOpen = false;
			newTitle = '';
			newDesc = '';
			isPublic = false;
		} catch (err: any) {
			toast.error(err?.response?.data?.detail || 'Failed to create list');
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteList(listId: number, listTitle: string) {
		if (!confirm(`Are you sure you want to delete "${listTitle}"? This cannot be undone.`)) return;
		try {
			await ListService.deleteList(listId);
			lists = lists.filter((l) => l.id !== listId);
			toast.success(`"${listTitle}" deleted`);
		} catch (err: any) {
			toast.error(err?.response?.data?.detail || 'Failed to delete list');
		}
	}
</script>

<svelte:head>
	<title>Your Lists · Velvet</title>
</svelte:head>

{#if isLoading}
	<main class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</main>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<div class="container mx-auto px-4 py-12 max-w-5xl">
			<header class="mb-10 border-b pb-6 flex items-end justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
						Your Lists
					</h1>
					<p class="mt-2 text-sm text-muted-foreground sm:text-base">
						Curate, rank, and organize your favorite films.
					</p>
				</div>
				<button
					onclick={() => (dialogOpen = true)}
					class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
				>
					<Plus class="size-4" />
					New List
				</button>
			</header>

			{#if lists.length === 0}
				<div class="flex flex-col items-center justify-center py-24 text-center">
					<div class="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
						<Film class="size-8 text-muted-foreground" />
					</div>
					<h2 class="text-xl font-semibold mb-2">No lists yet</h2>
					<p class="text-sm text-muted-foreground mb-6 max-w-sm">
						Create your first list to start curating and ranking your favorite movies.
					</p>
					<button
						onclick={() => (dialogOpen = true)}
						class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<Plus class="size-4" />
						Create Your First List
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each lists as list (list.id)}
						<div
							class="group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:border-primary/30"
						>
							<!-- Delete button -->
							<button
								onclick={(e) => {
									e.preventDefault();
									handleDeleteList(list.id, list.title);
								}}
								class="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive hover:text-white"
								title="Delete list"
							>
								<Trash2 class="size-4" />
							</button>

							<a href="/lists/{list.id}" class="flex flex-1 flex-col">
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

								<!-- List info -->
								<div class="flex flex-1 flex-col p-4">
									<div class="flex items-start justify-between gap-2">
										<h3
											class="text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-1"
										>
											{list.title}
										</h3>
										{#if !list.is_public}
											<span
												class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
												>Private</span
											>
										{/if}
									</div>
									<p class="text-sm text-muted-foreground mt-1 mb-2">
										{list.movieCount}
										{list.movieCount === 1 ? 'movie' : 'movies'} · Updated {list.updatedAt}
									</p>
									{#if list.desc}
										<p class="text-xs text-muted-foreground line-clamp-2">{list.desc}</p>
									{/if}
								</div>
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
{/if}

<!-- Create List Dialog -->
{#if dialogOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="create-list-title"
	>
		<div
			class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
			role="document"
		>
			<h2 id="create-list-title" class="text-xl font-bold mb-4">Create a New List</h2>
			<form onsubmit={handleCreateList} class="space-y-4">
				<div class="space-y-2">
					<label for="list-title" class="text-sm font-medium">Title</label>
					<input
						id="list-title"
						type="text"
						placeholder="e.g. Favorite Sci-Fi"
						bind:value={newTitle}
						required
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div class="space-y-2">
					<label for="list-desc" class="text-sm font-medium">Description (optional)</label>
					<input
						id="list-desc"
						type="text"
						placeholder="What's this list about?"
						bind:value={newDesc}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div class="flex items-center gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={isPublic}
						onclick={() => (isPublic = !isPublic)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isPublic
							? 'bg-primary'
							: 'bg-muted-foreground/30'}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {isPublic
								? 'translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
					<label class="text-sm cursor-pointer" onclick={() => (isPublic = !isPublic)}>
						Make public
					</label>
				</div>
				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (dialogOpen = false)}
						class="flex-1 rounded-lg border border-border py-2 text-sm font-medium transition-colors hover:bg-muted"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isCreating || !newTitle.trim()}
						class="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						{#if isCreating}
							<Loader2 class="size-4 animate-spin mx-auto" />
						{:else}
							Create List
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
