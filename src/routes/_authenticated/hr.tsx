import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StaffToolbar } from "@/components/staff-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  deleteApplicationWithDocuments,
  fetchAllApplications,
  fetchAllDocuments,
  fetchMyRoles,
  getDocumentPreviewUrl,
  openDocument,
  type AllDocumentRecord,
  type ApplicationRecord,
} from "@/lib/candidate-api";
import {
  downloadCandidateBankXlsx,
  downloadDocx,
  downloadPdf,
  downloadXlsx,
} from "@/lib/exporters";
import {
  downloadAllCandidatesFullZip,
  downloadCandidateFullZip,
} from "@/lib/doc-bundle";
import { DOC_TYPES, REQUIRED_DOC_TYPES } from "@/lib/form-schema";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({
    meta: [
      { title: "Bank Data HC — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Bank data HC PT. Dover Chemical: formulir lamaran dan berkas dokumen setiap kandidat dalam satu halaman, siap diunduh sebagai satu berkas.",
      },
      { property: "og:title", content: "Bank Data HC — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Formulir lamaran dan dokumen kandidat digabung dalam satu bank data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HrPage,
});

function HrPage() {
  const [query, setQuery] = useState("");
  const [zipBusy, setZipBusy] = useState<string | null>(null);
  const [previewCandidate, setPreviewCandidate] = useState<ApplicationRecord | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AllDocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");

  const appsQuery = useQuery<ApplicationRecord[]>({
    queryKey: ["all-applications"],
    queryFn: fetchAllApplications,
    enabled: isStaff,
  });

  const docsQuery = useQuery<AllDocumentRecord[]>({
    queryKey: ["all-documents"],
    queryFn: fetchAllDocuments,
    enabled: isStaff,
  });

  const docsByApp = useMemo(() => {
    const map = new Map<string, AllDocumentRecord[]>();
    for (const doc of docsQuery.data ?? []) {
      const list = map.get(doc.application_id) ?? [];
      list.push(doc);
      map.set(doc.application_id, list);
    }
    return map;
  }, [docsQuery.data]);

  const rows = useMemo(() => {
    const list = appsQuery.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const docNames = (docsByApp.get(r.id) ?? []).map((d) => d.file_name);
      return [r.full_name, r.email, r.phone, r.position_applied, ...docNames]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [appsQuery.data, query, docsByApp]);

  const runZip = async (key: string, task: () => Promise<void>) => {
    setZipBusy(key);
    try {
      await task();
      toast.success("Berkas gabungan berhasil diunduh.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat berkas gabungan.");
    } finally {
      setZipBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteApplicationWithDocuments(deleteTarget.id);
      toast.success("Data kandidat berhasil dihapus.");
      setDeleteTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["all-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["all-documents"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data kandidat.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const showPreview = async (candidate: ApplicationRecord, doc: AllDocumentRecord) => {
    setPreviewCandidate(candidate);
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewBusy(true);
    try {
      setPreviewUrl(await getDocumentPreviewUrl(doc.file_path));
    } catch {
      toast.error("Pratinjau dokumen tidak dapat dimuat.");
    } finally {
      setPreviewBusy(false);
    }
  };

  const closePreview = () => {
    setPreviewCandidate(null);
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "K";

  const previewKind = previewDoc?.file_name.split(".").pop()?.toLowerCase();
  const canEmbed = previewKind === "pdf" || ["png", "jpg", "jpeg", "webp"].includes(previewKind ?? "");

  const totalDocs = docsQuery.data?.length ?? 0;

  if (rolesQuery.isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </AppShell>
    );
  }

  if (!isStaff) {
    return (
      <AppShell>
        <h1 className="font-display text-2xl font-bold text-foreground">Akses terbatas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya untuk tim HC. Hubungi HC jika Anda seharusnya memiliki akses.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell isStaff>
      <div className="flex flex-wrap items-end justify-between gap-4 font-admin">
        <div className="border-l-4 border-admin-accent pl-4">
          <h1 className="font-admin-display text-2xl font-bold text-foreground">Bank Data HC</h1>
          <p className="font-admin text-sm text-muted-foreground">
            {rows.length} kandidat · {totalDocs} dokumen. Formulir lamaran dan berkas dokumen
            digabung dalam satu daftar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCandidateBankXlsx(rows)}>
            <FileSpreadsheet aria-hidden="true" />
            Unduh rekap Excel
          </Button>
          <Button
            disabled={zipBusy !== null || rows.length === 0}
            onClick={() =>
              runZip("all", () =>
                downloadAllCandidatesFullZip(
                  rows.map((r) => ({
                    name: r.full_name || r.email || "Kandidat",
                    data: r.data,
                    docs: docsByApp.get(r.id) ?? [],
                  })),
                ),
              )
            }
          >
            <FileArchive aria-hidden="true" />
            {zipBusy === "all" ? "Menyiapkan..." : "Unduh semua (formulir + dokumen)"}
          </Button>
        </div>
      </div>
      <StaffToolbar />

      <div className="relative mt-5 max-w-xl font-admin">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          className="pl-9"
          placeholder="Cari nama, email, posisi, atau nama file dokumen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel font-admin" aria-label="Daftar kandidat">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">Belum ada kandidat yang cocok.</p>
        ) : null}
        <div className="divide-y divide-border">
          {rows.map((r) => {
              const docs = docsByApp.get(r.id) ?? [];
              const requiredDone = REQUIRED_DOC_TYPES.filter((t) =>
                docs.some((d) => d.doc_type === t.key),
              ).length;
              const candidateName = r.full_name || r.email || "Kandidat";
              return (
                <article key={r.id} className="grid gap-5 p-5 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(240px,1.25fr)_minmax(220px,1fr)_minmax(280px,1.25fr)] lg:items-center">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-admin-display text-sm font-bold text-admin-primary">
                      {initials(candidateName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-admin-display font-semibold text-foreground">{candidateName}</h2>
                    <span
                      className={
                        r.status === "submitted"
                          ? "rounded-full border border-admin-primary/20 bg-secondary px-2 py-0.5 text-[11px] font-bold text-admin-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                      }
                    >
                      {r.status === "submitted" ? "Terkirim" : "Draf"}
                    </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{r.position_applied || "Posisi belum diisi"}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{r.email || "Email belum diisi"}</p>
                      <p className="text-xs text-muted-foreground">{r.phone || "Telepon belum diisi"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-foreground">{docs.length} berkas tersedia</span>
                      <span className={requiredDone === REQUIRED_DOC_TYPES.length ? "font-semibold text-admin-primary" : "font-semibold text-admin-accent"}>
                        Wajib {requiredDone}/{REQUIRED_DOC_TYPES.length}
                      </span>
                    </div>
                    <progress
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted accent-admin-primary [&::-moz-progress-bar]:bg-admin-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-admin-primary"
                      value={requiredDone}
                      max={REQUIRED_DOC_TYPES.length}
                      aria-label={`Kelengkapan dokumen wajib ${requiredDone} dari ${REQUIRED_DOC_TYPES.length}`}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">Diperbarui {new Date(r.updated_at).toLocaleString("id-ID")}</p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex w-full flex-wrap gap-2 lg:justify-end">
                      {docs.slice(0, 2).map((doc) => (
                        <Button key={doc.id} size="sm" variant="outline" className="max-w-[180px]" onClick={() => showPreview(r, doc)}>
                          <Eye aria-hidden="true" />
                          <span className="truncate">{DOC_TYPES.find((d) => d.key === doc.doc_type)?.label ?? doc.doc_type}</span>
                        </Button>
                      ))}
                      {docs.slice(2, 3).map((doc) => (
                        <Button key={`more-${doc.id}`} size="sm" variant="ghost" onClick={() => showPreview(r, doc)}>+{docs.length - 2} lainnya</Button>
                      ))}
                      {docs.length === 0 ? <span className="text-xs text-muted-foreground">Belum ada berkas untuk dipratinjau</span> : null}
                    </div>
                    <div className="flex w-full flex-wrap gap-1.5 lg:justify-end">
                      <Button
                        size="sm"
                        disabled={zipBusy !== null}
                        onClick={() =>
                          runZip(r.id, () => downloadCandidateFullZip(candidateName, r.data, docs))
                        }
                      >
                        <Download aria-hidden="true" />
                        {zipBusy === r.id ? "Menyiapkan..." : "Unduh lengkap"}
                      </Button>
                      <Button size="icon" variant="outline" title="Unduh formulir PDF" aria-label="Unduh formulir PDF" onClick={() => downloadPdf(r.data)}><FileText aria-hidden="true" /></Button>
                      <Button size="icon" variant="outline" title="Unduh formulir Word" aria-label="Unduh formulir Word" onClick={() => downloadDocx(r.data)}><FileText aria-hidden="true" /></Button>
                      <Button size="icon" variant="outline" title="Unduh data Excel" aria-label="Unduh data Excel" onClick={() => downloadXlsx(r.data)}><FileSpreadsheet aria-hidden="true" /></Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        title={`Hapus data ${candidateName}`}
                        aria-label={`Hapus data ${candidateName}`}
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
        <footer className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
          Menampilkan {rows.length} kandidat dan {totalDocs} dokumen
        </footer>
      </section>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !deleteBusy) setDeleteTarget(null); }}>
        <AlertDialogContent className="font-admin">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-admin-display">Hapus data kandidat?</AlertDialogTitle>
            <AlertDialogDescription>
              Data formulir dan seluruh berkas dokumen{" "}
              <strong>{deleteTarget?.full_name || deleteTarget?.email || "kandidat ini"}</strong>{" "}
              akan dihapus permanen dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
            >
              {deleteBusy ? "Menghapus..." : "Hapus permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={previewDoc !== null} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <SheetContent side="right" className="flex w-full flex-col p-0 font-admin sm:max-w-2xl">
          <SheetHeader className="border-b border-border px-6 py-5 pr-12">
            <SheetTitle className="font-admin-display">Pratinjau Berkas</SheetTitle>
            <SheetDescription>{previewCandidate?.full_name || previewCandidate?.email || "Kandidat"}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-hidden p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-admin-accent">{DOC_TYPES.find((d) => d.key === previewDoc?.doc_type)?.label ?? previewDoc?.doc_type}</p>
                <p className="truncate text-sm font-semibold text-foreground">{previewDoc?.file_name}</p>
              </div>
              {previewDoc ? (
                <Button variant="outline" size="sm" onClick={() => openDocument(previewDoc.file_path).catch(() => toast.error("Gagal membuka file"))}>
                  <ExternalLink aria-hidden="true" /> Buka tab baru
                </Button>
              ) : null}
            </div>
            <div className="flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              {previewBusy ? <p className="text-sm text-muted-foreground">Memuat pratinjau...</p> : null}
              {!previewBusy && previewUrl && previewKind === "pdf" ? <iframe title={`Pratinjau ${previewDoc?.file_name ?? "dokumen"}`} src={previewUrl} className="h-full min-h-[620px] w-full bg-card" /> : null}
              {!previewBusy && previewUrl && ["png", "jpg", "jpeg", "webp"].includes(previewKind ?? "") ? <img src={previewUrl} alt={`Pratinjau ${previewDoc?.file_name ?? "dokumen kandidat"}`} className="max-h-full max-w-full object-contain" /> : null}
              {!previewBusy && previewUrl && !canEmbed ? (
                <div className="max-w-sm px-6 text-center">
                  <FileText className="mx-auto size-12 text-admin-primary" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-foreground">Format ini dibuka di tab baru</p>
                  <p className="mt-1 text-sm text-muted-foreground">Gunakan tombol di atas untuk melihat atau mengunduh berkas.</p>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
