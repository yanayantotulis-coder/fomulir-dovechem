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
  fetchDocuments,
  fetchMyRoles,
  openDocument,
  type ApplicationRecord,
} from "@/lib/candidate-api";
import {
  downloadCandidateBankXlsx,
  downloadDocx,
  downloadPdf,
  downloadXlsx,
} from "@/lib/exporters";
import { DOC_TYPES } from "@/lib/form-schema";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({
    meta: [
      { title: "Bank Data Kandidat — HR PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Halaman HR untuk mencari kandidat, melihat dokumen, dan mengunduh rekap bank data dalam Excel, PDF, atau Word.",
      },
      { property: "og:title", content: "Bank Data Kandidat — HR PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Cari, tinjau, dan unduh data seluruh kandidat PT. Dover Chemical.",
      },
    ],
  }),
  component: HrPage,
});

function HrPage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");

  const appsQuery = useQuery<ApplicationRecord[]>({
    queryKey: ["all-applications"],
    queryFn: fetchAllApplications,
    enabled: isStaff,
  });

  const docsQuery = useQuery({
    queryKey: ["candidate-documents", openId],
    queryFn: () => fetchDocuments(openId!),
    enabled: Boolean(openId),
  });

  const rows = useMemo(() => {
    const list = appsQuery.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.full_name, r.email, r.phone, r.position_applied]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [appsQuery.data, query]);

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
           <h1 className="font-admin-display text-2xl font-bold text-foreground">Bank Data Kandidat</h1>
           <p className="font-admin text-sm text-muted-foreground">
            {rows.length} kandidat terdaftar dalam sistem.
          </p>
        </div>
        <Button onClick={() => downloadCandidateBankXlsx(rows)}>Unduh rekap Excel</Button>
      </div>
       <StaffToolbar />

      <div className="mt-5 max-w-md">
        <Input
          placeholder="Cari nama, email, telepon, atau posisi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card shadow-panel">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              {["Nama", "Posisi", "Kontak", "Status", "Diperbarui", "Aksi"].map((h) => (
                <th
                  key={h}
                  className="border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Belum ada kandidat yang cocok.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
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
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {new Date(r.updated_at).toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(r.data)}>
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadDocx(r.data)}>
                      Word
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadXlsx(r.data)}>
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    >
                      {openId === r.id ? "Tutup dokumen" : "Dokumen"}
                    </Button>
                  </div>
                  {openId === r.id ? (
                    <ul className="mt-3 space-y-1.5">
                      {(docsQuery.data ?? []).length === 0 ? (
                        <li className="text-xs text-muted-foreground">Belum ada dokumen.</li>
                      ) : null}
                      {(docsQuery.data ?? []).map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
