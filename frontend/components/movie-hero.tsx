"use client"

import Image from "next/image"
import { Check, Plus, Star, Clock, Calendar, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MovieHeroProps {
  title: string
  original_title: string
  backdrop_path: string
  poster_path: string
  release_date: string
  runtime: string
  rating: string
  score: number
  omdbRatings?: {
    imdbRating?: string
    Metascore?: string
    Ratings?: Record<string, string>
  }
  vote_count: number
  original_language: string
  tagline?: string
  isLogged: boolean
  userRating?: number | null
  isInWatchlist?: boolean
  isUpdatingWatchlist?: boolean
  onLogMovie: () => void
  onAddToWatchlist?: () => void
}

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
}

export function MovieHero({
  title,
  original_title,
  backdrop_path,
  poster_path,
  release_date,
  runtime,
  rating,
  score,
  omdbRatings,
  vote_count,
  original_language,
  tagline,
  isLogged,
  userRating,
  isInWatchlist = false,
  isUpdatingWatchlist = false,
  onLogMovie,
  onAddToWatchlist,
}: MovieHeroProps) {
  const year = new Date(release_date).getFullYear()
  const languageName = languageNames[original_language] || original_language.toUpperCase()

  return (
    // Single wrapper — backdrop fills this, content sits at the bottom of it
    <div className="relative h-screen min-h-[520px] w-full overflow-hidden">

      {/* Backdrop image fills the whole wrapper */}
      {backdrop_path && (
        <Image
          src={backdrop_path}
          alt={`${title} backdrop`}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 26%" }}
          priority
        />
      )}

      {/* Minimal overlays — image stays bright; only left edge and bottom strip darken for legibility */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 18%, transparent 40%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 28%, transparent 50%)" }} />
      {/* Bottom blend — hero fades cleanly into the page background */}
      <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: "linear-gradient(to top, var(--background) 0%, transparent 100%)" }} />

      {/* Content anchored to the bottom of the wrapper */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 pb-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">

            {/* Poster */}
            <div className="relative mx-auto shrink-0 md:mx-0">
              <div className="relative aspect-2/3 w-44 overflow-hidden rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 md:w-56 transition-transform duration-500 hover:scale-[1.02] bg-muted flex items-center justify-center">
                {poster_path ? (
                  <Image
                    src={poster_path}
                    alt={`${title} poster`}
                    fill
                    sizes="(max-width: 768px) 176px, 224px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <span className="text-muted-foreground text-sm font-medium">No Poster</span>
                )}
              </div>
              {/* Score badge */}
              <div className="absolute -bottom-3 -right-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:size-16">
                <div className="flex items-center gap-0.5">
                  <Star className="size-3 fill-current md:size-4" />
                  <span className="text-lg font-bold md:text-xl">{score}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col space-y-3 pb-4 text-center md:pb-6 md:text-left">

              {/* Title + tagline */}
              <div>
                <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                  {title}
                </h1>
                {original_title !== title && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Original title: {original_title}
                  </p>
                )}
              </div>

              {/* Year · runtime · language */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  {year}
                </span>
                <span className="hidden size-1 rounded-full bg-muted-foreground md:block" />
                <span className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {runtime}
                </span>
                <span className="hidden size-1 rounded-full bg-muted-foreground md:block" />
                <span className="flex items-center gap-1">
                  <Globe className="size-4" />
                  {languageName}
                </span>
              </div>

              {/* External ratings */}
              {omdbRatings && (omdbRatings.imdbRating || omdbRatings.Metascore || (omdbRatings.Ratings && Object.keys(omdbRatings.Ratings).length > 0)) && (
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
                  {omdbRatings.imdbRating && omdbRatings.imdbRating !== "N/A" && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F5C518] !text-black font-extrabold shadow-sm">
                      <span className="text-xs uppercase tracking-tight">IMDb</span>
                      <span className="text-sm">{omdbRatings.imdbRating}</span>
                    </div>
                  )}
                  {omdbRatings.Ratings?.["Rotten Tomatoes"] && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white font-bold shadow-sm backdrop-blur-md">
                      <span className="text-base leading-none">
                        {parseInt(omdbRatings.Ratings["Rotten Tomatoes"]) >= 60 ? "🍅" : "🤢"}
                      </span>
                      <span className="text-sm">{omdbRatings.Ratings["Rotten Tomatoes"]}</span>
                    </div>
                  )}
                  {omdbRatings.Metascore && omdbRatings.Metascore !== "N/A" && (
                    <div className="flex items-center justify-center size-8 rounded bg-[#00CE7A] !text-black font-bold text-base shadow-sm">
                      {omdbRatings.Metascore}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 md:justify-start">
                <Button
                  onClick={onLogMovie}
                  className={
                    isLogged
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all"
                      : "shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all hover:scale-105"
                  }
                  size="lg"
                >
                  {isLogged ? (
                    <>
                      <Check className="size-5" />
                      Logged {userRating ? `(${userRating.toFixed(1)} ★)` : ""}
                    </>
                  ) : (
                    <>
                      <Plus className="size-5" />
                      Log Movie
                    </>
                  )}
                </Button>

                <Button
                  onClick={onAddToWatchlist}
                  disabled={isUpdatingWatchlist}
                  className="inline-flex items-center justify-center bg-black/50 hover:bg-black/70 text-white hover:text-white border-0 backdrop-blur-sm transition-all h-11 px-6 rounded-md text-sm font-medium"
                >
                  {isInWatchlist ? (
                    <>
                      <Check className="size-5 mr-2" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="size-5 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
