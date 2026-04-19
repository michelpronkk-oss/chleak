import { redirect } from "next/navigation"

import { getAccessApprovalState } from "@/lib/auth/access"
import { getServerSession } from "@/lib/auth/session"

export default async function AccessReviewPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  const approvalState = await getAccessApprovalState(session.user.email)

  if (approvalState === "approved") {
    redirect("/app")
  }

  if (approvalState === "none") {
    redirect("/request-access")
  }

  const isPending = approvalState === "pending"

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-7 flex h-10 w-10 items-center justify-center rounded-full border border-border/55 bg-card/40">
          {isPending ? (
            <svg
              className="h-4 w-4 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 6v6l3.5 3.5" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <p className="mb-3 font-mono text-[0.65rem] tracking-[0.14em] uppercase text-primary/55">
          Access Request
        </p>

        {isPending ? (
          <>
            <h1 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
              Your request is under review.
            </h1>
            <p className="mx-auto mt-4 max-w-[34ch] text-[0.9rem] leading-[1.72] text-muted-foreground sm:mt-5 sm:max-w-[38ch] sm:text-[0.97rem] sm:leading-[1.82]">
              We review every submission and reach out directly when there is a fit. No automated response will be sent.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[1.55rem] font-semibold leading-[1.13] tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
              This request was not approved.
            </h1>
            <p className="mx-auto mt-4 max-w-[34ch] text-[0.9rem] leading-[1.72] text-muted-foreground sm:mt-5 sm:max-w-[38ch] sm:text-[0.97rem] sm:leading-[1.82]">
              We review each submission carefully. This one did not meet our current intake criteria.
            </p>
          </>
        )}

        <div className="mx-auto mt-8 h-px max-w-[100px] bg-border/30" />

        <p className="mt-5 font-mono text-[0.6rem] tracking-[0.1em] uppercase text-muted-foreground/32">
          {isPending ? "Reviewed manually · No automated response" : "Invite-only · Reviewed manually"}
        </p>
      </div>
    </div>
  )
}
