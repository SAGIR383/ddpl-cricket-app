-- Run ONCE in Supabase SQL Editor, AFTER schema.sql and update.sql
create table auctions(
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues on delete cascade,
  name text not null,
  budget int not null default 10000,
  base int not null default 100,
  inc int not null default 100,
  status text not null default 'upcoming',   -- upcoming | live | done
  current jsonb,                              -- player currently on the block
  created_at timestamptz default now());

create table auction_results(
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references auctions on delete cascade,
  league_id uuid not null references leagues on delete cascade,
  player_name text not null,
  team text, price int,
  status text not null default 'sold',        -- sold | unsold
  created_at timestamptz default now());

alter table auctions enable row level security;
alter table auction_results enable row level security;
create policy "read auctions" on auctions for select using (true);
create policy "read auction results" on auction_results for select using (true);
create policy "admins write auctions" on auctions for all to authenticated
  using (is_league_admin(league_id)) with check (is_league_admin(league_id));
create policy "admins write results" on auction_results for all to authenticated
  using (is_league_admin(league_id)) with check (is_league_admin(league_id));
alter publication supabase_realtime add table auctions, auction_results;
