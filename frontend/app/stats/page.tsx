"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Film, Clock, Star, TrendingUp } from "lucide-react"
import { StatService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const chartConfig = {
  count: { label: "Count", color: "var(--primary)" },
}

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']

export default function StatsPage() {
  const [stats, setStats] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState<string>("all")

  React.useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      try {
        const data = await StatService.getStats(selectedYear)
        setStats(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [selectedYear])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="mb-8 flex items-center gap-4">
            <Link href="/profile" className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Your Stats</h1>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
            <p className="text-muted-foreground">Log more movies to see your stats.</p>
          </div>
        </div>
      </main>
    )
  }

  const { overview, comparison, top_genres, top_actors, top_directors, decades, rating_distribution } = stats

  // Format decades for chart
  const decadeData = Object.entries(decades || {}).map(([name, count]) => ({ name, count }))

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all shadow-sm">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Your Stats Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">A deep dive into your viewing habits.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="All-Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All-Time</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Film className="size-4 text-primary" /> Total Films
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview?.total_movies || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview?.total_hours || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="size-4 text-primary" /> Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Number(overview?.avg_rating || 0).toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> This Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{comparison?.this_year || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {comparison?.growth > 0 ? `+${comparison.growth}` : comparison?.growth} vs last year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Decades Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={decadeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <ChartTooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Top Genres</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {top_genres?.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={top_genres}
                        dataKey="c"
                        nameKey="movie__genres__name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={60}
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {top_genres.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-64 flex items-center text-muted-foreground">Not enough data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Most Watched Actors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                {top_actors?.map((actor: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-sm sm:text-base">{actor.movie__castmembership__person__name}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm">{actor.count} films</span>
                  </div>
                ))}
                {(!top_actors || top_actors.length === 0) && <p className="text-muted-foreground text-sm">Log some movies to see actors.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Most Watched Directors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                {top_directors?.map((director: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-sm sm:text-base">{director.movie__crewmembership__person__name}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm">{director.count} films</span>
                  </div>
                ))}
                {(!top_directors || top_directors.length === 0) && <p className="text-muted-foreground text-sm">Log some movies to see directors.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  )
}
