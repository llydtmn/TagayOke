-- TagayOke: host access codes with a time limit.
-- Run once in Supabase -> SQL Editor. Safe to run again (also upgrades an older version that stored minutes).
-- Assumes your existing tables: rooms(code, ...), queue_items, participants, admins(user_id).

-- 1) Rooms get an end time (NULL = no limit, so existing rooms keep working).
alter table public.rooms add column if not exists expires_at timestamptz;

-- 2) Helper: is the current signed-in user an admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- 3) The access codes you hand out.
create table if not exists public.host_codes (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  label            text,
  duration_seconds int,                    -- session length, typed by the admin in seconds / minutes / hours
  max_uses         int  not null default 1 check (max_uses >= 1),
  uses             int  not null default 0,
  redeem_by        timestamptz,            -- optional: code stops working if not used by this time
  revoked          boolean not null default false,
  created_at       timestamptz not null default now(),
  last_used_at     timestamptz
);
-- Upgrade from the older version that stored duration_minutes.
alter table public.host_codes add column if not exists duration_seconds int;
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'host_codes' and column_name = 'duration_minutes') then
    update public.host_codes set duration_seconds = duration_minutes * 60 where duration_seconds is null;
    alter table public.host_codes drop column duration_minutes;
  end if;
end $$;
alter table public.host_codes alter column duration_seconds set not null;
alter table public.host_codes drop constraint if exists host_codes_duration_seconds_check;
alter table public.host_codes add constraint host_codes_duration_seconds_check check (duration_seconds between 1 and 86400);

alter table public.host_codes enable row level security;
drop policy if exists "admins manage host codes" on public.host_codes;
create policy "admins manage host codes" on public.host_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4) Redeem a code: validates it, creates the room, starts the clock.
create or replace function public.redeem_host_code(p_code text)
returns table(out_room text, out_expires timestamptz, out_now timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  c public.host_codes%rowtype;
  v_room text;
  v_exp timestamptz;
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ';
  i int;
begin
  select * into c from public.host_codes where code = upper(trim(p_code)) for update;
  if not found or c.revoked then raise exception 'That access code is not valid.'; end if;
  if c.redeem_by is not null and c.redeem_by < now() then raise exception 'That access code has expired.'; end if;
  if c.uses >= c.max_uses then raise exception 'That access code has already been used.'; end if;

  perform set_config('app.redeeming', '1', true);   -- lets the rooms trigger below allow this insert
  v_exp := now() + make_interval(secs => c.duration_seconds);

  for attempt in 1..10 loop
    v_room := '';
    for i in 1..4 loop
      v_room := v_room || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    begin
      insert into public.rooms(code, expires_at) values (v_room, v_exp);
      exit;
    exception when unique_violation then
      v_room := null;
    end;
  end loop;
  if v_room is null then raise exception 'Could not create a room. Try again.'; end if;

  update public.host_codes set uses = uses + 1, last_used_at = now() where id = c.id;
  return query select v_room, v_exp, now();
end $$;
grant execute on function public.redeem_host_code(text) to anon, authenticated;

-- 5) Nobody can create a room without a code (admins still can from the dashboard).
create or replace function public.rooms_require_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.redeeming', true) = '1' or public.is_admin() then return new; end if;
  raise exception 'Hosting needs an access code.';
end $$;
drop trigger if exists rooms_require_code on public.rooms;
create trigger rooms_require_code before insert on public.rooms
  for each row execute function public.rooms_require_code();

-- 6) Room status + server clock (so a wrong phone/laptop clock can't stretch a session).
create or replace function public.room_status(p_code text)
returns table(out_exists boolean, out_expires timestamptz, out_now timestamptz)
language sql stable security definer set search_path = public as $$
  select r.code is not null and (r.expires_at is null or r.expires_at > now()), r.expires_at, now()
  from (select 1) d left join public.rooms r on r.code = upper(p_code)
$$;
grant execute on function public.room_status(text) to anon, authenticated;

-- 7) No new songs can be reserved after time is up.
create or replace function public.queue_block_expired() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.rooms where code = new.room_code and expires_at is not null and expires_at <= now()) then
    raise exception 'This session has ended.';
  end if;
  return new;
end $$;
drop trigger if exists queue_block_expired on public.queue_items;
create trigger queue_block_expired before insert on public.queue_items
  for each row execute function public.queue_block_expired();

-- 8) Automatically end sessions whose time is up (deletes room, queue and users).
create or replace function public.purge_expired_rooms() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.queue_items  where room_code in (select code from public.rooms where expires_at is not null and expires_at <= now());
  delete from public.participants where room_code in (select code from public.rooms where expires_at is not null and expires_at <= now());
  delete from public.rooms where expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.purge_expired_rooms() to anon, authenticated;

-- Run the purge every minute. If this line errors, enable "pg_cron" under
-- Database -> Extensions in Supabase, then run these two lines again.
create extension if not exists pg_cron;
select cron.schedule('purge-expired-rooms', '* * * * *', $$select public.purge_expired_rooms()$$);
