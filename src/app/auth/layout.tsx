import Link from "next/link"

import { CheckoutLeakLogo } from "@/components/brand/logo"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[820px] w-[820px]"
        style={{
          transform: "translate(-42%, -38%)",
          background:
            "radial-gradient(ellipse at center, rgba(70,225,215,0.11), transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[760px] w-[760px]"
        style={{
          transform: "translate(36%, -44%)",
          background:
            "radial-gradient(ellipse at center, rgba(44,142,196,0.08), transparent 74%)",
        }}
      />

      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <CheckoutLeakLogo />
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/[0.46] shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:rounded-[1.5rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="order-2 border-t border-border/60 p-5 sm:p-7 lg:order-1 lg:border-r lg:border-t-0 lg:p-9">
              <p className="data-mono text-primary">Private System Access</p>
              <h1 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-[2.1rem]">
                Secure entry for revenue operators
              </h1>
              <p className="mt-4 max-w-[46ch] text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
                CheckoutLeak sessions are tied to verified workspace members. Plan and source state are evaluated before dashboard visibility.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/30 px-3.5 py-3">
                  <p className="data-mono text-muted-foreground">Session control</p>
                  <p className="mt-1 text-sm text-foreground">Supabase-authenticated identity with secure cookie refresh.</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/30 px-3.5 py-3">
                  <p className="data-mono text-muted-foreground">Commercial routing</p>
                  <p className="mt-1 text-sm text-foreground">Users route to billing, onboarding, or dashboard based on account state.</p>
                </div>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                Need onboarding help? Contact support@checkoutleak.com.
              </p>
            </section>

            <section className="order-1 p-3.5 sm:p-5 lg:order-2 lg:p-7">
              <div className="mx-auto w-full max-w-md">{children}</div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
