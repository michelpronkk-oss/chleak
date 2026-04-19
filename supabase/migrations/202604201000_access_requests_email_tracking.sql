alter table public.access_requests
  add column if not exists request_received_email_sent_at timestamptz;

comment on column public.access_requests.request_received_email_sent_at is 'Timestamp when the request-received confirmation email was sent. Null means not yet sent.';
