-- Run ONCE in Supabase SQL Editor (after auction2.sql): server-side 100 KB photo limit
update storage.buckets
   set file_size_limit = 102400,
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'player-photos';
