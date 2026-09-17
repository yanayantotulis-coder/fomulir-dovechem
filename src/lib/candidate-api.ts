import { supabase } from "@/integrations/supabase/client";
import { mergeWithEmpty, type ApplicationData } from "./form-schema";

export type ApplicationRecord = {
  id: string;
  user_id: string;
  position_applied: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  data: ApplicationData;
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
};

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function fetchMyRoles(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return (data ?? []).map((r) => r.role as string);
}

export async function fetchOrCreateMyApplication(): Promise<ApplicationRecord> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Belum masuk");

  const { data: existing, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;

  if (existing && existing.length > 0) {
    const row = existing[0]!;
    return { ...row, data: mergeWithEmpty(row.data) } as ApplicationRecord;
  }

  const seed = mergeWithEmpty({
    personal: {
      fullName: (user.user_metadata?.["full_name"] as string) ?? "",
      email: user.email ?? "",
    },
  });
  const { data: created, error: insertError } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      full_name: (user.user_metadata?.["full_name"] as string) ?? null,
      email: user.email ?? null,
      status: "draft",
      data: seed as never,
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return { ...created, data: mergeWithEmpty(created.data) } as ApplicationRecord;
}

export async function saveApplication(
  id: string,
  data: ApplicationData,
  status?: "draft" | "submitted",
) {
  const personal = (data["personal"] ?? {}) as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    data: data as never,
    full_name: (personal["fullName"] as string) || null,
    email: (personal["email"] as string) || null,
    phone: (personal["currentMobile"] as string) || null,
    position_applied: (personal["position"] as string) || null,
  };
  if (status) {
    payload["status"] = status;
    if (status === "submitted") payload["submitted_at"] = new Date().toISOString();
  }
  const { error } = await supabase.from("applications").update(payload as never).eq("id", id);
  if (error) throw error;
}

export async function fetchAllApplications(): Promise<ApplicationRecord[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, data: mergeWithEmpty(row.data) })) as ApplicationRecord[];
}

export type DocumentRecord = {
  id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

export async function fetchDocuments(applicationId: string): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("application_documents")
    .select("id, doc_type, file_name, file_path, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(
  applicationId: string,
  docType: string,
  file: File,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Belum masuk");
  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${user.id}/${applicationId}/${docType}-${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("candidate-files")
    .upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("application_documents").insert({
    application_id: applicationId,
    user_id: user.id,
    doc_type: docType,
    file_path: path,
    file_name: file.name,
  });
  if (error) throw error;

  if (docType === "photo") {
    await supabase.from("applications").update({ photo_path: path }).eq("id", applicationId);
  }
}

export async function openDocument(filePath: string) {
  const signedUrl = await getDocumentPreviewUrl(filePath);
  window.open(signedUrl, "_blank", "noopener");
}

export async function getDocumentPreviewUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("candidate-files")
    .createSignedUrl(filePath, 60 * 10);
  if (error || !data) throw error ?? new Error("Gagal membuka dokumen");
  return data.signedUrl;
}

export async function deleteDocument(doc: DocumentRecord) {
  const { error } = await supabase.from("application_documents").delete().eq("id", doc.id);
  if (error) throw error;
  const { error: storageError } = await supabase.storage.from("candidate-files").remove([doc.file_path]);
  if (storageError) throw storageError;
}

export type CandidateLoginRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchStaffUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["admin", "hr"]);
  return (data ?? []).map((r) => r.user_id);
}

export async function fetchAllCandidateLogins(): Promise<CandidateLoginRecord[]> {
  const [{ data, error }, staffIds] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at, updated_at")
      .order("created_at", { ascending: false }),
    fetchStaffUserIds(),
  ]);
  if (error) throw error;
  const staff = new Set(staffIds);
  return (data ?? []).filter((p) => !staff.has(p.id));
}

export type AllDocumentRecord = DocumentRecord & {
  application_id: string;
  user_id: string;
};

export async function fetchAllDocuments(): Promise<AllDocumentRecord[]> {
  const { data, error } = await supabase
    .from("application_documents")
    .select("id, doc_type, file_name, file_path, created_at, application_id, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllProfiles(): Promise<CandidateLoginRecord[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
