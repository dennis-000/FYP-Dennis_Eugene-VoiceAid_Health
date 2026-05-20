-- Create the journals bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('journals', 'journals', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files from the journals bucket (needed for getPublicUrl to work)
DROP POLICY IF EXISTS "Public Access to Journals" ON storage.objects;
CREATE POLICY "Public Access to Journals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journals');

-- Allow anyone (public/guest/authenticated) to upload audio to the journals bucket
DROP POLICY IF EXISTS "Anyone can upload journals" ON storage.objects;
CREATE POLICY "Anyone can upload journals"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'journals');

-- Allow users to update their journals
DROP POLICY IF EXISTS "Anyone can update journals" ON storage.objects;
CREATE POLICY "Anyone can update journals"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'journals')
WITH CHECK (bucket_id = 'journals');

-- Allow users to delete their journals
DROP POLICY IF EXISTS "Anyone can delete journals" ON storage.objects;
CREATE POLICY "Anyone can delete journals"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'journals');
