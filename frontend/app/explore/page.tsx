"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Compass, SlidersHorizontal, Star } from "lucide-react"
import { MovieService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const GENRES = [
  { id: "all", name: "All Genres" },
  { id: "28", name: "Action" },
  { id: "35", name: "Comedy" },
  { id: "18", name: "Drama" },
  { id: "27", name: "Horror" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Science Fiction" },
  { id: "53", name: "Thriller" },
]

const DECADES = [
  { id: "all", name: "All Decades" },
  { id: "2020", name: "2020s", min: "2020-01-01", max: "2029-12-31" },
  { id: "2010", name: "2010s", min: "2010-01-01", max: "2019-12-31" },
  { id: "2000", name: "2000s", min: "2000-01-01", max: "2009-12-31" },
  { id: "1990", name: "1990s", min: "1990-01-01", max: "1999-12-31" },
  { id: "1980", name: "1980s", min: "1980-01-01", max: "1989-12-31" },
]

const SORTS = [
  { id: "popularity.desc", name: "Popularity" },
  { id: "vote_average.desc", name: "Highest Rated" },
  { id: "primary_release_date.desc", name: "Newest Releases" },
]

export default function ExplorePage() {
  const [movies, setMovies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [genre, setGenre] = useState("all")
  const [decade, setDecade] = useState("all")
  const [sort, setSort] = useState("popularity.desc")

  useEffect(() => {
    let mounted = true

    async function fetchMovies() {
      setIsLoading(true)
      try {
        const filters: any = { sort_by: sort }
        if (genre && genre !== "all") filters.with_genres = genre
        
        if (decade && decade !== "all") {
          const dec = DECADES.find(d => d.id === decade)
          if (dec) {
            filters["primary_release_date.gte"] = dec.min
            filters["primary_release_date.lte"] = dec.max
          }
        }

        const data = await MovieService.explore(filters)
        if (!mounted) return
        
        const results = Array.isArray(data) ? data : (data?.movies || data?.results || [])
        setMovies(results)
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchMovies()

    return () => { mounted = false }
  }, [genre, decade, sort])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Compass className="size-8 text-primary" />
              Explore
            </h1>
            <p className="text-muted-foreground mt-2">Discover new films by genre, decade, and popularity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
            </div>
            
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={decade} onValueChange={setDecade}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Decade" />
              </SelectTrigger>
              <SelectContent>
                {DECADES.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50">
            <p className="text-lg font-medium text-muted-foreground">No movies found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie: any) => (
              <div key={movie.tmdb_id || movie.id} className="group relative">
                <Link href={`/movie?id=${movie.tmdb_id || movie.id}`} className="block">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40">
                    <Image
                      src={getImageUrl(movie.poster_url || movie.poster_path, "w500")}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"

                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {(movie.rating > 0 || movie.vote_average > 0) && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-white">
                          {Number(movie.rating || movie.vote_average).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <h3 className="mt-2 truncate text-sm font-semibold transition-colors group-hover:text-primary px-0.5">
                  {movie.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
