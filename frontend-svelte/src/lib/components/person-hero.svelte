<script lang="ts">
	import { Calendar, MapPin, Film, Award, TrendingUp } from 'lucide-svelte';

	interface Props {
		name: string;
		profile_pic: string;
		date_of_birth: string;
		place_of_birth: string;
		totalMovies: number;
		knownFor: string;
		careerSpan?: string;
	}

	let {
		name,
		profile_pic,
		date_of_birth,
		place_of_birth,
		totalMovies,
		knownFor,
		careerSpan = 'Unknown'
	}: Props = $props();

	function calculateAge(birthDate: string): number {
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	let age = $derived(date_of_birth ? calculateAge(date_of_birth) : 0);
</script>

<section class="relative">
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>

	<div class="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-8 md:flex-row md:items-start">
			<!-- Profile Picture -->
			<div class="relative mx-auto aspect-[2/3] w-52 shrink-0 overflow-hidden rounded-xl ring-2 ring-border shadow-2xl md:mx-0 md:w-56">
				<img
					src={profile_pic}
					alt={name}
					class="h-full w-full object-cover"
				/>
			</div>

			<!-- Person Info -->
			<div class="flex flex-1 flex-col items-center text-center md:items-start md:pt-2 md:text-left">
				<p class="text-sm font-medium text-primary">{knownFor}</p>
				<h1 class="mt-1 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
					{name}
				</h1>

				<div class="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground md:justify-start">
					{#if date_of_birth}
						<div class="flex items-center gap-2">
							<Calendar class="h-4 w-4 text-primary" />
							<span class="text-sm">
								{formatDate(date_of_birth)} ({age} years old)
							</span>
						</div>
					{/if}

					{#if place_of_birth}
						<div class="flex items-center gap-2">
							<MapPin class="h-4 w-4 text-primary" />
							<span class="text-sm">{place_of_birth}</span>
						</div>
					{/if}
				</div>

				<!-- Quick Stats -->
				<div class="mt-6 grid w-full max-w-md grid-cols-2 gap-3 md:max-w-none md:grid-cols-3">
					<div class="rounded-lg bg-card p-4 ring-1 ring-border">
						<div class="flex items-center gap-2 text-muted-foreground">
							<Film class="h-4 w-4" />
							<span class="text-xs">Total Credits</span>
						</div>
						<p class="mt-1 text-2xl font-bold text-foreground">{totalMovies}</p>
					</div>
					<div class="rounded-lg bg-card p-4 ring-1 ring-border">
						<div class="flex items-center gap-2 text-muted-foreground">
							<Award class="h-4 w-4" />
							<span class="text-xs">Known For</span>
						</div>
						<p class="mt-1 text-lg font-semibold text-foreground">{knownFor}</p>
					</div>
					<div class="col-span-2 rounded-lg bg-card p-4 ring-1 ring-border md:col-span-1">
						<div class="flex items-center gap-2 text-muted-foreground">
							<TrendingUp class="h-4 w-4" />
							<span class="text-xs">Career Span</span>
						</div>
						<p class="mt-1 text-lg font-semibold text-foreground">{careerSpan}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
