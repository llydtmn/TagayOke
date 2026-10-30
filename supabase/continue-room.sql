-- Lets the host screen keep the SAME room going when time runs out and the access code still has uses left.
-- Run once in the Supabase SQL editor (after host-code-remaining.sql).
create or replace function public.continue_room(p_room text, p_code text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  h jsonb;
  secs integer;
  new_end timestamptz;
  n integer;
begin
  select to_jsonb(c) into h
  from host_codes c
  where c.code = p_code
    and not c.revoked
    and (c.redeem_by is null or c.redeem_by >= now())
    and c.uses < c.max_uses
  for update;

  if h is null then
    raise exception 'That access code can not be used again.';
  end if;

  -- works whether the column is duration_seconds or the older duration_minutes
  secs := coalesce((h->>'duration_seconds')::integer, (h->>'duration_minutes')::integer * 60);
  new_end := now() + make_interval(secs => secs);

  update rooms set expires_at = new_end where code = p_room;
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'This room has already closed.';
  end if;

  update host_codes set uses = uses + 1, last_used_at = now() where code = p_code;
  return new_end;
end;
$$;

grant execute on function public.continue_room(text, text) to anon, authenticated;
