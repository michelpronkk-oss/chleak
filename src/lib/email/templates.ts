const supportEmail = "hello@silentleak.com"

const colors = {
  background: "#060708",
  surface: "#0B0F12",
  border: "#1B2024",
  amber: "#D99235",
  amberSoft: "#F2B45A",
  text: "#F5F2EA",
  muted: "#8B949E",
  subdued: "#69727C",
  darkText: "#060708",
}

export interface RequestReceivedTemplateInput {
  fullName: string
}

export interface AccessApprovalTemplateInput {
  fullName: string
  email: string
  signInUrl: string
}

export interface AccessRejectionTemplateInput {
  fullName: string
}

export interface IssueDetectedTemplateInput {
  organizationName: string
  issueTitle: string
  impactEstimate: number
  recommendedAction: string
  dashboardUrl: string
}

export interface ScanCompletionTemplateInput {
  sourceLabel: string
  workspaceName: string
  resultKind: "issues_found" | "clean" | "failed"
  detectedIssuesCount: number
  criticalIssuesCount: number
  estimatedMonthlyLeakage: number
  topIssueTitle?: string | null
  topIssueEstimatedImpact?: number | null
  isScheduledMonitoring?: boolean
  scanFamilyLabel: string
  appUrl: string
}

export interface WeeklySummaryTemplateInput {
  organizationName: string
  estimatedMonthlyLeakage: number
  activeIssues: number
  newlyDetectedIssues: number
  recoveredRevenue: number
  dashboardUrl: string
}

type MetricRow = {
  label: string
  value: string | number
  accent?: boolean
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`
}

function paragraph(text: string) {
  return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.72;color:${colors.muted};">${text}</p>`
}

function divider(margin = "24px 0") {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};"><tr><td style="height:1px;background-color:${colors.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}

function ctaButton(label: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation">
  <tr>
    <td bgcolor="${colors.amber}" style="border-radius:8px;background-color:${colors.amber};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-size:13px;font-weight:700;color:${colors.darkText};text-decoration:none;letter-spacing:0.01em;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`
}

function metricTable(rows: MetricRow[]) {
  const rowHtml = rows
    .map((row, index) => {
      const isLast = index === rows.length - 1
      const border = isLast ? "" : `border-bottom:1px solid ${colors.border};`
      const valueColor = row.accent ? colors.amberSoft : colors.text
      return `<tr>
        <td style="padding:11px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;line-height:1.35;letter-spacing:0.08em;text-transform:uppercase;color:${colors.subdued};${border}">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:11px 0;font-size:13px;line-height:1.45;color:${valueColor};${border}">${escapeHtml(String(row.value))}</td>
      </tr>`
    })
    .join("")

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px 0;">${rowHtml}</table>`
}

function statusBadge(label: string, value: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:20px;">
  <tr>
    <td bgcolor="${colors.background}" style="background-color:${colors.background};border:1px solid ${colors.border};border-radius:8px;padding:12px 16px;">
      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;line-height:1.3;letter-spacing:0.1em;text-transform:uppercase;color:${colors.subdued};">${label}</p>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.35;font-weight:700;color:${colors.amberSoft};">${value}</p>
    </td>
  </tr>
</table>`
}

function emailShell(input: {
  subject: string
  eyebrow: string
  headline: string
  bodyHtml: string
  ctaHtml?: string
  prefooter?: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${escapeHtml(input.subject)}</title>
<style type="text/css">
  body, table, td, p, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  @media only screen and (max-width: 600px) {
    .sl-outer { padding: 28px 14px !important; }
    .sl-card { padding: 28px 22px 30px !important; }
    .sl-footer { padding-left: 8px !important; padding-right: 8px !important; }
    .sl-heading { font-size: 21px !important; line-height: 1.24 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${colors.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${colors.text};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.background}" role="presentation">
  <tr>
    <td class="sl-outer" align="center" style="padding:48px 20px;background-color:${colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:520px;">
        <tr>
          <td style="padding:0 0 18px 2px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="width:22px;padding-right:10px;">
                  <img src="https://checkoutleak.com/brand/silentleak/silentleak-icon.svg" width="18" height="18" alt="" style="display:block;width:18px;height:18px;border:0;outline:none;text-decoration:none;">
                </td>
                <td>
                  <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.2;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${colors.text};">Silent<span style="color:${colors.muted};">Leak</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="${colors.surface}" style="background-color:${colors.surface};border:1px solid ${colors.border};border-radius:14px;overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr><td style="height:2px;background-color:${colors.amber};font-size:0;line-height:0;">&nbsp;</td></tr>
              <tr>
                <td class="sl-card" style="padding:34px 38px 38px;background-color:${colors.surface};">
                  <p style="margin:0 0 12px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;line-height:1.35;letter-spacing:0.12em;text-transform:uppercase;color:${colors.amberSoft};">${escapeHtml(input.eyebrow)}</p>
                  <h1 class="sl-heading" style="margin:0 0 18px 0;font-size:23px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;color:${colors.text};">${escapeHtml(input.headline)}</h1>
                  ${input.bodyHtml}
                  ${input.ctaHtml ? `<div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>${input.ctaHtml}` : ""}
                  ${input.prefooter ?? ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="sl-footer" style="padding:18px 4px 0;">
            <p style="margin:0 0 5px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;line-height:1.45;letter-spacing:0.08em;text-transform:uppercase;color:${colors.subdued};">Revenue leak monitoring / SilentLeak</p>
            <p style="margin:0;font-size:12px;line-height:1.55;color:${colors.subdued};">Questions? Contact <a href="mailto:${supportEmail}" style="color:${colors.amberSoft};text-decoration:none;">${supportEmail}</a>.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function buildRequestReceivedTemplate(input: RequestReceivedTemplateInput) {
  const subject = "Your SilentLeak request has been received."
  const fullName = escapeHtml(input.fullName)
  const html = emailShell({
    subject,
    eyebrow: "Request received",
    headline: "Your request is on file.",
    bodyHtml: [
      paragraph(`Hi ${fullName},`),
      paragraph("Every submission is reviewed manually before access is granted. No automated queue, no auto-approvals. A real person reads every request."),
      paragraph("If your application is a fit, we will reach out directly at this address. No action is needed from you at this stage."),
      divider("26px 0 0"),
      statusBadge("Status", "Under review"),
    ].join(""),
  })
  return { subject, html }
}

export function buildAccessApprovalTemplate(input: AccessApprovalTemplateInput) {
  const subject = "Your SilentLeak access has been approved."
  const fullName = escapeHtml(input.fullName)
  const approvedEmail = escapeHtml(input.email)
  const html = emailShell({
    subject,
    eyebrow: "Access granted",
    headline: "Your workspace is ready.",
    bodyHtml: [
      paragraph(`Hi ${fullName}, your request has been reviewed and access has been granted. Sign in with your approved email address to enter the workspace.`),
      metricTable([{ label: "Approved email", value: approvedEmail }]),
    ].join(""),
    ctaHtml: ctaButton("Enter workspace", input.signInUrl),
  })
  return { subject, html }
}

export function buildAccessRejectionTemplate(input: AccessRejectionTemplateInput) {
  const subject = "Your SilentLeak access request."
  const fullName = escapeHtml(input.fullName)
  const html = emailShell({
    subject,
    eyebrow: "Access review complete",
    headline: "We're not moving forward.",
    bodyHtml: [
      paragraph(`Hi ${fullName},`),
      paragraph("We reviewed your request and it is not a fit for early access at this time. This is not a reflection of your business. We are onboarding a narrow set of operators in this phase."),
      paragraph("You are welcome to reapply if your situation changes or when we open broader access."),
    ].join(""),
  })
  return { subject, html }
}

export function buildIssueDetectedTemplate(input: IssueDetectedTemplateInput) {
  const subject = `SilentLeak issue detected: ${input.issueTitle}`
  const html = emailShell({
    subject,
    eyebrow: "Issue detected",
    headline: input.issueTitle,
    bodyHtml: [
      metricTable([
        { label: "Workspace", value: input.organizationName },
        { label: "Est. monthly impact", value: formatMoney(input.impactEstimate), accent: true },
      ]),
      `<p style="margin:0 0 8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;line-height:1.35;letter-spacing:0.08em;text-transform:uppercase;color:${colors.subdued};">Recommended action</p>`,
      paragraph(escapeHtml(input.recommendedAction)),
    ].join(""),
    ctaHtml: ctaButton("Review in dashboard", input.dashboardUrl),
  })
  return { subject, html }
}

export function buildScanCompletionTemplate(input: ScanCompletionTemplateInput) {
  const topIssueImpact =
    input.topIssueEstimatedImpact !== null &&
    input.topIssueEstimatedImpact !== undefined
      ? formatMoney(input.topIssueEstimatedImpact)
      : null
  const subject =
    input.resultKind === "issues_found"
      ? `SilentLeak found ${input.detectedIssuesCount} ${input.detectedIssuesCount === 1 ? "issue" : "issues"} on ${input.sourceLabel}`
      : input.resultKind === "failed"
        ? `SilentLeak scan needs attention for ${input.sourceLabel}`
        : "Your SilentLeak analysis is ready"
  const eyebrow =
    input.resultKind === "issues_found"
      ? "Scan complete"
      : input.resultKind === "failed"
        ? "Scan needs attention"
        : "Scan complete"
  const headline =
    input.resultKind === "issues_found"
      ? "New findings are ready."
      : input.resultKind === "failed"
        ? "The scan did not complete."
        : "No critical issues found."
  const body =
    input.resultKind === "issues_found"
      ? input.isScheduledMonitoring
        ? `SilentLeak is monitoring ${escapeHtml(input.sourceLabel)} automatically and found ${input.detectedIssuesCount} ${input.detectedIssuesCount === 1 ? "issue" : "issues"}. Review the evidence and ranked next step in the source detail.`
        : `SilentLeak found ${input.detectedIssuesCount} ${input.detectedIssuesCount === 1 ? "issue" : "issues"} on ${escapeHtml(input.sourceLabel)}. Review the evidence and ranked next step in the source detail.`
      : input.resultKind === "failed"
        ? `SilentLeak could not complete the latest scan for ${escapeHtml(input.sourceLabel)}. The source detail is ready for a retry when you are.`
        : `SilentLeak completed the latest scan for ${escapeHtml(input.sourceLabel)}. No critical issues were found, and the source remains in monitoring.`
  const impactLabel =
    input.resultKind === "issues_found"
      ? formatMoney(input.estimatedMonthlyLeakage)
      : input.resultKind === "failed"
        ? "Not scored"
        : "No new leakage"
  const rows: MetricRow[] = [
    { label: "Source", value: input.sourceLabel },
    { label: "Workspace", value: input.workspaceName },
    { label: "Scan family", value: input.scanFamilyLabel },
    { label: "Findings", value: input.detectedIssuesCount },
    { label: "Critical issues", value: input.criticalIssuesCount },
  ]

  if (input.topIssueTitle) {
    rows.push({
      label: "Top issue",
      value: `${input.topIssueTitle}${topIssueImpact ? ` (${topIssueImpact})` : ""}`,
    })
  }

  rows.push({ label: "Estimated leakage", value: impactLabel, accent: input.resultKind === "issues_found" })

  const html = emailShell({
    subject,
    eyebrow,
    headline,
    bodyHtml: [paragraph(body), metricTable(rows)].join(""),
    ctaHtml: ctaButton("Open source detail", input.appUrl),
  })

  return { subject, html }
}

export function buildWeeklySummaryTemplate(input: WeeklySummaryTemplateInput) {
  const subject = `SilentLeak weekly summary: ${input.organizationName}`
  const html = emailShell({
    subject,
    eyebrow: "Weekly summary",
    headline: input.organizationName,
    bodyHtml: metricTable([
      { label: "Est. monthly leakage", value: formatMoney(input.estimatedMonthlyLeakage), accent: true },
      { label: "Active issues", value: input.activeIssues },
      { label: "New this week", value: input.newlyDetectedIssues },
      { label: "Est. recovered", value: formatMoney(input.recoveredRevenue) },
    ]),
    ctaHtml: ctaButton("Open dashboard", input.dashboardUrl),
  })
  return { subject, html }
}
