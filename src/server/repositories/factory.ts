import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  DashboardRepository,
  MockDashboardRepository,
  SupabaseDashboardRepository,
} from "./dashboard-repository"

export async function createDashboardRepository(): Promise<DashboardRepository> {
  const dataSource = process.env.CHECKOUTLEAK_DATA_SOURCE ?? "mock"

  if (dataSource === "supabase") {
    try {
      const supabase = await createSupabaseServerClient()
      return new SupabaseDashboardRepository(supabase)
    } catch {
      return new MockDashboardRepository()
    }
  }

  return new MockDashboardRepository()
}
