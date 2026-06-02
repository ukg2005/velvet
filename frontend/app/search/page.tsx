"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2, Star } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MovieService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"

type SearchMovie = {
  id: string | number
  tmdb_id?: string | number
  title: string
  poster_path?: string
  poster_url?: string
  score?: number
  rating?: number | string
  vote_average?: number
}

type SearchPerson = {
  id: string | number
  tmdb_id?: string | number
  name: string
  avatar_url?: string
  profile_path?: string
  profile_url?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  )
}

function SearchResults() {
  const searchParams = useSearchParams()
  const query = (searchParams.get("q") || "").trim()

  const [movies, setMovies] = useState<SearchMovie[]>([])
  const [people, setPeople] = useState<SearchPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function runSearch() {
      if (!query) {
        setMovies([])
        setPeople([])
        return
      }

      setIsLoading(true)
      try {
        const data = await MovieService.search(query)

        if (!mounted) return

        const moviesPayload = Array.isArray(data)
          ? data
          : data.movies || data.results || []

        const peoplePayload = data.people || data.persons || []

        setMovies(Array.isArray(moviesPayload) ? moviesPayload : [])
        setPeople(Array.isArray(peoplePayload) ? peoplePayload : [])
      } catch (error) {
        console.error("Search failed:", error)
        if (mounted) {
          setMovies([])
          setPeople([])
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    runSearch()

    return () => {
      mounted = false
    }
  }, [query])

  const hasResults = movies.length > 0 || people.length > 0

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {query ? `Search results for "${query}"` : "Search"}
          </h1>
        </div>

        {isLoading ? (
          <div className="mt-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Searching...
          </div>
        ) : !hasResults ? (
          <div className="mt-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{query ? `No results found for "${query}"` : "Start typing to search"}</EmptyTitle>
                <EmptyDescription>Try a different movie or person name.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {movies.length > 0 && (
              <section>
                <h2 className="mb-6 border-l-4 border-primary pl-3 text-xl font-semibold text-foreground">Movies</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                  {movies.map((movie, index) => {
                    const movieId = movie.tmdb_id || movie.id
                    const score = Number(movie.score ?? movie.vote_average ?? movie.rating ?? 0)

                    return (
                      <Link
                        key={`${movieId}-${movie.title}-${index}`}
                        href={`/movie?id=${movieId}`}
                        className="group block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
                          {(movie.poster_path || movie.poster_url) && (
                            <Image
                              src={getImageUrl(movie.poster_path || movie.poster_url, "w500")}
                              alt={movie.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"

                            />
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Star className="size-3 fill-primary text-primary" />
                            <span className="text-xs font-medium text-foreground">{score.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="mt-2 truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {movie.title}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {people.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground">People</h2>
                <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
                  {people.map((person, index) => {
                    const personId = person.tmdb_id || person.id
                    return (
                      <Link
                        key={`${personId}-${person.name}-${index}`}
                        href={`/person?id=${personId}`}
                        className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <div className="flex w-24 flex-col items-center gap-2">
                          <Avatar className="size-16">
                            <AvatarImage
                              src={getImageUrl(person.avatar_url || person.profile_url || person.profile_path, "w185")}
                              alt={person.name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-center text-sm font-medium text-foreground">
                            {person.name}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
