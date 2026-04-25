import {
  getPlanEntitlement,
  getPlanStateForOrganization,
} from "@/server/services/plan-state-service"
import type { BillingPlan } from "@/types/domain"

export type EntitlementPlanKey = BillingPlan | "unknown"
export type SupportLevel = "standard" | "priority" | "private_beta"

export interface ProductEntitlements {
  planKey: EntitlementPlanKey
  isActive: boolean
  isTrialing: boolean
  maxSources: number | null
  monitoringIntervalHours: number
  canRunManualScan: boolean
  canUseScheduledMonitoring: boolean
  canViewFullEvidence: boolean
  canOpenActionBriefs: boolean
  canUseEmailAlerts: boolean
  canUseShopifyEnrichment: boolean
  canUseStripeEnrichment: boolean
  canExportReports: boolean
  supportLevel: SupportLevel
}

type PlanCapability = Omit<
  ProductEntitlements,
  "planKey" | "isActive" | "isTrialing"
>

const FALLBACK_ENTITLEMENTS: ProductEntitlements = {
  planKey: "unknown",
  isActive: false,
  isTrialing: false,
  maxSources: 1,
  monitoringIntervalHours: 168,
  canRunManualScan: false,
  canUseScheduledMonitoring: false,
  canViewFullEvidence: false,
  canOpenActionBriefs: false,
  canUseEmailAlerts: false,
  canUseShopifyEnrichment: false,
  canUseStripeEnrichment: false,
  canExportReports: false,
  supportLevel: "standard",
}

const PLAN_CAPABILITIES: Record<BillingPlan, PlanCapability> = {
  starter: {
    maxSources: 1,
    monitoringIntervalHours: 168,
    canRunManualScan: true,
    canUseScheduledMonitoring: true,
    canViewFullEvidence: false,
    canOpenActionBriefs: true,
    canUseEmailAlerts: true,
    canUseShopifyEnrichment: false,
    canUseStripeEnrichment: false,
    canExportReports: false,
    supportLevel: "standard",
  },
  growth: {
    maxSources: 3,
    monitoringIntervalHours: 24,
    canRunManualScan: true,
    canUseScheduledMonitoring: true,
    canViewFullEvidence: true,
    canOpenActionBriefs: true,
    canUseEmailAlerts: true,
    canUseShopifyEnrichment: true,
    canUseStripeEnrichment: true,
    canExportReports: false,
    supportLevel: "standard",
  },
  pro: {
    maxSources: null,
    monitoringIntervalHours: 6,
    canRunManualScan: true,
    canUseScheduledMonitoring: true,
    canViewFullEvidence: true,
    canOpenActionBriefs: true,
    canUseEmailAlerts: true,
    canUseShopifyEnrichment: true,
    canUseStripeEnrichment: true,
    canExportReports: true,
    supportLevel: "priority",
  },
}

export async function getEntitlementsForOrganization(
  organizationId: string
): Promise<ProductEntitlements> {
  const planState = await getPlanStateForOrganization(organizationId)
  const planEntitlement = getPlanEntitlement(planState)
  const plan = planEntitlement.currentPlan

  if (!planEntitlement.hasActiveAccess || !plan) {
    return {
      ...FALLBACK_ENTITLEMENTS,
      planKey: plan ?? "unknown",
      isTrialing: planState.status === "trialing",
    }
  }

  return {
    planKey: plan,
    isActive: true,
    isTrialing: planState.status === "trialing",
    ...PLAN_CAPABILITIES[plan],
  }
}
