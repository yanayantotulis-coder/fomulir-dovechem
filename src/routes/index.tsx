import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DoverLogo } from "@/components/dover-logo";
import { ArrowRight, CheckCircle2 } from "lucide-react";

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
      { property: "og:url", content: "https://fomulir-dovechem.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://fomulir-dovechem.lovable.app/" }],
  }),
  component: Landing,
});

const steps = [
  {
    title: "Buat Akun",
    text: "Daftarkan diri menggunakan email aktif Anda dalam kurang dari satu menit.",
  },
  {
    title: "Lengkapi Formulir",
    text: "Isi 10 bagian formulir resmi secara bertahap — tersimpan otomatis setiap saat.",
  },
  {
    title: "Unggah Dokumen",
    text: "Unggah foto, CV, KTP, ijazah, dan transkrip nilai langsung dari akun Anda.",
  },
  {
    title: "Kirim ke HC",
    text: "Kirim lamaran Anda dan pantau statusnya melalui dashboard kandidat.",
  },
];

const documents = [
  "Foto 3x4",
  "Curriculum Vitae (CV)",
  "KTP / Identitas Diri",
  "Ijazah Terakhir",
  "Transkrip Nilai",
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
    <div className="flex min-h-screen w-full flex-col bg-white font-landing text-landing-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-gray-100 bg-white px-4 md:px-12">
        <div className="flex items-center gap-3">
          <DoverLogo className="h-12 w-auto md:h-14" />
        </div>
        <nav className="flex items-center gap-4">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="bg-dover-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-dover-blue-dark active:scale-95 rounded-full"
            >
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth-admin"
                className="text-sm font-semibold text-gray-500 transition-colors hover:text-dover-blue"
              >
                Login Admin
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-dover-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-dover-blue-dark active:scale-95"
              >
                Masuk / Daftar Kandidat
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content: Split Screen */}
      <main className="flex flex-1 flex-col md:flex-row">
        {/* Left Panel: Hero CTA */}
        <section className="relative flex w-full flex-col justify-center overflow-hidden bg-dover-blue p-8 text-white md:w-1/2 md:p-20">
          <div className="absolute -mr-32 -mt-32 right-0 top-0 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative z-10">
            <span className="font-display mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              Portal Karir Resmi
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Mulai Karir Anda <br /> <span className="text-dover-sky">Bersama Kami.</span>
            </h1>
            <p className="mb-10 max-w-md text-base leading-relaxed text-blue-100/80 md:text-lg">
              Bergabunglah dengan tim profesional kami dan berkontribusi dalam inovasi industri
              kimia berkelanjutan di Indonesia.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to={signedIn ? "/formulir" : "/auth"}
                className="group flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-dover-blue shadow-lg transition-all hover:bg-[#F0F7FC]"
              >
                {signedIn ? "Lanjutkan Lamaran" : "Daftar Sekarang"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Right Panel: Information */}
        <section className="flex w-full flex-col justify-center bg-landing-surface p-8 md:w-1/2 md:p-20">
          <div className="mx-auto w-full max-w-md space-y-10">
            {/* Steps */}
            <div>
              <h2 className="font-display mb-8 flex items-center gap-3 text-2xl font-bold text-dover-blue">
                <span className="h-1 w-8 rounded-full bg-dover-blue" />
                Langkah Pendaftaran
              </h2>
              <div className="space-y-6">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-dover-blue">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-gray-500">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="font-display mb-4 text-lg font-bold text-dover-blue">
                Dokumen Wajib (PDF/JPG)
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {documents.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-white px-6 py-6 md:flex-row md:px-12">
        <p className="text-xs text-gray-400">
          © 2026 PT. Dover Chemical. Seluruh hak cipta dilindungi.
        </p>
        <div className="flex gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Portal Rekrutmen Resmi
          </span>
        </div>
      </footer>
    </div>
  );
}
