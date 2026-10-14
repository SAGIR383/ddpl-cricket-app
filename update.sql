-- Run ONCE in Supabase SQL Editor (after schema.sql): adds co-organizers
create table league_admins(
  league_id uuid not null references leagues on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key(league_id, user_id));
alter table league_admins enable row level security;

create function is_league_admin(lid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from leagues where id = lid and owner = auth.uid())
      or exists(select 1 from league_admins where league_id = lid and user_id = auth.uid()) $$;

create policy "read admins" on league_admins for select using (true);
create policy "owner manages admins" on league_admins for all to authenticated
  using (exists (select 1 from leagues l where l.id = league_id and l.owner = auth.uid()))
  with check (exists (select 1 from leagues l where l.id = league_id and l.owner = auth.uid()));

drop policy "owner writes fixtures" on fixtures;
create policy "admins write fixtures" on fixtures for all to authenticated
  using (is_league_admin(league_id)) with check (is_league_admin(league_id));

drop policy "edit self" on players;
create policy "edit self or admin" on players for update to authenticated
  using (user_id = auth.uid() or is_league_admin(league_id));

drop policy "leave or remove" on players;
create policy "leave or remove" on players for delete to authenticated
  using (user_id = auth.uid() or is_league_admin(league_id));

alter publication supabase_realtime add table league_admins;
