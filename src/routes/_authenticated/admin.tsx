import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchAllCandidateLogins,
  fetchAllDocuments,
  fetchAllProfiles,
  fetchMyRoles,
  openDocument,
  type AllDocumentRecord,
  type CandidateLoginRecord,
} from "@/lib/candidate-api";
import { DOC_TYPES } from "@/lib/form-schema";
import {
  downloadAllCandidateDocsZip,
  downloadCandidateDocsZip,
} from "@/lib/doc-bundle";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Dashboard admin PT. Dover Chemical: data login kandidat dan data dokumen kandidat dalam halaman terpisah.",
      },
      { property: "og:title", content: "Dashboard Admin — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Kelola data akun login kandidat dan dokumen kandidat.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [loginQuery, setLoginQuery] = useState("");
  const [docQuery, setDocQuery] = useState("");

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");

  const loginsQuery = useQuery<CandidateLoginRecord[]>({
    queryKey: ["candidate-logins"],
    queryFn: fetchAllCandidateLogins,
    enabled: isStaff,
  });

  const docsQuery = useQuery<AllDocumentRecord[]>({
    queryKey: ["all-documents"],
    queryFn: fetchAllDocuments,
    enabled: isStaff,
  });

  const profilesQuery = useQuery<CandidateLoginRecord[]>({
    queryKey: ["all-profiles"],
    queryFn: fetchAllProfiles,
    enabled: isStaff,
  });

  const nameByUser = useMemo(() => {
    const map = new Map<string, CandidateLoginRecord>();
    for (const p of profilesQuery.data ?? []) map.set(p.id, p);
    return map;
  }, [profilesQuery.data]);

  const logins = useMemo(() => {
    const q = loginQuery.trim().toLowerCase();
    const list = loginsQuery.data ?? [];
    if (!q) return list;
    return list.filter((p) =>
      [p.full_name, p.email, p.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [loginsQuery.data, loginQuery]);

  const docs = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    const list = docsQuery.data ?? [];
    if (!q) return list;
    return list.filter((d) => {
      const p = nameByUser.get(d.user_id);
      return [p?.full_name, p?.email, d.file_name, d.doc_type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [docsQuery.data, docQuery, nameByUser]);

  const docGroups = useMemo(() => {
    const map = new Map<string, { name: string; email: string; docs: AllDocumentRecord[] }>();
    for (const d of docs) {
      const p = nameByUser.get(d.user_id);
      const entry = map.get(d.user_id) ?? {
        name: p?.full_name || p?.email || "Kandidat tanpa nama",
        email: p?.email || "-",
        docs: [],
      };
      entry.docs.push(d);
      map.set(d.user_id, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [docs, nameByUser]);

  const [zipBusy, setZipBusy] = useState<string | null>(null);

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
          Halaman ini hanya untuk admin. Hubungi tim HR jika Anda seharusnya memiliki akses.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell isStaff>
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Admin</h1>
      <p className="text-sm text-muted-foreground">
        Data akun login kandidat dan data dokumen kandidat ditampilkan terpisah.
      </p>

      <Tabs defaultValue="logins" className="mt-6">
        <TabsList>
          <TabsTrigger value="logins">Data Login Kandidat</TabsTrigger>
          <TabsTrigger value="docs">Data Dokumen Kandidat</TabsTrigger>
        </TabsList>

        <TabsContent value="logins" className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{logins.length} akun kandidat</p>
            <Input
              className="max-w-xs"
              placeholder="Cari nama, email, atau telepon..."
              value={loginQuery}
              onChange={(e) => setLoginQuery(e.target.value)}
            />
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card shadow-panel">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {["Nama", "Email login", "Telepon", "Terdaftar"].map((h) => (
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
                {logins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      Belum ada akun kandidat.
                    </td>
                  </tr>
                ) : null}
                {logins.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 even:bg-muted/20">
                    <td className="px-3 py-3 font-medium text-foreground">{p.full_name || "-"}</td>
                    <td className="px-3 py-3">{p.email || "-"}</td>
                    <td className="px-3 py-3">{p.phone || "-"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {docs.length} dokumen dari {docGroups.length} kandidat
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-xs"
                placeholder="Cari kandidat atau nama file..."
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
              />
              <Button
                disabled={zipBusy !== null || docGroups.length === 0}
                onClick={() =>
                  runZip("all", () =>
                    downloadAllCandidateDocsZip(
                      docGroups.map((g) => ({ name: g.name, docs: g.docs })),
                    ),
                  )
                }
              >
                {zipBusy === "all" ? "Menyiapkan..." : "Unduh semua (1 berkas)"}
              </Button>
            </div>
          </div>

          {docGroups.length === 0 ? (
            <p className="mt-6 rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-panel">
              Belum ada dokumen kandidat.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            {docGroups.map((group) => (
              <div
                key={group.name + group.email}
                className="rounded-lg border border-border bg-card shadow-panel"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="font-display font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.email} · {group.docs.length} dokumen
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={zipBusy !== null}
                    onClick={() =>
                      runZip(group.name, () => downloadCandidateDocsZip(group.name, group.docs))
                    }
                  >
                    {zipBusy === group.name
                      ? "Menyiapkan..."
                      : "Unduh dokumen kandidat (1 berkas)"}
                  </Button>
                </div>
                <ul className="divide-y divide-border/60">
                  {group.docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {DOC_TYPES.find((t) => t.key === d.doc_type)?.label ?? d.doc_type}
                        </span>
                        <span className="ml-2 text-muted-foreground">{d.file_name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openDocument(d.file_path).catch(() => toast.error("Gagal membuka file"))
                        }
                      >
                        Lihat
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
