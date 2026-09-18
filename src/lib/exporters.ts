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

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.title = "Pembuatan PDF formulir";
  Object.assign(frame.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: "900px",
    height: "1200px",
    border: "0",
    zIndex: "-1",
  });
  document.body.appendChild(frame);

  try {
    const frameDocument = frame.contentDocument;
    if (!frameDocument) throw new Error("Area pembuatan PDF tidak tersedia.");
    frameDocument.open();
    frameDocument.write("<!doctype html><html><head></head><body></body></html>");
    frameDocument.close();
    const host = frameDocument.body;
    host.style.margin = "0";
    host.style.color = "rgb(0, 0, 0)";
    host.style.backgroundColor = "rgb(255, 255, 255)";

    await renderAsync(docxBytes, host, frameDocument.head, {
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

    let pdfPageIndex = 0;
    for (const page of pages) {
      if (!page) continue;
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const sliceHeight = Math.max(1, Math.round(canvas.width * (pdfHeight / pdfWidth)));
      for (let sourceY = 0; sourceY < canvas.height; sourceY += sliceHeight) {
        const currentHeight = Math.min(sliceHeight, canvas.height - sourceY);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        const context = slice.getContext("2d");
        if (!context) throw new Error("Halaman PDF tidak dapat digambar.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, slice.width, slice.height);
        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentHeight,
          0,
          0,
          canvas.width,
          currentHeight,
        );
        if (pdfPageIndex > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(
          slice.toDataURL("image/jpeg", 0.94),
          "JPEG",
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined,
          "FAST",
        );
        pdfPageIndex += 1;
      }
    }

    pdf.save(`${fileBaseName(data)}.pdf`);
  } finally {
    frame.remove();
  }
}



const SIGNATURE_REL_ID = "rIdTandaTangan";

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Baca ukuran piksel PNG dari header IHDR agar rasio gambar tidak berubah. */
function pngPixelSize(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24) return { width: 600, height: 220 };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (!width || !height) return { width: 600, height: 220 };
  return { width, height };
}

/**
 * Rapikan tanda tangan: buang area kosong di sekeliling goresan lalu
 * kembalikan PNG bersih, sehingga ukurannya di Word selalu konsisten.
 */
async function tidySignaturePng(dataUrl: string): Promise<Uint8Array<ArrayBuffer>> {
  const raw = base64ToBytes(dataUrl.slice("data:image/png;base64,".length));
  if (typeof document === "undefined") return raw;
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("gagal memuat tanda tangan"));
      el.src = dataUrl;
    });
    const source = document.createElement("canvas");
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const sctx = source.getContext("2d");
    if (!sctx) return raw;
    sctx.drawImage(image, 0, 0);
    const { data } = sctx.getImageData(0, 0, source.width, source.height);
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const i = (y * source.width + x) * 4;
        const alpha = data[i + 3]!;
        const luminance = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        if (alpha > 24 && luminance < 205) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0 || maxY < 0) return raw;
    const pad = Math.round(Math.max(source.width, source.height) * 0.02);
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(source.width - 1, maxX + pad);
    maxY = Math.min(source.height - 1, maxY + pad);
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = cropWidth;
    out.height = cropHeight;
    const octx = out.getContext("2d");
    if (!octx) return raw;
    octx.drawImage(source, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const trimmed = out.toDataURL("image/png");
    return base64ToBytes(trimmed.slice("data:image/png;base64,".length));
  } catch {
    return raw;
  }
}

function signatureDrawingXml(pixels: { width: number; height: number }): string {
  // Kotak tanda tangan tetap 1,9 x 0,75 inci; gambar diskalakan agar pas di dalamnya.
  const maxCx = Math.round(1.9 * 914400);
  const maxCy = Math.round(0.75 * 914400);
  const ratio = Math.max(1, pixels.height) / Math.max(1, pixels.width);
  let cx = maxCx;
  let cy = Math.round(maxCx * ratio);
  if (cy > maxCy) {
    cy = maxCy;
    cx = Math.round(maxCy / Math.max(0.05, ratio));
  }
  return (
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="1001" name="TandaTangan" descr="Tanda tangan kandidat"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="1001" name="TandaTangan"/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${SIGNATURE_REL_ID}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></pic:spPr></pic:pic>` +
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
    const pngBytes = await tidySignaturePng(signature);
    files["word/media/tanda-tangan-kandidat.png"] = pngBytes;
    const relsPath = "word/_rels/document.xml.rels";
    const rels = strFromU8(files[relsPath]!).replace(
      "</Relationships>",
      `<Relationship Id="${SIGNATURE_REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tanda-tangan-kandidat.png"/></Relationships>`,
    );
    files[relsPath] = strToU8(rels);
    source = source.replace(signatureRun, signatureDrawingXml(pngPixelSize(pngBytes)));
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
