import Image from "next/image"
import { Tv, ShoppingCart, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface WatchOption {
  provider: string
  type: "stream" | "rent" | "buy"
  logo: string
  link?: string
}

interface WatchOptionsProps {
  options: WatchOption[]
}

export function WatchOptions({ options }: WatchOptionsProps) {
  const streamOptions = options.filter((o) => o.type === "stream")
  const rentOptions = options.filter((o) => o.type === "rent")
  const buyOptions = options.filter((o) => o.type === "buy")

  const typeConfig = {
    stream: { icon: <Tv className="size-4" />, label: "Stream", color: "bg-primary/20 text-primary" },
    rent: { icon: <DollarSign className="size-4" />, label: "Rent", color: "bg-amber-500/20 text-amber-400" },
    buy: { icon: <ShoppingCart className="size-4" />, label: "Buy", color: "bg-blue-500/20 text-blue-400" },
  }

  const OptionGroup = ({ title, opts, type }: { title: string; opts: WatchOption[]; type: "stream" | "rent" | "buy" }) => {
    if (opts.length === 0) return null
    const config = typeConfig[type]

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <Badge variant="secondary" className={config.color}>
            {opts.length}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          {opts.map((option) => (
            <a
              key={option.provider}
              href={option.link || "#"}
              target={option.link ? "_blank" : undefined}
              rel={option.link ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary hover:bg-card/80"
            >
              <div className="relative size-10 overflow-hidden rounded-md flex items-center justify-center bg-muted">
                {option.logo ? (
                  <Image
                    src={option.logo}
                    alt={option.provider}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{option.provider[0]}</span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                {option.provider}
              </span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="mt-10 md:mt-14">
      <h2 className="text-xl font-semibold text-foreground">Where to Watch</h2>
      <div className="mt-6 space-y-6">
        <OptionGroup title="Stream" opts={streamOptions} type="stream" />
        <OptionGroup title="Rent" opts={rentOptions} type="rent" />
        <OptionGroup title="Buy" opts={buyOptions} type="buy" />
      </div>
    </section>
  )
}
