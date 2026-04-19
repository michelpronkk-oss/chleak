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
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-18">
      <header className="max-w-3xl space-y-3.5 sm:space-y-5">
        <p className="vault-eyebrow">
          {eyebrow}
        </p>
        <h1 className="text-balance text-[1.72rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl sm:leading-[1.03] lg:text-5xl">
          {title}
        </h1>
        <p className="max-w-[44ch] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-8">{description}</p>
      </header>
      <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-11 lg:mt-14 lg:space-y-12">{children}</div>
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
    <section id={id} className={cn("border-t border-border pt-5 sm:pt-7", className)}>
      <h2 className="text-[1.03rem] font-semibold tracking-tight sm:text-xl lg:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:space-y-4 sm:text-base sm:leading-7">
        {children}
      </div>
    </section>
  )
}
