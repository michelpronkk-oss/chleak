import { NextResponse } from "next/server"

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
    // access_requests is not yet in the generated types; cast until types are regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("access_requests").insert({
      full_name: fullName,
      email,
      store_url: storeUrl,
      platform,
      revenue_band: revenueBand,
      pain_prompt: painPrompt,
      source: "homepage",
    })

    if (error) {
      // Unique constraint = duplicate email; return success silently
      if (error.code === "23505") {
        return NextResponse.json({ success: true })
      }
      console.error("[request-access] insert error:", error.message)
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[request-access] unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
