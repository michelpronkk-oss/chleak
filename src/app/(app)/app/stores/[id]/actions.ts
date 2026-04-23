"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getServerSession } from "@/lib/auth/session"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { processQueuedScanV1 } from "@/server/services/scan-processing-service"
import type { Json } from "@/types/database"

type ActivationPageIntentHint =
  | "onboarding"
  | "activation"
  | "first_value"
  | "checkout_handoff"

type ActivationFlowHintsPayload = {
  preferred_entry_url: string | null
  onboarding_path_url: string | null
  preferred_primary_cta_selector: string | null
  preferred_next_action_selector: string | null
  first_value_area_selector: string | null
  auth_expected: boolean | null
  page_intent_hint: ActivationPageIntentHint | null
}

const PAGE_INTENT_HINTS = new Set<ActivationPageIntentHint>([
  "onboarding",
  "activation",
  "first_value",
  "checkout_handoff",
])

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {}
  }
  return input as Record<string, unknown>
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNullableUrl(value: FormDataEntryValue | null) {
  const trimmed = normalizeNullableText(value)
  if (!trimmed) {
    return { value: null as string | null, invalid: false }
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { value: null as string | null, invalid: true }
    }
    return { value: parsed.toString(), invalid: false }
  } catch {
    return { value: null as string | null, invalid: true }
  }
}

function normalizeSelector(value: FormDataEntryValue | null) {
  const trimmed = normalizeNullableText(value)
  if (!trimmed) {
    return { value: null as string | null, invalid: false }
  }
  if (trimmed.length > 220 || /[\r\n\t]/.test(trimmed)) {
    return { value: null as string | null, invalid: true }
  }
  return { value: trimmed, invalid: false }
}

function normalizeAuthExpected(value: FormDataEntryValue | null) {
  if (value === "true") {
    return true
  }
  if (value === "false") {
    return false
  }
  return null
}

function normalizePageIntentHint(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }
  return PAGE_INTENT_HINTS.has(value as ActivationPageIntentHint)
    ? (value as ActivationPageIntentHint)
    : null
}

async function resolveAuthorizedStore(input: { storeId: string; userId: string }) {
  const admin = createSupabaseAdminClient()
  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", input.userId)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    return null
  }

  const storeResult = await admin
    .from("stores")
    .select("id, organization_id, platform")
    .eq("id", input.storeId)
    .eq("organization_id", membershipResult.data.organization_id)
    .single()

  if (storeResult.error || !storeResult.data) {
    return null
  }

  return {
    admin,
    organizationId: membershipResult.data.organization_id,
    store: storeResult.data,
  }
}

export async function saveActivationFlowHints(storeId: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) {
    redirect(`/app/stores/${storeId}?hint_status=unauthorized`)
  }

  const storeCtx = await resolveAuthorizedStore({
    storeId,
    userId: session.user.id,
  })

  if (!storeCtx) {
    redirect(`/app/stores/${storeId}?hint_status=not_found`)
  }

  const preferredEntryUrl = normalizeNullableUrl(formData.get("preferred_entry_url"))
  const onboardingPathUrl = normalizeNullableUrl(formData.get("onboarding_path_url"))
  const primaryCtaSelector = normalizeSelector(
    formData.get("preferred_primary_cta_selector")
  )
  const nextActionSelector = normalizeSelector(
    formData.get("preferred_next_action_selector")
  )
  const firstValueAreaSelector = normalizeSelector(
    formData.get("first_value_area_selector")
  )
  const authExpected = normalizeAuthExpected(formData.get("auth_expected"))
  const pageIntentHint = normalizePageIntentHint(formData.get("page_intent_hint"))

  if (
    preferredEntryUrl.invalid ||
    onboardingPathUrl.invalid ||
    primaryCtaSelector.invalid ||
    nextActionSelector.invalid ||
    firstValueAreaSelector.invalid
  ) {
    redirect(`/app/stores/${storeId}?hint_status=invalid`)
  }

  const hints: ActivationFlowHintsPayload = {
    preferred_entry_url: preferredEntryUrl.value,
    onboarding_path_url: onboardingPathUrl.value,
    preferred_primary_cta_selector: primaryCtaSelector.value,
    preferred_next_action_selector: nextActionSelector.value,
    first_value_area_selector: firstValueAreaSelector.value,
    auth_expected: authExpected,
    page_intent_hint: pageIntentHint,
  }

  const integrationResult = await storeCtx.admin
    .from("store_integrations")
    .select("id, metadata")
    .eq("organization_id", storeCtx.organizationId)
    .eq("store_id", storeId)
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (integrationResult.error || !integrationResult.data) {
    redirect(`/app/stores/${storeId}?hint_status=no_integration`)
  }

  const metadata = asRecord(integrationResult.data.metadata)
  const nextMetadata: Record<string, unknown> = {
    ...metadata,
    activation_flow_hints_v1: hints,
  }

  const updateResult = await storeCtx.admin
    .from("store_integrations")
    .update({
      metadata: nextMetadata as Json,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", integrationResult.data.id)

  if (updateResult.error) {
    redirect(`/app/stores/${storeId}?hint_status=save_failed`)
  }

  revalidatePath(`/app/stores/${storeId}`)
  redirect(`/app/stores/${storeId}?hint_status=saved`)
}

export async function triggerUrlSourceAnalysisForStore(storeId: string) {
  const session = await getServerSession()
  if (!session) {
    redirect(`/app/stores/${storeId}?scan_status=unauthorized`)
  }

  const storeCtx = await resolveAuthorizedStore({
    storeId,
    userId: session.user.id,
  })

  if (!storeCtx) {
    redirect(`/app/stores/${storeId}?scan_status=not_found`)
  }

  if (storeCtx.store.platform !== "website") {
    redirect(`/app/stores/${storeId}?scan_status=not_found`)
  }

  const integrationResult = await storeCtx.admin
    .from("store_integrations")
    .select("id")
    .eq("organization_id", storeCtx.organizationId)
    .eq("store_id", storeId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (integrationResult.error || !integrationResult.data) {
    redirect(`/app/stores/${storeId}?scan_status=integration_missing`)
  }

  const insertScan = await storeCtx.admin
    .from("scans")
    .insert({
      organization_id: storeCtx.organizationId,
      store_id: storeId,
      status: "queued",
      scanned_at: new Date().toISOString(),
      detected_issues_count: 0,
      estimated_monthly_leakage: 0,
    })
    .select("id")
    .single()

  if (insertScan.error || !insertScan.data) {
    redirect(`/app/stores/${storeId}?scan_status=queue_failed`)
  }

  const processed = await processQueuedScanV1({ scanId: insertScan.data.id })

  revalidatePath(`/app/stores/${storeId}`)
  revalidatePath("/app/stores")

  if (processed.processed) {
    redirect(
      `/app/stores/${storeId}?scan_status=completed&scan_id=${encodeURIComponent(insertScan.data.id)}#surface-analysis`
    )
  }

  redirect(
    `/app/stores/${storeId}?scan_status=${encodeURIComponent(processed.reason)}&scan_id=${encodeURIComponent(insertScan.data.id)}`
  )
}

export async function triggerActivationTestRun(storeId: string) {
  const session = await getServerSession()
  if (!session) {
    redirect(`/app/stores/${storeId}?scan_status=unauthorized`)
  }

  const storeCtx = await resolveAuthorizedStore({
    storeId,
    userId: session.user.id,
  })

  if (!storeCtx) {
    redirect(`/app/stores/${storeId}?scan_status=not_found`)
  }

  const insertScan = await storeCtx.admin
    .from("scans")
    .insert({
      organization_id: storeCtx.organizationId,
      store_id: storeId,
      status: "queued",
      scanned_at: new Date().toISOString(),
      detected_issues_count: 0,
      estimated_monthly_leakage: 0,
    })
    .select("id")
    .single()

  if (insertScan.error || !insertScan.data) {
    redirect(`/app/stores/${storeId}?scan_status=queue_failed`)
  }

  const processed = await processQueuedScanV1({ scanId: insertScan.data.id })

  revalidatePath(`/app/stores/${storeId}`)

  if (processed.processed) {
    redirect(
      `/app/stores/${storeId}?scan_status=completed&scan_id=${encodeURIComponent(insertScan.data.id)}`
    )
  }

  redirect(
    `/app/stores/${storeId}?scan_status=${encodeURIComponent(processed.reason)}&scan_id=${encodeURIComponent(insertScan.data.id)}`
  )
}
