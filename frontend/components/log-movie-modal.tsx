"use client"

import * as React from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Star, Repeat, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { LogService } from "@/lib/services"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface LogMovieModalMovie {
  id?: string | number;
  title: string
  poster_path: string
}

interface LogMovieModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movie?: LogMovieModalMovie | null
  onSuccess?: (rating: number) => void
}

const logSchema = z.object({
  rating: z.number().min(0.5, "Please provide a rating").max(5),
  date: z.date(),
  isRewatch: z.boolean(),
  review: z.string(),
})

type LogFormValues = z.infer<typeof logSchema>

function RatingStars({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onChange(starValue)
    }
  }

  return (
    <div 
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverValue(null)}
      role="group"
      aria-label="Movie rating"
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1
        const displayValue = hoverValue !== null ? hoverValue : value
        const isFull = displayValue >= starValue
        const isHalf = displayValue >= starValue - 0.5 && displayValue < starValue

        return (
          <button
            key={starValue}
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const clickedLeftHalf = event.clientX - rect.left < rect.width / 2
              onChange(clickedLeftHalf ? starValue - 0.5 : starValue)
            }}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const hoveredLeftHalf = event.clientX - rect.left < rect.width / 2
              setHoverValue(hoveredLeftHalf ? starValue - 0.5 : starValue)
            }}
            className="group relative size-10 transition-transform active:scale-95 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
            aria-label={`Rate ${starValue} stars`}
            aria-pressed={value >= starValue - 0.5}
          >
            <Star className="absolute inset-0 size-10 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/50" />
            <Star
              className={cn(
                "absolute inset-0 size-10 text-primary transition-all duration-200",
                isFull || isHalf ? "scale-100 opacity-100" : "scale-90 opacity-0",
                hoverValue !== null ? "drop-shadow-md" : ""
              )}
              style={isHalf ? { clipPath: "inset(0 50% 0 0)" } : undefined}
            />
          </button>
        )
      })}
    </div>
  )
}

export function LogMovieModal({ open, onOpenChange, movie, onSuccess }: LogMovieModalProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const targetMovie = movie || null

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      rating: 0,
      date: new Date(),
      isRewatch: false,
      review: "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    form.reset({
      rating: 0,
      date: new Date(),
      isRewatch: false,
      review: "",
    })
    setIsSaving(false)
  }, [open, targetMovie?.title, form])

  const onSubmit = async (data: LogFormValues) => {
    if (!targetMovie) {
      toast.error("No movie selected to log.")
      return
    }
    if (!targetMovie.id) {
      toast.error("Movie ID is missing. Please open this from a movie page.")
      return
    }

    setIsSaving(true)
    try {
      await LogService.createLog({
        tmdb_id: Number(targetMovie.id),
        rating: data.rating,
        review: data.review,
        logged_at: format(data.date, "yyyy-MM-dd"),
      })
      toast.success("Log saved successfully!")
      onOpenChange(false)
      if (onSuccess) onSuccess(data.rating)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.logged_at?.[0] || "Failed to save log.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,720px)] gap-0 overflow-hidden p-0 sm:max-w-180">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="border-b border-border bg-card px-6 py-5">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-4">
                {targetMovie?.poster_path ? (
                  <div className="relative aspect-2/3 w-16 overflow-hidden rounded-md ring-1 ring-border sm:w-20">
                    <Image
                      src={targetMovie.poster_path}
                      alt={`${targetMovie.title} poster`}
                      fill
                      sizes="(max-width: 640px) 4rem, 5rem"
                      className="object-cover"

                    />
                  </div>
                ) : (
                  <div className="flex aspect-2/3 w-16 items-center justify-center rounded-md ring-1 ring-border sm:w-20">
                    <span className="text-xs text-muted-foreground">No Poster</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate text-xl sm:text-2xl">
                    {targetMovie?.title || "Log a Movie"}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {targetMovie ? "Log your rating and thoughts for this movie." : "Open this from a movie page to prefill details."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Rating</p>
              </div>
              <Controller
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <>
                    <RatingStars value={field.value} onChange={field.onChange} />
                    <div className="text-sm text-muted-foreground">Selected rating: {field.value.toFixed(1)} / 5</div>
                    {form.formState.errors.rating && (
                      <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>
                    )}
                  </>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Date watched</p>
                <Controller
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start gap-2 text-left font-normal", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="size-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Rewatch</p>
                <Controller
                  control={form.control}
                  name="isRewatch"
                  render={({ field }) => (
                    <div className="flex h-9 w-full items-center gap-3 space-x-2 rounded-md border border-input px-3 py-2 shadow-xs transition-colors hover:bg-accent/50">
                      <Switch
                        id="rewatch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="rewatch" className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                        <Repeat className="size-4 text-muted-foreground" />
                        I've seen this before
                      </Label>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Review</p>
              <Controller
                control={form.control}
                name="review"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Write your review"
                    className="min-h-28 resize-none"
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-card px-6 py-5">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
