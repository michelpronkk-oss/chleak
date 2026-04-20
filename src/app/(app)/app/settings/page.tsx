import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Settings",
}

import { SubmitButton } from "@/components/ui/submit-button"
import { getSettingsData } from "@/server/services/app-service"
import { updateOperatorProfile, updateWorkspaceSettings } from "./actions"
import { SignOutButton } from "./sign-out-button"

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Stockholm",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
]

const alertOptions = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly only" },
  { value: "disabled", label: "Disabled" },
]

const digestDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
]

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

      {/* Operator profile */}
      <section id="profile" className="vault-panel-shell scroll-mt-24">
        <header className="vault-panel-head">
          <p className="vault-panel-title">Operator profile</p>
          <p className="vault-panel-meta">Identity and role</p>
        </header>
        <form action={updateOperatorProfile}>
          <div className="vault-settings-table">
            <div className="vault-settings-row">
              <div>
                <label htmlFor="display_name" className="vault-settings-key">Name</label>
                <p className="vault-settings-desc">Display name in workspace and activity log.</p>
              </div>
              <input
                id="display_name"
                name="display_name"
                defaultValue={data.user.savedDisplayName}
                placeholder={data.user.fullName}
                className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                autoComplete="off"
              />
            </div>
            <div className="vault-settings-row">
              <div>
                <p className="vault-settings-key">Email</p>
                <p className="vault-settings-desc">Primary login and notifications destination.</p>
              </div>
              <p className="text-sm">{data.user.email}</p>
              <span className="font-mono text-[0.66rem] tracking-[0.06em] text-muted-foreground">fixed</span>
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
                <label htmlFor="timezone" className="vault-settings-key">Timezone</label>
                <p className="vault-settings-desc">Used for digest scheduling and timestamps.</p>
              </div>
              <select
                id="timezone"
                name="timezone"
                defaultValue={data.user.savedTimezone}
                className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t border-border/60 px-4 py-3 sm:px-5">
            <SubmitButton label="Save profile" />
          </div>
        </form>
      </section>

      {/* Workspace controls */}
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
        </div>
        <form action={updateWorkspaceSettings}>
          <div className="vault-settings-table border-t-0">
            <div className="vault-settings-row">
              <div>
                <label htmlFor="issue_alerts" className="vault-settings-key">Issue alerts</label>
                <p className="vault-settings-desc">Critical notification routing.</p>
              </div>
              <select
                id="issue_alerts"
                name="issue_alerts"
                defaultValue={data.notificationPreferences.issueAlerts}
                className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
              >
                {alertOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="vault-settings-row">
              <div>
                <label htmlFor="weekly_digest_day" className="vault-settings-key">Weekly digest</label>
                <p className="vault-settings-desc">Digest schedule for workspace reporting.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  id="weekly_digest_day"
                  name="weekly_digest_day"
                  defaultValue={data.notificationPreferences.weeklyDigestDay}
                  className="vault-input rounded-md px-3 py-2 text-sm outline-none w-full max-w-xs"
                >
                  {digestDays.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
                <input
                  type="hidden"
                  name="digest_enabled"
                  value={data.notificationPreferences.digestEnabled ? "true" : "false"}
                />
              </div>
            </div>
            <div className="vault-settings-row">
              <div>
                <p className="vault-settings-key">Billing alerts</p>
                <p className="vault-settings-desc">Payment and subscription state notices.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="hidden"
                  name="billing_alerts_enabled"
                  value={data.notificationPreferences.billingAlerts ? "true" : "false"}
                />
                <p className="text-sm text-muted-foreground">
                  {data.notificationPreferences.billingAlerts ? "Enabled" : "Disabled"}
                </p>
                <Link
                  href="/app/billing"
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Billing <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 px-4 py-3 sm:px-5">
            <SubmitButton label="Save workspace settings" />
          </div>
        </form>
      </section>

      <section className="vault-panel-shell">
        <header className="vault-panel-head">
          <p className="vault-panel-title">Account controls</p>
          <p className="vault-panel-meta">Session</p>
        </header>
        <div className="px-4 py-4 sm:px-5">
          <SignOutButton />
        </div>
      </section>
    </div>
  )
}
