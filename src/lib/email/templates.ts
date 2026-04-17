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
