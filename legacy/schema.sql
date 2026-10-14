-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table leagues(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  overs int not null default 10,
  teams text[] not null,
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz default now());

create table fixtures(
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues on delete cascade,
  a text not null, b text not null,
  status text not null default 'upcoming',   -- upcoming | live | done
  state jsonb, result jsonb,
  created_at timestamptz default now());

create table players(
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  league_id uuid not null references leagues on delete cascade,
  name text not null, role text, team text,
  primary key(user_id, league_id));

alter table leagues enable row level security;
alter table fixtures enable row level security;
alter table players enable row level security;

-- everyone (even logged out) can view
create policy "read leagues" on leagues for select using (true);
create policy "read fixtures" on fixtures for select using (true);
create policy "read players" on players for select using (true);

-- logged-in users create leagues; only the owner edits/deletes them
create policy "create league" on leagues for insert to authenticated with check (owner = auth.uid());
create policy "edit league" on leagues for update to authenticated using (owner = auth.uid());
create policy "delete league" on leagues for delete to authenticated using (owner = auth.uid());

-- only the league owner manages fixtures and scores
create policy "owner writes fixtures" on fixtures for all to authenticated
  using (exists (select 1 from leagues l where l.id = league_id and l.owner = auth.uid()))
  with check (exists (select 1 from leagues l where l.id = league_id and l.owner = auth.uid()));

-- players add/edit/remove themselves; the league owner can remove anyone
create policy "join" on players for insert to authenticated with check (user_id = auth.uid());
create policy "edit self" on players for update to authenticated using (user_id = auth.uid());
create policy "leave or remove" on players for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from leagues l where l.id = league_id and l.owner = auth.uid()));

-- live updates
alter publication supabase_realtime add table fixtures, players;
