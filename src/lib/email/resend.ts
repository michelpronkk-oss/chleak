import { Resend } from "resend"

import {
  buildAccessApprovalTemplate,
  buildAccessRejectionTemplate,
  buildIssueDetectedTemplate,
  buildRequestReceivedTemplate,
  buildScanCompletionTemplate,
  buildWeeklySummaryTemplate,
  type AccessApprovalTemplateInput,
  type AccessRejectionTemplateInput,
  type IssueDetectedTemplateInput,
  type RequestReceivedTemplateInput,
  type ScanCompletionTemplateInput,
  type WeeklySummaryTemplateInput,
} from "./templates"

interface SendEmailBaseInput {
  to: string
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM

  return {
    apiKey,
    fromEmail,
    configured: Boolean(apiKey && fromEmail),
  }
}

async function sendEmail({
  to,
  subject,
  html,
}: SendEmailBaseInput & { subject: string; html: string }) {
  const config = getResendConfig()

  if (!config.configured) {
    return {
      status: "skipped" as const,
      reason: "Resend is not configured",
    }
  }

  const resend = new Resend(config.apiKey)

  const response = await resend.emails.send({
    from: config.fromEmail!,
    to,
    subject,
    html,
  })

  return {
    status: "sent" as const,
    id: response.data?.id ?? null,
  }
}

interface SendRequestReceivedEmailInput extends SendEmailBaseInput, RequestReceivedTemplateInput {}

export async function sendRequestReceivedEmail(input: SendRequestReceivedEmailInput) {
  const template = buildRequestReceivedTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

interface SendAccessApprovalEmailInput extends SendEmailBaseInput, AccessApprovalTemplateInput {}

export async function sendAccessApprovalEmail(input: SendAccessApprovalEmailInput) {
  const template = buildAccessApprovalTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

interface SendAccessRejectionEmailInput extends SendEmailBaseInput, AccessRejectionTemplateInput {}

export async function sendAccessRejectionEmail(input: SendAccessRejectionEmailInput) {
  const template = buildAccessRejectionTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

interface SendTransactionalIssueEmailInput
  extends SendEmailBaseInput,
    IssueDetectedTemplateInput {}

export async function sendTransactionalIssueDetectedEmail(
  input: SendTransactionalIssueEmailInput
) {
  const template = buildIssueDetectedTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

interface SendScanCompletionEmailInput
  extends SendEmailBaseInput,
    ScanCompletionTemplateInput {}

export async function sendScanCompletionEmail(input: SendScanCompletionEmailInput) {
  const template = buildScanCompletionTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

interface SendWeeklySummaryEmailInput
  extends SendEmailBaseInput,
    WeeklySummaryTemplateInput {}

export async function sendWeeklySummaryEmail(input: SendWeeklySummaryEmailInput) {
  const template = buildWeeklySummaryTemplate(input)
  return sendEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
  })
}

export async function sendVerificationRequestNotification(input: {
  sourceDomain: string
  sourceUrl: string | null
  storeName: string
  storeId: string
  organizationId: string
  userEmail: string
  requestedAt: string
}) {
  return sendEmail({
    to: "hello@silentleak.com",
    subject: `[SilentLeak] Verification request — ${input.sourceDomain}`,
    html: `
      <h2 style="font-family:sans-serif;font-size:18px;margin-bottom:16px;">Manual verification request</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 0;color:#666;width:160px">Source domain</td><td style="padding:6px 0;font-weight:600">${input.sourceDomain}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Source URL</td><td style="padding:6px 0">${input.sourceUrl ?? "not set"}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Store name</td><td style="padding:6px 0">${input.storeName}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Organization ID</td><td style="padding:6px 0;font-family:monospace">${input.organizationId}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Store ID</td><td style="padding:6px 0;font-family:monospace">${input.storeId}</td></tr>
        <tr><td style="padding:6px 0;color:#666">User email</td><td style="padding:6px 0">${input.userEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Requested at</td><td style="padding:6px 0">${input.requestedAt}</td></tr>
      </table>
      <p style="margin-top:20px;padding:12px;background:#f5f5f5;border-radius:6px;font-family:monospace;font-size:12px;color:#333">
        To approve: run this SQL in Supabase<br><br>
        UPDATE store_integrations<br>
        SET metadata = jsonb_set(metadata, '{source_verification}', '{"state":"verified","reason":"manual_verified"}')<br>
        WHERE store_id = '${input.storeId}'<br>
        AND provider = 'checkoutleak_connector';
      </p>
    `,
  })
}
