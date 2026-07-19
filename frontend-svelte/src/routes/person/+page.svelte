<script lang="ts">
	import { page } from '$app/stores';
	import { MovieService } from '$lib/services';
	import { getImageUrl } from '$lib/utils';
	import { Loader2 } from 'lucide-svelte';
	import PersonHero from '$lib/components/person-hero.svelte';
	import PersonBio from '$lib/components/person-bio.svelte';
	import PersonFilmography from '$lib/components/person-filmography.svelte';

	let id = $derived($page.url.searchParams.get('id'));
	let dbId = $derived($page.url.searchParams.get('dbId'));

	let personData = $state<any>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		let isActive = true;

		async function loadPerson() {
			if (!id) {
				error = 'No person ID provided.';
				isLoading = false;
				return;
			}

			isLoading = true;
			error = null;

			try {
				let data;
				try {
					data = await MovieService.getPerson(id);
				} catch (primaryError) {
					if (!dbId || dbId === id) {
						throw primaryError;
					}
					data = await MovieService.getPerson(dbId);
				}
				if (!isActive) return;

				const mappedData = {
					name: data.name,
					profile_pic: getImageUrl(data.profile_url || data.profile_path, 'w500'),
					date_of_birth: data.date_of_birth,
					place_of_birth: data.place_of_birth,
					bio: data.bio || data.biography || 'No biography available.',
					known_for_department: data.known_for_department || 'Acting'
				};

				const mapCredit = (m: any) => ({
					id: m.tmdb_id || m.id,
					title: m.title || m.original_title || m.name || m.original_name,
					character: m.character,
					job: m.job,
					department: m.department,
					release_date:
						m.release_date || m.first_air_date ? (m.release_date || m.first_air_date).split('-')[0] : '',
					poster_path: getImageUrl(m.poster_url || m.poster_path, 'w300'),
					rating: m.vote_average || 0
				});

				const creditsByDepartment: Record<string, any[]> = {};
				let totalCredits = 0;

				if (data.cast && data.cast.length > 0) {
					creditsByDepartment['Acting'] = data.cast
						.map(mapCredit)
						.sort((a: any, b: any) => parseInt(b.release_date || '0') - parseInt(a.release_date || '0'));
					totalCredits += data.cast.length;
				}

				if (data.crew && data.crew.length > 0) {
					data.crew.forEach((m: any) => {
						const mapped = mapCredit(m);
						const dep = mapped.department || 'Crew';
						if (!creditsByDepartment[dep]) creditsByDepartment[dep] = [];
						creditsByDepartment[dep].push(mapped);
						totalCredits++;
					});

					Object.keys(creditsByDepartment).forEach((dep) => {
						if (dep !== 'Acting') {
							creditsByDepartment[dep].sort(
								(a: any, b: any) => parseInt(b.release_date || '0') - parseInt(a.release_date || '0')
							);
						}
					});
				}

				let earliestYear = 9999;
				let latestYear = 0;
				const currentYear = new Date().getFullYear();

				Object.values(creditsByDepartment)
					.flat()
					.forEach((c: any) => {
						if (c.release_date) {
							const year = parseInt(c.release_date);
							if (!isNaN(year) && year > 1800 && year <= currentYear + 5) {
								if (year < earliestYear) earliestYear = year;
								if (year > latestYear) latestYear = year;
							}
						}
					});

				let careerSpan = 'Unknown';
				if (earliestYear !== 9999 && latestYear !== 0) {
					if (earliestYear === latestYear && latestYear < currentYear) {
						careerSpan = `${earliestYear}`;
					} else {
						const endStr = latestYear >= currentYear ? 'Present' : latestYear;
						careerSpan = `${earliestYear} - ${endStr}`;
					}
				}

				personData = { ...mappedData, credits: creditsByDepartment, totalMovies: totalCredits, careerSpan };
			} catch (err) {
				console.error(err);
				if (!isActive) return;
				error = 'Failed to load person data.';
			} finally {
				if (isActive) isLoading = false;
			}
		}

		loadPerson();

		return () => {
			isActive = false;
		};
	});
</script>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<Loader2 class="size-8 animate-spin text-primary" />
	</div>
{:else if error || !personData}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-xl text-muted-foreground">{error || 'Person not found'}</div>
	</div>
{:else}
	<main class="min-h-screen bg-background pt-16">
		<PersonHero
			name={personData.name}
			profile_pic={personData.profile_pic}
			date_of_birth={personData.date_of_birth}
			place_of_birth={personData.place_of_birth}
			totalMovies={personData.totalMovies}
			knownFor={personData.knownFor || personData.known_for_department}
			careerSpan={personData.careerSpan}
		/>

		<div class="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
			<PersonBio bio={personData.bio} />
			<PersonFilmography creditsByDepartment={personData.credits} />
		</div>
	</main>
{/if}
