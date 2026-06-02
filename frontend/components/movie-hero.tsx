"use client"

import Image from "next/image"
import { Check, Plus, ChevronDown, Star, Clock, Calendar, Globe, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    <div className="relative">
      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-100 w-full overflow-hidden md:h-[60vh]">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent mix-blend-overlay" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="relative -mt-64 flex flex-col gap-6 md:-mt-72 md:flex-row md:gap-8">
          {/* Poster */}
          <div className="relative mx-auto shrink-0 md:mx-0">
            <div className="relative aspect-2/3 w-48 overflow-hidden rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 md:w-64 transition-transform duration-500 hover:scale-[1.02] bg-muted flex items-center justify-center">
              {poster_path ? (
                <Image
                  src={poster_path}
                  alt={`${title} poster`}
                  fill
                  sizes="(max-width: 768px) 192px, 256px"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-muted-foreground text-sm font-medium">No Poster</span>
              )}
            </div>
            {/* Score badge */}
            <div className="absolute -bottom-3 -right-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:size-16">
              <div className="text-center">
                <div className="flex items-center gap-0.5">
                  <Star className="size-3 fill-current md:size-4" />
                  <span className="text-lg font-bold md:text-xl">{score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-end space-y-4 pb-4 text-center md:pb-6 md:text-left">
            <div>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {title}
              </h1>
              {original_title !== title && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Original title: {original_title}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
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

              {omdbRatings && (omdbRatings.imdbRating || omdbRatings.Metascore || (omdbRatings.Ratings && Object.keys(omdbRatings.Ratings).length > 0)) && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
                  {omdbRatings.imdbRating && omdbRatings.imdbRating !== "N/A" && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F5C518] !text-black font-extrabold shadow-sm">
                      <span className="text-xs uppercase tracking-tight">IMDb</span>
                      <span className="text-sm">{omdbRatings.imdbRating}</span>
                    </div>
                  )}
                  {omdbRatings.Ratings && omdbRatings.Ratings["Rotten Tomatoes"] && (
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

              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground md:justify-start">
                <Users className="size-3" />
                <span>{vote_count.toLocaleString()} votes on TMDB</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
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
                    Logged {userRating ? `(${userRating.toFixed(1)} ★)` : ''}
                  </>
                ) : (
                  <>
                    <Plus className="size-5" />
                    Log Movie
                  </>
                )}
              </Button>

              <Button 
                variant={isInWatchlist ? "outline" : "secondary"}
                size="lg"
                onClick={onAddToWatchlist}
                disabled={isUpdatingWatchlist}
                className={isInWatchlist ? "border-primary/50 text-primary hover:bg-primary/10" : ""}
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
  )
}
