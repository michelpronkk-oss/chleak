import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getPublicAccessState } from "@/lib/auth/public-access"
import { FadeIn } from "@/components/motion/fade-in"
import { RequestAccessFullForm } from "@/components/marketing/request-access-full-form"

export const metadata: Metadata = {
  title: "Request Access",
  robots: { index: false, follow: false },
}

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const accessState = await getPublicAccessState()

  if (accessState === "approved") {
    redirect("/app")
  }

  const params = await searchParams
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email
  const defaultEmail = typeof emailRaw === "string" ? emailRaw.trim() : ""

  if (accessState === "pending") {
    return (
      <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <FadeIn delay={0.05}>
          <div
            className="relative overflow-hidden rounded-xl px-6 py-10 text-center sm:px-8 sm:py-12"
            style={{
              border: "1px solid color-mix(in oklab, var(--signal-line) 28%, var(--line-default) 72%)",
              background: "var(--ink-100)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl"
              style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.22), transparent)" }}
            />

            <div
              className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-full border"
              style={{
                borderColor: "color-mix(in oklab, var(--signal-line) 45%, var(--line-default) 55%)",
                background: "oklch(0.78 0.13 75 / 0.06)",
              }}
            >
              <svg className="h-4 w-4 text-signal/80" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l3.5 3.5" />
              </svg>
            </div>

            <p className="vault-eyebrow mb-3">Access request</p>

            <h1 className="text-[1.35rem] font-semibold leading-[1.13] tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
              Your request is under review.
            </h1>
            <p className="mx-auto mt-4 max-w-[32ch] text-[0.875rem] leading-[1.72] text-muted-foreground sm:leading-[1.82]">
              We review every submission and reach out directly when there is a fit.
            </p>

            <div className="mx-auto mt-7 h-px bg-border/30" />
            <p className="mt-4 font-mono text-[0.58rem] tracking-[0.08em] uppercase text-muted-foreground/40">
              Reviewed manually · no automated response
            </p>
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="relative" style={{ overflowX: "clip" }}>
      <section className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <FadeIn delay={0.04}>
          <div className="mb-7 sm:mb-9">
            <p className="vault-eyebrow mb-3 sm:text-[0.7rem]">
              Private access
            </p>
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.4rem] sm:leading-[1.05]">
              Request access.
            </h1>
            <p className="mt-3 max-w-[40ch] text-[0.88rem] leading-[1.72] text-muted-foreground sm:mt-3.5 sm:text-[0.95rem] sm:leading-[1.8]">
              Tell us about your store and what you are trying to solve. We review every request and reach out directly.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <RequestAccessFullForm defaultEmail={defaultEmail} />
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
