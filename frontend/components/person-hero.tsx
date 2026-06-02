"use client"

import Image from "next/image"
import { Calendar, MapPin, Film, Award, TrendingUp } from "lucide-react"

interface PersonHeroProps {
  name: string
  profile_pic: string
  date_of_birth: string
  place_of_birth: string
  totalMovies: number
  knownFor: string
  careerSpan?: string
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function PersonHero({
  name,
  profile_pic,
  date_of_birth,
  place_of_birth,
  totalMovies,
  knownFor,
  careerSpan = "Unknown",
}: PersonHeroProps) {
  const age = calculateAge(date_of_birth)

  return (
    <section className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Profile Picture */}
          <div className="relative mx-auto aspect-[2/3] w-52 shrink-0 overflow-hidden rounded-xl ring-2 ring-border shadow-2xl md:mx-0 md:w-56">
            <Image
              src={profile_pic}
              alt={name}
              fill
              className="object-cover"
              priority

            />
          </div>

          {/* Person Info */}
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:pt-2 md:text-left">
            <p className="text-sm font-medium text-primary">{knownFor}</p>
            <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground md:justify-start">
              {date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {formatDate(date_of_birth)} ({age} years old)
                  </span>
                </div>
              )}

              {place_of_birth && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">{place_of_birth}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3 md:max-w-none md:grid-cols-3">
              <div className="rounded-lg bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Film className="h-4 w-4" />
                  <span className="text-xs">Total Credits</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">{totalMovies}</p>
              </div>
              <div className="rounded-lg bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span className="text-xs">Known For</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{knownFor}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-card p-4 ring-1 ring-border md:col-span-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Career Span</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{careerSpan}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
