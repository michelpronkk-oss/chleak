import { redirect } from "next/navigation"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { SignInForm } from "./sign-in-form"

const errorMessage: Record<string, string> = {
  missing_email: "Enter your approved email to continue.",
  under_review: "Your request is still under review.",
  not_approved: "This email is not approved for workspace access.",
  rate_limited: "A sign-in link was just sent. Please wait and check your inbox.",
  send_failed: "We could not send a sign-in link right now. Please try again.",
  callback_missing: "Sign-in callback was incomplete. Please request a new link.",
  callback_failed: "We could not complete sign-in from that link. Request a new one.",
  workspace_setup_failed:
    "Your identity was verified, but workspace setup failed. Contact support.",
  password_disabled: "Password sign-in is disabled. Use your approved email sign-in link.",
}

const stateMessage: Record<string, string> = {
  check_email: "Check your inbox for your secure sign-in link.",
}

type BillingPlan = "starter" | "growth" | "pro"

function parsePlan(raw: string | undefined): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email
  const errorRaw = Array.isArray(params.error) ? params.error[0] : params.error
  const stateRaw = Array.isArray(params.state) ? params.state[0] : params.state
  const planRaw = Array.isArray(params.plan) ? params.plan[0] : params.plan

  const next = sanitizeNextPath(nextRaw, "/app")
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : ""
  const selectedPlan = parsePlan(planRaw)
  const errorText = errorRaw ? errorMessage[errorRaw] : null
  const stateText = stateRaw ? stateMessage[stateRaw] : null
  const message = errorText ?? stateText

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(next)
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:px-7 sm:py-8">
        <div className="relative">
          <p className="vault-eyebrow mb-0">
            Access approved
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
            Enter your workspace
          </h1>
          <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">
            Sign in with your approved email to enter the private CheckoutLeak operator workspace.
          </p>

          {message ? (
            <div className="mt-5 rounded-lg border border-border/50 bg-background/45 px-3.5 py-2.5 text-sm text-muted-foreground">
              {message}
            </div>
          ) : null}

          <SignInForm next={next} plan={selectedPlan} defaultEmail={email} />
        </div>
      </div>
    </div>
  )
}
