"use client"

import { useState, useEffect } from "react"
import { HomeHero } from "@/components/home-hero"
import { GlobalActivity } from "@/components/global-activity"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { Star, TrendingUp, Trophy, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MovieService } from "@/lib/services"

interface Movie {
  id: string | number
  tmdb_id?: string | number
  title: string
  poster_path?: string
  poster_url?: string
  backdrop_path?: string
  backdrop_url?: string
  score?: number
  vote_average?: number
  rating?: number | string
  release_date?: string
  year?: number
}

interface Review {
  id: string
  username: string
  movie_title: string
  rating: number
  review_text: string
  created_at: string
}

const getImageUrl = (path: string | undefined, size: string = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  if (path.startsWith('http')) {
    if (path.includes('image.tmdb.org/t/p/')) {
      return path.replace(/\/t\/p\/(w\d+|original)\//, `/t/p/${size}/`);
    }
    return path;
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function MovieRow({ movies, title, icon: Icon }: { movies: Movie[]; title: string; icon: any }) {
  if (!movies || movies.length === 0) {
    return (
      <div className="py-12 flex justify-center text-muted-foreground">
        No movies found.
      </div>
    )
  }

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/50 scrollbar-track-transparent pt-2">
        {movies.map((movie) => {
          const score = Number(movie.score ?? movie.vote_average ?? movie.rating ?? 0);
          return (
            <Link key={movie.id} href={`/movie?id=${movie.tmdb_id || movie.id}`} className="group shrink-0 w-36 sm:w-40 md:w-48 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
              <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
                <Image
                  src={getImageUrl(movie.poster_path || movie.poster_url, 'w342')}
                  alt={movie.title || 'Movie Poster'}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"

                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Star className="size-3 fill-primary text-primary" />
                  <span className="text-xs font-medium text-foreground">{score.toFixed(1)}</span>
                </div>
              </div>
              <h3 className="mt-3 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary md:text-base">{movie.title}</h3>
              <p className="text-xs text-muted-foreground">{movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown')}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([])
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    const fetchMovies = async () => {
      try {
        const [trending, topRated] = await Promise.all([
          MovieService.getTrending(),
          MovieService.getTopRated()
        ]);

        if (!mounted) return;

        const trendingData = Array.isArray(trending) ? trending : trending.movies || trending.results || [];
        const topRatedData = Array.isArray(topRated) ? topRated : topRated.movies || topRated.results || [];

        setTrendingMovies(trendingData);
        setTopRatedMovies(topRatedData);

        if (trendingData.length > 0) {
          const featured = trendingData[0];
          setFeaturedMovie(featured); // fallback

          // Fetch full backend movie object to secure backdrop_path
          const tmdbId = featured.tmdb_id || featured.id;
          if (tmdbId) {
            MovieService.getMovie(tmdbId)
              .then((detailed) => {
                if (mounted && detailed) setFeaturedMovie({ ...featured, ...detailed });
              })
              .catch((err) => console.log('Could not fetch detailed backdrop cover:', err));
          }
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchMovies();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        {/* Hero Skeleton */}
        <div className="h-[70vh] w-full bg-muted animate-pulse border-b border-border/50" />
        <div className="container mx-auto mt-4 px-4 sm:mt-10">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Discover</h2>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 mt-1" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const featuredScore = featuredMovie ? Number(featuredMovie.score ?? featuredMovie.vote_average ?? featuredMovie.rating ?? 0) : 0;

  return (
    <main className="min-h-screen bg-background">
      {featuredMovie && (
        <HomeHero
          movieId={featuredMovie.tmdb_id || featuredMovie.id}
          title={featuredMovie.title}
          backdrop_path={getImageUrl(featuredMovie.backdrop_path || featuredMovie.backdrop_url || featuredMovie.poster_path || featuredMovie.poster_url, 'original')}
          poster_path={getImageUrl(featuredMovie.poster_path || featuredMovie.poster_url, 'w500')}
          score={featuredScore}
        />
      )}

      <div className="container mx-auto mt-4 px-4 sm:mt-10">
        <Tabs defaultValue="trending" className="w-full">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Discover</h2>
            <TabsList>
              <TabsTrigger value="trending" className="flex items-center gap-2 px-4">
                <TrendingUp className="size-4" />
                <span>Trending</span>
              </TabsTrigger>
              <TabsTrigger value="top-rated" className="flex items-center gap-2 px-4">
                <Trophy className="size-4" />
                <span>Top Rated</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="trending" className="mt-0 animate-in fade-in-50 zoom-in-95 duration-300">
            <MovieRow title="Trending This Week" movies={trendingMovies} icon={TrendingUp} />
          </TabsContent>
          
          <TabsContent value="top-rated" className="mt-0 animate-in fade-in-50 zoom-in-95 duration-300">
            <MovieRow title="All-Time Highest Rated" movies={topRatedMovies} icon={Trophy} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="h-16" />
    </main>
  )
}
