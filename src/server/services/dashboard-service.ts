import { createDashboardRepository } from "@/server/repositories/factory"
import type { DashboardSnapshot } from "@/types/domain"

export async function getDashboardSnapshotForOrganization(
  organizationId: string
): Promise<DashboardSnapshot> {
  const repository = await createDashboardRepository()
  return repository.getDashboardSnapshot(organizationId)
}
