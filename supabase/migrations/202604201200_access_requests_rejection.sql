alter table public.access_requests
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_email_sent_at timestamptz;

comment on column public.access_requests.rejected_at is 'Timestamp when the request was rejected.';
comment on column public.access_requests.rejection_email_sent_at is 'Timestamp when the rejection email was sent. Null means not yet sent.';
