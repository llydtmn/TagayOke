-- Admin activity log: who did what in the admin dashboard.
-- Run this once in the Supabase SQL editor. Safe to run again.

create table if not exists public.admin_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  admin_id    uuid default auth.uid(),
  admin_email text,
  action      text not null,
  target      text,
  detail      text
);

create index if not exists admin_log_at_idx on public.admin_log (at desc);

alter table public.admin_log enable row level security;

-- Admins can read and add entries. There is no update or delete policy on purpose,
-- so nobody can edit or erase the log from the app.
drop policy if exists "admins read log" on public.admin_log;
create policy "admins read log" on public.admin_log
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins write log" on public.admin_log;
create policy "admins write log" on public.admin_log
  for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
