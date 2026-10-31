-- Session insights: keeps a permanent record of every song request so the admin dashboard can show
-- most-requested songs, top singers, busiest hours and peak phones per session.
-- Run this once in the Supabase SQL editor. It is safe to run again.
-- It does not change host_sessions' existing counters (songs_played, people_joined); it only adds to them.

-- 1) Peak phones in a room at once, stored on the session row.
alter table public.host_sessions add column if not exists peak_users integer not null default 0;

-- 2) One row per queued song. It survives after the room, its queue and its users are deleted.
create table if not exists public.session_songs (
  id            bigint generated always as identity primary key,
  session_id    text,                        -- host_sessions.id as text (null if no running session was found)
  room_code     text not null,
  queue_item_id text not null unique,
  song_id       text,
  song_code     text,
  title         text,
  artist        text,
  language      text,
  singer        text,
  requested_at  timestamptz not null default now(),
  started_at    timestamptz,                 -- set when the song starts playing
  ended_at      timestamptz,                 -- set when it finishes, is skipped, or the room closes
  removed_at    timestamptz                  -- set if it was deleted before it ever played
);
create index if not exists session_songs_requested_idx on public.session_songs (requested_at);
create index if not exists session_songs_started_idx   on public.session_songs (started_at);
create index if not exists session_songs_session_idx   on public.session_songs (session_id);

-- Only admins can read it. Nobody can write to it from the app; the triggers below do the writing.
alter table public.session_songs enable row level security;
revoke all on public.session_songs from anon, authenticated;
grant select on public.session_songs to authenticated;
drop policy if exists "admins read session songs" on public.session_songs;
create policy "admins read session songs" on public.session_songs
  for select to authenticated using (is_admin());

-- 3) Triggers on queue_items. Logging must never block a song request, so each one swallows its own errors.
create or replace function public.tgk_log_queue_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_sid text; v_code text; v_title text; v_artist text; v_lang text;
begin
  select id::text into v_sid from public.host_sessions
    where room_code = new.room_code and ended_at is null order by started_at desc limit 1;
  select code::text, title, artist, language into v_code, v_title, v_artist, v_lang
    from public.songs where id = new.song_id;
  insert into public.session_songs
    (session_id, room_code, queue_item_id, song_id, song_code, title, artist, language, singer, requested_at, started_at)
  values
    (v_sid, new.room_code, new.id::text, new.song_id::text, v_code, v_title, v_artist, v_lang, new.singer,
     coalesce(new.created_at, now()), case when new.status = 'playing' then now() end)
  on conflict (queue_item_id) do nothing;
  return new;
exception when others then
  return new;
end $$;

create or replace function public.tgk_log_queue_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'playing' then
      update public.session_songs set started_at = coalesce(started_at, now()) where queue_item_id = new.id::text;
    elsif new.status = 'done' then
      update public.session_songs set ended_at = now() where queue_item_id = new.id::text;
    end if;
  end if;
  return new;
exception when others then
  return new;
end $$;

create or replace function public.tgk_log_queue_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- never played: mark as removed. Playing when it vanished (room closed mid-song): close it off.
  update public.session_songs set removed_at = now()
    where queue_item_id = old.id::text and started_at is null and removed_at is null;
  update public.session_songs set ended_at = now()
    where queue_item_id = old.id::text and started_at is not null and ended_at is null;
  return old;
exception when others then
  return old;
end $$;

drop trigger if exists tgk_log_queue_insert on public.queue_items;
create trigger tgk_log_queue_insert after insert on public.queue_items
  for each row execute function public.tgk_log_queue_insert();
drop trigger if exists tgk_log_queue_update on public.queue_items;
create trigger tgk_log_queue_update after update of status on public.queue_items
  for each row execute function public.tgk_log_queue_update();
drop trigger if exists tgk_log_queue_delete on public.queue_items;
create trigger tgk_log_queue_delete after delete on public.queue_items
  for each row execute function public.tgk_log_queue_delete();

-- 4) Peak phones: every time someone joins, raise the session's peak if the room is now fuller than ever.
create or replace function public.tgk_track_peak_users()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  select count(*) into v_n from public.participants where room_code = new.room_code;
  update public.host_sessions set peak_users = greatest(peak_users, v_n)
    where id = (select id from public.host_sessions
                where room_code = new.room_code and ended_at is null order by started_at desc limit 1);
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists tgk_track_peak_users on public.participants;
create trigger tgk_track_peak_users after insert on public.participants
  for each row execute function public.tgk_track_peak_users();

-- 5) One call that returns every number the dashboard needs (counts, not raw rows).
create or replace function public.admin_insights(p_days integer default 30, p_tz text default 'UTC')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_since timestamptz := case when coalesce(p_days, 0) > 0 then now() - make_interval(days => p_days) else '-infinity'::timestamptz end;
  v_tz text := case when exists (select 1 from pg_timezone_names where name = p_tz) then p_tz else 'UTC' end;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'songs_sung',          (select count(*) from public.session_songs where started_at >= v_since),
    'songs_requested',     (select count(*) from public.session_songs where requested_at >= v_since),
    'sessions',            (select count(*) from public.host_sessions where started_at >= v_since),
    'sessions_with_songs', (select count(distinct session_id) from public.session_songs where started_at >= v_since and session_id is not null),
    'peak_users_max',      (select coalesce(max(peak_users), 0) from public.host_sessions where started_at >= v_since),
    'peak_users_avg',      (select coalesce(round(avg(peak_users) filter (where peak_users > 0), 1), 0) from public.host_sessions where started_at >= v_since),
    'top_songs', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.requested desc, t.sung desc)
      from (
        select max(song_code) as code, max(title) as title, max(artist) as artist,
               count(*) as requested, count(started_at) as sung
        from public.session_songs where requested_at >= v_since
        group by song_id
        order by count(*) desc, count(started_at) desc
        limit 10
      ) t), '[]'::jsonb),
    'top_singers', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sung desc)
      from (
        select max(singer) as singer, count(started_at) as sung
        from public.session_songs
        where started_at >= v_since and singer is not null and btrim(singer) <> ''
        group by lower(btrim(singer))
        order by count(started_at) desc
        limit 10
      ) t), '[]'::jsonb),
    'by_hour', (
      select jsonb_agg(coalesce(x.c, 0) order by g.h)
      from generate_series(0, 23) as g(h)
      left join (
        select extract(hour from (started_at at time zone v_tz))::int as hr, count(*) as c
        from public.session_songs where started_at >= v_since group by 1
      ) x on x.hr = g.h),
    'by_dow', (
      select jsonb_agg(coalesce(x.c, 0) order by g.d)
      from generate_series(0, 6) as g(d)
      left join (
        select extract(dow from (started_at at time zone v_tz))::int as dw, count(*) as c
        from public.session_songs where started_at >= v_since group by 1
      ) x on x.dw = g.d)
  );
end $$;

revoke execute on function public.admin_insights(integer, text) from public, anon;
grant execute on function public.admin_insights(integer, text) to authenticated;
