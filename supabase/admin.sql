-- Admin dashboard setup. Run once in the Supabase SQL editor (safe to run again).

-- 1. Hosts can have a label, and every phone that joins a host is recorded as a participant.
-- 2. Admin account
-- Email: admin.TagayOke@capoocan.sing.ph
-- password: AdminAccess2026
alter table rooms add column if not exists name text;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  device_id text not null,
  name text not null default 'Guest',
  joined_at timestamptz default now(),
  last_seen timestamptz default now(),
  unique (room_code, device_id)
);
create index if not exists participants_room_idx on participants(room_code);

-- 2. Who counts as an admin.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

-- 3. Row level security.
alter table participants enable row level security;
alter table admins enable row level security;

drop policy if exists "tgk participants read" on participants;
drop policy if exists "tgk participants join" on participants;
drop policy if exists "tgk participants ping" on participants;
drop policy if exists "tgk participants admin delete" on participants;
create policy "tgk participants read" on participants for select using (true);
create policy "tgk participants join" on participants for insert with check (true);
create policy "tgk participants ping" on participants for update using (true);
create policy "tgk participants admin delete" on participants for delete using (is_admin());

drop policy if exists "tgk admins read own" on admins;
create policy "tgk admins read own" on admins for select using (user_id = auth.uid());

drop policy if exists "tgk rooms admin update" on rooms;
drop policy if exists "tgk rooms admin delete" on rooms;
create policy "tgk rooms admin update" on rooms for update using (is_admin());
create policy "tgk rooms admin delete" on rooms for delete using (is_admin());

drop policy if exists "tgk songs admin delete" on songs;
create policy "tgk songs admin delete" on songs for delete using (is_admin());

-- 4. After creating your admin user in Supabase (Authentication section), make them an admin:
-- insert into admins (user_id) select id from auth.users where email = 'YOUR_EMAIL_HERE';
