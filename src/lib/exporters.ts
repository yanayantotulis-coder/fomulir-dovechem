import { FORM_SECTIONS, type ApplicationData, type Section } from "./form-schema";

const asText = (value: unknown): string => {
  if (value === true) return "Ya";
  if (value === false || value === null || value === undefined) return "";
  return String(value);
};

const rowIsEmpty = (row: Record<string, unknown>, skipFirst: string) =>
  Object.entries(row).every(([k, v]) => k === skipFirst || asText(v).trim() === "");

type TablePart = { title: string; head: string[]; body: string[][] };

function sectionParts(section: Section, data: ApplicationData) {
  const sectionData = data[section.id] ?? {};
  const fieldRows: string[][] = (section.fields ?? [])
    .filter((f) => f.type !== "signature")
    .map((f) => [`${f.labelId} / ${f.label}`, asText(sectionData[f.key])]);
  const tables: TablePart[] = (section.tables ?? []).map((t) => {
    const rows = Array.isArray(sectionData[t.key])
      ? (sectionData[t.key] as Record<string, unknown>[])
      : [];
    const firstKey = t.columns[0]?.key ?? "";
    const body = rows
      .filter((r) => !rowIsEmpty(r, t.presets ? firstKey : "__none__"))
      .map((r) => t.columns.map((c) => asText(r[c.key])));
    return { title: `${t.labelId} / ${t.label}`, head: t.columns.map((c) => c.label), body };
  });
  return { fieldRows, tables };
}

export function fileBaseName(data: ApplicationData) {
  const name = asText((data["personal"] ?? {})["fullName"]) || "Kandidat";
  return `Formulir_Lamaran_${name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}`;
}

export async function downloadPdf(data: ApplicationData) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const marginX = 36;
  doc.setFontSize(14);
  doc.text("PT. DOVER CHEMICAL", marginX, 44);
  doc.setFontSize(11);
  doc.text("Application Form / Formulir Lamaran Kerja", marginX, 60);
  let cursor = 78;

  for (const section of FORM_SECTIONS) {
    const { fieldRows, tables } = sectionParts(section, data);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: cursor,
      head: [[`${section.no}. ${section.titleId} / ${section.title}`, ""]],
      body: fieldRows.length ? fieldRows : [["", ""]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 42, 67], textColor: 255, fontSize: 9 },
      columnStyles: { 0: { cellWidth: 200, fontStyle: "bold" } },
      margin: { left: marginX, right: marginX },
    });
    cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    for (const table of tables) {
      autoTable(doc, {
        startY: cursor,
        head: [[{ content: table.title, colSpan: table.head.length }], table.head],
        body: table.body.length ? table.body : [table.head.map(() => "-")],
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: [45, 74, 105], textColor: 255 },
        margin: { left: marginX, right: marginX },
      });
      cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
    if (section.note) {
      const lines = doc.splitTextToSize(section.note, 520) as string[];
      doc.setFontSize(7.5);
      doc.text(lines, marginX, cursor + 4);
      cursor += lines.length * 10 + 8;
    }
    if (cursor > 740) {
      doc.addPage();
      cursor = 48;
    }
  }
  doc.save(`${fileBaseName(data)}.pdf`);
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .join('</w:t><w:br/><w:t xml:space="preserve">');

/** Ambil nilai dari data formulir memakai jalur bertitik, mis. personal.fullName */
function resolvePath(data: ApplicationData, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) return "";
    if (Array.isArray(current)) current = current[Number(part)];
    else if (typeof current === "object") current = (current as Record<string, unknown>)[part];
    else return "";
  }
  return current;
}

function nonFormalText(data: ApplicationData): string {
  const rows = (data["education"]?.["nonFormal"] ?? []) as Record<string, unknown>[];
  return rows
    .filter((r) => asText(r["name"]).trim() !== "")
    .map(
      (r) =>
        `${asText(r["name"])} - ${asText(r["heldBy"])} (${asText(r["date"])}) ${asText(r["notes"])}`.trim(),
    )
    .join("\n");
}

/**
 * Unduhan Word memakai berkas template asli PT. Dover Chemical:
 * template berisi token {{...}} yang diisi dengan data kandidat dari sistem.
 */
export async function downloadDocx(data: ApplicationData) {
  const [{ unzipSync, zipSync, strFromU8, strToU8 }, templateUrl] = await Promise.all([
    import("fflate"),
    import("@/assets/formulir-dover-template.docx?url").then((m) => m.default as string),
  ]);
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Template formulir Word tidak dapat dibaca.");
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const docPath = "word/document.xml";
  const extras = nonFormalText(data);

  const xml = strFromU8(files[docPath]!).replace(/\{\{([a-zA-Z0-9._]+)\}\}/g, (_all, path: string) => {
    if (path === "education.nonFormalText") return escapeXml(extras);
    const value = resolvePath(data, path);
    if (value === true) return "√";
    if (value === false || value === null || value === undefined) return path.endsWith(".checked") ? "□" : "";
    return escapeXml(String(value));
  });

  files[docPath] = strToU8(xml);
  const zipped = zipSync(files, { level: 6 });
  triggerDownload(
    new Blob([zipped as unknown as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    `${fileBaseName(data)}.docx`,
  );
}

export async function downloadXlsx(data: ApplicationData) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const section of FORM_SECTIONS) {
    const { fieldRows, tables } = sectionParts(section, data);
    const aoa: string[][] = [[`${section.no}. ${section.titleId} / ${section.title}`]];
    if (fieldRows.length) {
      aoa.push([]);
      aoa.push(...fieldRows);
    }
    for (const table of tables) {
      aoa.push([]);
      aoa.push([table.title]);
      aoa.push(table.head);
      aoa.push(...(table.body.length ? table.body : [table.head.map(() => "-")]));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 40 }, { wch: 34 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, section.no);
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  triggerDownload(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${fileBaseName(data)}.xlsx`,
  );
}

export type CandidateRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  position_applied: string | null;
  status: string;
  submitted_at: string | null;
  data: ApplicationData;
};

export async function downloadCandidateBankXlsx(rows: CandidateRow[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const summary = rows.map((r) => {
    const personal = (r.data?.["personal"] ?? {}) as Record<string, unknown>;
    return {
      Nama: r.full_name ?? asText(personal["fullName"]),
      Posisi: r.position_applied ?? asText(personal["position"]),
      Email: r.email ?? asText(personal["email"]),
      Telepon: r.phone ?? asText(personal["currentMobile"]),
      KTP: asText(personal["idCard"]),
      "Tempat Lahir": asText(personal["birthPlace"]),
      "Tanggal Lahir": asText(personal["birthDate"]),
      Agama: asText(personal["religion"]),
      "Status Pernikahan": asText(personal["maritalStatus"]),
      Alamat: asText(personal["currentAddress"]),
      Status: r.status,
      "Tanggal Submit": r.submitted_at ? new Date(r.submitted_at).toLocaleString("id-ID") : "",
    };
  });
  const ws = XLSX.utils.json_to_sheet(summary);
  ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, ws, "Bank Data Kandidat");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  triggerDownload(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `Bank_Data_Kandidat_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
