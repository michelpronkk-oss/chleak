create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null,
  source_domain text,
  topic text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

alter table public.store_integrations
  add column if not exists shop_domain text,
  add column if not exists access_token_ref text,
  add column if not exists scopes text[] default '{}',
  add column if not exists installed_at timestamptz,
  add column if not exists sync_status text default 'pending',
  add column if not exists connection_health text default 'unknown';

create unique index if not exists stores_org_domain_unique_idx
  on public.stores (organization_id, domain)
  where domain is not null;

create unique index if not exists store_integrations_org_store_provider_unique_idx
  on public.store_integrations (organization_id, store_id, provider);

create index if not exists integration_webhook_events_provider_topic_idx
  on public.integration_webhook_events (provider, topic, received_at desc);
