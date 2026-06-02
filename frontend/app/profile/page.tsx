"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Film, Star, User, Settings, BarChart2, Search, Heart, Loader2, Pencil, Plus, X, Trash2, MapPin, CalendarDays } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { LogService, ListService, MovieService, AuthService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

type ProfileMovie = {
  tmdb_id: number
  title: string
  poster: string
  score: number
}

function normalizeMovies(payload: any): ProfileMovie[] {
  const items = Array.isArray(payload) ? payload : (payload?.results || payload?.movies || payload?.logs || [])
  return items
    .map((item: any) => {
      const movie = item?.movie || item
      const tmdbId = Number(movie?.tmdb_id || movie?.id || item?.tmdb_id)
      if (!Number.isFinite(tmdbId)) return null

      const posterSource = movie?.poster || movie?.poster_url || movie?.poster_path
      return {
        tmdb_id: tmdbId,
        title: movie?.title || movie?.original_title || "Untitled",
        poster: getImageUrl(posterSource, "w500"),
        score: Number(movie?.rating ?? movie?.vote_average ?? movie?.score ?? 0),
      }
    })
    .filter(Boolean) as ProfileMovie[]
}

const chartConfig = {
  count: { label: "Logged", color: "#16a34a" },
}

const FAVORITE_LIMIT = 4
const FAVORITES_STORAGE_KEY = "profile_favorites_v1"

export default function ProfilePage() {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = React.useState<ProfileMovie[]>([])
  const [recentMovies, setRecentMovies] = React.useState<any[]>([])
  const [userLists, setUserLists] = React.useState<any[]>([])
  const [ratingData, setRatingData] = React.useState<{rating: string, count: number}[]>([])
  const [user, setUser] = React.useState<any>(null)
  
  const [isEditingFavorites, setIsEditingFavorites] = React.useState(false)
  const [favSearch, setFavSearch] = React.useState("")
  const [favSearchResults, setFavSearchResults] = React.useState<ProfileMovie[]>([])
  const [isSearchingFav, setIsSearchingFav] = React.useState(false)
  const [isLoadingFav, setIsLoadingFav] = React.useState(true)

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState({ username: "", bio: "", display_name: "", location: "" })
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    async function loadFavorites() {
      let initialFavorites: ProfileMovie[] = []

      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            initialFavorites = normalizeMovies(parsed).slice(0, FAVORITE_LIMIT)
          }
        }
      } catch {
        // Ignore malformed local storage and fallback to API seed.
      }

      if (initialFavorites.length === 0) {
        try {
          const likedPayload = await LogService.getLiked()
          initialFavorites = normalizeMovies(likedPayload).slice(0, FAVORITE_LIMIT)
        } catch (error) {
          console.error(error)
          toast.error("Failed to load favorites")
        }
      }

      if (mounted) {
        setFavorites(initialFavorites)
        setIsLoadingFav(false)
      }
    }

    loadFavorites()

    async function loadProfileData() {
      setIsLoadingProfile(true)
      try {
        const currentUser = await AuthService.me()
        setUser(currentUser)
        setEditForm({ 
          username: currentUser.username || "", 
          bio: currentUser.bio || "",
          display_name: currentUser.display_name || "",
          location: currentUser.location || ""
        })
      } catch (err) {
        console.error(err)
      }

      try {
        const logsPayload = await LogService.getLogs()
        const logs = Array.isArray(logsPayload) ? logsPayload : (logsPayload?.logs || logsPayload?.results || [])
        
        // Recent movies — guard against missing movie data
        const recent = logs
          .filter((log: any) => log.movie)
          .slice(0, 5)
          .map((log: any) => ({
            id: log.movie.tmdb_id,
            title: log.movie.title,
            poster: getImageUrl(log.movie.poster_url || log.movie.poster_path, "w500"),
            user_rating: log.rating || 0,
            logged_at: log.logged_at
          }))
        if (mounted) setRecentMovies(recent)

        // Generate rating data
        const bins: Record<string, number> = {
          "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0, "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0
        }
        logs.forEach((log: any) => {
          if (log.rating && log.rating > 0) {
            const r = Number(log.rating).toFixed(1)
            if (bins[r] !== undefined) {
              bins[r] += 1
            }
          }
        })
        const rData = Object.entries(bins).map(([rating, count]) => ({ rating, count }))
        if (mounted) setRatingData(rData)
      } catch (error) {
        console.error(error)
      }

      try {
        const listsPayload = await ListService.getLists()
        const lists = Array.isArray(listsPayload) ? listsPayload : (listsPayload?.lists || listsPayload?.results || [])
        const uLists = lists.slice(0, 3).map((l: any) => {
          // entries come from ListEntrySerializer with .movie embedded
          const entries = l.entries || l.items || []
          const covers = entries.slice(0, 4).map((e: any) => {
            const movie = e.movie || e
            return getImageUrl(movie?.poster_url || movie?.poster_path, "w342")
          }).filter(Boolean)
          
          return {
            id: l.id,
            title: l.title || l.name || "Untitled",
            movieCount: l.count ?? entries.length,
            coverImages: covers.slice(0, 4)
          }
        })
        if (mounted) setUserLists(uLists)
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) setIsLoadingProfile(false)
      }
    }
    loadProfileData()

    return () => {
      mounted = false
    }
  }, [])

  React.useEffect(() => {
    if (isLoadingFav) return
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.slice(0, FAVORITE_LIMIT)))
  }, [favorites, isLoadingFav])

  const favoriteIds = React.useMemo(() => new Set(favorites.map((m) => m.tmdb_id)), [favorites])
  const favoriteSlots = React.useMemo(
    () => Array.from({ length: FAVORITE_LIMIT }, (_, index) => favorites[index] || null),
    [favorites]
  )

  const runFavoritesSearch = async () => {
    if (!favSearch.trim()) {
      setFavSearchResults([])
      return
    }

    try {
      setIsSearchingFav(true)
      const payload = await MovieService.search(favSearch.trim())
      const moviesPayload = Array.isArray(payload) ? payload : (payload?.movies || payload?.results || [])
      setFavSearchResults(normalizeMovies(moviesPayload).slice(0, 12))
    } catch (error) {
      console.error(error)
      toast.error("Favorites search failed")
    } finally {
      setIsSearchingFav(false)
    }
  }

  const addFavorite = (movie: ProfileMovie) => {
    if (favoriteIds.has(movie.tmdb_id)) return

    if (favorites.length >= FAVORITE_LIMIT) {
      toast.error(`You can only keep ${FAVORITE_LIMIT} favorites.`)
      return
    }

    setFavorites((prev) => [...prev, movie])
  }

  const removeFavorite = (tmdbId: number) => {
    setFavorites((prev) => prev.filter((movie) => movie.tmdb_id !== tmdbId))
  }

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true)
      const updatedUser = await AuthService.updateProfile(editForm)
      setUser(updatedUser)
      setIsEditDialogOpen(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to update profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl space-y-16 px-4 py-12">

        {/* Profile Header */}
        <section className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-primary/20 to-accent/40 shadow-lg sm:size-32">
            <User className="size-12 text-muted-foreground sm:size-16" />
          </div>
          <div className="flex-1 pt-2 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{user?.display_name || user?.username || user?.email?.split('@')[0] || "User"}</h1>
            {user?.username && user?.display_name && user.display_name !== user.username && (
              <p className="text-sm font-medium text-muted-foreground mt-0.5">@{user.username}</p>
            )}
            
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              {user?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.joined_at && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="size-4" />
                  <span>Joined {new Date(user.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-lg text-foreground/80 max-w-2xl">{user?.bio || "Avid cinephile and sci-fi enthusiast."}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                    <Settings className="mr-2 size-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editForm.display_name}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          placeholder="Your Name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about your movie tastes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                      {isSavingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="secondary" size="sm" asChild className="rounded-full bg-secondary/50 text-secondary-foreground hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:border-primary/30 transition-all border border-transparent">
                <Link href="/stats">
                  <BarChart2 className="mr-2 size-4" />
                  View Stats
                </Link>
              </Button>

              <Button variant="secondary" size="sm" asChild className="rounded-full bg-secondary/50 text-secondary-foreground hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:border-primary/30 transition-all border border-transparent">
                <Link href="/watchlist" prefetch={false}>Watchlist</Link>
              </Button>

              <Button variant="secondary" size="sm" asChild className="rounded-full bg-secondary/50 text-secondary-foreground hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:border-primary/30 transition-all border border-transparent">
                <Link href="/history" prefetch={false}>History (All)</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Favorites Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="min-w-36 border-b border-green-600/30 pb-2 text-2xl font-bold tracking-tight">Favorites</h2>
            <Button
              variant={isEditingFavorites ? "default" : "outline"}
              className={
                isEditingFavorites
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-primary/40 bg-card hover:border-primary hover:bg-primary/10 hover:text-primary"
              }
              onClick={() => {
                const next = !isEditingFavorites
                setIsEditingFavorites(next)
                if (!next) {
                  setFavSearch("")
                  setFavSearchResults([])
                }
              }}
            >
              {isEditingFavorites ? <X className="mr-2 size-4" /> : <Pencil className="mr-2 size-4" />}
              {isEditingFavorites ? "Close" : "Add / Edit"}
            </Button>
          </div>

          {isEditingFavorites && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="flex w-full items-center gap-2">
                <Input
                  value={favSearch}
                  onChange={(e) => setFavSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runFavoritesSearch()
                  }}
                  placeholder="Search movies to add to favorites"
                />
                <Button onClick={runFavoritesSearch} disabled={isSearchingFav}>
                  {isSearchingFav ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Pick up to {FAVORITE_LIMIT} movies for your profile favorites.</p>

              {favSearchResults.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {favSearchResults.map((movie) => {
                    const alreadyAdded = favoriteIds.has(movie.tmdb_id)
                    const isFull = favorites.length >= FAVORITE_LIMIT && !alreadyAdded

                    return (
                      <div key={`fav-search-${movie.tmdb_id}`} className="rounded-lg border border-border p-2">
                        <Link href={`/movie?id=${movie.tmdb_id}`} prefetch={false} className="block">
                          <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={movie.poster}
                              alt={movie.title}
                              fill
                              className="object-cover"

                            />
                          </div>
                          <h3 className="mt-2 truncate text-sm font-semibold">{movie.title}</h3>
                        </Link>
                        <Button
                          size="sm"
                          variant={alreadyAdded ? "secondary" : "outline"}
                          className="mt-2 w-full hover:bg-primary/10 hover:text-primary"
                          disabled={alreadyAdded || isFull}
                          onClick={() => addFavorite(movie)}
                        >
                          <Heart className="mr-2 size-4" />
                          {alreadyAdded ? "Added" : isFull ? "Limit Reached" : "Add"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isLoadingFav ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
              {favoriteSlots.map((movie, index) => (
                movie ? (
                  <div key={movie.tmdb_id} className="group relative">
                    {isEditingFavorites && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute right-2 top-2 z-20 size-8"
                        onClick={() => removeFavorite(movie.tmdb_id)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                    <Link href={`/movie?id=${movie.tmdb_id}`} prefetch={false} className="block">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40">
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"

                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        {movie.score > 0 && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-white">{movie.score.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <h3 className="mt-3 truncate text-center text-sm font-semibold leading-tight transition-colors group-hover:text-primary sm:text-base px-0.5">{movie.title}</h3>
                  </div>
                ) : (
                  <button
                    key={`favorite-slot-${index}`}
                    type="button"
                    onClick={() => setIsEditingFavorites(true)}
                    className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-card/50 text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-5" />
                    </div>
                    <span className="text-xs font-medium">Empty Slot</span>
                  </button>
                )
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <Link href="/history" prefetch={false} className="text-sm font-medium text-green-600 transition-colors hover:text-green-500">
              View all
            </Link>
          </div>

          {isLoadingProfile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
              ))}
            </div>
          ) : recentMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
              <Film className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-medium text-muted-foreground">No recent activity</p>
              <p className="mt-1 text-sm text-muted-foreground/60">Log a movie to see it here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentMovies.map((movie: any, i: number) => {
                const date = movie.logged_at ? new Date(movie.logged_at) : null;
                const month = date ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'N/A';
                const day = date ? date.getDate() : '-';

                return (
                  <Link key={i} href={`/movie?id=${movie.id}`} prefetch={false} className="group block">
                    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:bg-primary/5">
                      
                      {/* Date Block */}
                      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/50 py-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                          {month}
                        </span>
                        <span className="text-lg font-extrabold text-foreground leading-none mt-0.5">
                          {day}
                        </span>
                      </div>

                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-white/10">
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"

                        />
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 items-center justify-between overflow-hidden">
                        <h3 className="truncate pr-4 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                          {movie.title}
                        </h3>
                        {movie.user_rating > 0 && (
                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold text-white">{Number(movie.user_rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Public Lists */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Public Lists</h2>
            <Link href="/lists" prefetch={false} className="text-sm font-medium text-green-600 transition-colors hover:text-green-500">
              All Lists
            </Link>
          </div>

          {isLoadingProfile ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : userLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
              <Film className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-medium text-muted-foreground">No lists yet</p>
              <p className="mt-1 text-sm text-muted-foreground/60">
                <Link href="/lists" className="text-primary hover:underline">Create a list</Link> to organize your movies.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {userLists.map((list: any) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  prefetch={false}
                  className="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="grid aspect-[16/9] w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-muted">
                    {list.coverImages.length > 0
                      ? list.coverImages.slice(0, 4).map((img: string, idx: number) => (
                          <div key={idx} className="relative h-full w-full overflow-hidden">
                            <Image
                              src={img}
                              alt={`Movie poster ${idx + 1}`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"

                            />
                          </div>
                        ))
                      : Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className="flex h-full w-full items-center justify-center bg-secondary">
                            <Film className="size-4 text-muted-foreground/30" />
                          </div>
                        ))
                    }
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">{list.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{list.movieCount} {list.movieCount === 1 ? "film" : "films"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Rating Distribution */}
        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Rating Distribution</h2>
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="pt-6">
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="rating"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <ChartTooltip cursor={{ fill: "hsl(var(--accent))" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

      </div>
    </main>
  )
}
