import type {
  Issue,
  IssueEvent,
  OrgMember,
  Organization,
  Report,
  Scan,
  Store,
  StoreIntegration,
  Subscription,
} from "@/types/domain"

import type {
  IssueEventRow,
  IssueRow,
  OrgMemberRow,
  OrganizationRow,
  ReportRow,
  ScanRow,
  StoreIntegrationRow,
  StoreRow,
  SubscriptionRow,
} from "./database-models"

export function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }
}

export function mapOrgMemberRow(row: OrgMemberRow): OrgMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role as OrgMember["role"],
    createdAt: row.created_at,
  }
}

export function mapStoreRow(row: StoreRow): Store {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    platform: row.platform as Store["platform"],
    domain: row.domain,
    timezone: row.timezone,
    currency: row.currency,
    active: row.active,
    createdAt: row.created_at,
  }
}

export function mapStoreIntegrationRow(row: StoreIntegrationRow): StoreIntegration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    storeId: row.store_id,
    provider: row.provider as StoreIntegration["provider"],
    status: row.status as StoreIntegration["status"],
    accountIdentifier: row.account_identifier,
    shopDomain: row.shop_domain,
    installedAt: row.installed_at,
    syncStatus: row.sync_status as StoreIntegration["syncStatus"],
    connectionHealth: row.connection_health as StoreIntegration["connectionHealth"],
    lastSyncedAt: row.last_synced_at,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  }
}

export function mapScanRow(row: ScanRow): Scan {
  return {
    id: row.id,
    organizationId: row.organization_id,
    storeId: row.store_id,
    status: row.status as Scan["status"],
    scannedAt: row.scanned_at,
    completedAt: row.completed_at,
    detectedIssuesCount: row.detected_issues_count,
    estimatedMonthlyLeakage: row.estimated_monthly_leakage,
    errorMessage: row.error_message ?? null,
  }
}

export function mapIssueRow(row: IssueRow): Issue {
  return {
    id: row.id,
    organizationId: row.organization_id,
    storeId: row.store_id,
    scanId: row.scan_id,
    title: row.title,
    summary: row.summary,
    type: row.type as Issue["type"],
    severity: row.severity as Issue["severity"],
    status: row.status as Issue["status"],
    estimatedMonthlyRevenueImpact: row.estimated_monthly_revenue_impact,
    recommendedAction: row.recommended_action,
    source: row.source,
    detectedAt: row.detected_at,
    whyItMatters: row.why_it_matters,
  }
}

export function mapIssueEventRow(row: IssueEventRow): IssueEvent {
  return {
    id: row.id,
    issueId: row.issue_id,
    eventType: row.event_type as IssueEvent["eventType"],
    eventSummary: row.event_summary,
    createdAt: row.created_at,
  }
}

export function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,
    organizationId: row.organization_id,
    storeId: row.store_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    estimatedRecoveredRevenue: row.estimated_recovered_revenue,
    estimatedLeakage: row.estimated_leakage,
    issueCount: row.issue_count,
    generatedAt: row.generated_at,
  }
}

export function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    organizationId: row.organization_id,
    plan: row.plan as Subscription["plan"],
    status: row.status as Subscription["status"],
    seats: row.seats,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    dodoCustomerId: row.dodo_customer_id,
    dodoSubscriptionId: row.dodo_subscription_id,
    createdAt: row.created_at,
  }
}
