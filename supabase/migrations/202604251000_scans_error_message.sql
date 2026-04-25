-- Add error_message column to scans table.
-- This stores the reason a scan failed so operators can see what went wrong
-- without having to check server logs. Written by scan-task-service.ts when
-- Trigger.dev cannot start the scan worker.

alter table public.scans
  add column if not exists error_message text;
