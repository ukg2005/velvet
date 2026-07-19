<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, Star, Film, Pencil, Trash2, Repeat2 } from 'lucide-svelte';
	import { LogService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import LogMovieModal from '$lib/components/log-movie-modal.svelte';

	let logs = $state<any[]>([]);
	let isLoading = $state(true);
	let editLogEntry = $state<any | null>(null);
	let editMovie = $state<any | null>(null);
	let logModalOpen = $state(false);

	$effect(() => {
		auth.requireAuth();
	});

	onMount(async () => {
		try {
			const payload = await LogService.getLogs();
			const fetched = Array.isArray(payload) ? payload : payload?.logs || payload?.results || [];
			logs = fetched.sort(
				(a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
			);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load history');
		} finally {
			isLoading = false;
		}
	});

	function openEdit(log: any) {
		editLogEntry = log;
		editMovie = {
			id: log.movie.tmdb_id,
			title: log.movie.title,
			poster_path: getImageUrl(log.movie.poster_url || log.movie.poster_path, 'w500')
		};
		logModalOpen = true;
	}

	async function deleteLog(log: any) {
		if (!log.id) { toast.error('Cannot delete: missing log ID'); return; }
		try {
			await LogService.deleteLog(log.id);
			logs = logs.filter((l: any) => l.id !== log.id);
			toast.success('Log deleted');
		} catch (err) {
			console.error(err);
			toast.error('Failed to delete log');
		}
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return { month: 'N/A', day: '-', year: '' };
		const d = new Date(dateStr);
		return {
			month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
			day: d.getDate(),
			year: d.getFullYear()
		};
	}
</script>

<svelte:head>
	<title>Viewing History · Velvet</title>
</svelte:head>

<main class="min-h-screen bg-background pt-16">
	<div class="container mx-auto max-w-5xl px-4 py-12">
		<div class="mb-8 flex items-center gap-4">
			<a
				href="/profile"
				class="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all"
			>
				<ArrowLeft class="size-5" />
			</a>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Viewing History</h1>
				<p class="text-muted-foreground text-sm mt-1">All the movies you've ever logged.</p>
			</div>
		</div>

		{#if isLoading}
			<!-- Skeleton loading -->
			<div class="flex flex-col gap-3">
				{#each { length: 8 } as _, i (i)}
					<div class="h-[88px] w-full animate-pulse rounded-xl bg-muted"></div>
				{/each}
			</div>
		{:else if logs.length === 0}
			<div
				class="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50"
			>
				<Film class="size-10 text-muted-foreground/40 mb-3" />
				<p class="text-lg font-medium text-muted-foreground">You haven't logged any movies yet.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each logs as log, index (log.id ?? index)}
					{#if log.movie}
						{@const { month, day, year } = formatDate(log.logged_at)}
						<div class="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:bg-primary/5">
							<!-- Date block -->
							<div
								class="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/50 py-1.5"
							>
								<span class="text-[10px] font-bold text-muted-foreground tracking-widest"
									>{month}</span
								>
								<span class="text-lg font-extrabold text-foreground leading-none mt-0.5">{day}</span>
								<span class="text-[10px] font-medium text-muted-foreground/80 mt-0.5">{year}</span>
							</div>

							<!-- Poster -->
							<a href="/movie?id={log.movie.tmdb_id}" class="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-white/10">
								{#if log.movie.poster_url || log.movie.poster_path}
									<img
										src={getImageUrl(log.movie.poster_url || log.movie.poster_path, 'w154')}
										alt={log.movie.title}
										class="absolute inset-0 h-full w-full object-cover"
									/>
								{/if}
							</a>

							<!-- Details -->
							<div class="flex flex-1 items-center justify-between overflow-hidden gap-3">
								<a href="/movie?id={log.movie.tmdb_id}" class="flex-1 min-w-0">
									<h3
										class="truncate text-base font-bold text-foreground transition-colors hover:text-primary"
									>
										{log.movie.title}
									</h3>
								</a>
								<div class="flex items-center gap-2 shrink-0">
									{#if log.is_rewatch}
										<div class="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
											<Repeat2 class="size-3" />
											<span class="text-[11px] font-medium">Rewatch</span>
										</div>
									{/if}
									{#if log.rating > 0}
										<div class="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1">
											<Star class="size-3.5 fill-amber-400 text-amber-400" />
											<span class="text-sm font-semibold text-white">{Number(log.rating).toFixed(1)}</span>
										</div>
									{/if}
									<button
										type="button"
										onclick={() => openEdit(log)}
										class="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
										title="Edit log"
									>
										<Pencil class="size-3.5" />
									</button>
									<button
										type="button"
										onclick={() => deleteLog(log)}
										class="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
										title="Delete log"
									>
										<Trash2 class="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</main>

<LogMovieModal
	bind:open={logModalOpen}
	movie={editMovie}
	log={editLogEntry}
	onSuccess={async (r) => {
		// refresh the logs list after update
		try {
			const payload = await LogService.getLogs();
			const fetched = Array.isArray(payload) ? payload : payload?.logs || payload?.results || [];
			logs = fetched.sort(
				(a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
			);
		} catch {}
	}}
/>
