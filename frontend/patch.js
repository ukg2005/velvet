const fs = require('fs');
let code = fs.readFileSync('c:/programming/velvet-frontend/velvet-frontend-39/app/movie/page.tsx', 'utf8');

const newImports = `use client` + `

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MovieHero } from "@/components/movie-hero"
import { MovieDetails } from "@/components/movie-details"
import { CastCrewSection } from "@/components/cast-crew-section"
import { WatchOptions } from "@/components/watch-options"
import { SimilarMovies } from "@/components/similar-movies"
import { LogMovieModal } from "@/components/log-movie-modal"
import { MovieService } from "@/lib/services"

type WatchOption = {
  provider: string
  type: "stream" | "rent" | "buy"
  logo: string
};`;

code = code.replace(/^"use client".*?type WatchOption = \{[^}]+\}/s, newImports);

const newBody = `function MovieView() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [movieData, setMovieData] = useState<any>(null)
  
  useEffect(() => {
    if (id) {
      MovieService.getMovie(id)
        .then((data) => {
          setMovieData(data)
        })
        .catch(console.error)
    }
  }, [id])

  const [isLogged, setIsLogged] = useState(false)
  const [logMovieOpen, setLogMovieOpen] = useState(false)

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return \`\${hours}h \${mins}m\`
  }

  if (!movieData) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
`;

code = code.replace(/const movieData = \{[\s\S]+?\}\s+export default function MovieProfilePage\(\) \{/s, newBody);

code = code.replace(/export default function MovieProfilePage\(\) \{/, '');

code += `
export default function MovieProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <MovieView />
    </Suspense>
  )
}
`;

fs.writeFileSync('c:/programming/velvet-frontend/velvet-frontend-39/app/movie/page.tsx', code);
