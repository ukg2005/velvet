"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Plus, User, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogMovieModal } from "@/components/log-movie-modal"
import { MovieService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [currentMovie, setCurrentMovie] = useState<{ title: string; poster_path: string } | null>(null)

  useEffect(() => {
    let mounted = true

    async function hydrateCurrentMovie() {
      if (pathname !== "/movie") {
        if (mounted) setCurrentMovie(null)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const movieId = params.get("id")
      if (!movieId) {
        if (mounted) setCurrentMovie(null)
        return
      }

      try {
        const data = await MovieService.getMovie(movieId)
        if (!mounted) return

        setCurrentMovie({
          title: data.title || "Movie",
          poster_path: getImageUrl(data.poster_url || data.poster_path, "w500"),
        })
      } catch {
        if (mounted) setCurrentMovie(null)
      }
    }

    hydrateCurrentMovie()

    return () => {
      mounted = false
    }
  }, [pathname])

  // Do not show navbar on the login page (or auth routes)
  if (pathname === "/") return null

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/20">
      <div className="container mx-auto px-4 flex h-16 max-w-7xl items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
          <span className="font-semibold text-xl sm:text-2xl tracking-widest text-primary">velvet</span>
        </Link>

        {/* Global Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="search" 
              placeholder="Search movies, people, lists..." 
              className="pl-9 bg-muted/50 w-full border-transparent focus-visible:border-primary focus-visible:bg-transparent transition-all h-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Explore
          </Link>
          <Link href="/watchlist" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Watchlist
          </Link>
          <Link href="/lists" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Lists
          </Link>

          <Button size="sm" className="hidden sm:flex font-medium bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-colors" onClick={() => setIsLogModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Log Film
          </Button>

          {/* Mobile search toggle */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="size-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Log mobile */}
          <Button size="icon" className="sm:hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" onClick={() => setIsLogModalOpen(true)}>
            <Plus className="size-5" />
            <span className="sr-only">Log Film</span>
          </Button>

          <Button variant="outline" size="icon" asChild className="rounded-full transition-colors ml-1 border-border hover:bg-accent">
            <Link href="/profile">
              <User className="size-5 text-foreground/80" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </nav>
      </div>

      <LogMovieModal open={isLogModalOpen} onOpenChange={setIsLogModalOpen} movie={currentMovie} />
    </header>
  )
}
