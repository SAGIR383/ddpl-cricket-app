CricPluse - setup

FILES
  index.html    the website (the only file you upload to Netlify)
  schema.sql    database step 1
  update.sql    database step 2 (co-organizers)
  auction.sql   database step 3 (auctions)
  auction2.sql  database step 4 (limit price, player photos)
  auction3.sql  database step 5 (100 KB photo limit)
  logo.sql      database step 6 (league logo)

FIRST-TIME SETUP
  1. Create a free project at supabase.com.
  2. SQL Editor: run schema.sql, then update.sql, then auction.sql, auction2.sql, auction3.sql, logo.sql
     (copy each file's text, paste, click Run, in this order).
  3. Project Settings > API: copy the Project URL and the anon (or publishable) key.
     Open index.html in a text editor and fill in the two values at the top
     (SUPABASE_URL and SUPABASE_ANON_KEY). Keep the quote marks.
  4. Authentication > Sign In / Providers > Email: turn off "Confirm email".
  5. Put index.html alone in a folder and drag it to app.netlify.com/drop.

UPDATING AN EXISTING SETUP
  Run only the .sql files you have not run before, paste your key into the new
  index.html, and upload the folder to Netlify again (Deploys > drag folder).

NOTE: free Supabase projects pause after 7 days of inactivity; restore from the dashboard.
