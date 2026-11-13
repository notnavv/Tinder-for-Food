-- =====================================================================
-- Security hardening, from Supabase's security advisor (2026-11-12).
--
-- 1. set_updated_at: pin search_path so the function can't be tricked into
--    calling a look-alike function from another schema.
-- 2. handle_new_user: it runs with extra privileges (security definer) and is
--    only meant to be called by the on_auth_user_created trigger. Revoking
--    EXECUTE stops anyone calling it through the API (/rest/v1/rpc/...).
--    Triggers don't need EXECUTE, so new sign-ups still get a profile.
-- =====================================================================

alter function public.set_updated_at() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
