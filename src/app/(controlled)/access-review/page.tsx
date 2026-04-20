import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getAccessApprovalState } from "@/lib/auth/access"
import { PUBLIC_ACCESS_EMAIL_COOKIE } from "@/lib/auth/public-access"
import { getServerSession } from "@/lib/auth/session"
import { FadeIn } from "@/components/motion/fade-in"

export default async function AccessReviewPage() {
  const session = await getServerSession()

  // Resolve identity: authenticated session takes precedence, then public cookie
  let email: string | null = session?.user?.email ?? null

  if (!email) {
    const cookieStore = await cookies()
    const raw = cookieStore.get(PUBLIC_ACCESS_EMAIL_COOKIE)?.value ?? null
    if (raw && raw.includes("@")) {
      email = raw.trim().toLowerCase()
    }
  }

  // No identity at all — send to request access
  if (!email) {
    redirect("/request-access")
  }

  const approvalState = await getAccessApprovalState(email)

  if (approvalState === "approved") {
    // Authenticated users go straight in; unauthenticated approved users sign in first
    redirect(session ? "/app" : "/auth/sign-in")
  }

  if (approvalState === "none") {
    redirect("/request-access")
  }

  const isPending = approvalState === "pending"

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
      <FadeIn delay={0.05}>
        <div className="mx-auto max-w-sm">
          <div
            className="relative overflow-hidden rounded-xl px-6 py-8 text-center sm:px-8 sm:py-10"
            style={{
              border: isPending
                ? "1px solid color-mix(in oklab, var(--signal-line) 28%, var(--line-default) 72%)"
                : "1px solid var(--line-default)",
              background: "var(--ink-100)",
            }}
          >
            {isPending && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl"
                style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.22), transparent)" }}
              />
            )}

            <div
              className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-full border"
              style={{
                borderColor: isPending ? "color-mix(in oklab, var(--signal-line) 45%, var(--line-default) 55%)" : "var(--line-default)",
                background: isPending ? "oklch(0.78 0.13 75 / 0.06)" : "var(--ink-200)",
              }}
            >
              {isPending ? (
                <svg className="h-4 w-4 text-signal/80" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l3.5 3.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <p className="vault-eyebrow mb-3">Access request</p>

            {isPending ? (
              <>
                <h1 className="text-[1.35rem] font-semibold leading-[1.13] tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
                  Your request is under review.
                </h1>
                <p className="mx-auto mt-4 max-w-[32ch] text-[0.875rem] leading-[1.72] text-muted-foreground sm:leading-[1.82]">
                  We review every submission and reach out directly when there is a fit.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[1.35rem] font-semibold leading-[1.13] tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
                  This request was not approved.
                </h1>
                <p className="mx-auto mt-4 max-w-[32ch] text-[0.875rem] leading-[1.72] text-muted-foreground sm:leading-[1.82]">
                  We review each submission carefully. This one did not meet our current intake criteria.
                </p>
              </>
            )}

            <div className="mx-auto mt-7 h-px bg-border/30" />
            <p className="mt-4 font-mono text-[0.58rem] tracking-[0.08em] uppercase text-muted-foreground/40">
              {isPending ? "Reviewed manually / no automated response" : "Invite-only / reviewed manually"}
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
