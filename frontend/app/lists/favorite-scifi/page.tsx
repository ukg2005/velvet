"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { GripVertical, Plus, Search, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

interface ListMovie {
  id: string
  title: string
  year: number
  poster_path: string
  rank: number
}

const mockListData: ListMovie[] = [
  {
    id: "157336",
    title: "Interstellar",
    year: 2014,
    poster_path: "https://image.tmdb.org/t/p/w92/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    rank: 1,
  },
  {
    id: "603",
    title: "The Matrix",
    year: 1999,
    poster_path: "https://image.tmdb.org/t/p/w92/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    rank: 2,
  },
  {
    id: "27205",
    title: "Dune: Part Two",
    year: 2024,
    poster_path: "https://image.tmdb.org/t/p/w92/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    rank: 3,
  },
  {
    id: "329865",
    title: "Arrival",
    year: 2016,
    poster_path: "https://image.tmdb.org/t/p/w92/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    rank: 4,
  },
  {
    id: "335984",
    title: "Blade Runner 2049",
    year: 2017,
    poster_path: "https://image.tmdb.org/t/p/w92/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    rank: 5,
  },
]

const mockSearchResults: ListMovie[] = [
  {
    id: "19",
    title: "Metropolis",
    year: 1927,
    poster_path: "https://image.tmdb.org/t/p/w92/qfEgjTseE3L2eM0A7b0ePneQkO3.jpg",
    rank: 0,
  },
  {
    id: "68718",
    title: "Django Unchained",
    year: 2012,
    poster_path: "https://image.tmdb.org/t/p/w92/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    rank: 0,
  },
  {
    id: "878",
    title: "Solaris",
    year: 1972,
    poster_path: "https://image.tmdb.org/t/p/w92/1U2wI9yIayHn54VvjP3y1VAnxY8.jpg",
    rank: 0,
  },
]

export default function ListsPage() {
  const [movies, setMovies] = useState<ListMovie[]>(mockListData)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)
  
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // A simplified "empty state" demonstration
  const handleClearList = () => {
    setMovies([])
    setHasChanges(true)
  }
  const handleResetList = () => {
    setMovies(mockListData)
    setHasChanges(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setHasChanges(false)
    setIsSaving(false)
    toast.success("List saved successfully", {
      description: "Your personalized rankings have been updated."
    })
  }

  const handleAddMovie = (movie: ListMovie) => {
    if (movies.find(m => m.id === movie.id)) {
      toast.error("Movie is already in your list")
      return
    }
    setMovies([...movies, { ...movie, rank: movies.length + 1 }])
    setHasChanges(true)
    setSearchQuery("")
    setIsSearching(false)
    toast.success(`${movie.title} added to the list`)
  }

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index)
    // Create an invisible drag image or style it nicely (optional but good for UX)
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
    
    // Reorder movies array
    const draggedItem = movies[draggedItemIndex]
    const currentMovies = [...movies]
    
    // Remove the item from its original position
    currentMovies.splice(draggedItemIndex, 1)
    // Insert the item into the new position
    currentMovies.splice(index, 0, draggedItem)
    
    // Update state and clear drag indices
    setMovies(currentMovies)
    if (draggedItemIndex !== index) {
      setHasChanges(true)
    }
    setDraggedItemIndex(null)
    setDraggedOverIndex(null)
  }

  const onDragEnd = () => {
    setDraggedItemIndex(null)
    setDraggedOverIndex(null)
  }

  // Filter mock search results based on query
  const filteredSearchResults = searchQuery.length > 1
    ? mockSearchResults.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Favorite Sci-Fi</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A vertically ranked list of the best science fiction films.
            </p>
          </div>
          <div className="flex gap-2 sm:shrink-0 sticky top-4 z-50">
            {movies.length > 0 && hasChanges ? (
              <Button variant="default" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                Save Changes
              </Button>
            ) : movies.length > 0 ? (
              <Button variant="outline" onClick={handleClearList}>
                Clear List
              </Button>
            ) : (
              <Button variant="outline" onClick={handleResetList}>
                Reset
              </Button>
            )}
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
              onFocus={() => setIsSearching(true)}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            />
          </div>
          {isSearching && searchQuery.length > 1 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-md border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleAddMovie(movie)}
                    className="flex w-full items-center gap-3 rounded-sm p-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <Image
                      src={movie.poster_path}
                      alt={movie.title}
                      width={32}
                      height={48}
                      className="rounded bg-muted object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground">{movie.title}</span>
                      <span className="text-xs text-muted-foreground">{movie.year}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No movies found. Try a different search.
                </div>
              )}
            </div>
          )}
        </div>

        {movies.length === 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <Empty className="py-20">
              <EmptyHeader>
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <GripVertical className="size-6 text-primary" />
                </div>
                <EmptyTitle>This list is empty</EmptyTitle>
                <EmptyDescription>
                  You haven't added any movies to this list yet. Start ranking your favorites!
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleResetList} className="mt-6 mx-auto">
                <Plus className="size-4" />
                Add Your First Movie
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="space-y-3">
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={`group relative flex items-center rounded-xl transition-all duration-200 ease-in-out ${
                  draggedItemIndex === index 
                    ? 'opacity-60 scale-[0.98] ring-2 ring-primary ring-offset-2 ring-offset-background z-20 shadow-xl' 
                    : draggedOverIndex === index 
                    ? 'border-transparent ring-2 ring-primary/50 shadow-md bg-accent/30 scale-[1.01] z-10'
                    : 'border border-border/50 bg-card hover:border-primary/40 hover:shadow-md'
                }`}
              >
                {/* Drop Indicator (Line) */}
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
                <div className="relative my-2 mr-4 aspect-2/3 w-12 shrink-0 overflow-hidden rounded bg-muted shadow-sm md:w-14">
                  <Image
                    src={movie.poster_path}
                    alt={movie.title}
                    fill
                    className="object-cover"

                  />
                </div>

                {/* Movie Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <Link
                    href="/movie"
                    className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline md:text-lg"
                  >
                    {movie.title}
                  </Link>
                  <span className="mt-1 text-sm text-muted-foreground">{movie.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
