import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, ClipboardList, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const roles = await fetchMyRoles();
    if (roles.some((role) => role === "admin" || role === "hr")) {
      throw redirect({ to: "/admin" });
    }
  },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Dashboard Kandidat — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Isi formulir lamaran dan unggah foto serta dokumen pendukung Anda.",
      },
      { property: "og:title", content: "Dashboard Kandidat — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Pengisian formulir dan unggah dokumen kandidat.",
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

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const appQuery = useQuery<ApplicationRecord>({
    queryKey: ["my-application"],
    queryFn: fetchOrCreateMyApplication,
  });
  const docsQuery = useQuery<DocumentRecord[]>({
    queryKey: ["my-documents", appQuery.data?.id],
    queryFn: () => {
      if (!appQuery.data) throw new Error("Lamaran belum tersedia");
      return fetchDocuments(appQuery.data.id);
    },
    enabled: Boolean(appQuery.data?.id),
  });

  const upload = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      if (!appQuery.data) throw new Error("Lamaran belum tersedia");
      return uploadDocument(appQuery.data.id, type, file);
    },
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
        Formulir lamaran dan berkas dokumen Anda.
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

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <section className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ClipboardList aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Langkah 1</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">Isi Formulir Lamaran</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lengkapi seluruh data diri dan simpan sebelum dikirim ke HR.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-md bg-muted p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">Kelengkapan formulir</span>
                  <span className="font-semibold text-foreground">{progressOf(app)}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-background">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${progressOf(app)}%` }} />
                </div>
              </div>
              <Button asChild className="mt-5 w-full">
                <Link to="/formulir">
                  {progressOf(app) > 0 ? "Lanjutkan pengisian" : "Mulai isi formulir"}
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Upload aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Langkah 2</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">Unggah Berkas Pendukung</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pilih tombol pada jenis berkas yang sesuai. PDF, JPG, PNG, DOC, atau DOCX; maksimal 10 MB.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {DOC_TYPES.map((type) => {
                  const files = (docsQuery.data ?? []).filter((doc) => doc.doc_type === type.key);
                  const latest = files[files.length - 1];
                  const isUploading = upload.isPending && upload.variables?.type === type.key;
                  return (
                    <div key={type.key} className="rounded-md border border-border bg-background p-4">
                      <div className="flex min-h-10 items-start gap-3">
                        {latest ? (
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{type.label}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {latest ? latest.file_name : "Belum diunggah"}
                          </p>
                        </div>
                      </div>
                      <input
                        id={`upload-${type.key}`}
                        type="file"
                        accept={type.key === "photo" ? "image/jpeg,image/png" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) upload.mutate({ file, type: type.key });
                          event.target.value = "";
                        }}
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant={latest ? "outline" : "default"}>
                          <label htmlFor={`upload-${type.key}`}>
                            <Upload aria-hidden="true" />
                            {isUploading ? "Mengunggah..." : latest ? "Ganti file" : "Pilih file"}
                          </label>
                        </Button>
                        {latest ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openDocument(latest.file_path).catch(() => toast.error("Gagal membuka file"))
                              }
                            >
                              Lihat
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => remove.mutate(latest)}>
                              Hapus
                            </Button>
                          </>
                        ) : null}
                      </div>
                      {files.length > 1 ? (
                        <p className="mt-2 text-xs text-muted-foreground">{files.length} file tersimpan</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
