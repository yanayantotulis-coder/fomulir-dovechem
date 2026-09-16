import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOC_TYPES, FORM_SECTIONS } from "@/lib/form-schema";
import {
  deleteDocument,
  fetchDocuments,
  fetchMyRoles,
  fetchOrCreateMyApplication,
  openDocument,
  uploadDocument,
  type ApplicationRecord,
  type DocumentRecord,
} from "@/lib/candidate-api";
import { downloadDocx, downloadPdf, downloadXlsx } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Kandidat — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Pantau status lamaran, unggah foto dan dokumen pendukung, serta unduh formulir lamaran Anda.",
      },
      { property: "og:title", content: "Dashboard Kandidat — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Status lamaran, dokumen pendukung, dan unduhan formulir kandidat.",
      },
    ],
  }),
  component: Dashboard,
});

function progressOf(app: ApplicationRecord) {
  let filled = 0;
  let total = 0;
  for (const section of FORM_SECTIONS) {
    for (const field of section.fields ?? []) {
      total += 1;
      const v = (app.data[section.id] ?? {})[field.key];
      if (v !== "" && v !== undefined && v !== null && v !== false) filled += 1;
    }
  }
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}

function Dashboard() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]?.value ?? "photo");

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const appQuery = useQuery<ApplicationRecord>({
    queryKey: ["my-application"],
    queryFn: fetchOrCreateMyApplication,
  });
  const docsQuery = useQuery<DocumentRecord[]>({
    queryKey: ["my-documents", appQuery.data?.id],
    queryFn: () => fetchDocuments(appQuery.data!.id),
    enabled: Boolean(appQuery.data?.id),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => uploadDocument(appQuery.data!.id, docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast.success("Dokumen terunggah");
    },
    onError: () => toast.error("Gagal mengunggah dokumen (maksimal 10 MB)"),
  });

  const remove = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast.success("Dokumen dihapus");
    },
    onError: () => toast.error("Gagal menghapus dokumen"),
  });

  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");
  const app = appQuery.data;

  return (
    <AppShell isStaff={isStaff}>
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Kandidat</h1>
      <p className="text-sm text-muted-foreground">
        Ringkasan lamaran, dokumen pendukung, dan unduhan formulir Anda.
      </p>

      {!app ? (
        <p className="mt-8 text-sm text-muted-foreground">Memuat data...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <p className="label-form">Nama kandidat</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {app.full_name || "Belum diisi"}
              </p>
              <p className="text-sm text-muted-foreground">{app.email}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <p className="label-form">Status</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {app.status === "submitted" ? "Sudah dikirim ke HR" : "Draf"}
              </p>
              <p className="text-sm text-muted-foreground">
                Diperbarui {new Date(app.updated_at).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <p className="label-form">Kelengkapan isian</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{progressOf(app)}%</p>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${progressOf(app)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/formulir">Lanjut isi formulir</Link>
            </Button>
            <Button variant="outline" onClick={() => downloadPdf(app.data)}>
              Unduh PDF
            </Button>
            <Button variant="outline" onClick={() => downloadDocx(app.data)}>
              Unduh Word
            </Button>
            <Button variant="outline" onClick={() => downloadXlsx(app.data)}>
              Unduh Excel
            </Button>
          </div>

          <section className="mt-10 rounded-lg border border-border bg-card p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-foreground">Dokumen Pendukung</h2>
            <p className="text-sm text-muted-foreground">
              Unggah foto 3x4, CV, KTP, ijazah, transkrip, atau sertifikat. Maksimal 10 MB per file.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload.mutate(file);
                  e.target.value = "";
                }}
              />
              <Button disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
                Pilih & unggah file
              </Button>
            </div>

            <ul className="mt-5 divide-y divide-border">
              {(docsQuery.data ?? []).length === 0 ? (
                <li className="py-3 text-sm text-muted-foreground">Belum ada dokumen.</li>
              ) : null}
              {(docsQuery.data ?? []).map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOC_TYPES.find((d) => d.value === doc.doc_type)?.label ?? doc.doc_type} •{" "}
                      {new Date(doc.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openDocument(doc.file_path).catch(() => toast.error("Gagal membuka file"))
                      }
                    >
                      Lihat
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(doc)}>
                      Hapus
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}
