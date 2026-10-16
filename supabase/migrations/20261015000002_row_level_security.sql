-- =====================================================================
-- Row Level Security.
--
-- The frontend uses the public anon key, so RLS is the ONLY thing stopping
-- one user from reading another user's swipes. Rules:
--   * Menu data (halls, foods, appearances, approved photos): anyone can read;
--     only the service-role key (backend scripts) can write.
--   * profiles: users read/update only their own row.
--   * swipe_events: users insert and read only their own rows.
--     No update/delete for anyone but service role: the log is append-only.
-- The service-role key bypasses RLS entirely; it must never reach the browser.
-- =====================================================================

alter table public.dining_halls     enable row level security;
alter table public.foods            enable row level security;
alter table public.menu_appearances enable row level security;
alter table public.food_photos      enable row level security;
alter table public.profiles         enable row level security;
alter table public.swipe_events     enable row level security;
alter table public.ingestion_runs   enable row level security;   -- no policies = service role only

-- ---------- public menu data (read-only) ----------
create policy "Anyone can read dining halls"
  on public.dining_halls for select to anon, authenticated using (true);

create policy "Anyone can read foods"
  on public.foods for select to anon, authenticated using (true);

create policy "Anyone can read menu appearances"
  on public.menu_appearances for select to anon, authenticated using (true);

create policy "Anyone can read approved photos"
  on public.food_photos for select to anon, authenticated using (status = 'approved');

-- ---------- profiles ----------
create policy "Users can read their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- (Rows are created by the handle_new_user trigger, so no insert policy.)
-- Friends will need a second select policy in Week 7.

-- ---------- swipe_events ----------
create policy "Users can record their own swipes"
  on public.swipe_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own swipes"
  on public.swipe_events for select to authenticated
  using ((select auth.uid()) = user_id);

-- Belt and braces: even if someone adds a permissive policy by mistake,
-- app users can't rewrite history.
revoke update, delete, truncate on public.swipe_events from anon, authenticated;
