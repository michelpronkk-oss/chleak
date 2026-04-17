alter table public.store_integrations
  add column if not exists account_identifier text;

create index if not exists store_integrations_provider_account_identifier_idx
  on public.store_integrations (provider, account_identifier);
