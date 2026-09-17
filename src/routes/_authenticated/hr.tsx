import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StaffToolbar } from "@/components/staff-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchAllApplications,
  fetchAllDocuments,
  fetchMyRoles,
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
      { title: "Bank Data HR — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Bank data HR PT. Dover Chemical: formulir lamaran dan berkas dokumen setiap kandidat dalam satu halaman, siap diunduh sebagai satu berkas.",
      },
      { property: "og:title", content: "Bank Data HR — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Formulir lamaran dan dokumen kandidat digabung dalam satu bank data.",
      },
    ],
  }),
  component: HrPage,
});

function HrPage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState<string | null>(null);

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
          Halaman ini hanya untuk tim HR. Hubungi HR jika Anda seharusnya memiliki akses.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell isStaff>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-admin-accent pl-4">
          <h1 className="font-admin-display text-2xl font-bold text-foreground">Bank Data HR</h1>
          <p className="font-admin text-sm text-muted-foreground">
            {rows.length} kandidat · {totalDocs} dokumen. Formulir lamaran dan berkas dokumen
            digabung dalam satu daftar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCandidateBankXlsx(rows)}>
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
            {zipBusy === "all" ? "Menyiapkan..." : "Unduh semua (formulir + dokumen)"}
          </Button>
        </div>
      </div>
      <StaffToolbar />

      <div className="mt-5 max-w-md">
        <Input
          placeholder="Cari nama, email, posisi, atau nama file dokumen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card shadow-panel">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              {["Nama", "Posisi", "Kontak", "Formulir", "Dokumen", "Diperbarui", "Unduh"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Belum ada kandidat yang cocok.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => {
              const docs = docsByApp.get(r.id) ?? [];
              const requiredDone = REQUIRED_DOC_TYPES.filter((key) =>
                docs.some((d) => d.doc_type === key),
              ).length;
              const candidateName = r.full_name || r.email || "Kandidat";
              return (
                <tr key={r.id} className="border-b border-border/60 align-top even:bg-muted/20">
                  <td className="px-3 py-3 font-medium text-foreground">{r.full_name || "-"}</td>
                  <td className="px-3 py-3">{r.position_applied || "-"}</td>
                  <td className="px-3 py-3">
                    <span className="block">{r.email || "-"}</span>
                    <span className="text-xs text-muted-foreground">{r.phone || "-"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        r.status === "submitted"
                          ? "rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-foreground"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                      }
                    >
                      {r.status === "submitted" ? "Terkirim" : "Draf"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    >
                      <span className="font-medium text-foreground underline-offset-2 hover:underline">
                        {docs.length} berkas
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Wajib {requiredDone}/{REQUIRED_DOC_TYPES.length}
                      </span>
                    </button>
                    {openId === r.id ? (
                      <ul className="mt-2 space-y-1.5">
                        {docs.length === 0 ? (
                          <li className="text-xs text-muted-foreground">Belum ada dokumen.</li>
                        ) : null}
                        {docs.map((doc) => (
                          <li key={doc.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {DOC_TYPES.find((d) => d.key === doc.doc_type)?.label ?? doc.doc_type}
                            </span>
                            <Button
                              size="sm"
                              variant="link"
                              className="h-auto p-0 text-xs"
                              onClick={() =>
                                openDocument(doc.file_path).catch(() =>
                                  toast.error("Gagal membuka file"),
                                )
                              }
                            >
                              {doc.file_name}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        disabled={zipBusy !== null}
                        onClick={() =>
                          runZip(r.id, () => downloadCandidateFullZip(candidateName, r.data, docs))
                        }
                      >
                        {zipBusy === r.id ? "Menyiapkan..." : "1 berkas lengkap"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadPdf(r.data)}>
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadDocx(r.data)}>
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadXlsx(r.data)}>
                        Excel
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
