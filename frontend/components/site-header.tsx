"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, Plus, User, Film, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LogMovieModal } from "@/components/log-movie-modal"
import { MovieService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"

type Suggestion =
  | { kind: "movie"; id: string | number; tmdb_id?: string | number; title: string; poster_path?: string; poster_url?: string; year?: string | number; release_date?: string }
  | { kind: "person"; id: string | number; tmdb_id?: string | number; name: string; profile_path?: string; profile_url?: string; avatar_url?: string }

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [currentMovie, setCurrentMovie] = useState<{ title: string; poster_path: string } | null>(null)

  const [isScrolled, setIsScrolled] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Transparent → solid on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  // Hydrate current movie for log modal
  useEffect(() => {
    let mounted = true
    async function hydrateCurrentMovie() {
      if (pathname !== "/movie") {
        if (mounted) setCurrentMovie(null)
        return
      }
      const params = new URLSearchParams(window.location.search)
      const movieId = params.get("id")
      if (!movieId) { if (mounted) setCurrentMovie(null); return }
      try {
        const data = await MovieService.getMovie(movieId)
        if (!mounted) return
        setCurrentMovie({ title: data.title || "Movie", poster_path: getImageUrl(data.poster_url || data.poster_path, "w500") })
      } catch {
        if (mounted) setCurrentMovie(null)
      }
    }
    hydrateCurrentMovie()
    return () => { mounted = false }
  }, [pathname])

  // Debounced search for suggestions
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearchLoading(true)
      try {
        const data = await MovieService.search(q)
        const movies: Suggestion[] = (Array.isArray(data) ? data : data.movies || data.results || [])
          .slice(0, 5)
          .map((m: any) => ({ kind: "movie" as const, id: m.id, tmdb_id: m.tmdb_id, title: m.title, poster_path: m.poster_path, poster_url: m.poster_url, release_date: m.release_date, year: m.year }))
        const people: Suggestion[] = (data.people || data.persons || [])
          .slice(0, 3)
          .map((p: any) => ({ kind: "person" as const, id: p.id, tmdb_id: p.tmdb_id, name: p.name, profile_path: p.profile_path, profile_url: p.profile_url, avatar_url: p.avatar_url }))
        const merged = [...movies, ...people]
        setSuggestions(merged)
        setIsSuggestionsOpen(merged.length > 0)
        setActiveIdx(-1)
      } catch {
        setSuggestions([])
        setIsSuggestionsOpen(false)
      } finally {
        setIsSearchLoading(false)
      }
    }, 280)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchQuery(v)
    fetchSuggestions(v)
  }

  const navigateToSuggestion = (s: Suggestion) => {
    setIsSuggestionsOpen(false)
    setSearchQuery("")
    setSuggestions([])
    if (s.kind === "movie") router.push(`/movie?id=${s.tmdb_id || s.id}`)
    else router.push(`/person?id=${s.tmdb_id || s.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen) {
      if (e.key === "Enter" && searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        setIsSuggestionsOpen(false)
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        navigateToSuggestion(suggestions[activeIdx])
      } else if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        setIsSuggestionsOpen(false)
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false)
      setActiveIdx(-1)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSuggestions([])
    setIsSuggestionsOpen(false)
    inputRef.current?.focus()
  }

  if (pathname === "/") return null

  const isOnHeroPage = pathname === "/movie" || pathname === "/home"

  return (
    <header
      className={[
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled || !isOnHeroPage
          ? "bg-background/90 backdrop-blur-md border-b border-white/8 shadow-sm"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="container mx-auto px-4 flex h-16 max-w-7xl items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
          <span className="font-semibold text-xl sm:text-2xl tracking-widest text-primary">velvet</span>
        </Link>

        {/* Search with suggestions */}
        <div className="flex-1 max-w-md mx-4 hidden md:block" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search movies, people, lists..."
              className="w-full h-10 pl-9 pr-8 rounded-md text-sm bg-white/8 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background/60 transition-all backdrop-blur-sm"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setIsSuggestionsOpen(true)}
              autoComplete="off"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-3.5" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[60]">
                {isSearchLoading && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">Searching…</div>
                )}

                {/* Group: Movies */}
                {suggestions.filter(s => s.kind === "movie").length > 0 && (
                  <div>
                    <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Movies</div>
                    {suggestions.filter(s => s.kind === "movie").map((s, i) => {
                      const globalIdx = suggestions.indexOf(s)
                      const year = s.kind === "movie" ? (s.year || (s.release_date ? new Date(s.release_date).getFullYear() : null)) : null
                      const posterSrc = s.kind === "movie" ? getImageUrl(s.poster_path || s.poster_url, "w92") : null
                      return (
                        <button
                          key={`movie-${s.id}`}
                          onPointerDown={() => navigateToSuggestion(s)}
                          className={[
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                            activeIdx === globalIdx ? "bg-primary/10 text-foreground" : "hover:bg-white/5 text-foreground",
                          ].join(" ")}
                        >
                          <div className="relative size-9 rounded overflow-hidden shrink-0 bg-muted">
                            {posterSrc
                              ? <Image src={posterSrc} alt={s.title} fill className="object-cover" sizes="36px" />
                              : <Film className="size-4 text-muted-foreground m-auto mt-2.5" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.title}</p>
                            {year && <p className="text-xs text-muted-foreground">{year}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Group: People */}
                {suggestions.filter(s => s.kind === "person").length > 0 && (
                  <div className="border-t border-white/6">
                    <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">People</div>
                    {suggestions.filter(s => s.kind === "person").map((s) => {
                      const globalIdx = suggestions.indexOf(s)
                      const avatarSrc = s.kind === "person" ? getImageUrl(s.avatar_url || s.profile_url || s.profile_path, "w92") : null
                      return (
                        <button
                          key={`person-${s.id}`}
                          onPointerDown={() => navigateToSuggestion(s)}
                          className={[
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                            activeIdx === globalIdx ? "bg-primary/10 text-foreground" : "hover:bg-white/5 text-foreground",
                          ].join(" ")}
                        >
                          <div className="relative size-9 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                            {avatarSrc
                              ? <Image src={avatarSrc} alt={s.name} fill className="object-cover" sizes="36px" />
                              : <User className="size-4 text-muted-foreground" />
                            }
                          </div>
                          <p className="text-sm font-medium truncate">{s.name}</p>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Footer: full search */}
                <div className="border-t border-white/6 px-3 py-2">
                  <button
                    onPointerDown={() => { router.push(`/search?q=${encodeURIComponent(searchQuery)}`); setIsSuggestionsOpen(false) }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    See all results for <span className="font-medium text-foreground">"{searchQuery}"</span> →
                  </button>
                </div>
              </div>
            )}
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
