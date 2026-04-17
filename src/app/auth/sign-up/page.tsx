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
      next={next}
      infoMessage={planMessage}
      errorMessage={errorText}
      secondaryPrefix="Already have access?"
      secondaryLabel="Sign in"
      secondaryHref={`/auth/sign-in?next=${encodeURIComponent(next)}`}
    >
      <form method="POST" action="/api/auth/sign-up" className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-xs text-muted-foreground">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/50"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-xs text-muted-foreground">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={emailRaw ?? ""}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/50"
            placeholder="you@brand.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-xs text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/50"
            placeholder="At least 8 characters"
          />
        </div>
        <button
          type="submit"
          className="marketing-primary-cta mt-1 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px"
        >
          Create account
        </button>
      </form>
    </AccessPanel>
  )
}
