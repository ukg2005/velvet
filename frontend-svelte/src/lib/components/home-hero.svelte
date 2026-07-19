<script lang="ts">
	import { Star } from 'lucide-svelte';

	let { movieId, title, backdrop_path, poster_path, score } = $props<{
		movieId: string | number;
		title: string;
		backdrop_path: string;
		poster_path: string;
		score: string | number;
	}>();
</script>

<div class="relative">
	<div class="relative h-[55vh] min-h-112.5 w-full overflow-hidden md:h-[65vh] pointer-events-none">
		<img
			src={backdrop_path}
			alt={`${title} backdrop`}
			class="object-cover w-full h-full"
			style="object-position: center 24%;"
		/>
		<div class="absolute inset-0 bg-black/10" />
		<div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
		<div class="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
	</div>

	<div class="container relative z-10 mx-auto px-4">
		<div class="relative -mt-56 flex flex-col gap-6 md:-mt-64 md:flex-row md:gap-8">
			<a
				href={`/movie?id=${movieId}`}
				class="relative mx-auto shrink-0 md:mx-0 block transition-transform duration-500 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			>
				<div class="relative aspect-[2/3] w-48 overflow-hidden rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 md:w-64">
					<img
						src={poster_path}
						alt={`${title} poster`}
						class="object-cover w-full h-full"
					/>
				</div>
				<div class="absolute -bottom-3 -right-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:size-16">
					<div class="text-center">
						<div class="flex items-center gap-0.5">
							<Star class="size-3 fill-current md:size-4" />
							<span class="text-lg font-bold md:text-xl">{score}</span>
						</div>
					</div>
				</div>
			</a>

			<div class="flex flex-1 flex-col justify-end space-y-4 pb-4 md:pb-6 text-center md:text-left">
				<div>
					<p class="mb-2 text-sm font-bold tracking-wider text-primary uppercase">
						Featured this week
					</p>
					<a
						href={`/movie?id=${movieId}`}
						class="group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
					>
						<h1 class="text-balance text-3xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-5xl lg:text-6xl">
							{title}
						</h1>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
