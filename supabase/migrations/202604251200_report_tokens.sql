-- Public report tokens for shareable scan reports.
-- Each token grants read-only, time-limited access to a single scan's findings.
-- Reports are public — no auth required — so tokens must be unguessable (uuid).

create table if not exists public.report_tokens (
  id           uuid primary key default gen_random_uuid(),
  token        uuid not null default gen_random_uuid() unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id     uuid not null references public.stores(id) on delete cascade,
  scan_id      uuid references public.scans(id) on delete set null,
  label        text,
  expires_at   timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists report_tokens_token_idx on public.report_tokens (token);
create index if not exists report_tokens_org_idx   on public.report_tokens (organization_id);

-- Reports are public — RLS is not needed because the token itself is the gate.
-- The API route validates expiry before returning any data.
alter table public.report_tokens enable row level security;

create policy "service_role_all" on public.report_tokens
  for all using (true) with check (true);
