import { Resend } from "resend"

import {
  buildAccessApprovalTemplate,
  buildIssueDetectedTemplate,
  buildWeeklySummaryTemplate,
  type AccessApprovalTemplateInput,
  type IssueDetectedTemplateInput,
  type WeeklySummaryTemplateInput,
} from "./templates"

interface SendEmailBaseInput {
  to: string
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

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

interface SendAccessApprovalEmailInput extends SendEmailBaseInput, AccessApprovalTemplateInput {}

export async function sendAccessApprovalEmail(input: SendAccessApprovalEmailInput) {
  const template = buildAccessApprovalTemplate(input)
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
