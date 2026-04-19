create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  full_name text not null,
  email text not null,
  company_name text,
  store_url text,
  platform text not null check (platform in ('shopify', 'stripe', 'both')),
  revenue_band text,
  pain_prompt text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'contacted')),
  source text not null default 'homepage',
  notes text
);

-- Case-insensitive unique email among non-rejected requests to block obvious spam
create unique index if not exists access_requests_email_unique
  on public.access_requests (lower(email))
  where (status <> 'rejected');

-- Only service role may access this table; no public reads or writes
alter table public.access_requests enable row level security;
