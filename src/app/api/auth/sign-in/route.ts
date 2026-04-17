import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"

function toErrorRedirect(origin: string, next: string, reason: string, email?: string) {
  const url = new URL("/auth/sign-in", origin)
  url.searchParams.set("error", reason)
  url.searchParams.set("next", next)
  if (email) {
    url.searchParams.set("email", email)
  }
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const emailRaw = formData.get("email")
  const passwordRaw = formData.get("password")
  const nextRaw = formData.get("next")

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : ""
  const password = typeof passwordRaw === "string" ? passwordRaw : ""
  const next = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null, "/app")
  const url = new URL(request.url)

  if (!email || !password) {
    return toErrorRedirect(url.origin, next, "missing_fields", email)
  }

  const supabase = await createSupabaseServerClient()
  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInResult.error || !signInResult.data.user) {
    return toErrorRedirect(url.origin, next, "invalid_credentials", email)
  }

  const metadata = signInResult.data.user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  try {
    await ensureWorkspaceForUser({
      userId: signInResult.data.user.id,
      email: signInResult.data.user.email ?? null,
      fullName,
    })
  } catch {
    return toErrorRedirect(url.origin, next, "workspace_setup_failed", email)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}

