alter table public.scans
  add column if not exists notification_requested boolean not null default false,
  add column if not exists notification_reason text,
  add column if not exists notification_recipient_email text,
  add column if not exists notification_sent_at timestamptz,
  add column if not exists notification_status text,
  add column if not exists notification_error text;

create index if not exists scans_notification_requested_idx
  on public.scans (organization_id, notification_requested, notification_sent_at)
  where notification_requested = true;
