import { cn } from "@/lib/utils"
import { FadeIn } from "@/components/motion/fade-in"

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
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
      <FadeIn delay={0.03}>
        <header className="space-y-3 sm:space-y-4">
          <p className="vault-eyebrow">{eyebrow}</p>
          <h1 className="text-balance text-[1.72rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl sm:leading-[1.03]">
            {title}
          </h1>
          <p className="max-w-[44ch] text-[0.9rem] leading-[1.75] text-muted-foreground sm:text-base sm:leading-[1.8]">
            {description}
          </p>
        </header>
      </FadeIn>
      <FadeIn delay={0.08}>
        <div className="mt-10 space-y-0 sm:mt-14">{children}</div>
      </FadeIn>
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
    <section
      id={id}
      className={cn(
        "border-t border-border/60 py-7 sm:py-9",
        className
      )}
    >
      <p className="mb-1 font-mono text-[0.62rem] tracking-[0.1em] uppercase text-muted-foreground/45">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-[0.9rem] leading-[1.75] text-muted-foreground sm:mt-4 sm:space-y-4 sm:text-[0.95rem] sm:leading-[1.8]">
        {children}
      </div>
    </section>
  )
}
