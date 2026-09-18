import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DoverLogo } from "@/components/dover-logo";
import {
  FileText,
  ShieldCheck,
  Download,
  Database,
  UserPlus,
  ClipboardList,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "PT. Dover Chemical — Portal Rekrutmen Online" },
      {
        name: "description",
        content:
          "Portal rekrutmen resmi PT. Dover Chemical. Isi formulir lamaran online, unggah dokumen, dan unduh hasilnya dalam PDF, Word, atau Excel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "PT. Dover Chemical — Portal Rekrutmen Online" },
      {
        property: "og:description",
        content: "Formulir lamaran online, bank data kandidat, dan unduhan PDF/Word/Excel.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: UserPlus,
    step: "Langkah 1",
    title: "Buat akun kandidat",
    text: "Daftar dengan email atau akun Google dalam kurang dari satu menit.",
  },
  {
    icon: ClipboardList,
    step: "Langkah 2",
    title: "Isi formulir bertahap",
    text: "Lengkapi 10 bagian formulir sesuai formulir resmi — tersimpan otomatis sebagai draf.",
  },
  {
    icon: FolderOpen,
    step: "Langkah 3",
    title: "Unggah dokumen",
    text: "Foto 3x4, CV, KTP, ijazah, dan dokumen pendukung lainnya tersimpan aman.",
  },
  {
    icon: Download,
    step: "Langkah 4",
    title: "Unduh & kirim",
    text: "Hasil isian langsung bisa diunduh dalam format PDF, Word, atau Excel.",
  },
];

const highlights = [
  {
    icon: FileText,
    title: "Formulir resmi lengkap",
    text: "Seluruh isi formulir lamaran PT. Dover Chemical: data pribadi, keluarga, pendidikan, pengalaman kerja, hingga remunerasi.",
  },
  {
    icon: Database,
    title: "Bank data kandidat",
    text: "Data Anda tersimpan rapi dan bisa diperbarui kapan saja. Tim HC dapat menelusuri seluruh kandidat dari satu tempat.",
  },
  {
    icon: ShieldCheck,
    title: "Privasi terjaga",
    text: "Data hanya dapat diakses oleh Anda sebagai pemilik akun dan tim HC PT. Dover Chemical.",
  },
];

const checklists = [
  "Data pribadi & informasi keluarga",
  "Riwayat pendidikan & kemampuan bahasa",
  "Pengalaman organisasi & penghargaan",
  "Pengalaman kerja & referensi",
  "Riwayat kesehatan & kontak darurat",
  "Paket remunerasi & pernyataan",
];

const sections = [
  { no: "I", id: "Data Pribadi", en: "Personal Data" },
  { no: "II", id: "Latar Belakang Keluarga", en: "Family Background" },
  { no: "III", id: "Pendidikan & Kemampuan Bahasa", en: "Education & Languages" },
  { no: "IV", id: "Organisasi & Prestasi", en: "Organization & Achievements" },
  { no: "V", id: "Pengalaman Kerja", en: "Working Experience" },
  { no: "VI", id: "Riwayat Kesehatan", en: "Medical Record" },
  { no: "VII", id: "Referensi & Kontak Darurat", en: "References & Emergency" },
  { no: "VIII", id: "Ketersediaan & Latar Belakang", en: "Availability & Background" },
  { no: "IX", id: "Remunerasi", en: "Remuneration" },
  { no: "X", id: "Pernyataan & Tanda Tangan", en: "Declaration & Signature" },
];

const documents = [
  { title: "Foto 3x4", text: "Foto formal terbaru, tampak jelas, format JPG atau PNG." },
  { title: "Curriculum Vitae", text: "CV terbaru berisi riwayat pendidikan dan pengalaman kerja." },
  { title: "KTP", text: "Kartu identitas yang masih berlaku dan terbaca jelas." },
  { title: "Ijazah & Transkrip", text: "Ijazah pendidikan terakhir beserta transkrip nilai." },
];

const stages = [
  { title: "Seleksi administrasi", text: "Tim HC memeriksa kelengkapan formulir dan dokumen Anda." },
  { title: "Wawancara HC", text: "Pembahasan riwayat kerja, motivasi, dan ekspektasi remunerasi." },
  { title: "Wawancara user", text: "Diskusi teknis bersama calon atasan langsung di departemen." },
  { title: "Penawaran kerja", text: "Kandidat terpilih menerima penawaran resmi dari perusahaan." },
];

const faqs = [
  {
    q: "Apakah formulir harus diisi sekali selesai?",
    a: "Tidak. Setiap bagian dapat disimpan sebagai draf dan dilanjutkan kapan saja dari akun Anda.",
  },
  {
    q: "Bagaimana kalau saya perlu memperbaiki isian setelah terkirim?",
    a: "Buka kembali formulir dari akun Anda, perbaiki bagian yang salah, lalu kirim ulang ke HC.",
  },
  {
    q: "Apakah tanda tangan bisa dilakukan online?",
    a: "Ya. Pada bagian pernyataan Anda menandatangani langsung di layar, dan tanda tangan itu ikut tercetak pada berkas formulir.",
  },
  {
    q: "Siapa yang bisa melihat data saya?",
    a: "Hanya Anda sebagai pemilik akun dan tim HC PT. Dover Chemical. Kandidat lain tidak dapat melihat data Anda.",
  },
  {
    q: "Apakah ada biaya dalam proses rekrutmen?",
    a: "Tidak ada. Seluruh proses rekrutmen PT. Dover Chemical tidak dikenakan biaya apa pun.",
  },
];


function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <DoverLogo className="h-14 w-auto" />
          </div>
          <nav className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild>
                <Link to="/dashboard">
                  Buka Dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/auth-admin">Login Admin</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Login / Daftar Kandidat</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-gradient text-surface-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Formulir Lamaran 2026
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Satu portal untuk seluruh proses lamaran Anda.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-foreground/80 md:text-lg">
            PT. Dover Chemical kini menerima lamaran sepenuhnya online. Isi formulir resmi,
            unggah dokumen pendukung, dan unduh hasilnya — semua dari satu akun, tanpa formulir
            kertas.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={signedIn ? "/formulir" : "/auth"}>
                Mulai Melamar <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
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

      {/* Langkah-langkah */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Cara melamar
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
          Empat langkah sederhana
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-card p-6 shadow-panel"
            >
              <s.icon className="h-7 w-7 text-accent" aria-hidden />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {s.step}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Isi formulir */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Isi formulir
            </p>
            <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
              Persis seperti formulir resmi, tanpa kertas
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Formulir online ini mengikuti seluruh struktur formulir lamaran resmi PT. Dover
              Chemical. Anda bisa mengisi bertahap — setiap bagian tersimpan otomatis, jadi tidak
              harus selesai dalam satu kali duduk.
            </p>
            <Button asChild className="mt-6" variant="secondary">
              <Link to={signedIn ? "/formulir" : "/auth"}>
                Lihat formulir <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-3 self-center sm:grid-cols-2">
            {checklists.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Daftar 10 bagian formulir */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Isi formulir lengkap
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
          10 bagian yang akan Anda isi
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Urutan dan pertanyaannya sama dengan formulir lamaran resmi PT. Dover Chemical, dalam
          dua bahasa (Indonesia dan Inggris).
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div
              key={s.no}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="mt-0.5 flex h-7 w-9 shrink-0 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
                {s.no}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.id}</p>
                <p className="text-xs text-muted-foreground">{s.en}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dokumen yang disiapkan */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Sebelum mulai
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            Dokumen yang perlu disiapkan
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map((d) => (
              <div key={d.title} className="rounded-lg border border-border bg-background p-6">
                <FolderOpen className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-4 text-base font-semibold text-foreground">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Ukuran berkas maksimal 5 MB per dokumen. Dokumen dapat diganti kapan saja selama
            proses seleksi berjalan.
          </p>
        </div>
      </section>

      {/* Tahapan seleksi */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Setelah formulir dikirim
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">Tahapan seleksi</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-border bg-card p-6 shadow-panel">
              <span className="text-2xl font-bold text-accent">{i + 1}</span>
              <h3 className="mt-2 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>


      {/* Keunggulan */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          Kenapa melamar lewat portal ini
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {highlights.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-6 shadow-panel"
            >
              <f.icon className="h-7 w-7 text-accent" aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Pertanyaan umum
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            Hal yang sering ditanyakan kandidat
          </h2>
          <dl className="mt-10 divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-sm font-semibold text-foreground md:text-base">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA akhir */}

      <section className="bg-hero-gradient text-surface-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold md:text-4xl">
            Siap bergabung dengan PT. Dover Chemical?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-surface-foreground/80 md:text-base">
            Buat akun sekarang dan mulai isi formulir lamaran Anda hari ini.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to={signedIn ? "/formulir" : "/auth"}>
              Daftar & Isi Formulir <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PT. Dover Chemical — Human Resources Department</p>
          <p className="text-xs uppercase tracking-[0.2em]">Portal Rekrutmen Resmi</p>
        </div>
      </footer>
    </div>
  );
}
