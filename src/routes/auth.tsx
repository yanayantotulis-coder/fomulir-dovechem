import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMyRoles } from "@/lib/candidate-api";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk Portal — Kandidat & Admin PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Masuk sebagai kandidat untuk mengisi formulir lamaran, atau sebagai admin untuk membuka dashboard data kandidat PT. Dover Chemical.",
      },
      { property: "og:title", content: "Masuk Portal — Kandidat & Admin PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Login kandidat dan login admin PT. Dover Chemical dalam satu halaman.",
      },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email({ message: "Format email tidak valid" }).max(255),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter" }).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const validate = (values: { email: string; password: string }) => {
    const parsed = credSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return null;
    }
    return parsed.data;
  };

  const handleSignIn = async () => {
    const creds = validate({ email, password });
    if (!creds) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(creds);
    setLoading(false);
    if (error) {
      toast.error("Gagal masuk: email atau kata sandi salah");
      return;
    }
    toast.success("Berhasil masuk");
    navigate({ to: "/dashboard" });
  };

  const handleAdminSignIn = async () => {
    const creds = validate({ email: adminEmail, password: adminPassword });
    if (!creds) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(creds);
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

  const handleSignUp = async () => {
    const creds = validate({ email, password });
    if (!creds) return;
    if (fullName.trim().length < 3) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...creds,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Email sudah terdaftar" : "Pendaftaran gagal");
      return;
    }
    if (!data.session) {
      toast.success("Akun dibuat. Cek email Anda untuk konfirmasi sebelum masuk.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Gagal masuk dengan Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-lg font-bold text-foreground">
            PT. DOVER CHEMICAL
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Portal Rekrutmen
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-panel">
          <Tabs defaultValue="candidate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="candidate">Kandidat</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="candidate" className="mt-6">
              <h1 className="text-2xl font-bold text-foreground">Akun Kandidat</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Satu akun untuk mengisi, menyimpan, dan mengunduh formulir lamaran Anda.
              </p>

              <Tabs defaultValue="signin" className="mt-5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Masuk</TabsTrigger>
                  <TabsTrigger value="signup">Daftar</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">Email</Label>
                    <Input
                      id="email-in"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-in">Kata sandi</Label>
                    <Input
                      id="pass-in"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={loading} onClick={handleSignIn}>
                    Masuk sebagai kandidat
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-up">Nama lengkap</Label>
                    <Input
                      id="name-up"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-up">Kata sandi</Label>
                    <Input
                      id="pass-up"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={loading} onClick={handleSignUp}>
                    Buat akun
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">atau</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogle}
              >
                Lanjut dengan Google
              </Button>
            </TabsContent>

            <TabsContent value="admin" className="mt-6 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Masuk Admin</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Khusus tim HR dan admin PT. Dover Chemical.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email admin</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@doverchemical.co.id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Kata sandi</Label>
                <Input
                  id="admin-pass"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={loading} onClick={handleAdminSignIn}>
                Masuk sebagai admin
              </Button>
              <p className="text-xs text-muted-foreground">
                Akun admin dibuat oleh HR. Jika belum punya akses, hubungi tim HR.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
