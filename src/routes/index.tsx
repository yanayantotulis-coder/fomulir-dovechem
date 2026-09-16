import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Download, Database } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Lamaran Kerja PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Isi formulir lamaran PT. Dover Chemical secara online, simpan sebagai draf, dan unduh hasilnya dalam format PDF, Word, atau Excel.",
      },
      { property: "og:title", content: "Portal Lamaran Kerja PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Formulir lamaran online, bank data kandidat, dan unduhan PDF/Word/Excel.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: FileText,
    title: "Formulir digital lengkap",
    text: "Semua bagian formulir asli Dover Chemical, dari data pribadi hingga paket remunerasi.",
  },
  {
    icon: Database,
    title: "Bank data kandidat",
    text: "Setiap kandidat punya arsip datanya sendiri dan bisa memperbarui kapan saja.",
  },
  {
    icon: Download,
    title: "Unduh PDF, Word, Excel",
    text: "Hasil isian bisa langsung diunduh dalam tiga format untuk kebutuhan cetak dan arsip.",
  },
  {
    icon: ShieldCheck,
    title: "Aman per akun",
    text: "Data hanya bisa dibuka oleh kandidat pemiliknya dan tim HR.",
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
              PT. DOVER CHEMICAL
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Recruitment Portal
            </p>
          </div>
          {signedIn ? (
            <Button asChild>
              <Link to="/dashboard">Buka Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">Masuk / Daftar</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="bg-hero-gradient text-surface-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Application Form 2026
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Isi formulir lamaran sekali, simpan selamanya, unduh kapan saja.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-surface-foreground/80">
            Portal ini memindahkan formulir lamaran PT. Dover Chemical ke sistem online. Kandidat
            cukup membuat akun, mengisi bertahap, mengunggah foto dan dokumen, lalu mengunduh hasil
            isian dalam bentuk PDF, Word, atau Excel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={signedIn ? "/formulir" : "/auth"}>Mulai isi formulir</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-surface-foreground/40 bg-transparent text-surface-foreground hover:bg-surface-foreground/10"
            >
              <Link to="/auth">Sudah punya akun</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground">Kenapa lebih mudah</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <f.icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          PT. Dover Chemical — Human Resources Department
        </div>
      </footer>
    </div>
  );
}
