-- Allow admin/HC staff to remove a candidate's application and its document rows
CREATE POLICY "applications delete staff" ON public.applications
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "docs delete staff" ON public.application_documents
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Staff deletions must not be blocked by the required-document guard
CREATE OR REPLACE FUNCTION public.prevent_required_document_removal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) THEN
    RETURN OLD;
  END IF;

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
$function$;
