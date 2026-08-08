-- Run once in the DevQuest Supabase SQL Editor to enable member-owned avatars.

alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-profile-images',
  'team-profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Team members can upload own profile image" on storage.objects;
create policy "Team members can upload own profile image"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'team-profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_devquest_team()
);

drop policy if exists "Team members can view own profile image" on storage.objects;
create policy "Team members can view own profile image"
on storage.objects for select to authenticated
using (
  bucket_id = 'team-profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_devquest_team()
);

drop policy if exists "Team members can update own profile image" on storage.objects;
create policy "Team members can update own profile image"
on storage.objects for update to authenticated
using (
  bucket_id = 'team-profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_devquest_team()
)
with check (
  bucket_id = 'team-profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_devquest_team()
);

drop policy if exists "Team members can delete own profile image" on storage.objects;
create policy "Team members can delete own profile image"
on storage.objects for delete to authenticated
using (
  bucket_id = 'team-profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_devquest_team()
);
