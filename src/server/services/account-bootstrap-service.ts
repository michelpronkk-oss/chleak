import { createSupabaseAdminClient } from "@/lib/supabase/shared"

type WorkspaceMembership = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: "owner" | "admin" | "analyst" | "viewer"
}

function toWorkspaceName(email: string | null, fullName: string | null) {
  if (fullName) {
    return `${fullName} Workspace`
  }

  if (!email) {
    return "CheckoutLeak Workspace"
  }

  const [localPart] = email.split("@")
  if (!localPart) {
    return "CheckoutLeak Workspace"
  }

  const cleaned = localPart
    .replaceAll(/[._-]+/g, " ")
    .trim()
    .slice(0, 42)
  const normalized =
    cleaned.length > 0
      ? cleaned
          .split(" ")
          .map((part) =>
            part.length > 0 ? `${part[0].toUpperCase()}${part.slice(1)}` : part
          )
          .join(" ")
      : "CheckoutLeak"

  return `${normalized} Workspace`
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 48)
}

async function createOrganizationWithUniqueSlug(input: {
  name: string
  preferredSlug: string
}) {
  const supabase = createSupabaseAdminClient()

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`
    const slug = `${input.preferredSlug}${suffix}`.slice(0, 56)
    const insertResult = await supabase
      .from("organizations")
      .insert({
        name: input.name,
        slug,
      })
      .select("id, name, slug")
      .single()

    if (!insertResult.error && insertResult.data) {
      return insertResult.data
    }

    if (!insertResult.error) {
      continue
    }

    if (!insertResult.error.message.toLowerCase().includes("duplicate")) {
      throw new Error("Failed to create organization for authenticated user.")
    }
  }

  throw new Error("Unable to allocate unique workspace slug.")
}

export async function ensureWorkspaceForUser(input: {
  userId: string
  email: string | null
  fullName: string | null
}): Promise<WorkspaceMembership> {
  const supabase = createSupabaseAdminClient()

  const existingMembershipResult = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingMembershipResult.error) {
    throw new Error("Failed to load organization membership.")
  }

  if (existingMembershipResult.data?.organization_id) {
    const organizationResult = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", existingMembershipResult.data.organization_id)
      .maybeSingle()

    if (organizationResult.error) {
      throw new Error("Failed to load organization.")
    }

    if (organizationResult.data) {
      return {
        organizationId: organizationResult.data.id,
        organizationName: organizationResult.data.name,
        organizationSlug: organizationResult.data.slug,
        role: existingMembershipResult.data.role as WorkspaceMembership["role"],
      }
    }
  }

  const workspaceName = toWorkspaceName(input.email, input.fullName)
  const preferredSlug = slugify(workspaceName) || `workspace-${input.userId.slice(0, 8)}`
  const organization = await createOrganizationWithUniqueSlug({
    name: workspaceName,
    preferredSlug,
  })

  const membershipInsert = await supabase.from("org_members").insert({
    organization_id: organization.id,
    user_id: input.userId,
    role: "owner",
  })

  if (membershipInsert.error) {
    throw new Error("Failed to create organization membership.")
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    role: "owner",
  }
}

