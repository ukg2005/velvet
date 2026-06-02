"use client"

import Image from "next/image"
import Link from "next/link"
import { memo, useMemo } from "react"
import { Star, Film } from "lucide-react"

interface SimilarMovie {
  id: string | number
  title: string
  poster_path: string
  release_date: string
  score: number
}

interface SimilarMoviesProps {
  movies: SimilarMovie[]
}

export const SimilarMovies = memo(function SimilarMovies({ movies }: SimilarMoviesProps) {
  const preparedMovies = useMemo(() => {
    return movies.map((movie) => {
      const parsedYear = movie.release_date ? new Date(movie.release_date).getFullYear() : NaN
      return {
        ...movie,
        year: Number.isFinite(parsedYear) ? parsedYear : "N/A",
      }
    })
  }, [movies])

  return (
    <section className="mt-10 md:mt-14">
      <div className="flex items-center gap-2">
        <Film className="size-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Similar Movies</h2>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {preparedMovies.map((movie, index) => {
          return (
            <Link
              key={movie.id}
              href={`/movie?id=${movie.id}`}
              prefetch={false}
              className="group cursor-pointer"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
                <Image
                  src={movie.poster_path}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 16vw"
                  loading={index < 4 ? "eager" : "lazy"}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"

                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {/* Score badge on hover */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Star className="size-3 fill-primary text-primary" />
                  <span className="text-xs font-medium text-foreground">{movie.score.toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                  {movie.title}
                </p>
                <p className="text-xs text-muted-foreground">{movie.year}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
})
