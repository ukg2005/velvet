"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PersonBioProps {
  bio: string
}

export function PersonBio({ bio }: PersonBioProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = bio.length > 500

  const displayBio =
    shouldTruncate && !isExpanded ? bio.slice(0, 500) + "..." : bio

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-foreground">Biography</h2>

      <div className="rounded-xl bg-card p-5 ring-1 ring-border">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {displayBio}
        </p>

        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 h-auto p-0 text-primary hover:text-primary/80"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Read More <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  )
}
