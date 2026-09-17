import { type ApplicationData } from "./form-schema";

const asText = (value: unknown): string => {
  if (value === true) return "Ya";
  if (value === false || value === null || value === undefined) return "";
  return String(value);
};


export function fileBaseName(data: ApplicationData) {
  const name = asText((data["personal"] ?? {})["fullName"]) || "Kandidat";
  return `Formulir_Lamaran_${name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}`;
}

/**
 * PDF dibuat dari berkas Word template resmi yang sudah terisi data kandidat,
 * jadi susunan halaman PDF mengikuti formulir Word (tinggal konversi).
 */
export async function downloadPdf(data: ApplicationData) {
  const [{ default: JsPDF }, { default: html2canvas }, { renderAsync }, docxBytes] =
    await Promise.all([
      import("jspdf"),
      import("html2canvas"),
      import("docx-preview"),
      buildDocxBytes(data),
    ]);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: "fit-content",
    color: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255)",
    zIndex: "-1",
  });
  document.body.appendChild(host);

  try {
    await renderAsync(docxBytes, host, host, {
      className: "docx-pdf",
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      useBase64URL: true,
    });

    await document.fonts?.ready;
    const images = Array.from(host.querySelectorAll("img"));
    await Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const timeout = window.setTimeout(resolve, 5000);
              const finish = () => {
                window.clearTimeout(timeout);
                resolve();
              };
              image.addEventListener("load", finish, { once: true });
              image.addEventListener("error", finish, { once: true });
            }),
      ),
    );

    const pages = Array.from(host.querySelectorAll<HTMLElement>("section.docx-pdf"));
    if (!pages.length) throw new Error("Halaman template Word tidak dapat dirender.");

    const pdf = new JsPDF({ unit: "pt", format: "a4", compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      if (!page) continue;
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      if (index > 0) pdf.addPage("a4", "portrait");

      const pageRatio = canvas.width / canvas.height;
      const pdfRatio = pdfWidth / pdfHeight;
      const renderWidth = pageRatio > pdfRatio ? pdfWidth : pdfHeight * pageRatio;
      const renderHeight = pageRatio > pdfRatio ? pdfWidth / pageRatio : pdfHeight;
      const offsetX = (pdfWidth - renderWidth) / 2;
      const offsetY = (pdfHeight - renderHeight) / 2;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        offsetX,
        offsetY,
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );
    }

    pdf.save(`${fileBaseName(data)}.pdf`);
  } finally {
    host.remove();
  }
}



const SIGNATURE_REL_ID = "rIdTandaTangan";

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function signatureDrawingXml(): string {
  const cx = 1828800;
  const cy = 731520;
  return (
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1001" name="TandaTangan"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="1001" name="TandaTangan"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${SIGNATURE_REL_ID}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  );
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
export async function buildDocxBytes(data: ApplicationData): Promise<Uint8Array> {
  const [{ unzipSync, zipSync, strFromU8, strToU8 }, templateUrl] = await Promise.all([
    import("fflate"),
    import("@/assets/formulir-dover-template.docx?url").then((m) => m.default as string),
  ]);
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Template formulir Word tidak dapat dibaca.");
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const docPath = "word/document.xml";
  const extras = nonFormalText(data);

  let source = strFromU8(files[docPath]!);
  const signature = asText((data["declaration"] ?? {})["signature"]);
  const signatureRun =
    /<w:r>(?:(?!<w:r>)[\s\S])*?\{\{declaration\.signature\}\}<\/w:t><\/w:r>/;

  if (signature.startsWith("data:image/png;base64,")) {
    files["word/media/tanda-tangan-kandidat.png"] = base64ToBytes(
      signature.slice("data:image/png;base64,".length),
    );
    const relsPath = "word/_rels/document.xml.rels";
    const rels = strFromU8(files[relsPath]!).replace(
      "</Relationships>",
      `<Relationship Id="${SIGNATURE_REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tanda-tangan-kandidat.png"/></Relationships>`,
    );
    files[relsPath] = strToU8(rels);
    source = source.replace(signatureRun, signatureDrawingXml());
  } else {
    source = source.replace(signatureRun, "");
  }

  const xml = source.replace(/\{\{([a-zA-Z0-9._]+)\}\}/g, (_all, path: string) => {
    if (path === "education.nonFormalText") return escapeXml(extras);
    const value = resolvePath(data, path);
    if (value === true) return "√";
    if (value === false || value === null || value === undefined) return path.endsWith(".checked") ? "□" : "";
    return escapeXml(String(value));
  });

  files[docPath] = strToU8(xml);
  return zipSync(files, { level: 6 });
}

export async function downloadDocx(data: ApplicationData) {
  const zipped = await buildDocxBytes(data);
  triggerDownload(
    new Blob([zipped as unknown as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    `${fileBaseName(data)}.docx`,
  );
}

/**
 * Excel juga diambil dari berkas Word template yang sudah terisi,
 * sehingga baris/kolomnya mengikuti isi formulir resmi.
 */
export async function downloadXlsx(data: ApplicationData) {
  const [XLSX, { docxToBlocks }, docxBytes] = await Promise.all([
    import("xlsx"),
    import("./docx-render"),
    buildDocxBytes(data),
  ]);
  const blocks = await docxToBlocks(docxBytes);
  const aoa: string[][] = [];
  for (const block of blocks) {
    if (block.type === "paragraph") aoa.push([block.text]);
    else if (block.type === "image") aoa.push(["[Tanda tangan kandidat terlampir pada PDF/Word]"]);
    else {
      aoa.push([]);
      aoa.push(...block.rows);
      aoa.push([]);
    }
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa.length ? aoa : [[""]]);
  const maxCols = Math.max(1, ...aoa.map((r) => r.length));
  ws["!cols"] = Array.from({ length: maxCols }, (_, i) => ({ wch: i === 0 ? 46 : 26 }));
  XLSX.utils.book_append_sheet(wb, ws, "Formulir Lamaran");
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
