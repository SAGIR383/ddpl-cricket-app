-- Run ONCE in Supabase SQL Editor (after auction.sql): per-player limit price + player photos
alter table auctions add column limits jsonb not null default '{}'::jsonb;
alter table players add column photo text;

insert into storage.buckets (id, name, public) values ('player-photos', 'player-photos', true)
  on conflict (id) do nothing;

create policy "photos public read" on storage.objects for select
  using (bucket_id = 'player-photos');
create policy "photos upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos update own" on storage.objects for update to authenticated
  using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = auth.uid()::text);
