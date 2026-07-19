<script lang="ts">
	import { Users, Clapperboard } from 'lucide-svelte';

	interface CastMember {
		id: number;
		tmdb_id?: number;
		db_id?: number;
		name: string;
		character: string;
		profile_path: string;
	}

	interface CrewMember {
		id: number;
		tmdb_id?: number;
		db_id?: number;
		name: string;
		job: string;
		profile_path: string;
	}

	let { cast, crew } = $props<{
		cast: CastMember[];
		crew: CrewMember[];
	}>();

	let activeTab = $state<'cast' | 'crew'>('cast');

	const getPersonHref = (member: CastMember | CrewMember) => {
		const primaryId = member.tmdb_id || member.id || member.db_id;
		const dbParam = member.db_id ? `&dbId=${member.db_id}` : '';
		return `/person?id=${primaryId}${dbParam}`;
	};
</script>

<section class="mt-10 md:mt-14">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<button
				onclick={() => (activeTab = 'cast')}
				class={[
					'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
					activeTab === 'cast'
						? 'bg-primary text-primary-foreground'
						: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
				].join(' ')}
			>
				<Users class="size-4" />
				Cast
				<span
					class={[
						'rounded-full px-2 py-0.5 text-xs',
						activeTab === 'cast'
							? 'bg-primary-foreground/20 text-primary-foreground'
							: 'bg-muted text-muted-foreground'
					].join(' ')}
				>
					{cast.length}
				</span>
			</button>
			<button
				onclick={() => (activeTab = 'crew')}
				class={[
					'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
					activeTab === 'crew'
						? 'bg-primary text-primary-foreground'
						: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
				].join(' ')}
			>
				<Clapperboard class="size-4" />
				Crew
				<span
					class={[
						'rounded-full px-2 py-0.5 text-xs',
						activeTab === 'crew'
							? 'bg-primary-foreground/20 text-primary-foreground'
							: 'bg-muted text-muted-foreground'
					].join(' ')}
				>
					{crew.length}
				</span>
			</button>
		</div>
	</div>

	<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-left">
		{#if activeTab === 'cast'}
			{#each cast as member, index (`${member.id}-${member.character}-${index}`)}
				<a
					href={getPersonHref(member)}
					class="group block rounded-lg bg-secondary/50 p-3 ring-1 ring-border transition-all hover:bg-secondary hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				>
					<p
						class="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary"
					>
						{member.name}
					</p>
					<p class="truncate text-xs text-muted-foreground mt-0.5">
						{member.character}
					</p>
				</a>
			{/each}
		{:else}
			{#each crew as member, index (`${member.id}-${member.job}-${index}`)}
				<a
					href={getPersonHref(member)}
					class="group block rounded-lg bg-secondary/50 p-3 ring-1 ring-border transition-all hover:bg-secondary hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				>
					<p
						class="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary"
					>
						{member.name}
					</p>
					<p class="truncate text-xs text-muted-foreground mt-0.5">
						{member.job}
					</p>
				</a>
			{/each}
		{/if}
	</div>
</section>
