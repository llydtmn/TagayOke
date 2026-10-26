-- Songs: curated catalog plus anything cached from YouTube search.
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  code int generated always as identity (start with 10001) unique,
  title text not null,
  artist text not null,
  youtube_id text unique,          -- fill in embeddable karaoke video IDs you have verified
  language text default 'OPM',
  source text default 'curated',   -- 'curated' | 'youtube'
  created_at timestamptz default now()
);

create table if not exists rooms (
  code text primary key,
  created_at timestamptz default now()
);

create table if not exists queue_items (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  song_id uuid not null references songs(id),
  singer text not null default 'Guest',
  status text not null default 'queued' check (status in ('queued','playing','done')),
  created_at timestamptz default now()
);
create index if not exists queue_room_idx on queue_items(room_code, status, created_at);

-- Realtime
alter publication supabase_realtime add table queue_items;

-- Row level security: open for a private MVP. Tighten before any public launch.
alter table songs enable row level security;
alter table rooms enable row level security;
alter table queue_items enable row level security;
create policy "songs read" on songs for select using (true);
create policy "rooms read" on rooms for select using (true);
create policy "rooms create" on rooms for insert with check (true);
create policy "queue read" on queue_items for select using (true);
create policy "queue add" on queue_items for insert with check (true);
create policy "queue update" on queue_items for update using (true);
create policy "queue delete" on queue_items for delete using (true);

-- Let people add songs from a YouTube link (private MVP; restrict before going public).
create policy "songs add" on songs for insert with check (true);
create policy "songs update" on songs for update using (true);

create policy "songs add" on songs for insert with check (true);
create policy "songs update" on songs for update using (true);

-- Added with "Add by link": lets people add a song they pasted from YouTube.
create policy "songs add by link" on songs for insert with check (source = 'user');
