import { supabase } from "@/integrations/supabase/client";
import { DOC_TYPES } from "./form-schema";
import type { AllDocumentRecord, DocumentRecord } from "./candidate-api";

const DOC_ORDER = DOC_TYPES.map((d) => d.key);

const safe = (value: string) =>
  value
    .replace(/[^\w\s.\-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "Tanpa_Nama";

const extOf = (fileName: string) => {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot).toLowerCase() : "";
};

const labelOf = (docType: string) =>
  DOC_TYPES.find((d) => d.key === docType)?.label ?? docType;

function sortDocs<T extends { doc_type: string; created_at: string }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => {
    const ia = DOC_ORDER.indexOf(a.doc_type);
    const ib = DOC_ORDER.indexOf(b.doc_type);
    if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return a.created_at.localeCompare(b.created_at);
  });
}

async function bytesOf(filePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from("candidate-files").download(filePath);
  if (error || !data) throw error ?? new Error("Gagal mengunduh dokumen");
  return new Uint8Array(await data.arrayBuffer());
}

type ZipTree = Record<string, Uint8Array>;

/** Susun nama berkas rapi: 01-Foto_3x4.jpg, 02-CV.pdf, dst. */
async function collect(
  docs: (DocumentRecord & { doc_type: string })[],
  prefix: string,
  index: { n: number },
): Promise<ZipTree> {
  const tree: ZipTree = {};
  for (const doc of sortDocs(docs)) {
    index.n += 1;
    const order = String(index.n).padStart(2, "0");
    let name = `${prefix}${order}-${safe(labelOf(doc.doc_type))}${extOf(doc.file_name)}`;
    let dedupe = 2;
    while (tree[name]) {
      name = `${prefix}${order}-${safe(labelOf(doc.doc_type))}_${dedupe}${extOf(doc.file_name)}`;
      dedupe += 1;
    }
    tree[name] = await bytesOf(doc.file_path);
  }
  return tree;
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

async function zipAndSave(tree: ZipTree, filename: string) {
  const { zipSync } = await import("fflate");
  const zipped = zipSync(tree, { level: 6 });
  triggerDownload(new Blob([zipped as unknown as BlobPart], { type: "application/zip" }), filename);
}

/** Semua dokumen satu kandidat menjadi satu berkas ZIP bernama kandidat tersebut. */
export async function downloadCandidateDocsZip(
  candidateName: string,
  docs: DocumentRecord[],
) {
  if (docs.length === 0) throw new Error("Kandidat ini belum memiliki dokumen.");
  const base = `Dokumen_${safe(candidateName)}`;
  const tree = await collect(docs, "", { n: 0 });
  await zipAndSave(tree, `${base}.zip`);
}

/** Semua dokumen seluruh kandidat: satu ZIP, satu folder per kandidat. */
export async function downloadAllCandidateDocsZip(
  groups: { name: string; docs: AllDocumentRecord[] }[],
) {
  const filled = groups.filter((g) => g.docs.length > 0);
  if (filled.length === 0) throw new Error("Belum ada dokumen kandidat.");
  const tree: ZipTree = {};
  for (const group of filled) {
    const folder = `${safe(group.name)}/`;
    Object.assign(tree, await collect(group.docs, folder, { n: 0 }));
  }
  await zipAndSave(tree, `Dokumen_Kandidat_${new Date().toISOString().slice(0, 10)}.zip`);
}
