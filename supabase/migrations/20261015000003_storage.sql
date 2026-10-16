-- =====================================================================
-- Storage bucket for team food photos.
--
-- Public bucket: anyone with the URL can view a photo (needed for food cards).
-- No insert/update/delete policies: only the service-role key (the photo
-- upload script) can add or change files.
--
-- Photo rules: dishes only, no identifiable people without consent.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('food-photos', 'food-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;
