import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { BillingPlan } from "@/types/domain"

export type CommercialPlanStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"

interface SubscriptionState {
  plan: BillingPlan
  status: CommercialPlanStatus
  seats: number
  currentPeriodStart: string
  currentPeriodEnd: string
  dodoCustomerId: string | null
  dodoSubscriptionId: string | null
}

interface PlanState {
  status: CommercialPlanStatus
  plan: BillingPlan | null
  subscription: SubscriptionState | null
}

function isBillingPlan(value: string | null): value is BillingPlan {
  return value === "starter" || value === "growth" || value === "pro"
}

function normalizeCommercialPlanStatus(value: string | null): CommercialPlanStatus {
  if (
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "canceled" ||
    value === "incomplete"
  ) {
    return value
  }

  return "none"
}

export function hasActivePlan(state: PlanState) {
  return state.status === "active" || state.status === "trialing"
}

export async function getPlanStateForOrganization(
  organizationId: string
): Promise<PlanState> {
  const admin = createSupabaseAdminClient()
  const subscriptionResult = await admin
    .from("subscriptions")
    .select(
      "plan, status, seats, current_period_start, current_period_end, dodo_customer_id, dodo_subscription_id"
    )
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (subscriptionResult.error || !subscriptionResult.data) {
    return {
      status: "none",
      plan: null,
      subscription: null,
    }
  }

  const plan = isBillingPlan(subscriptionResult.data.plan)
    ? subscriptionResult.data.plan
    : null

  return {
    status: normalizeCommercialPlanStatus(subscriptionResult.data.status),
    plan,
    subscription:
      plan && subscriptionResult.data
        ? {
            plan,
            status: normalizeCommercialPlanStatus(subscriptionResult.data.status),
            seats: subscriptionResult.data.seats,
            currentPeriodStart: subscriptionResult.data.current_period_start,
            currentPeriodEnd: subscriptionResult.data.current_period_end,
            dodoCustomerId: subscriptionResult.data.dodo_customer_id,
            dodoSubscriptionId: subscriptionResult.data.dodo_subscription_id,
          }
        : null,
  }
}
