-- =====================================================================
-- Table privileges for the API roles.
--
-- Newer Supabase projects no longer give anon / authenticated / service_role
-- automatic access to new tables in `public`. Without these grants every API
-- call fails with "permission denied for table ...", even with the secret key.
--
-- Two layers, both required:
--   GRANT = which tables a role may touch at all (this file)
--   RLS   = which ROWS it may see or change (20261015000002_row_level_security.sql)
-- The grants below match the RLS policies exactly: nothing extra.
-- =====================================================================

-- Menu data: anyone may read (RLS: approved photos only).
grant select on public.dining_halls, public.foods, public.menu_appearances,
  public.food_photos, public.foods_with_photo
  to anon, authenticated;

-- Signed-in users: their own profile (RLS limits it to their row).
grant select, update on public.profiles to authenticated;

-- Signed-in users: add and read their own swipes. Still no update/delete:
-- the swipe log is append-only.
grant select, insert on public.swipe_events to authenticated;
grant select on public.user_food_preferences to authenticated;

-- Backend + ingestion scripts (secret key only; it bypasses RLS).
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Tables added later are usable by the backend automatically.
-- (anon / authenticated still need an explicit grant per table, on purpose.)
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
