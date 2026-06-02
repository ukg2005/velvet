"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

interface HomeHeroProps {
  movieId: string | number
  title: string
  backdrop_path: string
  poster_path: string
  score: number
}

export function HomeHero({
  movieId,
  title,
  backdrop_path,
  poster_path,
  score,
}: HomeHeroProps) {
  return (
    <div className="relative">
      <div className="relative h-[55vh] min-h-112.5 w-full overflow-hidden md:h-[65vh]">
        <Image
          src={backdrop_path}
          alt={`${title} backdrop`}
          fill
          className="object-cover"
          style={{ objectPosition: "center 24%" }}
          priority

        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent mix-blend-overlay" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="relative -mt-56 flex flex-col gap-6 md:-mt-64 md:flex-row md:gap-8">
          <Link href={`/movie?id=${movieId}`} className="relative mx-auto shrink-0 md:mx-0 block transition-transform duration-500 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <div className="relative aspect-2/3 w-48 overflow-hidden rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 md:w-64">
              <Image
                src={poster_path}
                alt={`${title} poster`}
                fill
                className="object-cover"
                priority

              />
            </div>
            <div className="absolute -bottom-3 -right-3 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:size-16">
              <div className="text-center">
                <div className="flex items-center gap-0.5">
                  <Star className="size-3 fill-current md:size-4" />
                  <span className="text-lg font-bold md:text-xl">{score}</span>
                </div>
              </div>
            </div>
          </Link>

          <div className="flex flex-1 flex-col justify-end space-y-4 pb-4 md:pb-6 text-center md:text-left">
            <div>
              <p className="mb-2 text-sm font-bold tracking-wider text-primary uppercase">
                Featured this week
              </p>
              <Link href={`/movie?id=${movieId}`} className="group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-5xl lg:text-6xl">
                  {title}
                </h1>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
