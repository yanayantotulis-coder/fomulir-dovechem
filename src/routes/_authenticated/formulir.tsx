import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { FORM_SECTIONS, type ApplicationData } from "@/lib/form-schema";
import {
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
          "Isi formulir lamaran PT. Dover Chemical, simpan draf, lalu kirim ke HR.",
      },
      { property: "og:title", content: "Formulir Lamaran — PT. Dover Chemical" },
      {
        property: "og:description",
        content: "Formulir lamaran online dengan penyimpanan draf dan pengiriman ke HR.",
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

  useEffect(() => {
    if (appQuery.data && !data) setData(appQuery.data.data);
  }, [appQuery.data, data]);

  const save = useMutation({
    mutationFn: async (status?: "draft" | "submitted") => {
      if (!appQuery.data || !data) return;
      await saveApplication(appQuery.data.id, data, status);
    },
    onSuccess: (_r, status) => {
      queryClient.invalidateQueries({ queryKey: ["my-application"] });
      toast.success(status === "submitted" ? "Formulir dikirim ke HR" : "Draf tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan, coba lagi"),
  });

  const onChange = (sectionId: string, key: string, value: unknown) =>
    setData((prev) =>
      prev ? { ...prev, [sectionId]: { ...(prev[sectionId] ?? {}), [key]: value } } : prev,
    );

  const isStaff = (rolesQuery.data ?? []).some((r) => r === "hr" || r === "admin");
  const section = FORM_SECTIONS[active];

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
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FORM_SECTIONS.map((s, i) => (
          <Button
            key={s.id}
            size="sm"
            variant={i === active ? "default" : "outline"}
            onClick={() => setActive(i)}
          >
            {s.no}. {s.title}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        <FormSection section={section} data={data} onChange={onChange} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={active === 0}
            onClick={() => setActive((i) => Math.max(0, i - 1))}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={active === FORM_SECTIONS.length - 1}
            onClick={() => setActive((i) => Math.min(FORM_SECTIONS.length - 1, i + 1))}
          >
            Selanjutnya
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate("draft")}>
            Simpan draf
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate("submitted")}>
            Kirim ke HR
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
