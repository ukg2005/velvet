"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Clapperboard } from "lucide-react"

interface CastMember {
  id: number
  tmdb_id?: number
  db_id?: number
  name: string
  character: string
  profile_path: string
}

interface CrewMember {
  id: number
  tmdb_id?: number
  db_id?: number
  name: string
  job: string
  profile_path: string
}

interface CastCrewSectionProps {
  cast: CastMember[]
  crew: CrewMember[]
}

export function CastCrewSection({ cast, crew }: CastCrewSectionProps) {
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast")
  const getPersonHref = (member: CastMember | CrewMember) => {
    const primaryId = member.tmdb_id || member.id || member.db_id
    const dbParam = member.db_id ? `&dbId=${member.db_id}` : ""
    return `/person?id=${primaryId}${dbParam}`
  }

  return (
    <section className="mt-10 md:mt-14">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("cast")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "cast"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Users className="size-4" />
            Cast
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "cast"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cast.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("crew")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "crew"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Clapperboard className="size-4" />
            Crew
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "crew"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {crew.length}
            </span>
          </button>
        </div>
        
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {activeTab === "cast"
          ? cast.map((member, index) => (
              <Link
                href={getPersonHref(member)}
               
                key={`${member.id}-${member.character}-${index}`}
                className="group block rounded-lg bg-secondary/50 p-3 ring-1 ring-border transition-all hover:bg-secondary hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {member.name}
                </p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {member.character}
                </p>
              </Link>
            ))
          : crew.map((member, index) => (
              <Link
                href={getPersonHref(member)}
               
                key={`${member.id}-${member.job}-${index}`}
                className="group block rounded-lg bg-secondary/50 p-3 ring-1 ring-border transition-all hover:bg-secondary hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {member.name}
                </p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {member.job}
                </p>
              </Link>
            ))}
      </div>
    </section>
  )
}
