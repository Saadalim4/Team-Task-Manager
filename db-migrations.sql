-- Add phone column to users table
ALTER TABLE users ADD COLUMN phone text;

-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN profile_picture text;

-- Note: Run this in your Supabase SQL editor

-- For profile picture upload, create a storage bucket in Supabase:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket named "profile-pictures"
-- 3. Make it public
-- 4. Add a policy to allow authenticated users to upload:
--    CREATE POLICY "Users can upload their own profile picture"
--    ON storage.objects FOR INSERT
--    TO authenticated
--    WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 5. Add a policy to allow public read access:
--    CREATE POLICY "Public can view profile pictures"
--    ON storage.objects FOR SELECT
--    TO public
--    USING (bucket_id = 'profile-pictures');
