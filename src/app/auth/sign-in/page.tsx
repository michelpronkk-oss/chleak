import { AccessPanel } from "@/components/auth/access-panel"
import { sanitizeNextPath } from "@/lib/auth/navigation"

const errorMessage: Record<string, string> = {
  missing_fields: "Enter both email and password to continue.",
  invalid_credentials: "Email or password is incorrect.",
  callback_missing: "Verification callback was incomplete. Please try again.",
  callback_failed: "We could not complete sign in from your verification link.",
  workspace_setup_failed:
    "Your account was verified, but workspace setup failed. Contact support.",
}

const stateMessage: Record<string, string> = {
  check_email:
    "Check your inbox to verify your account. After confirmation, sign in to continue.",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email
  const error = Array.isArray(params.error) ? params.error[0] : params.error
  const state = Array.isArray(params.state) ? params.state[0] : params.state
  const next = sanitizeNextPath(nextRaw, "/app")
  const errorText = error ? errorMessage[error] : null
  const stateText = state ? stateMessage[state] : null

  return (
    <AccessPanel
      mode="sign-in"
      next={next}
      infoMessage={stateText}
      errorMessage={errorText}
      secondaryPrefix="No account?"
      secondaryLabel="Create one"
      secondaryHref={`/auth/sign-up?next=${encodeURIComponent(next)}`}
    >
      <form method="POST" action="/api/auth/sign-in" className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/50"
            placeholder="Your password"
          />
        </div>
        <button
          type="submit"
          className="marketing-primary-cta mt-1 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px"
        >
          Enter workspace
        </button>
      </form>
    </AccessPanel>
  )
}
