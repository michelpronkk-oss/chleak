"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getServerSession } from "@/lib/auth/session"
import { normalizeLiveSourceUrl } from "@/lib/live-source"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import {
  LIVE_SOURCE_CONTEXT_COOKIE,
  serializeLiveSourceContext,
} from "@/server/services/source-connection-state-service"
import type { Json } from "@/types/database"

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {}
  }
  return input as Record<string, unknown>
}

export async function setLiveSourceContext(formData: FormData) {
  const raw = (formData.get("source_url") as string | null)?.trim() ?? ""
  const normalized = normalizeLiveSourceUrl(raw)

  if (!normalized) {
    redirect("/app/connect?provider=source_url&status=invalid_source_url")
  }

  const session = await getServerSession()
  if (!session) {
    redirect("/auth/sign-in?next=/app/connect")
  }

  const cookieStore = await cookies()
  cookieStore.set(
    LIVE_SOURCE_CONTEXT_COOKIE,
    serializeLiveSourceContext({
      url: normalized.normalizedUrl,
      domain: normalized.hostname,
      updatedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  )

  const admin = createSupabaseAdminClient()
  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    redirect("/app/connect?provider=source_url&status=context_save_failed")
  }

  const integrationsResult = await admin
    .from("store_integrations")
    .select("id, metadata")
    .eq("organization_id", membershipResult.data.organization_id)
    .in("provider", ["shopify", "stripe"])
    .neq("status", "disconnected")

  if (integrationsResult.error) {
    redirect("/app/connect?provider=source_url&status=context_save_failed")
  }

  for (const integration of integrationsResult.data ?? []) {
    const metadata = asRecord(integration.metadata)
    const update = await admin
      .from("store_integrations")
      .update({
        metadata: {
          ...metadata,
          primary_live_source_url: normalized.normalizedUrl,
          primary_live_source_domain: normalized.hostname,
          primary_live_source_updated_at: new Date().toISOString(),
        } as Json,
      })
      .eq("id", integration.id)

    if (update.error) {
      redirect("/app/connect?provider=source_url&status=context_save_failed")
    }
  }

  revalidatePath("/app/connect")
  revalidatePath("/app/stores")
  redirect("/app/connect?provider=source_url&status=context_saved")
}
