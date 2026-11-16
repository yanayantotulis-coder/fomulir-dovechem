/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { createEmptyData, FORM_SECTIONS, mergeWithEmpty, validateSection } from "./form-schema";

describe("Jawaban tidak tersedia", () => {
  test("strip memenuhi isian wajib tetapi isian kosong tetap ditolak", () => {
    const section = FORM_SECTIONS.find((item) => item.id === "work");
    if (!section) throw new Error("Missing work section");
    const data = createEmptyData();
    expect(validateSection(section, data).fields["innovation"]).toBe("Wajib diisi");
    data["work"] = { innovation: "-", orgChart: "-" };
    expect(validateSection(section, data).fields).toEqual({});
  });

  test("strip diterima pada seluruh kolom baris keluarga wajib", () => {
    const section = FORM_SECTIONS.find((item) => item.id === "family");
    if (!section) throw new Error("Missing family section");
    const data = createEmptyData();
    data["family"] = { familyTree: [{ name: "-", birthday: "-", education: "-", job: "-" }], spouseChildren: [{ name: "-", birthday: "-", education: "-", job: "-" }] };
    expect(validateSection(section, data).tables).toEqual({});
  });

  test("jurusan perguruan tinggi berupa strip dipertahankan setelah dimuat kembali", () => {
    const data = mergeWithEmpty({ education: { formal: [{ level: "D3", major: "-" }] } });
    expect(data["education"]?.["formal"]).toEqual([{ level: "D3", major: "-" }]);
  });

  test("strip tidak menggantikan tanda tangan atau persetujuan", () => {
    const section = FORM_SECTIONS.find((item) => item.id === "declaration");
    if (!section) throw new Error("Missing declaration section");
    const data = createEmptyData();
    data["declaration"] = { city: "-", date: "-", signatureName: "-", signature: "-", agree: "-" };
    expect(validateSection(section, data).fields).toEqual({ signature: "Tanda tangan wajib diisi", agree: "Wajib dicentang" });
  });
});