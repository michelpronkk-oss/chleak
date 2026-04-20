export interface RequestReceivedTemplateInput {
  fullName: string
}

export function buildRequestReceivedTemplate(input: RequestReceivedTemplateInput) {
  const subject = "Your CheckoutLeak request has been received."
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0e16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0e16">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="background-color:#111624;border:1px solid #1e2640;border-radius:16px;padding:36px 40px;">
            <p style="margin:0 0 28px 0;font-family:monospace;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#2e3a54;">CHECKOUTLEAK</p>
            <p style="margin:0 0 10px 0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">Request received</p>
            <h1 style="margin:0 0 14px 0;font-size:22px;font-weight:600;letter-spacing:-0.025em;line-height:1.2;color:#e8ecf4;">We have your application.</h1>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6c7898;">Hi ${input.fullName},</p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6c7898;">Your request is on file. Every submission is reviewed manually before access is granted — no automated queue, no auto-approvals.</p>
            <p style="margin:0 0 0 0;font-size:14px;line-height:1.75;color:#6c7898;">If your application is a fit, we will reach out directly at this email address. No action is required from you at this stage.</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr><td style="height:1px;background-color:#1e2640;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#3d4860;">If you submitted this in error or have a question, reply to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#222d44;">Reviewed manually / invite-only / checkoutleak.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
  return { subject, html }
}

export interface AccessApprovalTemplateInput {
  fullName: string
  email: string
  signInUrl: string
}

export function buildAccessApprovalTemplate(input: AccessApprovalTemplateInput) {
  const subject = "Your CheckoutLeak access has been approved."
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0e16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0e16">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="background-color:#111624;border:1px solid #1e2640;border-radius:16px;padding:36px 40px;">
            <p style="margin:0 0 28px 0;font-family:monospace;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#2e3a54;">CHECKOUTLEAK</p>
            <p style="margin:0 0 10px 0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">Access granted</p>
            <h1 style="margin:0 0 14px 0;font-size:22px;font-weight:600;letter-spacing:-0.025em;line-height:1.2;color:#e8ecf4;">Your workspace is ready.</h1>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.75;color:#6c7898;">Hi ${input.fullName}, your request has been reviewed and access has been granted. Sign in with your approved email address to enter the workspace.</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#0d1120;border:1px solid #1e2640;border-radius:8px;padding:12px 16px;">
                  <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;">Approved email</p>
                  <p style="margin:6px 0 0 0;font-size:14px;color:#e8ecf4;">${input.email}</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background-color:#c89a10;">
                  <a href="${input.signInUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:600;color:#0b0e16;text-decoration:none;letter-spacing:0.01em;border-radius:8px;">Enter workspace &rarr;</a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr><td style="height:1px;background-color:#1e2640;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#3d4860;">If you have questions or did not request this, reply to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#222d44;">Private access system / checkoutleak.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
  return { subject, html }
}

export interface AccessRejectionTemplateInput {
  fullName: string
}

export function buildAccessRejectionTemplate(input: AccessRejectionTemplateInput) {
  const subject = "Your CheckoutLeak access request."
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0e16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0e16">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="background-color:#111624;border:1px solid #1e2640;border-radius:16px;padding:36px 40px;">
            <p style="margin:0 0 28px 0;font-family:monospace;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#2e3a54;">CHECKOUTLEAK</p>
            <p style="margin:0 0 10px 0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">Access review complete</p>
            <h1 style="margin:0 0 14px 0;font-size:22px;font-weight:600;letter-spacing:-0.025em;line-height:1.2;color:#e8ecf4;">We're not moving forward.</h1>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6c7898;">Hi ${input.fullName},</p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6c7898;">We reviewed your request and it's not a fit for early access at this time. This is not a reflection of your business — we're onboarding a narrow set of operators in this phase.</p>
            <p style="margin:0 0 0 0;font-size:14px;line-height:1.75;color:#6c7898;">You're welcome to reapply if your situation changes or when we open broader access.</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr><td style="height:1px;background-color:#1e2640;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#3d4860;">If you believe this was an error or would like to provide additional context, reply to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#222d44;">Private access system / checkoutleak.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0e16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0e16">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="background-color:#111624;border:1px solid #1e2640;border-radius:16px;padding:36px 40px;">
            <p style="margin:0 0 28px 0;font-family:monospace;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#2e3a54;">CHECKOUTLEAK</p>
            <p style="margin:0 0 10px 0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">Issue detected</p>
            <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:600;letter-spacing:-0.025em;line-height:1.2;color:#e8ecf4;">${input.issueTitle}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;border-bottom:1px solid #1e2640;">Workspace</td>
                <td style="padding:10px 0;font-size:13px;color:#e8ecf4;text-align:right;border-bottom:1px solid #1e2640;">${input.organizationName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;border-bottom:1px solid #1e2640;">Est. monthly impact</td>
                <td style="padding:10px 0;font-size:13px;color:#c89a10;text-align:right;border-bottom:1px solid #1e2640;">$${input.impactEstimate.toLocaleString()}</td>
              </tr>
            </table>
            <p style="margin:0 0 8px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;">Recommended action</p>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.75;color:#6c7898;">${input.recommendedAction}</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background-color:#c89a10;">
                  <a href="${input.dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:600;color:#0b0e16;text-decoration:none;letter-spacing:0.01em;border-radius:8px;">Review in dashboard &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#222d44;">Private access system / checkoutleak.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0e16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0e16">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="background-color:#111624;border:1px solid #1e2640;border-radius:16px;padding:36px 40px;">
            <p style="margin:0 0 28px 0;font-family:monospace;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#2e3a54;">CHECKOUTLEAK</p>
            <p style="margin:0 0 10px 0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">Weekly summary</p>
            <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:600;letter-spacing:-0.025em;line-height:1.2;color:#e8ecf4;">${input.organizationName}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;border-bottom:1px solid #1e2640;">Est. monthly leakage</td>
                <td style="padding:10px 0;font-size:13px;color:#c89a10;text-align:right;border-bottom:1px solid #1e2640;">$${input.estimatedMonthlyLeakage.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;border-bottom:1px solid #1e2640;">Active issues</td>
                <td style="padding:10px 0;font-size:13px;color:#e8ecf4;text-align:right;border-bottom:1px solid #1e2640;">${input.activeIssues}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;border-bottom:1px solid #1e2640;">New this week</td>
                <td style="padding:10px 0;font-size:13px;color:#e8ecf4;text-align:right;border-bottom:1px solid #1e2640;">${input.newlyDetectedIssues}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#3d4860;">Est. recovered</td>
                <td style="padding:10px 0;font-size:13px;color:#e8ecf4;text-align:right;">$${input.recoveredRevenue.toLocaleString()}</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background-color:#c89a10;">
                  <a href="${input.dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:600;color:#0b0e16;text-decoration:none;letter-spacing:0.01em;border-radius:8px;">Open dashboard &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#222d44;">Private access system / checkoutleak.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
  return { subject, html }
}
