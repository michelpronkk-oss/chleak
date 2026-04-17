import Link from "next/link"

import { cn } from "@/lib/utils"

interface AccessPanelProps {
  mode: "sign-in" | "sign-up"
  title: string
  description: string
  next: string
  infoMessage?: string | null
  errorMessage?: string | null
  secondaryPrefix: string
  secondaryLabel: string
  secondaryHref: string
  children: React.ReactNode
}

export function AccessPanel({
  mode,
  title,
  description,
  next,
  infoMessage,
  errorMessage,
  secondaryPrefix,
  secondaryLabel,
  secondaryHref,
  children,
}: AccessPanelProps) {
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(next)}`
  const signUpHref = `/auth/sign-up?next=${encodeURIComponent(next)}`

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/[0.78] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:rounded-2xl sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(70,225,215,0.12), transparent 72%)",
        }}
      />

      <div className="relative">
        <div className="mb-5 inline-flex rounded-lg border border-border/70 bg-background/55 p-1 text-xs">
          <Link
            href={signInHref}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              mode === "sign-in"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign in
          </Link>
          <Link
            href={signUpHref}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              mode === "sign-up"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create account
          </Link>
        </div>

        <p className="data-mono text-primary">Workspace Access</p>
        <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight sm:text-[1.7rem]">
          {title}
        </h2>
        <p className="mt-2.5 max-w-[44ch] text-sm leading-6 text-muted-foreground sm:text-[0.95rem] sm:leading-7">
          {description}
        </p>

        {infoMessage ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.08] px-3.5 py-3 text-sm text-primary">
            {infoMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/[0.08] px-3.5 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">{children}</div>

        <p className="mt-5 text-sm text-muted-foreground">
          {secondaryPrefix}{" "}
          <Link href={secondaryHref} className="text-primary transition-opacity hover:opacity-80">
            {secondaryLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
