import {
  getAllMockFixPlans,
  getFixPlanIdForIssue,
  getMockFixPlanById,
} from "@/data/mock/fix-plans"

export async function getFixPlanById(id: string) {
  const dataSource = process.env.CHECKOUTLEAK_DATA_SOURCE ?? "mock"

  if (dataSource === "supabase") {
    return getMockFixPlanById(id)
  }

  return getMockFixPlanById(id)
}

export function resolveFixPlanIdForIssue(issueId: string) {
  return getFixPlanIdForIssue(issueId)
}

export function getFixPlanHrefForIssue(issueId: string) {
  const fixPlanId = resolveFixPlanIdForIssue(issueId)
  if (!fixPlanId) {
    return null
  }

  return `/app/fix-plans/${fixPlanId}`
}

export function getFallbackFixPlanHref() {
  const firstPlan = getAllMockFixPlans()[0]
  return `/app/fix-plans/${firstPlan.id}`
}
