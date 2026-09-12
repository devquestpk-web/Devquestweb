-- Create a public bucket for student profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-avatars',
  'student-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for student-avatars
-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Students can upload own profile image" ON storage.objects;
CREATE POLICY "Students can upload own profile image"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Students can update own profile image" ON storage.objects;
CREATE POLICY "Students can update own profile image"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Students can delete own profile image" ON storage.objects;
CREATE POLICY "Students can delete own profile image"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'student-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view student avatars
DROP POLICY IF EXISTS "Anyone can view student avatars" ON storage.objects;
CREATE POLICY "Anyone can view student avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-avatars'
);
