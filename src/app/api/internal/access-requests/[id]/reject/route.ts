import { NextResponse } from "next/server"

import { sendAccessRejectionEmail } from "@/lib/email/resend"
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

  const admin = createSupabaseAdminClient()

  const { data: record, error: fetchError } = await admin
    .from("access_requests")
    .select("id, full_name, email, status, rejection_email_sent_at")
    .eq("id", id)
    .single()

  if (fetchError || !record) {
    return NextResponse.json({ message: "Access request not found." }, { status: 404 })
  }

  if (record.status === "rejected") {
    return NextResponse.json({ message: "Request is already rejected." }, { status: 409 })
  }

  const now = new Date().toISOString()

  const { error: updateError } = await admin
    .from("access_requests")
    .update({
      status: "rejected",
      rejected_at: now,
      updated_at: now,
    })
    .eq("id", id)

  if (updateError) {
    console.error("[reject-access-request] update error:", updateError.message)
    return NextResponse.json({ message: "Failed to update record." }, { status: 500 })
  }

  let emailStatus: "sent" | "skipped" | "failed" = "skipped"

  if (!record.rejection_email_sent_at) {
    try {
      const result = await sendAccessRejectionEmail({
        to: record.email,
        fullName: record.full_name,
      })
      if (result.status === "sent") {
        emailStatus = "sent"
        await admin
          .from("access_requests")
          .update({ rejection_email_sent_at: now })
          .eq("id", id)
      }
    } catch (err) {
      console.error("[reject-access-request] email send error:", err)
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
