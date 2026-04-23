import type { SupabaseClient } from "@supabase/supabase-js"

import { getMockDashboardSnapshot } from "@/data/mock/dashboard"
import {
  formatLeakFamilyLabel,
  summarizeIssueImpactByLeakFamily,
} from "@/lib/revenue-flow-taxonomy"
import type { Database } from "@/types/database"
import type {
  DashboardSnapshot,
  Issue,
  Organization,
  RevenueOpportunity,
  Scan,
  Store,
  SuggestedAction,
} from "@/types/domain"

import { mapIssueRow, mapOrganizationRow, mapScanRow, mapStoreRow } from "../models/mappers"

export interface DashboardRepository {
  getDashboardSnapshot(organizationId: string): Promise<DashboardSnapshot>
}

export class MockDashboardRepository implements DashboardRepository {
  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    return getMockDashboardSnapshot()
  }
}

function buildRevenueOpportunities(issues: Issue[]): RevenueOpportunity[] {
  return summarizeIssueImpactByLeakFamily(issues)
    .map(([family, estimatedMonthlyRevenueImpact]) => {
      const confidence: RevenueOpportunity["confidence"] =
        estimatedMonthlyRevenueImpact > 20000 ? "high" : "medium"

      return {
        label: formatLeakFamilyLabel(family),
        estimatedMonthlyRevenueImpact,
        confidence,
      }
    })
    .sort(
      (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
    )
}

function buildSuggestedActions(issues: Issue[]): SuggestedAction[] {
  return issues
    .slice(0, 3)
    .map((issue, index) => ({
      id: `action_${index + 1}`,
      title: issue.recommendedAction,
      description: issue.summary,
      issueIds: [issue.id],
      estimatedMonthlyRevenueImpact: issue.estimatedMonthlyRevenueImpact,
      urgency:
        issue.severity === "critical"
          ? "do_now"
          : issue.severity === "high"
            ? "this_week"
            : "watch",
    }))
}

function pickHighestImpactIssue(issues: Issue[]) {
  return [...issues].sort(
    (a, b) => b.estimatedMonthlyRevenueImpact - a.estimatedMonthlyRevenueImpact
  )[0]
}

function buildFallbackSnapshot({
  organizationId,
  organization,
  stores,
  scans,
  issues,
}: {
  organizationId: string
  organization: Organization | null
  stores: Store[]
  scans: Scan[]
  issues: Issue[]
}): DashboardSnapshot {
  const activeIssues = issues.filter((issue) => issue.status !== "resolved")
  const highestImpactIssue = pickHighestImpactIssue(activeIssues) ?? issues[0]

  return {
    organization: organization ?? {
      id: organizationId,
      name: "Untitled Organization",
      slug: organizationId,
      createdAt: new Date(0).toISOString(),
    },
    stores,
    scans,
    issues,
    summary: {
      estimatedMonthlyLeakage: activeIssues.reduce(
        (total, issue) => total + issue.estimatedMonthlyRevenueImpact,
        0
      ),
      activeIssues: activeIssues.length,
      highestImpactIssue:
        highestImpactIssue ??
        ({
          id: "placeholder_issue",
          organizationId,
          storeId: stores[0]?.id ?? "placeholder_store",
          scanId: scans[0]?.id ?? "placeholder_scan",
          title: "No issues detected yet",
          summary: "Run your first scan to see potential leaks.",
          type: "setup_gap",
          severity: "low",
          status: "monitoring",
          estimatedMonthlyRevenueImpact: 0,
          recommendedAction: "Connect stores and trigger first scan.",
          source: "system",
          detectedAt: new Date().toISOString(),
          whyItMatters: "Baseline scan is required to detect opportunities.",
        } as Issue),
      monitoredStores: stores.length,
    },
    revenueOpportunities: buildRevenueOpportunities(activeIssues),
    suggestedActions: buildSuggestedActions(activeIssues),
  }
}

export class SupabaseDashboardRepository implements DashboardRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getDashboardSnapshot(organizationId: string): Promise<DashboardSnapshot> {
    const [organizationResponse, storesResponse, scansResponse, issuesResponse] =
      await Promise.all([
        this.supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationId)
          .maybeSingle(),
        this.supabase
          .from("stores")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: true }),
        this.supabase
          .from("scans")
          .select("*")
          .eq("organization_id", organizationId)
          .order("scanned_at", { ascending: false })
          .limit(8),
        this.supabase
          .from("issues")
          .select("*")
          .eq("organization_id", organizationId)
          .order("detected_at", { ascending: false })
          .limit(20),
      ])

    const organization = organizationResponse.data
      ? mapOrganizationRow(organizationResponse.data)
      : null
    const stores = (storesResponse.data ?? []).map(mapStoreRow)
    const scans = (scansResponse.data ?? []).map(mapScanRow)
    const issues = (issuesResponse.data ?? []).map(mapIssueRow)

    return buildFallbackSnapshot({
      organizationId,
      organization,
      stores,
      scans,
      issues,
    })
  }
}
