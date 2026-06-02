import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Film, Clapperboard, Camera, Music, PenTool, Palette, Scissors } from "lucide-react"

interface Genre {
  id: number
  name: string
}

interface CrewMember {
  id: number
  tmdb_id?: number
  db_id?: number
  name: string
  job: string
  profile_path: string
}

interface MovieDetailsProps {
  tagline: string
  overview: string
  genres: Genre[]
  crew: CrewMember[]
}

const jobIcons: Record<string, React.ReactNode> = {
  "Director": <Clapperboard className="size-4" />,
  "Director of Photography": <Camera className="size-4" />,
  "Original Music Composer": <Music className="size-4" />,
  "Screenplay": <PenTool className="size-4" />,
  "Production Design": <Palette className="size-4" />,
  "Editor": <Scissors className="size-4" />,
}

export function MovieDetails({
  tagline,
  overview,
  genres,
  crew,
}: MovieDetailsProps) {
  const keyCrewJobs = ["Director", "Screenplay", "Original Music Composer", "Director of Photography"]
  const keyCrew = crew.filter((c) => keyCrewJobs.includes(c.job))
  const getPersonHref = (member: CrewMember) => {
    const primaryId = member.tmdb_id || member.id || member.db_id
    const dbParam = member.db_id ? `&dbId=${member.db_id}` : ""
    return `/person?id=${primaryId}${dbParam}`
  }

  return (
    <section className="mt-8 space-y-6 md:mt-12">
      <div className="max-w-3xl">
        {tagline && (
          <p className="text-lg italic text-muted-foreground">{`"${tagline}"`}</p>
        )}
        <h2 className="mt-4 text-xl font-semibold text-foreground">Overview</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">{overview}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Key crew members */}
        {keyCrew.map((member, index) => (
          <Link href={getPersonHref(member)} key={`${member.id}-${member.job}-${index}`} className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">        
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {jobIcons[member.job] || <Clapperboard className="size-4" />}
              {member.job}
            </div>
            <p className="mt-1 font-medium text-foreground transition-colors group-hover:text-primary">{member.name}</p>
          </Link>
        ))}
      </div>

      {/* Genres */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Film className="size-4" />
          Genres
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Badge key={genre.id} variant="secondary">
              {genre.name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
