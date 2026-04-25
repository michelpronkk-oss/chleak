import { createSupabaseAdminClient } from "@/lib/supabase/shared"

type AdminClient = ReturnType<typeof createSupabaseAdminClient>

export type SourceVerificationState = "verified" | "unverified" | "pending"
export type SourceVerificationReason =
  | "email_domain_match"
  | "connected_system_domain_match"
  | "manual_verified"
  | "dns_txt_verified"
  | "manual_unverified"

export interface SourceVerificationView {
  state: SourceVerificationState
  reason: SourceVerificationReason
  matchedDomain: string | null
  matchedSystem: "shopify" | "stripe" | null
}

export interface ConnectedSystemDomain {
  system: "shopify" | "stripe"
  domain: string
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

export function normalizeDomainLike(input: string | null | undefined) {
  if (!input) {
    return null
  }

  const trimmed = input.trim().toLowerCase()
  if (!trimmed) {
    return null
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "")
  const hostname = withoutProtocol.split("/")[0]?.split(":")[0] ?? withoutProtocol
  const withoutWww = hostname.startsWith("www.") ? hostname.slice(4) : hostname
  return withoutWww || null
}

function extractEmailDomain(input: string | null | undefined) {
  if (!input) {
    return null
  }

  const atIndex = input.lastIndexOf("@")
  if (atIndex < 0) {
    return null
  }

  return normalizeDomainLike(input.slice(atIndex + 1))
}

export function domainsMatch(left: string, right: string) {
  return (
    left === right ||
    left.endsWith(`.${right}`) ||
    right.endsWith(`.${left}`)
  )
}

function readManualVerification(metadataSources: unknown[]) {
  for (const source of metadataSources) {
    const metadata = asRecord(source)
    const verification = asRecord(metadata?.source_verification)
    const state = verification?.state
    const reason = verification?.reason

    if (state === "verified") {
      return {
        state,
        reason:
          reason === "dns_txt_verified"
            ? "dns_txt_verified"
            : "manual_verified",
      } as const
    }

    if (state === "pending") {
      return {
        state,
        reason:
          reason === "dns_txt_verified"
            ? "dns_txt_verified"
            : "manual_unverified",
      } as const
    }

    if (state === "unverified" && reason === "manual_unverified") {
      return {
        state,
        reason,
      } as const
    }
  }

  return null
}

export function deriveSourceVerification(input: {
  sourceDomain: string | null | undefined
  operatorEmail?: string | null
  operatorEmails?: string[]
  connectedSystemDomains?: ConnectedSystemDomain[]
  metadataSources?: unknown[]
}): SourceVerificationView {
  const sourceDomain = normalizeDomainLike(input.sourceDomain)

  if (!sourceDomain) {
    return {
      state: "unverified",
      reason: "manual_unverified",
      matchedDomain: null,
      matchedSystem: null,
    }
  }

  const manual = readManualVerification(input.metadataSources ?? [])
  if (manual?.state === "verified") {
    return {
      state: "verified",
      reason: manual.reason,
      matchedDomain: sourceDomain,
      matchedSystem: null,
    }
  }
  if (manual?.state === "pending") {
    return {
      state: "pending",
      reason: manual.reason,
      matchedDomain: null,
      matchedSystem: null,
    }
  }

  const emailDomains = [
    extractEmailDomain(input.operatorEmail),
    ...(input.operatorEmails ?? []).map(extractEmailDomain),
  ].filter((domain): domain is string => Boolean(domain))

  const matchedEmailDomain = emailDomains.find((domain) =>
    domainsMatch(sourceDomain, domain)
  )
  if (matchedEmailDomain) {
    return {
      state: "verified",
      reason: "email_domain_match",
      matchedDomain: matchedEmailDomain,
      matchedSystem: null,
    }
  }

  for (const candidate of input.connectedSystemDomains ?? []) {
    const normalizedCandidate = normalizeDomainLike(candidate.domain)
    if (!normalizedCandidate) {
      continue
    }
    if (domainsMatch(sourceDomain, normalizedCandidate)) {
      return {
        state: "verified",
        reason: "connected_system_domain_match",
        matchedDomain: normalizedCandidate,
        matchedSystem: candidate.system,
      }
    }
  }

  return {
    state: "unverified",
    reason: "manual_unverified",
    matchedDomain: null,
    matchedSystem: null,
  }
}

export async function loadOrganizationOperatorEmails(input: {
  admin: AdminClient
  organizationId: string
}) {
  const membersResult = await input.admin
    .from("org_members")
    .select("user_id, role")
    .eq("organization_id", input.organizationId)
    .in("role", ["owner", "admin"])
    .limit(10)

  if (membersResult.error) {
    return []
  }

  const emails: string[] = []
  for (const member of membersResult.data ?? []) {
    const userResult = await input.admin.auth.admin.getUserById(member.user_id)
    const email = userResult.data.user?.email?.trim().toLowerCase()
    if (email) {
      emails.push(email)
    }
  }

  return emails
}

export async function loadConnectedSystemDomains(input: {
  admin: AdminClient
  organizationId: string
  excludeStoreId?: string | null
}): Promise<ConnectedSystemDomain[]> {
  const [storesResult, integrationsResult] = await Promise.all([
    input.admin
      .from("stores")
      .select("id, platform, domain")
      .eq("organization_id", input.organizationId)
      .in("platform", ["shopify", "stripe"]),
    input.admin
      .from("store_integrations")
      .select("store_id, provider, shop_domain, account_identifier")
      .eq("organization_id", input.organizationId)
      .in("provider", ["shopify", "stripe"])
      .neq("status", "disconnected"),
  ])

  const domains: ConnectedSystemDomain[] = []

  if (!storesResult.error) {
    for (const store of storesResult.data ?? []) {
      if (store.id === input.excludeStoreId || !store.domain) {
        continue
      }
      if (store.platform === "shopify" || store.platform === "stripe") {
        domains.push({ system: store.platform, domain: store.domain })
      }
    }
  }

  if (!integrationsResult.error) {
    for (const integration of integrationsResult.data ?? []) {
      if (integration.store_id === input.excludeStoreId) {
        continue
      }
      if (integration.provider !== "shopify" && integration.provider !== "stripe") {
        continue
      }
      if (integration.shop_domain) {
        domains.push({
          system: integration.provider,
          domain: integration.shop_domain,
        })
      }
      if (
        integration.account_identifier &&
        integration.account_identifier.includes(".")
      ) {
        domains.push({
          system: integration.provider,
          domain: integration.account_identifier,
        })
      }
    }
  }

  return domains
}

export async function resolveStoreSourceVerification(input: {
  admin: AdminClient
  organizationId: string
  storeId: string
  operatorEmail?: string | null
  includeOrganizationOperators?: boolean
}) {
  const [storeResult, integrationsResult] = await Promise.all([
    input.admin
      .from("stores")
      .select("id, platform, domain")
      .eq("id", input.storeId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    input.admin
      .from("store_integrations")
      .select("metadata, provider, shop_domain, account_identifier")
      .eq("organization_id", input.organizationId)
      .eq("store_id", input.storeId)
      .neq("status", "disconnected"),
  ])

  const store = storeResult.data
  const metadataSources = (integrationsResult.data ?? []).map((row) => row.metadata)
  const sourceDomain =
    store?.domain ??
    (integrationsResult.data ?? []).find((row) => row.shop_domain)?.shop_domain ??
    null
  const connectedSystemDomains = await loadConnectedSystemDomains({
    admin: input.admin,
    organizationId: input.organizationId,
    excludeStoreId: input.storeId,
  })

  for (const integration of integrationsResult.data ?? []) {
    if (integration.provider !== "shopify" && integration.provider !== "stripe") {
      continue
    }
    if (integration.shop_domain) {
      connectedSystemDomains.push({
        system: integration.provider,
        domain: integration.shop_domain,
      })
    }
    if (
      integration.account_identifier &&
      integration.account_identifier.includes(".")
    ) {
      connectedSystemDomains.push({
        system: integration.provider,
        domain: integration.account_identifier,
      })
    }
  }

  const operatorEmails = input.includeOrganizationOperators
    ? await loadOrganizationOperatorEmails({
        admin: input.admin,
        organizationId: input.organizationId,
      })
    : []

  return deriveSourceVerification({
    sourceDomain,
    operatorEmail: input.operatorEmail,
    operatorEmails,
    connectedSystemDomains,
    metadataSources,
  })
}
