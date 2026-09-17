import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { StaffToolbar } from "@/components/staff-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchAllCandidateLogins,
  fetchMyRoles,
  type CandidateLoginRecord,
} from "@/lib/candidate-api";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Dashboard admin PT. Dover Chemical: data akun login kandidat, dengan formulir dan dokumen kandidat tergabung di Bank Data HC.",
      },
      { property: "og:title", content: "Dashboard Admin — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Kelola data akun login kandidat PT. Dover Chemical.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [loginQuery, setLoginQuery] = useState("");

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");

  const loginsQuery = useQuery<CandidateLoginRecord[]>({
    queryKey: ["candidate-logins"],
    queryFn: fetchAllCandidateLogins,
    enabled: isStaff,
  });

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
          Halaman ini hanya untuk admin. Hubungi tim HC jika Anda seharusnya memiliki akses.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell isStaff>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-admin-accent pl-4">
          <h1 className="font-admin-display text-2xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="font-admin text-sm text-muted-foreground">
            Data akun login kandidat. Formulir lamaran dan berkas dokumen kini tergabung di Bank
            Data HC.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/hr">Buka Bank Data HC</Link>
        </Button>
      </div>
      <StaffToolbar />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
    </AppShell>
  );
}
