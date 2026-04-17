import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"), "/app")

  if (!code) {
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin)
    redirectUrl.searchParams.set("error", "callback_missing")
    redirectUrl.searchParams.set("next", next)
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createSupabaseServerClient()
  const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeResult.error || !exchangeResult.data.user) {
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin)
    redirectUrl.searchParams.set("error", "callback_failed")
    redirectUrl.searchParams.set("next", next)
    return NextResponse.redirect(redirectUrl)
  }

  const metadata = exchangeResult.data.user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  try {
    await ensureWorkspaceForUser({
      userId: exchangeResult.data.user.id,
      email: exchangeResult.data.user.email ?? null,
      fullName,
    })
  } catch {
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin)
    redirectUrl.searchParams.set("error", "workspace_setup_failed")
    redirectUrl.searchParams.set("next", next)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

