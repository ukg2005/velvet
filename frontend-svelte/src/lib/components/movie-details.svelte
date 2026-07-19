<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Film, Clapperboard, Camera, Music, PenTool, Palette, Scissors } from 'lucide-svelte';

	interface Genre {
		id: number;
		name: string;
	}

	interface CrewMember {
		id: number;
		tmdb_id?: number;
		db_id?: number;
		name: string;
		job: string;
		profile_path: string;
	}

	let { tagline, overview, genres, crew } = $props<{
		tagline: string;
		overview: string;
		genres: Genre[];
		crew: CrewMember[];
	}>();

	const keyCrewJobs = ['Director', 'Screenplay', 'Original Music Composer', 'Director of Photography'];
	let keyCrew = $derived(crew.filter((c) => keyCrewJobs.includes(c.job)));

	const getPersonHref = (member: CrewMember) => {
		const primaryId = member.tmdb_id || member.id || member.db_id;
		const dbParam = member.db_id ? `&dbId=${member.db_id}` : '';
		return `/person?id=${primaryId}${dbParam}`;
	};
</script>

<section class="mt-4 space-y-6 md:mt-6">
	<div class="max-w-3xl">
		{#if tagline}
			<p class="text-base italic text-muted-foreground mb-4">"{tagline}"</p>
		{/if}
		<h2 class="text-xl font-semibold text-foreground">Overview</h2>
		<p class="mt-2 leading-relaxed text-muted-foreground">{overview}</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each keyCrew as member, index (`${member.id}-${member.job}-${index}`)}
			<a
				href={getPersonHref(member)}
				class="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					{#if member.job === 'Director'}
						<Clapperboard class="size-4" />
					{:else if member.job === 'Director of Photography'}
						<Camera class="size-4" />
					{:else if member.job === 'Original Music Composer'}
						<Music class="size-4" />
					{:else if member.job === 'Screenplay'}
						<PenTool class="size-4" />
					{:else if member.job === 'Production Design'}
						<Palette class="size-4" />
					{:else if member.job === 'Editor'}
						<Scissors class="size-4" />
					{:else}
						<Clapperboard class="size-4" />
					{/if}
					{member.job}
				</div>
				<p class="mt-1 font-medium text-foreground transition-colors group-hover:text-primary">
					{member.name}
				</p>
			</a>
		{/each}
	</div>

	<div class="rounded-lg border border-border bg-card p-4 text-left">
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<Film class="size-4" />
			Genres
		</div>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each genres as genre (genre.id)}
				<Badge variant="secondary">
					{genre.name}
				</Badge>
			{/each}
		</div>
	</div>
</section>
