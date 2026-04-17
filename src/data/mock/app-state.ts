export interface MockOperatorUser {
  id: string
  fullName: string
  email: string
  roleLabel: string
  initials: string
  timezone: string
}

export interface MockSubscriptionState {
  plan: "starter" | "growth" | "pro"
  status: "trialing" | "active" | "past_due"
  billingCycle: "monthly"
  seats: number
  nextInvoiceDate: string
  amount: number
}

export interface MockNotificationPreferences {
  issueAlerts: "immediate" | "hourly" | "daily"
  weeklyDigestDay: "monday" | "friday"
  billingAlerts: boolean
}

export interface MockStoreContext {
  storeId: string
  operationalArea: string
  ownerTeam: string
  primaryObjective: string
}

export const mockOperatorUser: MockOperatorUser = {
  id: "user_olivia_hart",
  fullName: "Olivia Hart",
  email: "olivia@lumahealth.com",
  roleLabel: "Revenue Operations Lead",
  initials: "OH",
  timezone: "America/New_York",
}

export const mockSubscriptionState: MockSubscriptionState = {
  plan: "growth",
  status: "active",
  billingCycle: "monthly",
  seats: 7,
  nextInvoiceDate: "2026-05-03T00:00:00.000Z",
  amount: 399,
}

export const mockNotificationPreferences: MockNotificationPreferences = {
  issueAlerts: "immediate",
  weeklyDigestDay: "friday",
  billingAlerts: true,
}

export const mockStoreContexts: MockStoreContext[] = [
  {
    storeId: "store_shopify_us",
    operationalArea: "Shopify checkout conversion",
    ownerTeam: "Growth and Conversion",
    primaryObjective: "Improve mobile checkout completion rate",
  },
  {
    storeId: "store_stripe_subscriptions",
    operationalArea: "Stripe subscription recovery",
    ownerTeam: "Lifecycle and Retention",
    primaryObjective: "Reduce failed renewal churn",
  },
]
