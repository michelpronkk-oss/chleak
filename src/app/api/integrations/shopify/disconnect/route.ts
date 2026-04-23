import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { ONBOARDING_STATE_COOKIE } from "@/server/services/onboarding-state-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
} from "@/server/services/source-connection-state-service"

async function disconnect(request: Request, nextOverride?: string | null) {
  const url = new URL(request.url)
  const next = sanitizeNextPath(nextOverride ?? url.searchParams.get("next"), "/app/stores")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL("/auth/sign-in", url.origin)
    signInUrl.searchParams.set("next", next)
    return NextResponse.redirect(signInUrl)
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  const membership = await ensureWorkspaceForUser({
    userId: user.id,
    email: user.email ?? null,
    fullName,
  })

  console.info(
    `[shopify] disconnect start: organization=${membership.organizationId}; user=${user.id}`
  )

  const admin = createSupabaseAdminClient()
  const updateResult = await admin
    .from("store_integrations")
    .update({
      status: "disconnected",
      sync_status: null,
      connection_health: "unknown",
      last_synced_at: new Date().toISOString(),
      metadata: {
        disconnect_source: "manual_ui",
        disconnected_at: new Date().toISOString(),
      },
    })
    .eq("organization_id", membership.organizationId)
    .eq("provider", "shopify")
    .neq("status", "disconnected")

  if (updateResult.error) {
    console.error(
      `[shopify] disconnect failed: organization=${membership.organizationId}; error=${JSON.stringify({ code: updateResult.error.code, message: updateResult.error.message, details: updateResult.error.details, hint: updateResult.error.hint })}`
    )
    const failed = new URL("/app/stores", url.origin)
    failed.searchParams.set("provider", "shopify")
    failed.searchParams.set("status", "disconnect_failed")
    return NextResponse.redirect(failed)
  }

  console.info(
    `[shopify] disconnect success: organization=${membership.organizationId}`
  )

  const response = NextResponse.redirect(new URL(next, url.origin))
  response.cookies.set(ONBOARDING_STATE_COOKIE, "empty", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  response.cookies.set(
    SHOPIFY_SOURCE_STATE_COOKIE,
    serializeShopifySourceState({
      status: "not_connected",
      shopDomain: null,
      message: null,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  )
  return response
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const nextRaw = formData.get("next")
  const next = typeof nextRaw === "string" ? nextRaw : null
  return disconnect(request, next)
}

export async function GET(request: Request) {
  return disconnect(request)
}
