CREATE OR REPLACE FUNCTION public.validate_required_application_documents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  missing_types text[];
BEGIN
  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
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

CREATE TRIGGER applications_validate_required_documents
BEFORE UPDATE OF status ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.validate_required_application_documents();

CREATE OR REPLACE FUNCTION public.prevent_required_document_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.doc_type = ANY (ARRAY['photo', 'cv', 'ktp', 'ijazah', 'transkrip'])
     AND EXISTS (
       SELECT 1 FROM public.applications a
       WHERE a.id = OLD.application_id AND a.status = 'submitted'
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.application_documents d
       WHERE d.application_id = OLD.application_id
         AND d.doc_type = OLD.doc_type
         AND d.id <> OLD.id
     ) THEN
    RAISE EXCEPTION 'Dokumen wajib pada lamaran yang sudah dikirim tidak dapat dihapus'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_required_document_removal() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER application_documents_prevent_required_removal
BEFORE DELETE ON public.application_documents
FOR EACH ROW
EXECUTE FUNCTION public.prevent_required_document_removal();