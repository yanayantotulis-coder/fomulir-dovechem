import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { DoverLogo } from "@/components/dover-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const credSchema = z.object({
  email: z.string().trim().email({ message: "Format email tidak valid" }).max(255),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter" }).max(72),
});

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: true },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk Kandidat — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Masuk atau daftar sebagai kandidat untuk mengisi, menyimpan, dan mengunduh formulir lamaran PT. Dover Chemical.",
      },
      { property: "og:title", content: "Masuk Kandidat — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Login kandidat PT. Dover Chemical.",
      },
      { property: "og:url", content: "https://fomulir-dovechem.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://fomulir-dovechem.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          <Link to="/" className="flex items-center">
            <DoverLogo className="h-14 w-auto" />
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Portal Kandidat
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-panel">
          <h1 className="text-2xl font-bold text-foreground">Akun Kandidat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu akun untuk mengisi, menyimpan, dan mengunduh formulir lamaran Anda.
          </p>

          <Tabs defaultValue="signin" className="mt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loading) void handleSignIn();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email-in">Email</Label>
                  <Input
                    id="email-in"
                    type="email"
                    autoComplete="email"
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Masuk sebagai kandidat"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loading) void handleSignUp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name-up">Nama lengkap</Label>
                  <Input
                    id="name-up"
                    autoComplete="name"
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
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-up">Kata sandi</Label>
                  <Input
                    id="pass-up"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Buat akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">atau</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" disabled={loading} onClick={handleGoogle}>
            Lanjut dengan Google
          </Button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Anda bagian dari tim HC/admin?{" "}
            <Link to="/auth-admin" className="font-medium text-primary underline">
              Masuk lewat portal admin
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
