import { cn } from "@/lib/utils"

export function MarketingPageLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-14 sm:px-8 md:pb-24 md:pt-20">
      <header className="max-w-3xl space-y-5">
        <p className="font-mono text-[0.72rem] tracking-[0.12em] uppercase text-primary/70">
          {eyebrow}
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {title}
        </h1>
        <p className="text-base leading-8 text-muted-foreground">{description}</p>
      </header>
      <div className="mt-14 space-y-12">{children}</div>
    </div>
  )
}

export function PageSection({
  title,
  children,
  className,
  id,
}: {
  title: string
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn("border-t border-border/60 pt-7", className)}>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  )
}
