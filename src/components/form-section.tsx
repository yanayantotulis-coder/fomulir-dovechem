import {
  LANGUAGE_LEVELS,
  SCHOOL_LEVELS,
  isFieldRequired,
  isTableRequired,
  type Section,
  type SectionErrors,
  type TableDef,
  type Field,
  type ApplicationData,
} from "@/lib/form-schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";

type Row = Record<string, unknown>;

type Props = {
  section: Section;
  data: ApplicationData;
  onChange: (sectionId: string, key: string, value: unknown) => void;
  errors?: SectionErrors | undefined;
};

export function FormSection({ section, data, onChange, errors }: Props) {
  const values = (data[section.id] ?? {}) as Record<string, unknown>;

  const setTableRows = (table: TableDef, rows: Row[]) => onChange(section.id, table.key, rows);

  const renderField = (field: Field) => {
    const value = values[field.key];
    const id = `${section.id}-${field.key}`;
    const required = isFieldRequired(section.id, field.key);
    const error = errors?.fields[field.key];
    return (
      <div key={field.key} className={field.full || field.type === "textarea" ? "md:col-span-2" : ""}>
        <label htmlFor={id} className="label-form">
          {field.label}
          <span className="ml-1 font-normal normal-case text-muted-foreground/70">
            / {field.labelId}
          </span>
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : (
            <span className="ml-1 font-normal normal-case text-muted-foreground/60">
              (opsional)
            </span>
          )}
        </label>
        <div className="mt-1.5">
          {field.type === "textarea" ? (
            <Textarea
              id={id}
              rows={3}
              value={String(value ?? "")}
              onChange={(e) => onChange(section.id, field.key, e.target.value)}
            />
          ) : field.type === "select" ? (
            <Select
              value={String(value ?? "")}
              onValueChange={(v) => onChange(section.id, field.key, v)}
            >
              <SelectTrigger id={id}>
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "signature" ? (
            <SignaturePad
              value={String(value ?? "")}
              onChange={(v) => onChange(section.id, field.key, v)}
            />
          ) : field.type === "checkbox" ? (
            <div className="flex h-9 items-center">
              <Checkbox
                id={id}
                checked={Boolean(value)}
                onCheckedChange={(c) => onChange(section.id, field.key, Boolean(c))}
              />
            </div>
          ) : (
            <Input
              id={id}
              type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
              value={String(value ?? "")}
              onChange={(e) => onChange(section.id, field.key, e.target.value)}
            />
          )}
        </div>
        {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
      </div>
    );
  };

  const renderTable = (table: TableDef) => {
    const rows = (Array.isArray(values[table.key]) ? values[table.key] : []) as Row[];
    const tableError = errors?.tables[table.key];
    return (
      <div key={table.key} className="mt-8">
        <h4 className="text-sm font-semibold text-foreground">
          {table.label}
          <span className="ml-1 font-normal text-muted-foreground">/ {table.labelId}</span>
          {isTableRequired(table.key) ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : (
            <span className="ml-1 font-normal text-muted-foreground/60">(opsional)</span>
          )}
        </h4>
        {tableError ? <p className="mt-1 text-xs font-medium text-destructive">{tableError}</p> : null}
        <div className="mt-3 space-y-3">
          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Belum ada data. Klik "Tambah baris" untuk mengisi.
            </p>
          ) : null}
          {rows.map((row, rowIndex) => {
            const firstCol = table.columns[0];
            const presetLabel =
              table.presets && firstCol && table.presets.includes(String(row[firstCol.key] ?? "")) && row[firstCol.key]
                ? String(row[firstCol.key])
                : null;
            return (
              <div key={rowIndex} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {presetLabel ?? `${table.labelId} #${rowIndex + 1}`}
                  </span>
                  {table.addable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label="Hapus baris"
                      onClick={() => setTableRows(table, rows.filter((_, i) => i !== rowIndex))}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Hapus
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {table.columns.map((col, colIndex) => {
                    if (presetLabel && colIndex === 0 && table.key !== "formal") return null;
                    const id = `${section.id}-${table.key}-${rowIndex}-${col.key}`;
                    const label = `${table.labelId}, baris ${rowIndex + 1}, ${col.label}`;
                    const updateCell = (value: unknown) =>
                      setTableRows(
                        table,
                        rows.map((r, i) => {
                          if (i !== rowIndex) return r;
                          const next = { ...r, [col.key]: value };
                          // Tingkat SD/SMP/SMA mengisi jurusan dengan "-", tingkat tinggi mengosongkannya lagi.
                          if (table.key === "formal" && col.key === "level") {
                            const level = String(value ?? "");
                            if (SCHOOL_LEVELS.includes(level)) {
                              if (String(next.major ?? "").trim() === "") next.major = "-";
                            } else if (String(next.major ?? "") === "-") {
                              next.major = "";
                            }
                          }
                          return next;
                        }),
                      );
                    const selectOptions = col.options ?? LANGUAGE_LEVELS;
                    const currentSelect = String(row[col.key] ?? "");
                    const selectList =
                      currentSelect && !selectOptions.includes(currentSelect)
                        ? [...selectOptions, currentSelect]
                        : selectOptions;
                    return (
                      <div key={col.key} className={col.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
                          {col.label}
                        </label>
                        {table.key === "formal" && col.key === "major" && presetLabel && SCHOOL_LEVELS.includes(presetLabel) ? (
                          <Input id={id} aria-label={label} value="-" disabled className="bg-muted" />
                        ) : col.type === "checkbox" ? (
                          <div className="flex h-9 items-center">
                            <Checkbox id={id} aria-label={label} checked={row[col.key] === true || row[col.key] === "true"} onCheckedChange={(value) => updateCell(value === true)} />
                          </div>
                        ) : col.type === "select" ? (
                          <Select value={String(row[col.key] ?? "")} onValueChange={updateCell}>
                            <SelectTrigger id={id} aria-label={label} className="bg-background"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>{selectList.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : col.type === "textarea" ? (
                          <Textarea id={id} aria-label={label} rows={3} className="bg-background" value={String(row[col.key] ?? "")} onChange={(e) => updateCell(e.target.value)} />
                        ) : (
                          <Input
                            id={id}
                            aria-label={label}
                            className="bg-background"
                            type={col.type === "date" ? "date" : "text"}
                            placeholder={col.label}
                            value={String(row[col.key] ?? "")}
                            onChange={(e) => updateCell(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {table.addable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setTableRows(table, [...rows, {}])}
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah baris
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-panel md:p-7">
      <header className="border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Bagian {section.no}
        </p>
        <h2 className="mt-1 font-display text-xl font-bold text-foreground">{section.title}</h2>
        <p className="text-sm text-muted-foreground">{section.titleId}</p>
        {section.note ? (
          <p className="mt-3 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            {section.note}
          </p>
        ) : null}
      </header>

      {section.fields?.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">{section.fields.map(renderField)}</div>
      ) : null}
      {section.tables?.map(renderTable)}
    </section>
  );
}
