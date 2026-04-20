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
<body style="margin:0;padding:0;background-color:#080b12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#080b12">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

        <!-- Wordmark -->
        <tr>
          <td style="padding:0 0 20px 0;">
            <p style="margin:0;font-family:monospace;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#3a4a6a;">CHECKOUTLEAK</p>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#0f1420;border:1px solid #1a2438;border-radius:14px;overflow:hidden;">

            <!-- Amber top accent -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="height:2px;background:linear-gradient(to right,#0f1420 0%,#b8860b 40%,#c89a10 50%,#b8860b 60%,#0f1420 100%);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:32px 36px 36px;">
                  <p style="margin:0 0 22px 0;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c89a10;">Request received</p>
                  <h1 style="margin:0 0 20px 0;font-size:21px;font-weight:600;letter-spacing:-0.025em;line-height:1.25;color:#dde3f0;">Your request is on file.</h1>
                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.78;color:#5a6a88;">Hi ${input.fullName},</p>
                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.78;color:#5a6a88;">Every submission is reviewed manually before access is granted. No automated queue, no auto-approvals. A real person reads every request.</p>
                  <p style="margin:0 0 0 0;font-size:14px;line-height:1.78;color:#5a6a88;">If your application is a fit, we will reach out directly at this address. No action is needed from you at this stage.</p>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                    <tr><td style="height:1px;background-color:#1a2438;font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>

                  <!-- Status badge -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                    <tr>
                      <td style="background-color:#0d1120;border:1px solid #1a2438;border-radius:6px;padding:10px 14px;">
                        <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#3a4a6a;">Status</p>
                        <p style="margin:5px 0 0;font-size:13px;font-weight:500;color:#c89a10;">Under review</p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 0;font-size:12px;line-height:1.65;color:#2e3d58;">Questions? Reply to this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 4px 0;">
            <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#1e2a40;">Reviewed manually &middot; invite-only &middot; checkoutleak.com</p>
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
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6c7898;">We reviewed your request and it's not a fit for early access at this time. This is not a reflection of your business. We are onboarding a narrow set of operators in this phase.</p>
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
