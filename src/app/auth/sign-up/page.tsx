import Link from "next/link"

import { AccessPanel } from "@/components/auth/access-panel"
import { sanitizeNextPath } from "@/lib/auth/navigation"

const errorMessage: Record<string, string> = {
  missing_fields: "Enter required account details to continue.",
  sign_up_failed: "Account creation failed. Please retry with a valid work email.",
  workspace_setup_failed:
    "Your account was created, but workspace setup failed. Contact support.",
}

const planLabel: Record<"starter" | "growth" | "pro", string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
}

function parsePlan(raw: string | undefined) {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email
  const error = Array.isArray(params.error) ? params.error[0] : params.error
  const planRaw = Array.isArray(params.plan) ? params.plan[0] : params.plan
  const next = sanitizeNextPath(nextRaw, "/app")
  const selectedPlan = parsePlan(planRaw)
  const errorText = error ? errorMessage[error] : null
  const planMessage = selectedPlan ? `Selected plan: ${planLabel[selectedPlan]}` : null

  return (
    <AccessPanel
      mode="sign-up"
      title="Create workspace access"
      description="Register your work identity to initialize organization context, billing state, and source onboarding."
      next={next}
      infoMessage={planMessage}
      errorMessage={errorText}
      secondaryPrefix="Already have access?"
      secondaryLabel="Sign in"
      secondaryHref={`/auth/sign-in?next=${encodeURIComponent(next)}`}
    >
      <form method="POST" action="/api/auth/sign-up" className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2.5">
          <label htmlFor="fullName" className="text-xs text-muted-foreground">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            className="w-full rounded-lg border border-border/70 bg-background/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/45"
            placeholder="Operator name"
          />
        </div>
        <div className="space-y-2.5">
          <label htmlFor="email" className="text-xs text-muted-foreground">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={emailRaw ?? ""}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border/70 bg-background/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/45"
            placeholder="you@brand.com"
          />
        </div>
        <div className="space-y-2.5">
          <label htmlFor="password" className="text-xs text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border/70 bg-background/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/45"
            placeholder="At least 8 characters"
          />
          <p className="text-xs text-muted-foreground">
            Your credentials are handled by Supabase Auth session controls.
          </p>
        </div>
        <button
          type="submit"
          className="marketing-primary-cta inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
        >
          Create workspace access
        </button>
      </form>

      <Link
        href="/"
        className="inline-flex text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Return to marketing site
      </Link>
    </AccessPanel>
  )
}
