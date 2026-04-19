alter table public.access_requests
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approval_email_sent_at timestamptz;

comment on column public.access_requests.approved_by is 'Free-text identifier of who approved (email or user id)';
