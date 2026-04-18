import Link from "next/link"

import { cn } from "@/lib/utils"

interface AccessPanelProps {
  mode: "sign-in" | "sign-up"
  next: string
  plan?: "starter" | "growth" | "pro" | null
  infoMessage?: string | null
  errorMessage?: string | null
  secondaryPrefix: string
  secondaryLabel: string
  secondaryHref: string
  children: React.ReactNode
}

export function AccessPanel({
  mode,
  next,
  plan,
  infoMessage,
  errorMessage,
  secondaryPrefix,
  secondaryLabel,
  secondaryHref,
  children,
}: AccessPanelProps) {
  const signInSearch = new URLSearchParams({ next })
  const signUpSearch = new URLSearchParams({ next })

  if (plan) {
    signInSearch.set("plan", plan)
    signUpSearch.set("plan", plan)
  }

  const signInHref = `/auth/sign-in?${signInSearch.toString()}`
  const signUpHref = `/auth/sign-up?${signUpSearch.toString()}`

  return (
    <div className="w-full max-w-[400px]">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/65 px-6 py-7 shadow-[0_24px_64px_rgba(0,0,0,0.32)] backdrop-blur-sm sm:px-7 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(70,225,215,0.07), transparent 70%)",
          }}
        />

        <div className="relative">
          <p className="font-mono text-[0.65rem] tracking-[0.14em] uppercase text-primary/55">
            CheckoutLeak
          </p>

          <div className="mt-4 flex items-center gap-6 border-b border-border/40">
            <Link
              href={signInHref}
              className={cn(
                "relative pb-3.5 text-sm transition-colors",
                mode === "sign-in"
                  ? "font-medium text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign in
            </Link>
            <Link
              href={signUpHref}
              className={cn(
                "relative pb-3.5 text-sm transition-colors",
                mode === "sign-up"
                  ? "font-medium text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create account
            </Link>
          </div>

          {infoMessage ? (
            <div className="mt-5 rounded-lg border border-primary/25 bg-primary/[0.07] px-3.5 py-2.5 text-sm text-primary">
              {infoMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-destructive/35 bg-destructive/[0.07] px-3.5 py-2.5 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6">{children}</div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {secondaryPrefix}{" "}
        <Link
          href={secondaryHref}
          className="text-foreground/70 transition-colors hover:text-foreground"
        >
          {secondaryLabel}
        </Link>
      </p>
    </div>
  )
}
