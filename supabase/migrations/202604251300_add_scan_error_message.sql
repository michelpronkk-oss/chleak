alter table public.scans
  add column if not exists error_message text;
