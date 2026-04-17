create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'admin', 'analyst', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  platform text not null check (platform in ('shopify', 'stripe')),
  domain text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null,
  status text not null default 'connected' check (status in ('connected', 'degraded', 'disconnected')),
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  scanned_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  detected_issues_count integer not null default 0,
  estimated_monthly_leakage numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  scan_id uuid not null references public.scans(id) on delete cascade,
  title text not null,
  summary text not null,
  type text not null check (type in ('checkout_friction', 'payment_method_coverage', 'failed_payment_recovery', 'setup_gap', 'fraud_false_decline')),
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'monitoring', 'resolved', 'ignored')),
  estimated_monthly_revenue_impact numeric(12,2) not null default 0,
  recommended_action text not null,
  source text not null,
  why_it_matters text not null,
  detected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.issue_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  event_type text not null check (event_type in ('detected', 'status_changed', 'impact_updated', 'resolved')),
  event_summary text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  estimated_recovered_revenue numeric(12,2) not null default 0,
  estimated_leakage numeric(12,2) not null default 0,
  issue_count integer not null default 0,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  status text not null default 'incomplete' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  seats integer not null default 1,
  dodo_customer_id text,
  dodo_subscription_id text,
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz not null default timezone('utc', now()) + interval '30 day',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scans_org_store_idx on public.scans (organization_id, store_id, scanned_at desc);
create index if not exists issues_org_status_idx on public.issues (organization_id, status, severity);
create index if not exists issues_store_detected_idx on public.issues (store_id, detected_at desc);
create index if not exists issue_events_issue_idx on public.issue_events (issue_id, created_at desc);
create index if not exists subscriptions_org_idx on public.subscriptions (organization_id);
