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
      <section className="vault-page-intro">
        <p className="data-mono text-muted-foreground">Settings</p>
        <h1 className="vault-page-intro-title">
          Account and Workspace Settings
        </h1>
        <p className="vault-page-intro-copy">
          Manage operator profile, workspace defaults, and notification behavior.
        </p>
      </section>

      <section id="profile" className="vault-panel-shell scroll-mt-24">
        <header className="vault-panel-head">
          <p className="vault-panel-title">Operator profile</p>
          <p className="vault-panel-meta">Identity and role</p>
        </header>
        <div className="vault-settings-table">
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Name</p>
              <p className="vault-settings-desc">Display name in workspace and activity log.</p>
            </div>
            <p className="text-sm">{data.user.fullName}</p>
            <button className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">Edit</button>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Email</p>
              <p className="vault-settings-desc">Primary login and notifications destination.</p>
            </div>
            <p className="text-sm">{data.user.email}</p>
            <button className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">Change</button>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Role</p>
              <p className="vault-settings-desc">Workspace permissions level.</p>
            </div>
            <p className="text-sm">{data.user.roleLabel}</p>
            <span className="font-mono text-[0.66rem] tracking-[0.06em] text-muted-foreground">fixed</span>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Timezone</p>
              <p className="vault-settings-desc">Used for digest scheduling and timestamps.</p>
            </div>
            <p className="text-sm">{data.user.timezone}</p>
            <button className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">Update</button>
          </div>
        </div>
      </section>

      <section className="vault-panel-shell">
        <header className="vault-panel-head">
          <p className="vault-panel-title">Workspace controls</p>
          <p className="vault-panel-meta">{data.organization.name}</p>
        </header>
        <div className="vault-settings-table">
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Connected stores</p>
              <p className="vault-settings-desc">Sources available for monitoring.</p>
            </div>
            <div>
              {data.connectedStores.length ? (
                <ul className="space-y-2">
                  {data.connectedStores.map((store) => (
                    <li key={store.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/25 px-3 py-2">
                      <span className="text-sm">{store.name}</span>
                      <Link
                        href={store.href}
                        className="vault-link text-xs"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No connected sources yet. Complete onboarding to populate workspace context.
                </p>
              )}
            </div>
            <Link
              href="/app/connect"
              className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Manage
            </Link>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Issue alerts</p>
              <p className="vault-settings-desc">Critical notification routing.</p>
            </div>
            <p className="text-sm">{data.notificationPreferences.issueAlerts}</p>
            <button className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">Edit</button>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Weekly digest</p>
              <p className="vault-settings-desc">Digest schedule for workspace reporting.</p>
            </div>
            <p className="text-sm">{data.notificationPreferences.weeklyDigestDay}</p>
            <button className="rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">Edit</button>
          </div>
          <div className="vault-settings-row">
            <div>
              <p className="vault-settings-key">Billing alerts</p>
              <p className="vault-settings-desc">Payment and subscription state notices.</p>
            </div>
            <p className="text-sm">{data.notificationPreferences.billingAlerts ? "Enabled" : "Disabled"}</p>
            <Link
              href="/app/billing"
              className="inline-flex items-center gap-1 rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Billing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="vault-panel-shell">
        <header className="vault-panel-head">
          <p className="vault-panel-title">Account controls</p>
          <p className="vault-panel-meta">Export and session actions</p>
        </header>
        <div className="flex flex-wrap gap-3 px-4 py-4 sm:px-5">
          <button
            type="button"
            className="rounded-md border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Export workspace settings
          </button>
          <form action="/api/auth/sign-out?next=/" method="POST">
            <button
              type="submit"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive transition-opacity hover:opacity-85"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

