import { cache } from "react"

import { createSupabaseAdminClient } from "@/lib/supabase/shared"

export type AccessApprovalStatus = "approved" | "pending" | "rejected" | "none"

async function fetchAccessApprovalState(email: string | null): Promise<AccessApprovalStatus> {
  if (!email) return "none"

  const admin = createSupabaseAdminClient()
  // access_requests is not yet in the generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (admin as any)
    .from("access_requests")
    .select("status")
    .eq("email", email.toLowerCase().trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (result.error || !result.data) return "none"

  const status = result.data.status
  if (status === "approved" || status === "pending" || status === "rejected") {
    return status
  }

  return "none"
}

export const getAccessApprovalState = cache(fetchAccessApprovalState)
