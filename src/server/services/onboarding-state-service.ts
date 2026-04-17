import { cookies } from "next/headers"

export const ONBOARDING_STATE_COOKIE = "checkoutleak_onboarding_state"

export const onboardingStates = [
  "empty",
  "connecting_shopify",
  "connecting_stripe",
  "pending_shopify",
  "pending_stripe",
  "first_results_shopify",
  "first_results_stripe",
  "completed_shopify",
  "completed_stripe",
  "demo",
] as const

export type OnboardingState = (typeof onboardingStates)[number]

export type ConnectedSource = "shopify" | "stripe" | "demo" | "none"

export function isOnboardingState(value: string): value is OnboardingState {
  return onboardingStates.includes(value as OnboardingState)
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const cookieStore = await cookies()
  const rawState = cookieStore.get(ONBOARDING_STATE_COOKIE)?.value

  if (rawState && isOnboardingState(rawState)) {
    return rawState
  }

  return "empty"
}

export function getConnectedSourceFromState(
  state: OnboardingState
): ConnectedSource {
  if (state.endsWith("_shopify")) {
    return "shopify"
  }

  if (state.endsWith("_stripe")) {
    return "stripe"
  }

  if (state === "demo") {
    return "demo"
  }

  return "none"
}

export function isConnectingState(state: OnboardingState) {
  return state === "connecting_shopify" || state === "connecting_stripe"
}

export function isPendingScanState(state: OnboardingState) {
  return state === "pending_shopify" || state === "pending_stripe"
}

export function isReadyState(state: OnboardingState) {
  return (
    state === "first_results_shopify" ||
    state === "first_results_stripe" ||
    state === "completed_shopify" ||
    state === "completed_stripe" ||
    state === "demo"
  )
}
