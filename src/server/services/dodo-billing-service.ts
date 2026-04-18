import { addDays } from "date-fns"

import {
  DodoConfigurationError,
  createDodoCheckoutSession,
} from "@/lib/billing/dodo"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { BillingPlan, SubscriptionStatus } from "@/types/domain"

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

function toIsoString(input: unknown): string | null {
  if (typeof input === "string" && input.length > 0) {
    const date = new Date(input)
    return Number.isNaN(date.valueOf()) ? null : date.toISOString()
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    const milliseconds = input > 10_000_000_000 ? input : input * 1000
    const date = new Date(milliseconds)
    return Number.isNaN(date.valueOf()) ? null : date.toISOString()
  }

  return null
}

function readString(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) {
    return null
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function resolvePlanIdEnv(plan: BillingPlan) {
  const candidates =
    plan === "starter"
      ? [
          "DODO_PRODUCT_STARTER",
          "DODO_STARTER_PRODUCT_ID",
          "DODO_STARTER_PLAN_ID",
          "DODO_PLAN_STARTER_ID",
        ]
      : plan === "growth"
        ? [
            "DODO_PRODUCT_GROWTH",
            "DODO_GROWTH_PRODUCT_ID",
            "DODO_GROWTH_PLAN_ID",
            "DODO_PLAN_GROWTH_ID",
          ]
        : [
            "DODO_PRODUCT_PRO",
            "DODO_PRO_PRODUCT_ID",
            "DODO_PRO_PLAN_ID",
            "DODO_PLAN_PRO_ID",
          ]

  for (const key of candidates) {
    const value = process.env[key]
    if (value && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function getDodoPlanMap() {
  return {
    starter: resolvePlanIdEnv("starter"),
    growth: resolvePlanIdEnv("growth"),
    pro: resolvePlanIdEnv("pro"),
  } as const
}

function getPlanFromKnownValues(input: string | null): BillingPlan | null {
  if (!input) {
    return null
  }

  const normalized = input.trim().toLowerCase()
  if (normalized === "starter") {
    return "starter"
  }
  if (normalized === "growth") {
    return "growth"
  }
  if (normalized === "pro") {
    return "pro"
  }

  return null
}

function getPlanFromDodoId(input: string | null): BillingPlan | null {
  if (!input) {
    return null
  }

  const planMap = getDodoPlanMap()
  if (planMap.starter === input) {
    return "starter"
  }
  if (planMap.growth === input) {
    return "growth"
  }
  if (planMap.pro === input) {
    return "pro"
  }

  return null
}

function mapSubscriptionStatus(input: {
  eventType: string
  statusRaw: string | null
}): SubscriptionStatus | null {
  const normalized = input.statusRaw?.trim().toLowerCase() ?? null
  if (
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "past_due" ||
    normalized === "canceled" ||
    normalized === "incomplete"
  ) {
    return normalized
  }

  const eventType = input.eventType.toLowerCase()
  if (eventType === "subscription.active") {
    return "active"
  }
  if (
    eventType === "payment.succeeded" ||
    eventType === "payment.success" ||
    eventType === "invoice.payment_succeeded" ||
    eventType === "invoice.paid"
  ) {
    return "active"
  }
  if (eventType === "subscription.canceled" || eventType === "subscription.cancelled") {
    return "canceled"
  }
  if (
    eventType === "subscription.payment_failed" ||
    eventType === "invoice.payment_failed" ||
    eventType === "payment.failed"
  ) {
    return "past_due"
  }

  return null
}

export function resolveDodoPlanId(plan: BillingPlan) {
  const planMap = getDodoPlanMap()
  const id = planMap[plan]
  if (!id) {
    throw new DodoConfigurationError(
      `Missing Dodo plan mapping for '${plan}'. Configure one supported Dodo product or plan env variable for this plan.`
    )
  }

  return id
}

export async function createDodoCheckoutForPlan(input: {
  plan: BillingPlan
  organizationId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}) {
  const planId = resolveDodoPlanId(input.plan)
  return createDodoCheckoutSession({
    planId,
    organizationId: input.organizationId,
    customerEmail: input.customerEmail,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  })
}

export async function syncSubscriptionFromDodoWebhook(input: {
  eventType: string
  payload: unknown
}) {
  const payloadRecord = asRecord(input.payload)
  const dataRecord = asRecord(payloadRecord?.data)
  const nestedObjectRecord = asRecord(dataRecord?.object)
  const nestedSubscriptionRecord = asRecord(dataRecord?.subscription)
  const rootSubscriptionRecord = asRecord(payloadRecord?.subscription)

  const subscriptionRecord =
    nestedSubscriptionRecord ??
    rootSubscriptionRecord ??
    nestedObjectRecord ??
    dataRecord ??
    payloadRecord

  const metadataRecord =
    asRecord(subscriptionRecord?.metadata) ??
    asRecord(dataRecord?.metadata) ??
    asRecord(payloadRecord?.metadata)

  const organizationId =
    readString(metadataRecord, ["organization_id", "organizationId"]) ??
    readString(dataRecord, ["organization_id", "organizationId"]) ??
    readString(payloadRecord, ["organization_id", "organizationId"])

  const dodoSubscriptionId =
    readString(subscriptionRecord, ["subscription_id", "id"]) ??
    readString(dataRecord, ["subscription_id"]) ??
    readString(payloadRecord, ["subscription_id"])

  const dodoCustomerId =
    readString(subscriptionRecord, ["customer_id", "customerId"]) ??
    readString(dataRecord, ["customer_id", "customerId"]) ??
    readString(payloadRecord, ["customer_id", "customerId"])

  const planRaw =
    readString(subscriptionRecord, ["plan"]) ??
    readString(dataRecord, ["plan"]) ??
    readString(payloadRecord, ["plan"])

  const planIdRaw =
    readString(subscriptionRecord, ["plan_id", "product_id", "price_id"]) ??
    readString(dataRecord, ["plan_id", "product_id", "price_id"]) ??
    readString(payloadRecord, ["plan_id", "product_id", "price_id"])

  const plan = getPlanFromKnownValues(planRaw) ?? getPlanFromDodoId(planIdRaw)

  const statusRaw =
    readString(subscriptionRecord, ["status"]) ??
    readString(dataRecord, ["status"]) ??
    readString(payloadRecord, ["status"])
  const status = mapSubscriptionStatus({
    eventType: input.eventType,
    statusRaw,
  })

  const currentPeriodStart =
    toIsoString(subscriptionRecord?.current_period_start) ??
    toIsoString(subscriptionRecord?.current_period_start_at) ??
    toIsoString(dataRecord?.current_period_start) ??
    toIsoString(payloadRecord?.current_period_start)

  const currentPeriodEnd =
    toIsoString(subscriptionRecord?.current_period_end) ??
    toIsoString(subscriptionRecord?.current_period_end_at) ??
    toIsoString(dataRecord?.current_period_end) ??
    toIsoString(payloadRecord?.current_period_end)

  const admin = createSupabaseAdminClient()
  const targetByOrganization = organizationId
    ? await admin
        .from("subscriptions")
        .select("id, organization_id, plan, status")
        .eq("organization_id", organizationId)
        .maybeSingle()
    : null

  if (targetByOrganization?.error) {
    throw new Error("Failed to query subscription by organization.")
  }

  const targetBySubscriptionId =
    !targetByOrganization?.data && dodoSubscriptionId
      ? await admin
          .from("subscriptions")
          .select("id, organization_id, plan, status")
          .eq("dodo_subscription_id", dodoSubscriptionId)
          .maybeSingle()
      : null

  if (targetBySubscriptionId?.error) {
    throw new Error("Failed to query subscription by Dodo subscription id.")
  }

  const existing = targetByOrganization?.data ?? targetBySubscriptionId?.data ?? null
  const effectiveOrganizationId = organizationId ?? existing?.organization_id ?? null
  const effectivePlan = plan ?? getPlanFromKnownValues(existing?.plan ?? null)
  const effectiveStatus = status ?? (existing?.status as SubscriptionStatus | null) ?? null

  if (!effectiveOrganizationId) {
    return {
      applied: false,
      reason: "missing_organization",
    }
  }

  if (!effectivePlan) {
    return {
      applied: false,
      reason: "missing_plan",
      organizationId: effectiveOrganizationId,
    }
  }

  const now = new Date()
  const fallbackStart = now.toISOString()
  const fallbackEnd = addDays(now, 30).toISOString()
  const payloadForWrite = {
    organization_id: effectiveOrganizationId,
    plan: effectivePlan,
    status: effectiveStatus ?? "incomplete",
    dodo_customer_id: dodoCustomerId ?? null,
    dodo_subscription_id: dodoSubscriptionId ?? null,
    current_period_start: currentPeriodStart ?? fallbackStart,
    current_period_end: currentPeriodEnd ?? fallbackEnd,
  }

  const writeResult = await admin
    .from("subscriptions")
    .upsert(payloadForWrite, { onConflict: "organization_id" })

  if (writeResult.error) {
    throw new Error("Failed to sync Dodo subscription state.")
  }

  return {
    applied: true,
    reason: "synced",
    organizationId: effectiveOrganizationId,
    plan: effectivePlan,
    status: payloadForWrite.status,
  }
}
