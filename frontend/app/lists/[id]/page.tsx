"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { GripVertical, Plus, Search, Save, Loader2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ListService, MovieService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface ListMovie {
  entryId: number
  tmdb_id: number
  title: string
  year: number | string | null
  poster_path: string
  order: number
}

interface SearchResult {
  tmdb_id: number
  title: string
  year: number | string | null
  poster_path: string
}

function normalizeEntries(entries: any[]): ListMovie[] {
  return entries
    .map((e: any, idx: number) => {
      const movie = e.movie || e
      const tmdbId = Number(movie?.tmdb_id || movie?.id)
      if (!Number.isFinite(tmdbId)) return null
      return {
        entryId: e.id ?? idx,
        tmdb_id: tmdbId,
        title: movie?.title || movie?.original_title || "Untitled",
        year: movie?.year ?? movie?.release_date?.slice?.(0, 4) ?? null,
        poster_path: getImageUrl(movie?.poster_url || movie?.poster_path, "w154"),
        order: e.order ?? idx,
      }
    })
    .filter(Boolean) as ListMovie[]
}

function normalizeSearchResults(results: any[]): SearchResult[] {
  return results
    .map((m: any) => {
      const tmdbId = Number(m?.tmdb_id || m?.id)
      if (!Number.isFinite(tmdbId)) return null
      return {
        tmdb_id: tmdbId,
        title: m?.title || m?.original_title || "Untitled",
        year: m?.year ?? m?.release_date?.slice?.(0, 4) ?? null,
        poster_path: getImageUrl(m?.poster_url || m?.poster_path, "w154"),
      }
    })
    .filter(Boolean) as SearchResult[]
}

export default function ListDetailPage() {
  const params = useParams()
  const listId = params?.id as string
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [listTitle, setListTitle] = useState("")
  const [listDesc, setListDesc] = useState("")
  const [movies, setMovies] = useState<ListMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  // Track original order for saving
  const originalOrderRef = useRef<{ id: number; order: number }[]>([])

  useEffect(() => {
    if (!isAuthenticated || !listId) return

    async function fetchList() {
      try {
        const data = await ListService.getList(listId)
        setListTitle(data.title || "Untitled List")
        setListDesc(data.desc || "")
        const normalized = normalizeEntries(data.entries || [])
        setMovies(normalized)
        originalOrderRef.current = normalized.map((m, i) => ({ id: m.entryId, order: i }))
      } catch (err: any) {
        toast.error("Failed to load list")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [isAuthenticated, listId])

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    if (searchDebounce.current) clearTimeout(searchDebounce.current)

    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await MovieService.search(searchQuery)
        const raw = Array.isArray(data) ? data : (data?.movies || data?.results || [])
        setSearchResults(normalizeSearchResults(raw).slice(0, 8))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
    }
  }, [searchQuery])

  const handleAddMovie = useCallback(
    async (movie: SearchResult) => {
      if (movies.some((m) => m.tmdb_id === movie.tmdb_id)) {
        toast.info("Already in this list")
        return
      }
      try {
        const res = await ListService.addToList(listId, movie.tmdb_id)
        const newEntry: ListMovie = {
          entryId: res.entry_id || Date.now(),
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          year: movie.year,
          poster_path: movie.poster_path,
          order: movies.length,
        }
        setMovies((prev) => [...prev, newEntry])
        setSearchQuery("")
        setIsSearchDropdownOpen(false)
        toast.success(`${movie.title} added`)
      } catch (err: any) {
        toast.error(err?.response?.data?.warning || err?.response?.data?.error || "Failed to add movie")
      }
    },
    [movies, listId]
  )

  const handleRemoveMovie = useCallback(
    (tmdbId: number) => {
      setMovies((prev) => prev.filter((m) => m.tmdb_id !== tmdbId))
      setHasChanges(true)
    },
    []
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const items = movies.map((m, i) => ({ id: m.entryId, order: i }))
      await ListService.reorderList(listId, items)
      originalOrderRef.current = items
      setHasChanges(false)
      toast.success("List saved!")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteList = async () => {
    if (!confirm(`Are you sure you want to delete "${listTitle}"? This cannot be undone.`)) return
    try {
      await ListService.deleteList(listId)
      toast.success(`"${listTitle}" deleted`)
      router.push("/lists")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete list")
    }
  }

  // Drag-and-drop handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedItemIndex === null || index === draggedItemIndex) return
    setDraggedOverIndex(index)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedItemIndex === null) return

    const reordered = [...movies]
    const [dragged] = reordered.splice(draggedItemIndex, 1)
    reordered.splice(index, 0, dragged)

    setMovies(reordered)
    if (draggedItemIndex !== index) setHasChanges(true)
    setDraggedItemIndex(null)
    setDraggedOverIndex(null)
  }

  const onDragEnd = () => {
    setDraggedItemIndex(null)
    setDraggedOverIndex(null)
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
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {listTitle}
            </h1>
            {listDesc && (
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{listDesc}</p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <span className="text-sm text-muted-foreground self-center">
              {movies.length} {movies.length === 1 ? "film" : "films"}
            </span>
            <Button variant="default" onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Save Changes
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeleteList} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete list">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </header>

        {/* Search to Add Movie */}
        <div className="relative mb-8 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for movies to add..."
              className="pl-9 bg-card shadow-sm h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {isSearchDropdownOpen && searchQuery.length > 1 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-md border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((movie) => (
                  <button
                    key={movie.tmdb_id}
                    onMouseDown={() => handleAddMovie(movie)}
                    className="flex w-full items-center gap-3 rounded-sm p-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                      {movie.poster_path && (
                        <Image src={movie.poster_path} alt={movie.title} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground">{movie.title}</span>
                      {movie.year && <span className="text-xs text-muted-foreground">{movie.year}</span>}
                    </div>
                    <Plus className="ml-auto size-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              ) : isSearching ? null : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No movies found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Movie List */}
        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <GripVertical className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">This list is empty</h2>
            <p className="text-sm text-muted-foreground">
              Use the search above to add movies and rank them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {movies.map((movie, index) => (
              <div
                key={`${movie.tmdb_id}-${index}`}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={`group relative flex items-center rounded-xl transition-all duration-200 ease-in-out ${
                  draggedItemIndex === index
                    ? "opacity-60 scale-[0.98] ring-2 ring-primary ring-offset-2 ring-offset-background z-20 shadow-xl"
                    : draggedOverIndex === index
                    ? "border-transparent ring-2 ring-primary/50 shadow-md bg-accent/30 scale-[1.01] z-10"
                    : "border border-border/50 bg-card hover:border-primary/40 hover:shadow-md"
                }`}
              >
                {/* Drop indicators */}
                {draggedOverIndex === index && draggedItemIndex !== null && draggedItemIndex > index && (
                  <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary rounded-full animate-in fade-in" />
                )}
                {draggedOverIndex === index && draggedItemIndex !== null && draggedItemIndex < index && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary rounded-full animate-in fade-in" />
                )}

                {/* Drag Handle */}
                <div className="flex h-20 w-10 shrink-0 cursor-grab items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground group-hover:text-muted-foreground active:cursor-grabbing">
                  <GripVertical className="size-5" />
                </div>

                {/* Rank Number */}
                <div className="flex w-10 shrink-0 items-center justify-center text-lg font-bold text-muted-foreground group-hover:text-foreground">
                  {index + 1}
                </div>

                {/* Poster Thumbnail */}
                <div className="relative my-2 mr-4 aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-muted shadow-sm md:w-14">
                  {movie.poster_path && (
                    <Image
                      src={movie.poster_path}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Movie Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <Link
                    href={`/movie?id=${movie.tmdb_id}`}
                    className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline md:text-lg"
                  >
                    {movie.title}
                  </Link>
                  {movie.year && <span className="mt-1 text-sm text-muted-foreground">{movie.year}</span>}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveMovie(movie.tmdb_id)}
                  className="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  title="Remove from list"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
