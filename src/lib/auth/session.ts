import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AppSession } from "@/types/auth"

type OrganizationMembershipRow = {
  organization_id: string
  role: "owner" | "admin" | "analyst" | "viewer"
}

export const getServerSession = cache(async (): Promise<AppSession | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const membershipQuery = await supabase
      .from("org_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<OrganizationMembershipRow>()

    const membership = membershipQuery.data

    if (!membership) {
      return {
        user: {
          id: user.id,
          email: user.email ?? null,
        },
        membership: null,
      }
    }

    const orgQuery = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", membership.organization_id)
      .maybeSingle<{ name: string; slug: string }>()

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      membership: orgQuery.data
        ? {
            organizationId: membership.organization_id,
            organizationName: orgQuery.data.name,
            organizationSlug: orgQuery.data.slug,
            role: membership.role,
          }
        : null,
    }
  } catch {
    return null
  }
})

export async function requireServerSession() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  return session
}
