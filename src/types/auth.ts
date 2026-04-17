export interface SessionUser {
  id: string
  email: string | null
  fullName: string | null
  timezone: string | null
}

export interface SessionOrganizationMembership {
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: "owner" | "admin" | "analyst" | "viewer"
}

export interface AppSession {
  user: SessionUser
  membership: SessionOrganizationMembership | null
}
