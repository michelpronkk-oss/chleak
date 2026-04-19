"use server"

import { revalidatePath } from "next/cache"

import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"

export async function updateOperatorProfile(formData: FormData) {
  const session = await getServerSession()
  if (!session) return

  const displayName = (formData.get("display_name") as string | null)?.trim() || null
  const timezone = (formData.get("timezone") as string | null)?.trim() || "UTC"

  const admin = createSupabaseAdminClient()
  await admin.from("operator_profiles").upsert(
    { user_id: session.user.id, display_name: displayName, timezone, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )

  revalidatePath("/app/settings")
}

export async function updateWorkspaceSettings(formData: FormData) {
  const session = await getServerSession()
  if (!session) return

  const admin = createSupabaseAdminClient()
  const { data: membership } = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (!membership) return

  const issueAlerts = (formData.get("issue_alerts") as string) || "immediate"
  const weeklyDigestDay = (formData.get("weekly_digest_day") as string) || "friday"
  const billingAlertsEnabled = formData.get("billing_alerts_enabled") === "true"
  const digestEnabled = formData.get("digest_enabled") === "true"

  await admin.from("workspace_settings").upsert(
    {
      org_id: membership.organization_id,
      issue_alerts: issueAlerts,
      weekly_digest_day: weeklyDigestDay,
      billing_alerts_enabled: billingAlertsEnabled,
      digest_enabled: digestEnabled,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" }
  )

  revalidatePath("/app/settings")
}
