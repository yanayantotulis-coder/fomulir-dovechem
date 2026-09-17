import {
  LANGUAGE_LEVELS,
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
  errors?: SectionErrors;
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
      </div>
    );
  };

  const renderTable = (table: TableDef) => {
    const rows = (Array.isArray(values[table.key]) ? values[table.key] : []) as Row[];
    return (
      <div key={table.key} className="mt-8">
        <h4 className="text-sm font-semibold text-foreground">
          {table.label}
          <span className="ml-1 font-normal text-muted-foreground">/ {table.labelId}</span>
        </h4>
        <div className="mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-muted/60">
              <tr>
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    className="border-b border-border px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {col.label}
                  </th>
                ))}
                {table.addable ? <th className="w-10 border-b border-border" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="even:bg-muted/20">
                  {table.columns.map((col, colIndex) => {
                    const locked = Boolean(table.presets && colIndex === 0 && table.presets.includes(String(row[col.key] ?? "")) && row[col.key]);
                    const label = `${table.labelId}, baris ${rowIndex + 1}, ${col.label}`;
                    const updateCell = (value: unknown) => setTableRows(table, rows.map((r, i) => i === rowIndex ? { ...r, [col.key]: value } : r));
                    return (
                      <td key={col.key} className="border-b border-border/70 px-1.5 py-1">
                        {locked ? (
                          <span className="block px-1 text-xs font-medium text-foreground">
                            {String(row[col.key] ?? "")}
                          </span>
                         ) : col.type === "checkbox" ? (
                           <Checkbox aria-label={label} checked={row[col.key] === true || row[col.key] === "true"} onCheckedChange={(value) => updateCell(value === true)} />
                         ) : col.type === "select" ? (
                           <Select value={String(row[col.key] ?? "")} onValueChange={updateCell}>
                             <SelectTrigger aria-label={label}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                             <SelectContent>{LANGUAGE_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                           </Select>
                         ) : col.type === "textarea" ? (
                           <Textarea aria-label={label} rows={3} value={String(row[col.key] ?? "")} onChange={(e) => updateCell(e.target.value)} />
                         ) : (
                          <Input
                             aria-label={label}
                            className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                            type={col.type === "date" ? "date" : "text"}
                            value={String(row[col.key] ?? "")}
                            onChange={(e) => {
                              const next = rows.map((r, i) =>
                                i === rowIndex ? { ...r, [col.key]: e.target.value } : r,
                              );
                              setTableRows(table, next);
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                  {table.addable ? (
                    <td className="border-b border-border/70 px-1 py-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus baris"
                        onClick={() => setTableRows(table, rows.filter((_, i) => i !== rowIndex))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
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
        <h3 className="mt-1 font-display text-xl font-bold text-foreground">{section.title}</h3>
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
