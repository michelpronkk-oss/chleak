import { cn } from "@/lib/utils"

export function Surface({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={cn("surface-card p-6", className)}>{children}</section>
}

export function SurfaceHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-3">
      <p className="data-mono text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
        {description}
      </p>
    </div>
  )
}
