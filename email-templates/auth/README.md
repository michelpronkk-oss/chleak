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
- The amber accent color (`#c89a10`) approximates the SilentLeak signal token (`oklch(0.78 0.13 75)`).
- Dark backgrounds use `#0b0e16` (outer) and `#111624` (card) to match the app surface palette.
- All colors are inline for maximum email client compatibility.
