# SilentLeak Auth Email Templates

Production-ready HTML templates for Supabase Auth. Paste each file's contents into the corresponding template in the Supabase dashboard.

## Supabase dashboard path

Authentication > Email Templates > (select template)

## Template mapping

| File | Supabase template |
|---|---|
| `magic-link.html` | Magic Link |
| `confirm-signup.html` | Confirm signup |
| `invite-user.html` | Invite user |
| `change-email.html` | Change Email Address |
| `reset-password.html` | Reset Password |
| `reauthentication.html` | Reauthentication |

## Supabase variables used

| Variable | Used in |
|---|---|
| `{{ .ConfirmationURL }}` | magic-link, confirm-signup, invite-user, change-email, reset-password |
| `{{ .NewEmail }}` | change-email |
| `{{ .Token }}` | reauthentication (6-digit OTP) |

## Notes

- Do not attempt to auto-configure these via the Supabase API. Paste them manually.
- The templates use the SilentLeak production palette: `#060708`, `#0B0F12`, `#1B2024`, `#D99235`, `#F2B45A`, `#F5F2EA`, and `#8B949E`.
- Layout is table-based with inline colors for Gmail, Outlook, Apple Mail, and clients that force light or dark mode.
- Footer contact is `hello@silentleak.com`.
