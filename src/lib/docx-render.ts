/**
 * Membaca berkas Word hasil template PT. Dover Chemical yang sudah terisi,
 * lalu mengubah isinya menjadi blok-blok sederhana (paragraf/tabel/gambar)
 * agar bisa dicetak ulang menjadi PDF dan Excel dengan susunan yang sama.
 */
export type DocBlock =
  | { type: "paragraph"; text: string; bold: boolean; align: "left" | "center" | "right" }
  | { type: "table"; rows: string[][] }
  | { type: "image" };

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function paragraphText(p: Element): string {
  let text = "";
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const name = child.localName;
      if (name === "t") text += child.textContent ?? "";
      else if (name === "tab") text += "\t";
      else if (name === "br" || name === "cr") text += "\n";
      else if (name === "rPr" || name === "pPr") continue;
      else walk(child);
    }
  };
  walk(p);
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function paragraphBlocks(p: Element): DocBlock[] {
  const blocks: DocBlock[] = [];
  const text = paragraphText(p);
  const pPr = p.getElementsByTagNameNS(W, "pPr")[0];
  const bold = !!p.getElementsByTagNameNS(W, "b").length;
  const jc = pPr?.getElementsByTagNameNS(W, "jc")[0]?.getAttributeNS(W, "val") ?? "left";
  const align = jc === "center" ? "center" : jc === "right" ? "right" : "left";
  if (text) blocks.push({ type: "paragraph", text, bold, align });
  if (new XMLSerializer().serializeToString(p).includes('name="TandaTangan"'))
    blocks.push({ type: "image" });


  return blocks;
}

function tableBlock(tbl: Element): DocBlock | null {
  const rows: string[][] = [];
  for (const tr of Array.from(tbl.children).filter((c) => c.localName === "tr")) {
    const cells: string[] = [];
    for (const tc of Array.from(tr.children).filter((c) => c.localName === "tc")) {
      const parts = Array.from(tc.getElementsByTagNameNS(W, "p")).map(paragraphText).filter(Boolean);
      cells.push(parts.join("\n"));
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return null;
  const width = Math.max(...rows.map((r) => r.length));
  return { type: "table", rows: rows.map((r) => [...r, ...Array(width - r.length).fill("")]) };
}

/** Ambil struktur isi dokumen Word (bytes .docx) menjadi daftar blok. */
export async function docxToBlocks(docxBytes: Uint8Array): Promise<DocBlock[]> {
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(docxBytes);
  const xml = strFromU8(files["word/document.xml"]!);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagNameNS(W, "body")[0];
  if (!body) return [];
  const blocks: DocBlock[] = [];
  for (const node of Array.from(body.children)) {
    if (node.localName === "p") blocks.push(...paragraphBlocks(node));
    else if (node.localName === "tbl") {
      const table = tableBlock(node);
      if (table) blocks.push(table);
    }
  }
  return blocks;
}
