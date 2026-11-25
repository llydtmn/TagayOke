-- Free host code for new users: always keeps ONE unused code ready for the announcement.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The landing page calls get_free_host_code():
--   * if a free code is still unused (not revoked, not expired)  -> returns that same code
--   * if it was used up / revoked                               -> makes a new one and returns it
--   * if the feature is off (Admin > Settings > Free host code)  -> returns null
-- Codes are normal rows in host_codes (1 use each) labelled 'Free welcome code', so they show in Codes and History.

create or replace function public.get_free_host_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg     jsonb;
  v_label constant text := 'Free welcome code';
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
  v_raw   text;
  v_mins  int;
  v_secs  int;
  v_try   int := 0;
  i       int;
begin
  select value into cfg from public.app_settings where key = 'free_code';
  if cfg is null or coalesce(cfg->>'enabled', 'false') <> 'true' then
    return null;
  end if;

  -- one visitor at a time, so two people opening the page together do not each create a code
  perform pg_advisory_xact_lock(hashtext('tagayoke_free_host_code'));

  select code into v_code
    from public.host_codes
   where label = v_label
     and not revoked
     and uses < max_uses
     and (redeem_by is null or redeem_by > now())
   order by created_at desc
   limit 1;
  if v_code is not null then
    return v_code;
  end if;

  v_mins := coalesce(nullif(cfg->>'minutes', '')::int, 60);
  v_secs := case when v_mins > 0 then least(v_mins * 60, 86400) else null end;  -- null = unlimited

  loop
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    v_code := substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
    begin
      insert into public.host_codes (code, label, duration_seconds, max_uses)
      values (v_code, v_label, v_secs, 1);
      return v_code;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 10 then raise; end if;
    end;
  end loop;
end;
$$;

revoke all on function public.get_free_host_code() from public;
grant execute on function public.get_free_host_code() to anon, authenticated;
