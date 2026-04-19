import { NextResponse } from "next/server"

import { sendAccessApprovalEmail } from "@/lib/email/resend"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.INTERNAL_ACCESS_APPROVAL_KEY ??
    process.env.INTERNAL_SCAN_SIM_KEY ??
    process.env.INTERNAL_SCAN_PROCESS_KEY

  if (!configuredKey || configuredKey.trim().length === 0) {
    return process.env.NODE_ENV !== "production"
  }

  const providedKey =
    request.headers.get("x-checkoutleak-approval-key") ??
    request.headers.get("x-checkoutleak-sim-key") ??
    request.headers.get("x-checkoutleak-manual-key") ??
    new URL(request.url).searchParams.get("key")

  return providedKey === configuredKey
}

function getAppBaseUrl(request: Request) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  if (!id || typeof id !== "string") {
    return NextResponse.json({ message: "Missing id." }, { status: 400 })
  }

  let approvedBy: string | undefined
  try {
    const body = await request.json().catch(() => ({}))
    approvedBy = typeof body.approved_by === "string" ? body.approved_by.trim() : undefined
  } catch {
    // body is optional
  }

  const admin = createSupabaseAdminClient()

  // Fetch the request record first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record, error: fetchError } = await (admin as any)
    .from("access_requests")
    .select("id, full_name, email, status, approval_email_sent_at")
    .eq("id", id)
    .single()

  if (fetchError || !record) {
    return NextResponse.json({ message: "Access request not found." }, { status: 404 })
  }

  if (record.status === "rejected") {
    return NextResponse.json({ message: "Cannot approve a rejected request." }, { status: 409 })
  }

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("access_requests")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: approvedBy ?? null,
      updated_at: now,
    })
    .eq("id", id)

  if (updateError) {
    console.error("[approve-access-request] update error:", updateError.message)
    return NextResponse.json({ message: "Failed to update record." }, { status: 500 })
  }

  // Send approval email only if not already sent
  let emailStatus: "sent" | "skipped" | "failed" = "skipped"

  if (!record.approval_email_sent_at) {
    const baseUrl = getAppBaseUrl(request)
    const signInUrl = `${baseUrl}/auth/sign-in?email=${encodeURIComponent(record.email)}`

    try {
      const result = await sendAccessApprovalEmail({
        to: record.email,
        fullName: record.full_name,
        email: record.email,
        signInUrl,
      })

      if (result.status === "sent") {
        emailStatus = "sent"
        // Mark email sent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("access_requests")
          .update({ approval_email_sent_at: now })
          .eq("id", id)
      } else {
        emailStatus = "skipped"
      }
    } catch (err) {
      console.error("[approve-access-request] email send error:", err)
      emailStatus = "failed"
    }
  }

  return NextResponse.json({
    success: true,
    id,
    email: record.email,
    emailStatus,
  })
}
