export interface IssueDetectedTemplateInput {
  organizationName: string
  issueTitle: string
  impactEstimate: number
  recommendedAction: string
  dashboardUrl: string
}

export interface WeeklySummaryTemplateInput {
  organizationName: string
  estimatedMonthlyLeakage: number
  activeIssues: number
  newlyDetectedIssues: number
  recoveredRevenue: number
  dashboardUrl: string
}

export function buildIssueDetectedTemplate(input: IssueDetectedTemplateInput) {
  const subject = `CheckoutLeak issue detected: ${input.issueTitle}`
  const html = `
    <div style="font-family:'Sora',sans-serif;line-height:1.5;color:#111827">
      <h2>New Revenue Leak Detected</h2>
      <p><strong>${input.organizationName}</strong> has a new issue requiring attention.</p>
      <p><strong>Issue:</strong> ${input.issueTitle}</p>
      <p><strong>Estimated monthly impact:</strong> $${input.impactEstimate.toLocaleString()}</p>
      <p><strong>Recommended action:</strong> ${input.recommendedAction}</p>
      <p>Review in dashboard: <a href="${input.dashboardUrl}">${input.dashboardUrl}</a></p>
    </div>
  `

  return { subject, html }
}

export interface AccessApprovalTemplateInput {
  fullName: string
  email: string
  signInUrl: string
}

export function buildAccessApprovalTemplate(input: AccessApprovalTemplateInput) {
  const subject = "Your CheckoutLeak access has been approved."
  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#e2e8f0;background:#0f1117;line-height:1.6">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5eead4;opacity:0.7">CheckoutLeak</p>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f1f5f9">Access approved.</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">Hi ${input.fullName},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">Your request has been reviewed and approved. You can now enter your private workspace.</p>
      <p style="margin:0 0 32px;font-size:14px;color:#94a3b8">Sign in using the email address you applied with: <span style="color:#e2e8f0">${input.email}</span></p>
      <a href="${input.signInUrl}" style="display:inline-block;background:#5eead4;color:#0f1117;font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">Open workspace</a>
      <p style="margin:32px 0 0;font-size:12px;color:#475569">If you have questions, reply to this email. We will get back to you directly.</p>
      <p style="margin:24px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#334155">Invite-only - Reviewed manually</p>
    </div>
  `
  return { subject, html }
}

export function buildWeeklySummaryTemplate(input: WeeklySummaryTemplateInput) {
  const subject = `CheckoutLeak weekly summary for ${input.organizationName}`
  const html = `
    <div style="font-family:'Sora',sans-serif;line-height:1.5;color:#111827">
      <h2>Weekly Revenue Leakage Summary</h2>
      <p><strong>${input.organizationName}</strong> weekly highlights:</p>
      <ul>
        <li>Estimated monthly leakage: $${input.estimatedMonthlyLeakage.toLocaleString()}</li>
        <li>Active issues: ${input.activeIssues}</li>
        <li>New issues this week: ${input.newlyDetectedIssues}</li>
        <li>Estimated recovered revenue: $${input.recoveredRevenue.toLocaleString()}</li>
      </ul>
      <p>Full dashboard: <a href="${input.dashboardUrl}">${input.dashboardUrl}</a></p>
    </div>
  `

  return { subject, html }
}

