import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DoverLogo } from "@/components/dover-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchMyRoles } from "@/lib/candidate-api";
import { credSchema } from "./auth";

export const Route = createFileRoute("/auth-admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk Admin — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Login khusus tim HC dan admin PT. Dover Chemical untuk membuka dashboard data kandidat dan dokumen.",
      },
      { property: "og:title", content: "Masuk Admin — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Portal admin PT. Dover Chemical.",
      },
    ],
  }),
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const roles = await fetchMyRoles();
      if (roles.some((r) => r === "admin" || r === "hr")) {
        navigate({ to: "/admin", replace: true });
      }
    });
  }, [navigate]);

  const handleAdminSignIn = async () => {
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setLoading(false);
      toast.error("Gagal masuk: email atau kata sandi salah");
      return;
    }
    const roles = await fetchMyRoles();
    setLoading(false);
    if (!roles.some((r) => r === "admin" || r === "hr")) {
      await supabase.auth.signOut();
      toast.error("Akun ini bukan akun admin");
      return;
    }
    toast.success("Berhasil masuk sebagai admin");
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center">
            <DoverLogo className="h-14 w-auto" />
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Portal Admin
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-panel">
          <h1 className="text-2xl font-bold text-foreground">Masuk Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khusus tim HC dan admin PT. Dover Chemical.
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) void handleAdminSignIn();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email admin</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dovechem.co.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Kata sandi</Label>
              <Input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk sebagai admin"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Akun admin dibuat oleh HC. Jika belum punya akses, hubungi tim HC.
          </p>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Anda kandidat?{" "}
            <Link to="/auth" className="font-medium text-primary underline">
              Masuk lewat portal kandidat
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
