import {
  getPlanEntitlement,
  getPlanStateForOrganization,
} from "@/server/services/plan-state-service"
import type { BillingPlan } from "@/types/domain"

export type MonitoringCadence = "weekly" | "daily" | "high_frequency"

export interface MonitoringEntitlement {
  plan: BillingPlan | null
  cadence: MonitoringCadence
  intervalHours: number
  maxSources: number | null
  hasActiveAccess: boolean
}

const DEFAULT_MONITORING_ENTITLEMENT: MonitoringEntitlement = {
  plan: null,
  cadence: "weekly",
  intervalHours: 168,
  maxSources: 1,
  hasActiveAccess: false,
}

const PLAN_MONITORING_ENTITLEMENTS: Record<
  BillingPlan,
  Omit<MonitoringEntitlement, "plan" | "hasActiveAccess">
> = {
  starter: {
    cadence: "weekly",
    intervalHours: 168,
    maxSources: 1,
  },
  growth: {
    cadence: "daily",
    intervalHours: 24,
    maxSources: 3,
  },
  pro: {
    cadence: "high_frequency",
    intervalHours: 6,
    maxSources: null,
  },
}

export async function getMonitoringEntitlementForOrganization(
  organizationId: string
): Promise<MonitoringEntitlement> {
  const planState = await getPlanStateForOrganization(organizationId)
  const planEntitlement = getPlanEntitlement(planState)
  const plan = planEntitlement.currentPlan

  if (!planEntitlement.hasActiveAccess || !plan) {
    return DEFAULT_MONITORING_ENTITLEMENT
  }

  return {
    ...PLAN_MONITORING_ENTITLEMENTS[plan],
    plan,
    hasActiveAccess: true,
  }
}
