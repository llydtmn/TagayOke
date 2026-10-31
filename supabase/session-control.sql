-- Session control: lets an admin skip or remove songs in a running room and send a short message to the TV.
-- Run this ONCE in the Supabase SQL editor. It is safe to run again.

-- 1. The TV message lives on the room row.
alter table public.rooms
  add column if not exists tv_message text,
  add column if not exists tv_message_until timestamptz,
  add column if not exists tv_message_at timestamptz;

-- 2. Admins may change the queue of any room (skip / remove a song).
drop policy if exists "admins manage queue" on public.queue_items;
create policy "admins manage queue" on public.queue_items
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 3. Admin sends (or clears) a message. The server sets the end time, so a wrong clock cannot stretch it.
--    Empty text clears the message.
create or replace function public.send_tv_message(p_room text, p_text text, p_seconds int default 20)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'Only admins can send TV messages';
  end if;

  if p_text is null or btrim(p_text) = '' then
    update public.rooms
       set tv_message = null, tv_message_until = null, tv_message_at = null
     where code = p_room;
  else
    update public.rooms
       set tv_message = left(btrim(p_text), 120),
           tv_message_until = now() + make_interval(secs => greatest(5, least(coalesce(p_seconds, 20), 120))),
           tv_message_at = now()
     where code = p_room;
  end if;

  if not found then
    raise exception 'Room % was not found', p_room;
  end if;
end;
$$;

revoke all on function public.send_tv_message(text, text, int) from public;
grant execute on function public.send_tv_message(text, text, int) to authenticated;

-- 4. The TV asks "is there a message for my room right now?" (the TV is not signed in, so this is a function).
create or replace function public.room_tv_message(p_code text)
returns table (out_text text, out_at timestamptz, out_left int)
language sql
stable
security definer
set search_path = public
as $$
  select r.tv_message,
         r.tv_message_at,
         ceil(extract(epoch from (r.tv_message_until - now())))::int
    from public.rooms r
   where r.code = p_code
     and r.tv_message is not null
     and r.tv_message_until > now();
$$;

grant execute on function public.room_tv_message(text) to anon, authenticated;
