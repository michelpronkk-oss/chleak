import { NextResponse } from "next/server"

import { PUBLIC_ACCESS_EMAIL_COOKIE } from "@/lib/auth/public-access"
import { sendRequestReceivedEmail } from "@/lib/email/resend"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"

interface RequestBody {
  full_name: string
  email: string
  store_url?: string
  platform: "shopify" | "stripe" | "both"
  revenue_band?: string
  pain_prompt?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function setAccessCookie(response: NextResponse, email: string) {
  response.cookies.set(PUBLIC_ACCESS_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  })
}

export async function POST(request: Request) {
  let body: RequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const fullName = (body.full_name ?? "").trim()
  const email = (body.email ?? "").trim().toLowerCase()
  const platform = body.platform
  const storeUrl = (body.store_url ?? "").trim() || null
  const revenueBand = (body.revenue_band ?? "").trim() || null
  const painPrompt = (body.pain_prompt ?? "").trim() || null

  if (!fullName || !email || !platform) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 })
  }

  if (!["shopify", "stripe", "both"].includes(platform)) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 })
  }

  try {
    const admin = createSupabaseAdminClient()

    const { data: inserted, error } = await admin
      .from("access_requests")
      .insert({
        full_name: fullName,
        email,
        store_url: storeUrl,
        platform,
        revenue_band: revenueBand,
        pain_prompt: painPrompt,
        source: "homepage",
      })
      .select("id, full_name, email")
      .single()

    if (error) {
      // Unique constraint = duplicate email; silently succeed, surface existing flag to client
      if (error.code === "23505") {
        const response = NextResponse.json({ success: true, existing: true })
        setAccessCookie(response, email)
        return response
      }
      console.error("[request-access] insert error:", error.message)
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }

    // New submission -- send request-received confirmation email
    if (inserted) {
      try {
        const result = await sendRequestReceivedEmail({
          to: inserted.email,
          fullName: inserted.full_name,
        })

        if (result.status === "sent") {
          await admin
            .from("access_requests")
            .update({ request_received_email_sent_at: new Date().toISOString() })
            .eq("id", inserted.id)
        }
      } catch (emailErr) {
        // Email failure must not fail the submission response
        console.error("[request-access] confirmation email error:", emailErr)
      }
    }

    const response = NextResponse.json({ success: true })
    setAccessCookie(response, email)
    return response
  } catch (err) {
    console.error("[request-access] unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
