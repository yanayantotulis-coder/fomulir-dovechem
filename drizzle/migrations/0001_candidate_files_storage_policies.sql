CREATE POLICY "candidate files read own or staff" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')
  )
);

CREATE POLICY "candidate files insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidate-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate files update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'candidate-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate files delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate-files' AND (storage.foldername(name))[1] = auth.uid()::text);
