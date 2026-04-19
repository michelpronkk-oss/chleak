export interface RequestReceivedTemplateInput {
  fullName: string
}

export function buildRequestReceivedTemplate(input: RequestReceivedTemplateInput) {
  const subject = "Your CheckoutLeak request has been received."
  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#e2e8f0;background:#0f1117;line-height:1.6">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5eead4;opacity:0.7">CheckoutLeak</p>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f1f5f9">Request received.</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">Hi ${input.fullName},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">We have your application on file. Every submission is reviewed manually before access is granted.</p>
      <p style="margin:0 0 32px;font-size:14px;color:#94a3b8">If your application is a fit, we will reach out directly using this email address. No action is required from you at this stage.</p>
      <p style="margin:32px 0 0;font-size:12px;color:#475569">If you submitted this in error or have a question, reply to this email.</p>
      <p style="margin:24px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#334155">Reviewed manually. Invite-only.</p>
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
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">Your request has been reviewed. Access has been granted.</p>
      <p style="margin:0 0 32px;font-size:14px;color:#94a3b8">Sign in with the email address you applied with to enter your workspace: <span style="color:#e2e8f0">${input.email}</span></p>
      <a href="${input.signInUrl}" style="display:inline-block;background:#5eead4;color:#0f1117;font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">Enter workspace</a>
      <p style="margin:32px 0 0;font-size:12px;color:#475569">If you have questions, reply to this email.</p>
      <p style="margin:24px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#334155">Reviewed manually. Invite-only.</p>
    </div>
  `
  return { subject, html }
}

export interface IssueDetectedTemplateInput {
  organizationName: string
  issueTitle: string
  impactEstimate: number
  recommendedAction: string
  dashboardUrl: string
}

export function buildIssueDetectedTemplate(input: IssueDetectedTemplateInput) {
  const subject = `CheckoutLeak issue detected: ${input.issueTitle}`
  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#e2e8f0;background:#0f1117;line-height:1.6">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5eead4;opacity:0.7">CheckoutLeak</p>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f1f5f9">Issue detected.</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#94a3b8"><span style="color:#e2e8f0">${input.organizationName}</span> has a new issue requiring attention.</p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Issue</p>
      <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0">${input.issueTitle}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Estimated monthly impact</p>
      <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0">$${input.impactEstimate.toLocaleString()}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Recommended action</p>
      <p style="margin:0 0 32px;font-size:14px;color:#94a3b8">${input.recommendedAction}</p>
      <a href="${input.dashboardUrl}" style="display:inline-block;background:#5eead4;color:#0f1117;font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">Review in dashboard</a>
      <p style="margin:24px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#334155">CheckoutLeak</p>
    </div>
  `
  return { subject, html }
}

export interface WeeklySummaryTemplateInput {
  organizationName: string
  estimatedMonthlyLeakage: number
  activeIssues: number
  newlyDetectedIssues: number
  recoveredRevenue: number
  dashboardUrl: string
}

export function buildWeeklySummaryTemplate(input: WeeklySummaryTemplateInput) {
  const subject = `CheckoutLeak weekly summary: ${input.organizationName}`
  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#e2e8f0;background:#0f1117;line-height:1.6">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5eead4;opacity:0.7">CheckoutLeak</p>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f1f5f9">Weekly summary.</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8"><span style="color:#e2e8f0">${input.organizationName}</span></p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 32px">
        <tr style="border-bottom:1px solid #1e293b">
          <td style="padding:10px 0;font-size:13px;color:#64748b">Estimated monthly leakage</td>
          <td style="padding:10px 0;font-size:13px;color:#e2e8f0;text-align:right">$${input.estimatedMonthlyLeakage.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid #1e293b">
          <td style="padding:10px 0;font-size:13px;color:#64748b">Active issues</td>
          <td style="padding:10px 0;font-size:13px;color:#e2e8f0;text-align:right">${input.activeIssues}</td>
        </tr>
        <tr style="border-bottom:1px solid #1e293b">
          <td style="padding:10px 0;font-size:13px;color:#64748b">New this week</td>
          <td style="padding:10px 0;font-size:13px;color:#e2e8f0;text-align:right">${input.newlyDetectedIssues}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:#64748b">Estimated recovered</td>
          <td style="padding:10px 0;font-size:13px;color:#e2e8f0;text-align:right">$${input.recoveredRevenue.toLocaleString()}</td>
        </tr>
      </table>
      <a href="${input.dashboardUrl}" style="display:inline-block;background:#5eead4;color:#0f1117;font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">Open dashboard</a>
      <p style="margin:24px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#334155">CheckoutLeak</p>
    </div>
  `
  return { subject, html }
}
