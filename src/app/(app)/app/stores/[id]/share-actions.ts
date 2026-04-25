"use server"

import { redirect } from "next/navigation"

import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"

export async function createShareableReport(storeId: string) {
  const session = await getServerSession()
  if (!session) {
    redirect(`/app/stores/${storeId}?share_status=unauthorized`)
  }

  const admin = createSupabaseAdminClient()

  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    redirect(`/app/stores/${storeId}?share_status=unauthorized`)
  }

  const storeResult = await admin
    .from("stores")
    .select("id, organization_id")
    .eq("id", storeId)
    .eq("organization_id", membershipResult.data.organization_id)
    .single()

  if (storeResult.error || !storeResult.data) {
    redirect(`/app/stores/${storeId}?share_status=not_found`)
  }

  // Find the latest completed scan for this store
  const scanResult = await admin
    .from("scans")
    .select("id")
    .eq("store_id", storeId)
    .eq("organization_id", membershipResult.data.organization_id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const scanId = scanResult.data?.id ?? null

  // Insert a new report token (30-day expiry)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertResult = await (admin as any)
    .from("report_tokens")
    .insert({
      organization_id: membershipResult.data.organization_id,
      store_id: storeId,
      scan_id: scanId,
      label: `Report created ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    })
    .select("token")
    .single()

  if (insertResult.error || !insertResult.data) {
    redirect(`/app/stores/${storeId}?share_status=create_failed`)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://www.silentleak.com"
  const reportUrl = `${appUrl}/r/${insertResult.data.token}`

  redirect(`/app/stores/${storeId}?share_status=created&report_url=${encodeURIComponent(reportUrl)}`)
}
