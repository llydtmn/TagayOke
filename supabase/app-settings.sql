-- App settings (announcement banner on the landing page). Run once in the Supabase SQL editor.
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Anyone (the landing page) may read settings.
drop policy if exists "settings readable by everyone" on public.app_settings;
create policy "settings readable by everyone" on public.app_settings
  for select using (true);

-- Only admins may create / change / delete them (same `admins` table the dashboard already uses).
drop policy if exists "settings writable by admins" on public.app_settings;
create policy "settings writable by admins" on public.app_settings
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Optional: lets the landing page update live when the admin toggles it.
-- alter publication supabase_realtime add table public.app_settings;
