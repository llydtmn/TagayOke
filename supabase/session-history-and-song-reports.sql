-- TagayOke: session history + broken-video reports.
-- Run once in Supabase -> SQL Editor (after host-access-codes.sql). Safe to run again.
-- It only adds things: it does not change your existing tables or functions.

-- ============ 1) SESSION HISTORY ============
-- One row per hosted session. Rooms are deleted when a session ends, so this is where the history lives.
create table if not exists public.host_sessions (
  id            uuid primary key default gen_random_uuid(),
  room_code     text not null,
  room_name     text,
  code_id       uuid references public.host_codes(id) on delete set null,
  code          text,                       -- copied, so history survives deleting the access code
  code_label    text,
  started_at    timestamptz not null default now(),
  planned_end   timestamptz,                -- NULL = no time limit
  ended_at      timestamptz,                -- NULL = still running
  end_reason    text,                       -- 'time_up' | 'ended' (host or admin ended it early)
  songs_played  int not null default 0,
  people_joined int not null default 0
);
create index if not exists host_sessions_started_idx on public.host_sessions (started_at desc);
create index if not exists host_sessions_open_idx    on public.host_sessions (room_code) where ended_at is null;
alter table public.host_sessions enable row level security;
drop policy if exists "admins read sessions"   on public.host_sessions;
drop policy if exists "admins delete sessions" on public.host_sessions;
create policy "admins read sessions"   on public.host_sessions for select to authenticated using (public.is_admin());
create policy "admins delete sessions" on public.host_sessions for delete to authenticated using (public.is_admin());

-- A room appears -> a session starts. If an access code was redeemed in the same transaction, link it.
create or replace function public.session_on_room_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.host_codes%rowtype;
begin
  select * into c from public.host_codes where last_used_at = now() order by created_at desc limit 1;
  insert into public.host_sessions(room_code, room_name, code_id, code, code_label, started_at, planned_end)
  values (new.code, new.name, c.id, c.code, c.label, now(), new.expires_at);
  return new;
end $$;
drop trigger if exists session_on_room_insert on public.rooms;
create trigger session_on_room_insert after insert on public.rooms
  for each row execute function public.session_on_room_insert();

-- Covers the other order too (code counted as used after the room was created).
create or replace function public.session_link_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.uses > old.uses then
    update public.host_sessions set code_id = new.id, code = new.code, code_label = new.label
    where started_at = now() and code is null;
  end if;
  return new;
end $$;
drop trigger if exists session_link_code on public.host_codes;
create trigger session_link_code after update of uses on public.host_codes
  for each row execute function public.session_link_code();

-- A room goes away -> the session ends (time ran out, or someone ended it early).
create or replace function public.session_on_room_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.host_sessions
     set ended_at    = now(),
         room_name   = coalesce(old.name, room_name),
         planned_end = old.expires_at,
         end_reason  = case when old.expires_at is not null and old.expires_at <= now() + interval '15 seconds'
                            then 'time_up' else 'ended' end
   where room_code = old.code and ended_at is null;
  return old;
end $$;
drop trigger if exists session_on_room_delete on public.rooms;
create trigger session_on_room_delete after delete on public.rooms
  for each row execute function public.session_on_room_delete();

-- A song starts playing -> count it.
create or replace function public.session_count_song() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'playing' and (tg_op = 'INSERT' or old.status is distinct from 'playing') then
    update public.host_sessions set songs_played = songs_played + 1
    where room_code = new.room_code and ended_at is null;
  end if;
  return new;
end $$;
drop trigger if exists session_count_song on public.queue_items;
create trigger session_count_song after insert or update of status on public.queue_items
  for each row execute function public.session_count_song();

-- A phone joins -> count it (people added by hand from the dashboard are not counted).
create or replace function public.session_count_person() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.device_id is null or new.device_id not like 'admin-%' then
    update public.host_sessions set people_joined = people_joined + 1
    where room_code = new.room_code and ended_at is null;
  end if;
  return new;
end $$;
drop trigger if exists session_count_person on public.participants;
create trigger session_count_person after insert on public.participants
  for each row execute function public.session_count_person();

-- Rooms that are running right now get an open session, so they show up too.
insert into public.host_sessions(room_code, room_name, started_at, planned_end)
select r.code, r.name, coalesce(r.created_at, now()), r.expires_at
from public.rooms r
where not exists (select 1 from public.host_sessions s where s.room_code = r.code and s.ended_at is null);

-- ============ 2) BROKEN-VIDEO REPORTS ============
-- One row per song. Created from the TV when YouTube refuses a video, or from a phone's "Report problem" button.
do $$
declare t text;
begin
  select format_type(atttypid, atttypmod) into t
  from pg_attribute where attrelid = 'public.songs'::regclass and attname = 'id' and not attisdropped;
  execute format($f$
    create table if not exists public.song_reports (
      song_id           %s primary key references public.songs(id) on delete cascade,
      reason            text not null default 'broken',
      report_count      int  not null default 1,
      first_reported_at timestamptz not null default now(),
      last_reported_at  timestamptz not null default now(),
      resolved          boolean not null default false
    )$f$, t);
end $$;
alter table public.song_reports enable row level security;
drop policy if exists "admins manage song reports" on public.song_reports;
create policy "admins manage song reports" on public.song_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anyone (TV or phone) can report a song, but only through this function.
create or replace function public.report_song(p_song_id text, p_reason text default 'broken') returns void
language plpgsql security definer set search_path = public as $$
declare v_reason text := case when p_reason in ('broken', 'wrong', 'no_sound', 'other') then p_reason else 'broken' end;
begin
  insert into public.song_reports(song_id, reason)
  select s.id, v_reason from public.songs s where s.id::text = p_song_id
  on conflict (song_id) do update set
    report_count      = case when public.song_reports.resolved then 1 else public.song_reports.report_count + 1 end,
    first_reported_at = case when public.song_reports.resolved then now() else public.song_reports.first_reported_at end,
    resolved          = false,
    reason            = excluded.reason,
    last_reported_at  = now();
end $$;
grant execute on function public.report_song(text, text) to anon, authenticated;
