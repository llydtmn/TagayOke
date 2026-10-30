-- Lets an access code have NO time limit (duration_seconds = NULL).
-- Step 1: allow NULL in the column and drop any CHECK that forces a positive/bounded length.
alter table public.host_codes alter column duration_seconds drop not null;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.host_codes'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%duration_seconds%'
  loop
    execute format('alter table public.host_codes drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.host_codes
  add constraint host_codes_duration_check
  check (duration_seconds is null or (duration_seconds >= 1 and duration_seconds <= 86400));

-- Step 2 (needed too): redeem_host_code and continue_room must turn a NULL duration into a NULL expires_at.
-- Wherever they compute  now() + (duration_seconds || ' seconds')::interval  change it to:
--   case when v.duration_seconds is null then null else now() + make_interval(secs => v.duration_seconds) end
-- (If you paste those two functions here I will patch them for you.)
