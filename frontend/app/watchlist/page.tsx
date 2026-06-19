"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bookmark, Heart, Loader2, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

type MovieItem = {
  tmdb_id: number
  title: string
  poster_path: string
  year?: string | number
  rating?: number
}

function normalizeList(payload: any): MovieItem[] {
  const items = Array.isArray(payload) ? payload : (payload?.results || payload?.movies || payload?.logs || [])
  return items
    .map((item: any) => {
      const movie = item?.movie || item
      const tmdbId = Number(movie?.tmdb_id || movie?.id || item?.tmdb_id)
      if (!Number.isFinite(tmdbId)) return null
      return {
        tmdb_id: tmdbId,
        title: movie?.title || movie?.original_title || "Untitled",
        poster_path: getImageUrl(movie?.poster_url || movie?.poster_path, "w500"),
        year: movie?.year || movie?.release_date?.slice?.(0, 4),
        rating: Number(movie?.rating ?? movie?.vote_average ?? 0),
      }
    })
    .filter(Boolean) as MovieItem[]
}

function MovieCard({
  movie,
  onRemove,
  removeLabel,
  accentColor,
}: {
  movie: MovieItem
  onRemove: () => void
  removeLabel: string
  accentColor: "rose" | "amber"
}) {
  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/movie?id=${movie.tmdb_id}`}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40"
      >
        {movie.poster_path && (
          <Image
            src={movie.poster_path}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"

          />
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Rating badge */}
        {movie.rating !== undefined && movie.rating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-white">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Remove button overlay */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive hover:text-white"
          title={removeLabel}
        >
          <X className="size-4" />
        </button>
      </Link>

      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {movie.title}
        </h3>
        {movie.year && (
          <p className="text-xs text-muted-foreground">{movie.year}</p>
        )}
      </div>
    </div>
  )
}

export default function WatchlistPage() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<MovieItem[]>([])
  const [favorites, setFavorites] = useState<MovieItem[]>([])

  useEffect(() => {
    if (!isAuthenticated) return
    let mounted = true

    async function loadLists() {
      try {
        const [watchlistRes, likedRes] = await Promise.all([
          LogService.getWatchlist(),
          LogService.getLiked(),
        ])
        if (!mounted) return

        setWatchlist(normalizeList(watchlistRes))
        setFavorites(normalizeList(likedRes))
      } catch (err) {
        console.error(err)
        toast.error("Failed to load watchlist/favorites")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadLists()

    return () => {
      mounted = false
    }
  }, [isAuthenticated])


  const toggleFavorite = async (tmdbId: number) => {
    setFavorites((prev) => prev.filter((m) => m.tmdb_id !== tmdbId))
    try {
      await LogService.toggleStatus(tmdbId, "liked")
      toast.success("Removed from favorites")
    } catch (err) {
      console.error(err)
      const source = [...watchlist, ...favorites].find((m) => m.tmdb_id === tmdbId)
      if (source) setFavorites((prev) => [...prev, source])
      toast.error("Failed to update favorites")
    }
  }

  const toggleWatchlist = async (tmdbId: number) => {
    setWatchlist((prev) => prev.filter((m) => m.tmdb_id !== tmdbId))
    try {
      await LogService.toggleStatus(tmdbId, "watchlist")
      toast.success("Removed from watchlist")
    } catch (err) {
      console.error(err)
      const source = [...favorites, ...watchlist].find((m) => m.tmdb_id === tmdbId)
      if (source) setWatchlist((prev) => [...prev, source])
      toast.error("Failed to update watchlist")
    }
  }

  if (isAuthenticated === null || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-16">
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-14">
        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Watchlist & Favorites
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Your saved movies, all in one place.
          </p>
        </header>

        {/* Watchlist Section */}
        <section>
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Bookmark className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Watchlist</h2>
              <p className="text-sm text-muted-foreground">{watchlist.length} {watchlist.length === 1 ? "movie" : "movies"} saved</p>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                <Bookmark className="size-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Your watchlist is empty</p>
              <p className="mt-1 text-sm text-muted-foreground/60">Bookmark movies from any movie page to watch later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlist.map((movie) => (
                <MovieCard
                  key={`watchlist-${movie.tmdb_id}`}
                  movie={movie}
                  onRemove={() => toggleWatchlist(movie.tmdb_id)}
                  removeLabel="Remove from watchlist"
                  accentColor="amber"
                />
              ))}
            </div>
          )}
        </section>

        {/* Favorites Section */}
        <section>
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Heart className="size-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Favorites</h2>
              <p className="text-sm text-muted-foreground">{favorites.length} {favorites.length === 1 ? "movie" : "movies"} liked</p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                <Heart className="size-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">No favorites yet</p>
              <p className="mt-1 text-sm text-muted-foreground/60">Like movies from any movie page to add them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {favorites.map((movie) => (
                <MovieCard
                  key={`favorite-${movie.tmdb_id}`}
                  movie={movie}
                  onRemove={() => toggleFavorite(movie.tmdb_id)}
                  removeLabel="Remove from favorites"
                  accentColor="rose"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
