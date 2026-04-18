import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { getSettingsData } from "@/server/services/app-service"

export default async function SettingsPage() {
  const data = await getSettingsData()
  console.info(
    `[auth] settings page auth decision: has_plan=${data.hasPlan}; org=${data.organization.id}`
  )

  if (!data.hasPlan) {
    redirect("/app/billing?intent=plan_required")
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <section className="space-y-2">
        <p className="data-mono text-primary">Settings</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Account and Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage operator profile, workspace defaults, and notification behavior.
        </p>
      </section>

      <section id="profile" className="surface-card p-4 sm:p-5 lg:p-6 scroll-mt-24">
        <p className="data-mono text-primary">Profile</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="mt-1 text-sm">{data.user.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-1 text-sm">{data.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="mt-1 text-sm">{data.user.roleLabel}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Timezone</p>
            <p className="mt-1 text-sm">{data.user.timezone}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Workspace Context</p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="mt-1 text-sm">{data.organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected stores</p>
              {data.connectedStores.length ? (
                <ul className="mt-2 space-y-2">
                  {data.connectedStores.map((store) => (
                    <li key={store.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/35 px-3 py-2">
                      <span className="text-sm">{store.name}</span>
                      <Link
                        href={store.href}
                        className="text-xs text-primary transition-opacity hover:opacity-80"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No connected sources yet. Complete onboarding to populate workspace context.
                </p>
              )}
            </div>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5 lg:p-6">
          <p className="data-mono text-primary">Notifications</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Issue alerts</dt>
              <dd>{data.notificationPreferences.issueAlerts}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Weekly digest</dt>
              <dd>{data.notificationPreferences.weeklyDigestDay}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Billing alerts</dt>
              <dd>{data.notificationPreferences.billingAlerts ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
          <Link
            href="/app/billing"
            className="mt-5 inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
          >
            Open billing settings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>
      </section>

      <section className="surface-card p-4 sm:p-5 lg:p-6">
        <p className="data-mono text-primary">Account Controls</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Export workspace settings
          </button>
          <Link
            href="/api/auth/sign-out?next=/"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive transition-opacity hover:opacity-85"
          >
            Sign out
          </Link>
        </div>
      </section>
    </div>
  )
}

