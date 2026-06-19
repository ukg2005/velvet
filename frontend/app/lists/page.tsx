"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Film, Loader2, Plus, Trash2 } from "lucide-react"
import { ListService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface MovieListCover {
  id: number
  title: string
  desc: string
  movieCount: number
  is_public: boolean
  coverImages: string[]
  updatedAt: string
}

function normalizeList(raw: any): MovieListCover {
  // entries come from ListEntrySerializer with .movie embedded
  const entries: any[] = raw.entries || []
  const coverImages = entries
    .slice(0, 4)
    .map((e: any) => getImageUrl(e.movie?.poster_url || e.movie?.poster_path, "w342"))
    .filter(Boolean)

  return {
    id: raw.id,
    title: raw.title || "Untitled List",
    desc: raw.desc || "",
    movieCount: raw.count ?? entries.length,
    is_public: raw.is_public ?? false,
    coverImages,
    updatedAt: raw.updated_at
      ? new Date(raw.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "Recently",
  }
}

export default function ListsHubPage() {
  const { isAuthenticated } = useAuth()
  const [lists, setLists] = useState<MovieListCover[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create list dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchLists() {
      try {
        const data = await ListService.getLists()
        const raw: any[] = Array.isArray(data) ? data : (data?.results || data?.lists || [])
        setLists(raw.map(normalizeList))
      } catch (err) {
        console.error(err)
        toast.error("Failed to load lists")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [isAuthenticated])

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      const created = await ListService.createList({
        name: newTitle.trim(),
        description: newDesc.trim(),
        is_public: isPublic,
      })
      toast.success(`"${created.title || newTitle}" created!`)
      // Optimistically add to state
      setLists((prev) => [normalizeList(created), ...prev])
      setDialogOpen(false)
      setNewTitle("")
      setNewDesc("")
      setIsPublic(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create list")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteList = async (listId: number, listTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${listTitle}"? This cannot be undone.`)) return
    try {
      await ListService.deleteList(listId)
      setLists((prev) => prev.filter((l) => l.id !== listId))
      toast.success(`"${listTitle}" deleted`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete list")
    }
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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-10 border-b pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Your Lists</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Curate, rank, and organize your favorite films.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                <Plus className="mr-2 size-4" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New List</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateList} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="list-title">Title</Label>
                  <Input
                    id="list-title"
                    placeholder="e.g. Favorite Sci-Fi"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list-desc">Description (optional)</Label>
                  <Input
                    id="list-desc"
                    placeholder="What's this list about?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="list-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="list-public" className="cursor-pointer">
                    Make public
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isCreating || !newTitle.trim()}
                >
                  {isCreating ? <Loader2 className="size-4 animate-spin" /> : "Create List"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Film className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No lists yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first list to start curating and ranking your favorite movies.
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:border-primary/30"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteList(list.id, list.title)
                  }}
                  className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive hover:text-white"
                  title="Delete list"
                >
                  <Trash2 className="size-4" />
                </button>

                <Link href={`/lists/${list.id}`} className="flex flex-1 flex-col">
                  {/* Stacked Covers */}
                  <div className="grid aspect-[16/9] w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-muted">
                    {list.coverImages.length > 0
                      ? list.coverImages.slice(0, 4).map((img, i) => (
                          <div key={i} className="relative h-full w-full overflow-hidden">
                            <Image
                              src={img}
                              alt={`Cover ${i}`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"

                            />
                          </div>
                        ))
                      : Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex h-full w-full items-center justify-center bg-secondary">
                            <Film className="size-4 text-muted-foreground/30" />
                          </div>
                        ))}
                  </div>

                  {/* List Info */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-1">
                        {list.title}
                      </h3>
                      {!list.is_public && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      {list.movieCount} {list.movieCount === 1 ? "movie" : "movies"} · Updated {list.updatedAt}
                    </p>
                    {list.desc && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{list.desc}</p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
