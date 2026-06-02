"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MovieHero } from "@/components/movie-hero"
import { MovieDetails } from "@/components/movie-details"
import { CastCrewSection } from "@/components/cast-crew-section"
import { WatchOptions } from "@/components/watch-options"
import { SimilarMovies } from "@/components/similar-movies"
import { LogMovieModal } from "@/components/log-movie-modal"
import { MovieService, LogService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type WatchOption = {
  provider: string
  type: "stream" | "rent" | "buy"
  logo: string
}

type SimilarMovie = {
  id: string | number
  title: string
  poster_path: string
  release_date: string
  score: number
  genre_ids?: Array<string | number>
}

const dedupeBy = <T,>(items: T[], keyFn: (item: T) => string) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFn(item)
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const parseYear = (value: unknown) => {
  if (!value) return null
  const n = Number.parseInt(String(value).slice(0, 4), 10)
  return Number.isFinite(n) ? n : null
}

const normalizeTitle = (value: unknown) => String(value || "").trim().toLowerCase()

const normalizeGenreIds = (genres: any): Array<string | number> => {
  if (!Array.isArray(genres)) return []
  return genres
    .map((g) => {
      if (typeof g === "number" || typeof g === "string") return g
      if (g?.id !== undefined && g?.id !== null) return g.id
      if (g?.name) return String(g.name).toLowerCase()
      return null
    })
    .filter((g): g is string | number => g !== null)
}

const scoreCandidate = (
  candidate: SimilarMovie,
  target: { title: string; year: number | null; score: number; genreIds: Array<string | number> }
) => {
  const candidateYear = parseYear(candidate.release_date)
  const yearScore =
    candidateYear && target.year
      ? Math.max(0, 1 - Math.min(Math.abs(candidateYear - target.year), 25) / 25)
      : 0.35

  const scoreDelta = Math.abs((candidate.score || 0) - (target.score || 0))
  const ratingScore = Math.max(0, 1 - Math.min(scoreDelta, 5) / 5)

  const targetGenres = new Set(target.genreIds.map(String))
  const candidateGenres = new Set((candidate.genre_ids || []).map(String))
  const overlapCount = [...candidateGenres].filter((id) => targetGenres.has(id)).length
  const genreScore = targetGenres.size > 0 ? overlapCount / targetGenres.size : 0

  const titlePenalty = normalizeTitle(candidate.title) === normalizeTitle(target.title) ? -2 : 0

  return (genreScore * 3) + (yearScore * 2) + ratingScore + titlePenalty
}

const rankSimilarMovies = (
  candidates: SimilarMovie[],
  target: { title: string; year: number | null; score: number; genreIds: Array<string | number> },
  limit: number = 6
) => {
  const targetGenres = new Set(target.genreIds.map(String))

  return dedupeBy(candidates, (item) => String(item.id))
    .filter((item) => item.poster_path)
    .filter((item) => normalizeTitle(item.title) !== normalizeTitle(target.title))
    .filter((item) => {
      if (targetGenres.size === 0) return true
      const candidateGenres = new Set((item.genre_ids || []).map(String))
      const overlap = [...candidateGenres].filter((id) => targetGenres.has(id))
      return overlap.length > 0
    })
    .sort((a, b) => scoreCandidate(b, target) - scoreCandidate(a, target))
    .slice(0, limit)
}

const mapSimilarItem = (m: any, index: number): SimilarMovie => ({
  id: m.tmdb_id || m.id || index,
  title: m.title || m.original_title || "Untitled",
  poster_path: getImageUrl(m.poster_url || m.poster_path, "w342"),
  release_date: m.release_date || `${m.year || ""}`,
  score: Number(m.rating ?? m.vote_average ?? m.score ?? 0),
  genre_ids: normalizeGenreIds(m.genre_ids || m.genres),
})

const parseRuntimeToMinutes = (value: unknown): number | null => {
  if (value === null || value === undefined) return null

  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value)
    return rounded > 0 ? rounded : null
  }

  const raw = String(value).trim().toLowerCase()
  if (!raw) return null

  // Common textual placeholders for missing runtime.
  if (["n/a", "na", "unknown", "null", "none", "-"] .includes(raw)) {
    return null
  }

  // Handles values like "2h 14m", "2h", "145m".
  const hoursMatch = raw.match(/(\d+)\s*h/)
  const minutesMatch = raw.match(/(\d+)\s*m/)
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0
    const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0
    const total = (hours * 60) + minutes
    return total > 0 ? total : null
  }

  // Handles ISO-8601 durations like PT2H14M.
  const isoMatch = raw.match(/^pt(?:(\d+)h)?(?:(\d+)m)?$/i)
  if (isoMatch) {
    const hours = isoMatch[1] ? Number.parseInt(isoMatch[1], 10) : 0
    const minutes = isoMatch[2] ? Number.parseInt(isoMatch[2], 10) : 0
    const total = (hours * 60) + minutes
    return total > 0 ? total : null
  }

  // Handles plain numeric strings like "142".
  const numeric = Number.parseInt(raw, 10)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

const extractRuntimeMinutes = (payload: any): number | null => {
  const runtimeKeys = [
    "runtime",
    "runtime_minutes",
    "duration",
    "duration_minutes",
    "length",
    "length_minutes",
    "movie_runtime",
    "run_time",
    "runtimeMins",
  ]

  const directCandidates = runtimeKeys.map((key) => payload?.[key])
  const nestedRoots = [
    payload?.movie,
    payload?.details,
    payload?.movie_details,
    payload?.tmdb,
    payload?.metadata,
    payload?.attributes,
    payload?.data,
  ]

  const scannedCandidates: unknown[] = []
  const visited = new Set<any>()
  const queue = nestedRoots.filter(Boolean)

  while (queue.length > 0 && scannedCandidates.length < 48) {
    const current = queue.shift()
    if (!current || typeof current !== "object" || visited.has(current)) continue
    visited.add(current)

    for (const [key, value] of Object.entries(current)) {
      const keyLower = key.toLowerCase()
      if (runtimeKeys.includes(keyLower) || keyLower.includes("runtime") || keyLower.includes("duration") || keyLower.includes("length")) {
        scannedCandidates.push(value)
      }

      if (value && typeof value === "object") {
        queue.push(value)
      }
    }
  }

  const parsed = [...directCandidates, ...scannedCandidates]
    .map((value) => parseRuntimeToMinutes(value))
    .filter((value): value is number => value !== null)

  if (parsed.length === 0) return null

  const plausible = parsed.find((minutes) => minutes >= 40 && minutes <= 300)
  return plausible ?? parsed[0]
}

function MovieProfileContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [isLogged, setIsLogged] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false)
  const [logMovieOpen, setLogMovieOpen] = useState(false)
  const [movieData, setMovieData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Scroll to top when the movie ID changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [id])

  useEffect(() => {
    let isActive = true

    async function loadMovie() {
      if (!id) {
        setError("No movie ID provided.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await MovieService.getMovie(id)
        if (!isActive) return

        const posterSource = data.poster_url || data.poster_path || ""
        const backdropSource = data.backdrop_url || data.backdrop_path || posterSource
        const runtimeValue = extractRuntimeMinutes(data)

        const targetYear = Number(data.year || (data.release_date ? new Date(data.release_date).getFullYear() : 0)) || null
        const targetScore = Number(data.rating ?? data.vote_average ?? data.score ?? 0)
        const targetGenreIds = normalizeGenreIds(data.genres)
        const targetMovie = {
          title: data.title,
          year: targetYear,
          score: targetScore,
          genreIds: targetGenreIds,
        }

        const castMapped = (data.cast || []).map((c: any, index: number) => ({
          id: c.person?.tmdb_id || c.person?.id || index,
          tmdb_id: c.person?.tmdb_id,
          db_id: c.person?.id,
          name: c.person?.name || c.name,
          character: c.character,
          profile_path: getImageUrl(c.person?.profile_url || c.person?.profile_path || c.profile_path, "w185"),
          order: c.order !== undefined ? c.order : index
        }))

        const crewMapped = (data.crew || []).map((c: any, index: number) => ({
          id: c.person?.tmdb_id || c.person?.id || index,
          tmdb_id: c.person?.tmdb_id,
          db_id: c.person?.id,
          name: c.person?.name || c.name,
          job: c.job,
          department: c.department,
          profile_path: getImageUrl(c.person?.profile_url || c.person?.profile_path || c.profile_path, "w185"),
        }))

        const castUnique = dedupeBy<any>(castMapped, (item) => `${item.id}-${item.character || ""}`)
          .sort((a: any, b: any) => a.order - b.order)
        const crewUnique = dedupeBy<any>(crewMapped, (item) => `${item.id}-${item.job || ""}`)

        const similarRaw = (data.similar || data.similar_movies || []).map(mapSimilarItem)
        const similarRelevant = rankSimilarMovies(similarRaw, targetMovie)

        const mappedData = {
          tmdb_id: data.tmdb_id || Number(id),
          title: data.title,
          original_title: data.original_title || data.title,
          year: data.year,
          release_date: data.release_date,
          runtime: runtimeValue,
          rating: typeof data.rating === "string" ? data.rating : (data.rating?.toString() || "NR"),
          original_language: data.original_language || "en",
          vote_count: data.vote_count || 0,
          genres: data.genres || [],
          tagline: data.tagline,
          overview: data.overview,
          poster_path: posterSource ? getImageUrl(posterSource, "w500") : "",
          backdrop_path: backdropSource ? getImageUrl(backdropSource, "w1280") : "",
          score: typeof data.rating === "string" ? parseFloat(data.rating) : (data.rating || 0),
          cast: castUnique,
          crew: crewUnique,
          watchOptions: data.watch_options || [],
          similarMovies: similarRelevant,
          omdbRatings: data.omdb_ratings || {},
        }

        setMovieData(mappedData)
        setIsLoading(false)

        // Secondary requests should not block first paint.
        void LogService.getWatchlist()
          .then((watchlistPayload) => {
            if (!isActive) return
            const watchlistItems = Array.isArray(watchlistPayload)
              ? watchlistPayload
              : watchlistPayload?.results || watchlistPayload?.movies || []

            const movieTmdbId = Number(data.tmdb_id || id)
            const existsInWatchlist = watchlistItems.some((item: any) => {
              const itemTmdbId = Number(item?.tmdb_id || item?.movie?.tmdb_id || item?.movie_tmdb_id)
              return Number.isFinite(itemTmdbId) && itemTmdbId === movieTmdbId
            })

            setIsInWatchlist(existsInWatchlist)
          })
          .catch(() => {
            // Watchlist status is optional for rendering.
          })

        void LogService.getLogs()
          .then((logsPayload) => {
            if (!isActive) return
            const logs = Array.isArray(logsPayload)
              ? logsPayload
              : logsPayload?.logs || logsPayload?.results || []

            const movieTmdbId = Number(data.tmdb_id || id)
            const userLog = logs.find((item: any) => {
              const itemTmdbId = Number(item?.movie?.tmdb_id || item?.movie_tmdb_id)
              return Number.isFinite(itemTmdbId) && itemTmdbId === movieTmdbId
            })

            if (userLog) {
              setIsLogged(true)
              if (userLog.rating && Number(userLog.rating) > 0) {
                setUserRating(Number(userLog.rating))
              }
            }
          })
          .catch(() => {
            // Logs status is optional.
          })

        if (similarRelevant.length < 8) {
          void Promise.allSettled([
            MovieService.getTrending(),
            MovieService.getTopRated(1),
          ]).then(([trendingRes, topRatedRes]) => {
            if (!isActive) return

            const trendingList = trendingRes.status === "fulfilled"
              ? (Array.isArray(trendingRes.value) ? trendingRes.value : (trendingRes.value?.movies || trendingRes.value?.results || []))
              : []

            const topRatedList = topRatedRes.status === "fulfilled"
              ? (Array.isArray(topRatedRes.value) ? topRatedRes.value : (topRatedRes.value?.movies || topRatedRes.value?.results || []))
              : []

            const fallbackMapped = [...trendingList, ...topRatedList].map(mapSimilarItem)
            const merged = rankSimilarMovies([...similarRaw, ...fallbackMapped], targetMovie)

            setMovieData((prev: any) => {
              if (!prev) return prev
              return {
                ...prev,
                similarMovies: merged,
              }
            })
          })
        }
      } catch (err) {
        console.error(err)
        if (!isActive) return
        setError("An error occurred while loading this movie")
        setIsLoading(false)
      }
    }

    loadMovie()

    return () => {
      isActive = false
    }
  }, [id])

  const handleWatchlistAdd = async () => {
    if (!movieData?.tmdb_id) {
      toast.error("Unable to identify this movie.")
      return
    }

    try {
      setIsUpdatingWatchlist(true)
      const result = await LogService.toggleStatus(Number(movieData.tmdb_id), "watchlist")
      const nextValue = typeof result?.watchlist === "boolean" ? result.watchlist : true
      setIsInWatchlist(nextValue)
      toast.success(nextValue ? "Added to watchlist" : "Removed from watchlist")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.error || "Failed to update watchlist")
    } finally {
      setIsUpdatingWatchlist(false)
    }
  }

  const formatRuntime = (minutes: number | null) => {
    if (!minutes || minutes <= 0) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !movieData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">{error || "Movie not found"}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <MovieHero
        title={movieData.title}
        original_title={movieData.original_title}
        backdrop_path={movieData.backdrop_path}
        poster_path={movieData.poster_path}
        release_date={movieData.release_date}
        runtime={formatRuntime(movieData.runtime)}
        rating={movieData.rating}
        score={movieData.score}
        omdbRatings={movieData.omdbRatings}
        vote_count={movieData.vote_count}
        original_language={movieData.original_language}
        isLogged={isLogged}
        userRating={userRating}
        onLogMovie={() => setLogMovieOpen(true)}
        isInWatchlist={isInWatchlist}
        isUpdatingWatchlist={isUpdatingWatchlist}
        onAddToWatchlist={handleWatchlistAdd}
      />
      <div className="container mx-auto px-4 pb-16">
        <MovieDetails
          tagline={movieData.tagline}
          overview={movieData.overview}
          genres={movieData.genres}
          crew={movieData.crew}
        />
        <CastCrewSection cast={movieData.cast} crew={movieData.crew} />
        {movieData.watchOptions.length > 0 && <WatchOptions options={movieData.watchOptions} />}
        {movieData.similarMovies.length > 0 && <SimilarMovies movies={movieData.similarMovies} />}
      </div>
      <LogMovieModal
        open={logMovieOpen}
        onOpenChange={setLogMovieOpen}
        movie={{
          id: movieData.tmdb_id,
          title: movieData.title,
          poster_path: movieData.poster_path,
        }}
        onSuccess={(rating) => {
          setIsLogged(true)
          if (rating > 0) setUserRating(rating)
        }}
      />
    </main>
  )
}

export default function MovieProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <MovieProfileContent />
    </Suspense>
  )
}
