"use client"

import { Star, Globe } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Review {
  id: string
  username: string
  movie_title: string
  rating: number
  review_text: string
  created_at: string
}

interface GlobalActivityProps {
  reviews: Review[]
}

export function GlobalActivity({ reviews }: GlobalActivityProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Global Activity</h2>
          <div className="flex size-[38px] items-center justify-center rounded-lg bg-primary/10">
            <Globe className="size-[18px] text-primary" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:shadow-none dark:hover:bg-accent/40"
            >
              <div className="flex items-start gap-4">
                <Link href="/person" className="shrink-0 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full">
                  <Avatar className="size-10 border border-border shadow-xs">
                    <AvatarFallback className="bg-primary/90 text-primary-foreground text-xs font-semibold">
                      {getInitials(review.username)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href="/person" className="truncate font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">
                    {review.username}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Logged <Link href="/movie" className="font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">{review.movie_title}</Link> • {formatDate(review.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const ratingHalf = review.rating / 2;
                    const isFull = ratingHalf >= i + 1;
                    const isHalf = !isFull && ratingHalf > i;
                    
                    return (
                      <div key={i} className="relative size-4">
                        <Star className="absolute inset-0 size-4 text-muted-foreground/30" />
                        {(isFull || isHalf) && (
                          <Star
                            className={`absolute inset-0 size-4 fill-primary text-primary transition-all duration-200 ${!isFull ? "opacity-50" : ""}`}
                            style={isHalf ? { clipPath: "inset(0 50% 0 0)" } : undefined}
                          />
                        )}
                      </div>
                    )
                  })}
                  <span className="ml-2 text-xs font-bold text-foreground">{(review.rating / 2).toFixed(1)}</span>
                </div>
                {review.review_text && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    "{review.review_text}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
