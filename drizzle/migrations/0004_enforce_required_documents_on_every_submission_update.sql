CREATE OR REPLACE FUNCTION public.validate_required_application_documents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  missing_types text[];
BEGIN
  IF NEW.status = 'submitted' THEN
    SELECT array_agg(required_type)
    INTO missing_types
    FROM unnest(ARRAY['photo', 'cv', 'ktp', 'ijazah', 'transkrip']) AS required_type
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.application_documents d
      WHERE d.application_id = NEW.id
        AND d.user_id = NEW.user_id
        AND d.doc_type = required_type
    );

    IF missing_types IS NOT NULL THEN
      RAISE EXCEPTION 'Berkas wajib belum lengkap: %', array_to_string(missing_types, ', ')
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_required_application_documents() FROM PUBLIC, anon, authenticated;