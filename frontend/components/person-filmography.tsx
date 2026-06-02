"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Clapperboard } from "lucide-react"

interface MovieCredit {
  id: string | number
  title: string
  character?: string
  job?: string
  release_date: string
  poster_path: string
  rating: number
}

interface PersonFilmographyProps {
  creditsByDepartment: Record<string, MovieCredit[]>
}

export function PersonFilmography({
  creditsByDepartment,
}: PersonFilmographyProps) {
  const departments = Object.keys(creditsByDepartment).sort((a, b) => {
    // Put "Acting" first if present, otherwise sort by number of credits descending
    if (a === "Acting") return -1;
    if (b === "Acting") return 1;
    return creditsByDepartment[b].length - creditsByDepartment[a].length;
  })

  // Start with the first available department
  const initialTab = departments.length > 0 ? departments[0] : ""
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [isAnimating, setIsAnimating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (departments.length > 0 && !departments.includes(activeTab)) {
      setActiveTab(departments[0])
    }
  }, [creditsByDepartment, activeTab, departments])

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setIsAnimating(true)
    setTimeout(() => {
      setActiveTab(tab)
      setTimeout(() => setIsAnimating(false), 50)
    }, 150)
  }

  const activeCredits = creditsByDepartment[activeTab] || []

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Filmography</h2>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {departments.map((dep) => (
          <button
            key={dep}
            onClick={() => handleTabChange(dep)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === dep
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Clapperboard className="h-4 w-4" />
            {dep}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === dep
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {creditsByDepartment[dep].length}
            </span>
          </button>
        ))}
      </div>

      {/* Credits Grid */}
      <div
        ref={contentRef}
        className={`transition-all duration-200 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {activeCredits.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {activeCredits.map((credit, index) => (
            <Link
              href={`/movie?id=${credit.id}`}
              key={`${activeTab}-${credit.id}-${credit.character || credit.job || "credit"}-${index}`}
              className="group block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-2 ring-primary/30 transition-all group-hover:ring-primary">
                  <Image
                    src={credit.poster_path}
                    alt={credit.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"

                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  {/* Rating badge on hover */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Star className="size-3 fill-primary text-primary" />      
                    <span className="text-xs font-medium text-foreground">      
                      {credit.rating.toFixed(1)}
                    </span>
                  </div>
              </div>

              <div className="mt-2 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {credit.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {credit.character || credit.job} ({credit.release_date})
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-12 text-center ring-1 ring-border">
          <p className="text-muted-foreground">
            No {activeTab} credits available.
          </p>
        </div>
      )}
      </div>
    </section>
  )
}
