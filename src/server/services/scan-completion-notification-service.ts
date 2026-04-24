import { sendScanCompletionEmail } from "@/lib/email/resend"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"

type ScanNotificationOutcome = "issues_found" | "clean" | "no_signal" | null

interface SendScanCompletionNotificationInput {
  scanId: string
  organizationId: string
  storeId: string
  outcome: ScanNotificationOutcome
  status: "completed" | "failed"
  detectedIssuesCount: number
  estimatedMonthlyLeakage: number
  scanFamily: string | null
}

function getAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  return "https://checkoutleak.com"
}

function formatScanFamily(input: string | null) {
  if (!input) {
    return "Revenue scan"
  }
  return input
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getSourceLabel(input: {
  name: string | null
  domain: string | null
  platform: string | null
}) {
  if (input.domain) {
    return input.domain
  }
  if (input.name) {
    return input.name
  }
  return input.platform ? `${input.platform} source` : "Source"
}

async function resolveRecipient(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  organizationId: string
  preferredEmail: string | null
}) {
  if (input.preferredEmail) {
    return input.preferredEmail
  }

  const membersResult = await input.admin
    .from("org_members")
    .select("user_id, role")
    .eq("organization_id", input.organizationId)
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: true })
    .limit(5)

  if (membersResult.error) {
    return null
  }

  for (const member of membersResult.data ?? []) {
    const userResult = await input.admin.auth.admin.getUserById(member.user_id)
    const email = userResult.data.user?.email?.trim().toLowerCase() ?? null
    if (email) {
      return email
    }
  }

  return null
}

export async function sendScanCompletionNotification(
  input: SendScanCompletionNotificationInput
) {
  const admin = createSupabaseAdminClient()

  const claimResult = await admin
    .from("scans")
    .update({
      notification_status: "sending",
      notification_error: null,
    })
    .eq("id", input.scanId)
    .eq("organization_id", input.organizationId)
    .eq("notification_requested", true)
    .is("notification_sent_at", null)
    .or("notification_status.is.null,notification_status.eq.failed")
    .select("id, notification_recipient_email")
    .maybeSingle()

  if (claimResult.error || !claimResult.data) {
    return { status: "skipped" as const, reason: "not_requested_or_already_sent" }
  }

  const [storeResult, organizationResult, criticalIssuesResult] = await Promise.all([
    admin
      .from("stores")
      .select("name, domain, platform")
      .eq("id", input.storeId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    admin
      .from("organizations")
      .select("name")
      .eq("id", input.organizationId)
      .maybeSingle(),
    admin
      .from("issues")
      .select("id", { head: true, count: "exact" })
      .eq("organization_id", input.organizationId)
      .eq("store_id", input.storeId)
      .eq("scan_id", input.scanId)
      .eq("severity", "critical")
      .neq("status", "resolved"),
  ])

  const recipient = await resolveRecipient({
    admin,
    organizationId: input.organizationId,
    preferredEmail: claimResult.data.notification_recipient_email,
  })

  if (!recipient) {
    await admin
      .from("scans")
      .update({
        notification_status: "skipped",
        notification_error: "No eligible recipient email found.",
      })
      .eq("id", input.scanId)
    return { status: "skipped" as const, reason: "recipient_missing" }
  }

  const store = storeResult.data
  const sourceLabel = getSourceLabel({
    name: store?.name ?? null,
    domain: store?.domain ?? null,
    platform: store?.platform ?? null,
  })
  const resultKind =
    input.status === "failed"
      ? "failed"
      : input.outcome === "issues_found"
        ? "issues_found"
        : "clean"
  const sourcePath =
    store?.platform === "website"
      ? `/app/stores/${input.storeId}#surface-analysis`
      : `/app/stores/${input.storeId}`
  let emailResult: Awaited<ReturnType<typeof sendScanCompletionEmail>>
  try {
    emailResult = await sendScanCompletionEmail({
      to: recipient,
      sourceLabel,
      workspaceName: organizationResult.data?.name ?? "CheckoutLeak workspace",
      resultKind,
      detectedIssuesCount: input.detectedIssuesCount,
      criticalIssuesCount: criticalIssuesResult.count ?? 0,
      estimatedMonthlyLeakage: input.estimatedMonthlyLeakage,
      scanFamilyLabel: formatScanFamily(input.scanFamily),
      appUrl: `${getAppUrl()}${sourcePath}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await admin
      .from("scans")
      .update({
        notification_status: "failed",
        notification_recipient_email: recipient,
        notification_error: message.slice(0, 1000),
      })
      .eq("id", input.scanId)

    return { status: "failed" as const, reason: message }
  }

  if (emailResult.status === "sent") {
    await admin
      .from("scans")
      .update({
        notification_status: "sent",
        notification_sent_at: new Date().toISOString(),
        notification_recipient_email: recipient,
        notification_error: null,
      })
      .eq("id", input.scanId)

    return { status: "sent" as const, id: emailResult.id }
  }

  await admin
    .from("scans")
    .update({
      notification_status: "skipped",
      notification_recipient_email: recipient,
      notification_error: emailResult.reason,
    })
    .eq("id", input.scanId)

  return { status: "skipped" as const, reason: emailResult.reason }
}
