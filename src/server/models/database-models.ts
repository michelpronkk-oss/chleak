import type { Database } from "@/types/database"

type PublicTables = Database["public"]["Tables"]

type Row<TTable extends keyof PublicTables> = PublicTables[TTable]["Row"]
type Insert<TTable extends keyof PublicTables> = PublicTables[TTable]["Insert"]
type Update<TTable extends keyof PublicTables> = PublicTables[TTable]["Update"]

export type OrganizationRow = Row<"organizations">
export type OrganizationInsert = Insert<"organizations">
export type OrganizationUpdate = Update<"organizations">

export type OrgMemberRow = Row<"org_members">
export type OrgMemberInsert = Insert<"org_members">
export type OrgMemberUpdate = Update<"org_members">

export type StoreRow = Row<"stores">
export type StoreInsert = Insert<"stores">
export type StoreUpdate = Update<"stores">

export type StoreIntegrationRow = Row<"store_integrations">
export type StoreIntegrationInsert = Insert<"store_integrations">
export type StoreIntegrationUpdate = Update<"store_integrations">

export type ScanRow = Row<"scans">
export type ScanInsert = Insert<"scans">
export type ScanUpdate = Update<"scans">

export type IssueRow = Row<"issues">
export type IssueInsert = Insert<"issues">
export type IssueUpdate = Update<"issues">

export type IssueEventRow = Row<"issue_events">
export type IssueEventInsert = Insert<"issue_events">
export type IssueEventUpdate = Update<"issue_events">

export type ReportRow = Row<"reports">
export type ReportInsert = Insert<"reports">
export type ReportUpdate = Update<"reports">

export type SubscriptionRow = Row<"subscriptions">
export type SubscriptionInsert = Insert<"subscriptions">
export type SubscriptionUpdate = Update<"subscriptions">
