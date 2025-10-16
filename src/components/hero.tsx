import { Badge } from "@/components/ui/badge"

export function Hero() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-balance font-mono text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Frontend Developer
          </h1>
          <p className="text-pretty text-xl text-muted-foreground sm:text-2xl">
            Crafting pixel-perfect interfaces with modern web technologies
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Next.js</Badge>
          <Badge variant="secondary">Tailwind CSS</Badge>
          <Badge variant="secondary">Node.js</Badge>
        </div>
      </div>
    </section>
  )
}
