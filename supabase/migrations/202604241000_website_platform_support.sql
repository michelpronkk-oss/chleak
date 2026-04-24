-- Allow 'website' as a valid platform value for URL-first source stores.
-- The stores table was created with check (platform in ('shopify', 'stripe')).
-- The URL-first source lane inserts stores with platform = 'website'.

alter table public.stores
  drop constraint if exists stores_platform_check;

alter table public.stores
  add constraint stores_platform_check
    check (platform in ('shopify', 'stripe', 'website'));
