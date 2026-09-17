import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import {
  FORM_SECTIONS,
  REQUIRED_DOC_TYPES,
  isSectionComplete,
  validateSection,
  type ApplicationData,
} from "@/lib/form-schema";
import {
  fetchDocuments,
  fetchMyRoles,
  fetchOrCreateMyApplication,
  saveApplication,
  type ApplicationRecord,
} from "@/lib/candidate-api";

export const Route = createFileRoute("/_authenticated/formulir")({
  beforeLoad: async () => {
    const roles = await fetchMyRoles();
    if (roles.some((role) => role === "admin" || role === "hr")) {
      throw redirect({ to: "/admin" });
    }
  },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Formulir Lamaran — PT. Dover Chemical" },
      {
        name: "description",
        content:
          "Isi formulir lamaran PT. Dover Chemical, simpan draf, lalu kirim ke HC.",
      },
      { property: "og:title", content: "Formulir Lamaran — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Formulir lamaran online dengan penyimpanan draf dan pengiriman ke HC.",
      },
    ],
  }),
  component: FormPage,
});

function FormPage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState(0);
  const [data, setData] = useState<ApplicationData | null>(null);

  const rolesQuery = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles });
  const appQuery = useQuery<ApplicationRecord>({
    queryKey: ["my-application"],
    queryFn: fetchOrCreateMyApplication,
  });
  const docsQuery = useQuery({
    queryKey: ["my-documents", appQuery.data?.id],
    queryFn: () => {
      if (!appQuery.data) throw new Error("Lamaran belum tersedia");
      return fetchDocuments(appQuery.data.id);
    },
    enabled: Boolean(appQuery.data?.id),
  });

  useEffect(() => {
    if (appQuery.data && !data) setData(appQuery.data.data);
  }, [appQuery.data, data]);

  const [showErrors, setShowErrors] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const lastSavedRef = useRef<string | null>(null);
  const appId = appQuery.data?.id;
  const stepKey = appId ? `dover-form-step:${appId}` : null;

  // Ingat bagian aktif terakhir agar tidak balik ke awal setelah refresh.
  useEffect(() => {
    if (!stepKey) return;
    const saved = Number(window.localStorage.getItem(stepKey));
    if (Number.isInteger(saved) && saved >= 0 && saved < FORM_SECTIONS.length) setActive(saved);
  }, [stepKey]);

  useEffect(() => {
    if (stepKey) window.localStorage.setItem(stepKey, String(active));
  }, [stepKey, active]);

  // Simpan otomatis draf ke server agar isian tidak hilang saat refresh.
  useEffect(() => {
    if (!appId || !data) return;
    const snapshot = JSON.stringify(data);
    if (lastSavedRef.current === null) {
      lastSavedRef.current = snapshot;
      return;
    }
    if (lastSavedRef.current === snapshot) return;
    const timer = window.setTimeout(async () => {
      setAutoSaving(true);
      try {
        await saveApplication(appId, data);
        lastSavedRef.current = snapshot;
        setAutoSavedAt(new Date());
      } catch {
        // biarkan percobaan berikutnya menyimpan ulang
      } finally {
        setAutoSaving(false);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [appId, data]);

  const save = useMutation({
    mutationFn: async (status?: "draft" | "submitted") => {
      if (!appQuery.data || !data) return;
      if (status === "submitted") {
        const incomplete = FORM_SECTIONS.filter((s) => !isSectionComplete(s, data));
        if (incomplete.length > 0) {
          const first = FORM_SECTIONS.findIndex((s) => s.id === incomplete[0]!.id);
          setActive(first);
          setShowErrors(true);
          throw new Error(
            `Lengkapi bagian: ${incomplete.map((s) => `${s.no}. ${s.titleId}`).join(", ")}`,
          );
        }
        const uploadedTypes = new Set((docsQuery.data ?? []).map((doc) => doc.doc_type));
        const missing = REQUIRED_DOC_TYPES.filter((type) => !uploadedTypes.has(type.key));
        if (missing.length > 0) {
          throw new Error(`Lengkapi berkas wajib: ${missing.map((type) => type.label).join(", ")}`);
        }
      }
      await saveApplication(appQuery.data.id, data, status);
    },
    onSuccess: (_r, status) => {
      queryClient.invalidateQueries({ queryKey: ["my-application"] });
      toast.success(status === "submitted" ? "Formulir dikirim ke HC" : "Draf tersimpan");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan, coba lagi"),
  });

  const onChange = (sectionId: string, key: string, value: unknown) =>
    setData((prev) =>
      prev ? { ...prev, [sectionId]: { ...(prev[sectionId] ?? {}), [key]: value } } : prev,
    );

  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");
  const section = FORM_SECTIONS[active];

  const completed = data
    ? FORM_SECTIONS.map((s) => isSectionComplete(s, data))
    : FORM_SECTIONS.map(() => false);
  const firstIncomplete = completed.findIndex((ok) => !ok);
  const maxUnlocked = firstIncomplete === -1 ? FORM_SECTIONS.length - 1 : firstIncomplete;
  const currentComplete = completed[active] === true;
  const errors = data && section && showErrors ? validateSection(section, data) : undefined;

  const goNext = () => {
    if (!currentComplete) {
      setShowErrors(true);
      toast.error("Lengkapi semua isian wajib di bagian ini sebelum lanjut");
      return;
    }
    setShowErrors(false);
    setActive((i) => Math.min(FORM_SECTIONS.length - 1, i + 1));
  };

  if (appQuery.isLoading || !data || !section) {
    return (
      <AppShell isStaff={isStaff}>
        <p className="text-sm text-muted-foreground">Memuat formulir...</p>
      </AppShell>
    );
  }

  return (
    <AppShell isStaff={isStaff}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Formulir Lamaran Kerja</h1>
          <p className="text-sm text-muted-foreground">
            Job Application Form 2026 — isian tersimpan per bagian.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FORM_SECTIONS.map((s, i) => (
          <Button
            key={s.id}
            size="sm"
            variant={i === active ? "default" : "outline"}
            disabled={i > maxUnlocked}
            title={i > maxUnlocked ? "Lengkapi bagian sebelumnya terlebih dahulu" : undefined}
            onClick={() => {
              setShowErrors(false);
              setActive(i);
            }}
          >
            {s.no}. {s.title}
            {completed[i] ? " ✓" : ""}
          </Button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Semua isian bertanda <span className="text-destructive">*</span> wajib diisi. Bagian
        berikutnya terbuka setelah bagian ini lengkap.
      </p>

      <div className="mt-6">
        <FormSection section={section} data={data} onChange={onChange} errors={errors} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={active === 0}
            onClick={() => {
              setShowErrors(false);
              setActive((i) => Math.max(0, i - 1));
            }}
          >
            Sebelumnya
          </Button>
          <Button variant="outline" disabled={active === FORM_SECTIONS.length - 1} onClick={goNext}>
            Selanjutnya
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate("draft")}>
            Simpan draf
          </Button>
          <Button disabled={save.isPending || docsQuery.isLoading} onClick={() => save.mutate("submitted")}>
            Kirim ke HC
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
