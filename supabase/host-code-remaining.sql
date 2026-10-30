-- Lets the host screen ask "how many more times can this access code be used?" when its time runs out.
-- Run once in the Supabase SQL editor.
create or replace function public.host_code_remaining(p_code text)
returns integer
language sql
security definer
set search_path = public
as $$
  select greatest(max_uses - uses, 0)
  from host_codes
  where code = p_code
    and not revoked
    and (redeem_by is null or redeem_by >= now())
$$;

grant execute on function public.host_code_remaining(text) to anon, authenticated;
