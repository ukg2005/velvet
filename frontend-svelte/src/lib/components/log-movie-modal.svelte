<script lang="ts">
import { Calendar as CalendarIcon, Star, Repeat, Loader2 } from 'lucide-svelte';
	import { format } from 'date-fns';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { LogService } from '$lib/services';
	import { toast } from 'svelte-sonner';
	import { getLocalTimeZone, today, parseDate } from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';

	interface LogMovieModalMovie {
		id?: string | number;
		title: string;
		poster_path: string;
	}

	let { open = $bindable(false), movie, log = null, onSuccess } = $props<{
		open?: boolean;
		movie?: LogMovieModalMovie | null;
		log?: any | null;
		onSuccess?: (rating: number) => void;
	}>();

	let isSaving = $state(false);

	let rating = $state(0);
	let date = $state<DateValue | undefined>(today(getLocalTimeZone()));
	let isRewatch = $state(false);
	let review = $state('');

	$effect(() => {
		if (open) {
			if (log) {
				rating = Number(log.rating || 0);
				review = log.review || '';
				isRewatch = log.rewatch || log.is_rewatch || false;
				if (log.logged_at) {
					try {
						date = parseDate(log.logged_at);
					} catch {
						date = today(getLocalTimeZone());
					}
				} else {
					date = today(getLocalTimeZone());
				}
			} else {
				rating = 0;
				date = today(getLocalTimeZone());
				isRewatch = false;
				review = '';
			}
			isSaving = false;
		}
	});

	let hoverValue = $state<number | null>(null);

	function setHover(val: number | null) {
		hoverValue = val;
	}

	function handleStarClick(event: MouseEvent, starValue: number) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const clickedLeftHalf = event.clientX - rect.left < rect.width / 2;
		rating = clickedLeftHalf ? starValue - 0.5 : starValue;
	}

	function handleStarMove(event: PointerEvent, starValue: number) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const hoveredLeftHalf = event.clientX - rect.left < rect.width / 2;
		setHover(hoveredLeftHalf ? starValue - 0.5 : starValue);
	}

	function handleStarKeyDown(e: KeyboardEvent, starValue: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			rating = starValue;
		}
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		if (!movie) {
			toast.error('No movie selected to log.');
			return;
		}
		if (!movie.id) {
			toast.error('Movie ID is missing. Please open this from a movie page.');
			return;
		}
		if (rating < 0.5) {
			toast.error('Please provide a rating.');
			return;
		}

		isSaving = true;
		try {
			const payload = {
				tmdb_id: Number(movie.id),
				rating: rating,
				review: review,
				is_rewatch: isRewatch,
				logged_at: date ? format(date.toDate(getLocalTimeZone()), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
			};

			if (log && log.id) {
				await LogService.updateLog(log.id, payload);
				toast.success('Log updated successfully!');
			} else {
				await LogService.createLog(payload);
				toast.success('Log saved successfully!');
			}
			open = false;
			if (onSuccess) onSuccess(rating);
		} catch (err: any) {
			toast.error(
				err.response?.data?.detail || err.response?.data?.logged_at?.[0] || 'Failed to save log.'
			);
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-[min(92vw,720px)] gap-0 overflow-hidden p-0 sm:max-w-[45rem]">
		<form onsubmit={onSubmit}>
			<div class="border-b border-border px-6 py-5">
				<Dialog.Header class="text-left">
					<div class="flex items-center gap-4">
						{#if movie?.poster_path}
							<div
								class="relative aspect-[2/3] w-16 overflow-hidden rounded-md ring-1 ring-border sm:w-20"
							>
								<img
									src={movie.poster_path}
									alt={`${movie.title} poster`}
									class="object-cover w-full h-full"
								/>
							</div>
						{:else}
							<div
								class="flex aspect-[2/3] w-16 items-center justify-center rounded-md ring-1 ring-border sm:w-20"
							>
								<span class="text-xs text-muted-foreground">No Poster</span>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<Dialog.Title class="truncate text-xl sm:text-2xl">
								{movie?.title || 'Log a Movie'}
							</Dialog.Title>
							<Dialog.Description class="mt-1">
								{movie
									? 'Log your rating and thoughts for this movie.'
									: 'Open this from a movie page to prefill details.'}
							</Dialog.Description>
						</div>
					</div>
				</Dialog.Header>
			</div>

			<div class="space-y-6 px-6 py-5 text-left">
				<div class="space-y-3">
					<div>
						<p class="text-sm font-medium text-foreground">Rating</p>
					</div>
					<!-- Stars -->
					<div
						class="flex items-center gap-1"
						onmouseleave={() => setHover(null)}
						role="group"
						aria-label="Movie rating"
					>
						{#each Array(5) as _, index}
							{@const starValue = index + 1}
							{@const displayValue = hoverValue !== null ? hoverValue : rating}
							{@const isFull = displayValue >= starValue}
							{@const isHalf = displayValue >= starValue - 0.5 && displayValue < starValue}

							<button
								type="button"
								onclick={(e) => handleStarClick(e, starValue)}
								onkeydown={(e) => handleStarKeyDown(e, starValue)}
								onpointermove={(e) => handleStarMove(e, starValue)}
								class="group relative size-10 transition-transform active:scale-95 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
								aria-label={`Rate ${starValue} stars`}
								aria-pressed={rating >= starValue - 0.5}
							>
								<Star
									class="absolute inset-0 size-10 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/50"
								/>
								<Star
									class={[
										'absolute inset-0 size-10 text-primary transition-all duration-200',
										isFull || isHalf ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
										hoverValue !== null ? 'drop-shadow-md' : ''
									].join(' ')}
									style={isHalf ? 'clip-path: inset(0 50% 0 0);' : ''}
								/>
							</button>
						{/each}
					</div>
					<div class="text-sm text-muted-foreground">Selected rating: {rating.toFixed(1)} / 5</div>
				</div>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div class="space-y-3">
						<p class="text-sm font-medium text-foreground">Date watched</p>
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class={[
											'w-full justify-start gap-2 text-left font-normal',
											!date && 'text-muted-foreground'
										].join(' ')}
										{...props}
									>
										<CalendarIcon class="size-4" />
										{#if date}
											{format(date.toDate(getLocalTimeZone()), 'PPP')}
										{:else}
											<span>Pick a date</span>
										{/if}
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto p-0" align="start">
								<Calendar type="single" bind:value={date as any} initialFocus />
							</Popover.Content>
						</Popover.Root>
					</div>

					<div class="space-y-3">
						<p class="text-sm font-medium text-foreground">Rewatch</p>
						<label
							for="rewatch"
							class="flex h-10 w-full items-center gap-3 rounded-md border border-input px-3 shadow-sm transition-colors hover:bg-accent/50 cursor-pointer"
						>
							<Switch id="rewatch" bind:checked={isRewatch} class="focus-visible:ring-0 focus-visible:outline-none" />
							<span class="flex items-center gap-2 text-sm font-normal select-none">
								<Repeat class="size-4 text-muted-foreground" />
								I've seen this before
							</span>
						</label>
					</div>
				</div>

				<div class="space-y-3">
					<p class="text-sm font-medium text-foreground">Review</p>
					<Textarea
						bind:value={review}
						placeholder="Write your review"
						class="min-h-28 resize-none"
					/>
				</div>
			</div>

			<Dialog.Footer class="mx-0! mb-0! bg-transparent! border-t border-border px-6 py-5 flex justify-end!">
				<Button
					type="submit"
					class="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
					disabled={isSaving}
				>
					{#if isSaving}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					{/if}
					Save Log
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
