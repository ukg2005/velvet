"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, Star, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LogService } from "@/lib/services"
import { getImageUrl } from "@/lib/utils"

export default function HistoryPage() {
  const [logs, setLogs] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchLogs() {
      try {
        const payload = await LogService.getLogs()
        const fetchedLogs = Array.isArray(payload) ? payload : (payload?.logs || payload?.results || [])
        // Sort by logged_at descending
        const sorted = fetchedLogs.sort((a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
        setLogs(sorted)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/profile" className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Viewing History</h1>
            <p className="text-muted-foreground text-sm mt-1">All the movies you've ever logged.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/50">
            <p className="text-lg font-medium text-muted-foreground">You haven't logged any movies yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log: any, index: number) => {
              if (!log.movie) return null;
              
              const date = log.logged_at ? new Date(log.logged_at) : null;
              const month = date ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'N/A';
              const day = date ? date.getDate() : '-';
              const year = date ? date.getFullYear() : '';

              return (
                <Link key={log.id || index} href={`/movie?id=${log.movie.tmdb_id}`} className="group block">
                  <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:bg-primary/5">
                    
                    {/* Date Block */}
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/50 py-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                        {month}
                      </span>
                      <span className="text-lg font-extrabold text-foreground leading-none mt-0.5">
                        {day}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground/80 mt-0.5">
                        {year}
                      </span>
                    </div>

                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-white/10">
                      <Image
                        src={getImageUrl(log.movie.poster_url || log.movie.poster_path, "w500")}
                        alt={log.movie.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"

                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <h3 className="truncate pr-4 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {log.movie.title}
                      </h3>
                      {log.rating > 0 && (
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold text-white">{Number(log.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
