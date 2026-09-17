export type FieldType =
  | "text"
  | "date"
  | "textarea"
  | "select"
  | "email"
  | "checkbox"
  | "signature";

export type Field = {
  key: string;
  label: string;
  labelId: string;
  type?: FieldType;
  options?: string[];
  full?: boolean;
};

export type TableColumn = { key: string; label: string; type?: FieldType; width?: number };

export type TableDef = {
  key: string;
  label: string;
  labelId: string;
  columns: TableColumn[];
  rows: number;
  /** Preset value for the first column of each row (label kolom pertama). */
  presets?: string[];
  addable?: boolean;
};

export type Section = {
  id: string;
  no: string;
  title: string;
  titleId: string;
  fields?: Field[];
  tables?: TableDef[];
  note?: string;
};

const person = (extra: TableColumn[] = []): TableColumn[] => [
  { key: "relation", label: "Hubungan / Relation" },
  { key: "name", label: "Nama / Name" },
  { key: "birthday", label: "Tgl Lahir / Birthday" },
  { key: "education", label: "Pendidikan Terakhir" },
  { key: "job", label: "Pekerjaan / Current Job" },
  ...extra,
];

export const FORM_SECTIONS: Section[] = [
  {
    id: "personal",
    no: "I",
    title: "PERSONAL DATA",
    titleId: "DATA PRIBADI",
    note: "Foto ukuran 3 x 4 / Photo size 3 x 4. Pilih salah satu jenis kelamin dan status tempat tinggal / Choose one gender and residence status.",
    fields: [
      { key: "position", label: "Position Applied", labelId: "Posisi yang dilamar" },
      { key: "fullName", label: "Full Name", labelId: "Nama Lengkap" },
      {
        key: "gender",
        label: "Gender (M/F)",
        labelId: "Jenis Kelamin (Pria/Wanita)",
        type: "select",
        options: ["Pria / Male", "Wanita / Female"],
      },
      { key: "birthPlace", label: "Place of Birth", labelId: "Tempat Lahir" },
      { key: "birthDate", label: "Date of Birth", labelId: "Tanggal Lahir", type: "date" },
      { key: "idCard", label: "ID Card Number", labelId: "No KTP" },
      { key: "simA", label: "Driving License A", labelId: "SIM A No." },
      { key: "simB", label: "Driving License B", labelId: "SIM B No." },
      { key: "simC", label: "Driving License C", labelId: "SIM C No." },
      { key: "npwp", label: "NPWP", labelId: "No NPWP" },
      { key: "bankAccount", label: "Bank Account Number", labelId: "No Rekening Bank" },
      { key: "email", label: "Email Address", labelId: "Alamat Email", type: "email" },
      { key: "religion", label: "Religion", labelId: "Agama" },
      { key: "ethnicity", label: "Ethnicity", labelId: "Suku Bangsa" },
      {
        key: "maritalStatus",
        label: "Marital Status",
        labelId: "Status Pernikahan",
        type: "select",
        options: ["Belum Menikah / Single", "Menikah / Married", "Janda / Duda"],
      },
      {
        key: "currentAddress",
        label: "Current Address",
        labelId: "Alamat Tempat Tinggal Saat Ini",
        type: "textarea",
        full: true,
      },
      { key: "currentHomePhone", label: "Home Number", labelId: "Telepon Rumah" },
      { key: "currentMobile", label: "Mobile Phone", labelId: "Telepon Selular" },
      {
        key: "currentStatus",
        label: "Residence Status",
        labelId: "Status Tempat Tinggal",
        type: "select",
        options: ["Milik Sendiri", "Milik Orang Tua", "Kontrak / Sewa", "Kos / Board"],
      },
      {
        key: "homeAddress",
        label: "Home Address",
        labelId: "Alamat Asal",
        type: "textarea",
        full: true,
      },
      { key: "homeHomePhone", label: "Home Number (Asal)", labelId: "Telepon Rumah (Asal)" },
      { key: "homeMobile", label: "Mobile Phone (Asal)", labelId: "Telepon Selular (Asal)" },
      {
        key: "homeStatus",
        label: "Residence Status (Home)",
        labelId: "Status Tempat Tinggal (Asal)",
        type: "select",
        options: ["Milik Sendiri", "Milik Orang Tua", "Kontrak / Sewa", "Kos / Board"],
      },
    ],
  },
  {
    id: "family",
    no: "II",
    title: "FAMILY BACKGROUND",
    titleId: "LATAR BELAKANG KELUARGA",
    tables: [
      {
        key: "spouseChildren",
        label: "Spouse & Children",
        labelId: "Pasangan & Anak",
        columns: person(),
        rows: 5,
        presets: ["Pasangan / Spouse", "Anak 1", "Anak 2", "Anak 3", "Anak 4"],
        addable: true,
      },
      {
        key: "familyTree",
        label: "Family Tree, Including You",
        labelId: "Susunan Keluarga, Termasuk Anda",
        columns: person(),
        rows: 7,
        presets: [
          "Ayah / Father",
          "Ibu / Mother",
          "Saudara 1",
          "Saudara 2",
          "Saudara 3",
          "Saudara 4",
          "Saudara 5",
        ],
        addable: true,
      },
    ],
  },
  {
    id: "education",
    no: "III",
    title: "EDUCATIONAL BACKGROUND AND LANGUAGE COMPETENCIES",
    titleId: "LATAR BELAKANG PENDIDIKAN DAN KEMAMPUAN BERBAHASA",
    note: "Mohon pilih Aktif atau Pasif sesuai kemampuan lisan dan tulisan Anda. Bahasa asing lainnya dapat dituliskan pada baris kosong / Please indicate your spoken and written language competencies.",
    tables: [
      {
        key: "formal",
        label: "Formal Education",
        labelId: "Pendidikan Formal",
        columns: [
          { key: "level", label: "Tingkat / Level" },
          { key: "school", label: "Sekolah / Perguruan Tinggi" },
          { key: "major", label: "Jurusan / Major" },
          { key: "from", label: "Dari (Bln/Thn)" },
          { key: "until", label: "Sampai (Bln/Thn)" },
          { key: "gpa", label: "IPK / GPA" },
        ],
        rows: 4,
        presets: ["SLTA / High School", "Diploma", "S1 / Bachelor", "S2 / Master"],
        addable: true,
      },
      {
        key: "nonFormal",
        label: "Non Formal Education (Course, Training, Seminar)",
        labelId: "Pendidikan Non Formal (Kursus, Pelatihan, Seminar, Lokakarya, dll)",
        columns: [
          { key: "name", label: "Nama Kursus / Pelatihan" },
          { key: "heldBy", label: "Penyelenggara" },
          { key: "date", label: "Tgl/Bln/Thn" },
          { key: "notes", label: "Keterangan" },
        ],
        rows: 1,
        addable: true,
      },
      {
        key: "languages",
        label: "Language Competencies",
        labelId: "Kemampuan Berbahasa",
        columns: [
          { key: "language", label: "Bahasa / Language" },
          {
            key: "spoken",
            label: "Lisan / Spoken",
            type: "select",
          },
          { key: "written", label: "Tulisan / Written", type: "select" },
        ],
        rows: 3,
        presets: ["Bahasa Inggris / English", "", ""],
        addable: true,
      },
    ],
  },
  {
    id: "organization",
    no: "IV",
    title: "ORGANIZATIONAL BACKGROUND AND ACHIEVEMENTS",
    titleId: "LATAR BELAKANG ORGANISASI DAN PRESTASI",
    tables: [
      {
        key: "social",
        label: "Social Activity",
        labelId: "Aktivitas Sosial",
        columns: [
          { key: "organization", label: "Nama Organisasi" },
          { key: "field", label: "Bidang" },
          { key: "period", label: "Periode Kepesertaan" },
          { key: "notes", label: "Keterangan" },
        ],
        rows: 1,
        addable: true,
      },
      {
        key: "awards",
        label: "Awards",
        labelId: "Penghargaan",
        columns: [
          { key: "achievement", label: "Prestasi" },
          { key: "year", label: "Tahun" },
          { key: "notes", label: "Keterangan" },
        ],
        rows: 1,
        addable: true,
      },
    ],
  },
  {
    id: "work",
    no: "V",
    title: "WORKING EXPERIENCE",
    titleId: "PENGALAMAN KERJA",
    note: "Mohon isi dimulai dari pekerjaan terakhir / Please fill descending from your latest employment.",
    fields: [
      {
        key: "innovation",
        label: "Have you ever made innovation or change during your work history?",
        labelId: "Pernahkah Anda melakukan pembaruan / perubahan selama bekerja? Jelaskan!",
        type: "textarea",
        full: true,
      },
      {
        key: "orgChart",
        label: "Please describe your current position in organizational chart",
        labelId: "Gambarkan posisi Anda saat ini dalam struktur organisasi",
        type: "textarea",
        full: true,
      },
    ],
    tables: [
      {
        key: "jobs",
        label: "Working Experience",
        labelId: "Riwayat Pekerjaan",
        columns: [
          { key: "company", label: "Nama Perusahaan" },
          { key: "companyField", label: "Bergerak di Bidang" },
          { key: "position", label: "Jabatan" },
          { key: "salary", label: "Gaji" },
          { key: "from", label: "Dari (Bln/Thn)" },
          { key: "until", label: "Sampai (Bln/Thn)" },
          { key: "jobDesc", label: "Gambaran Pekerjaan", type: "textarea" },
          { key: "reasonLeave", label: "Alasan Berhenti", type: "textarea" },
        ],
        rows: 1,
        addable: true,
      },
      {
        key: "supervisors",
        label: "Former Supervisors",
        labelId: "Orang-orang yang pernah menjadi atasan dalam karier Anda pada perusahaan di atas",
        columns: [
          { key: "name", label: "Nama" },
          { key: "position", label: "Jabatan" },
          { key: "company", label: "Perusahaan" },
          { key: "phone", label: "Nomor Kontak" },
        ],
        rows: 1,
        addable: true,
      },
    ],
  },
  {
    id: "medical",
    no: "VI",
    title: "MEDICAL HISTORY",
    titleId: "RIWAYAT KESEHATAN",
    note: "Silahkan berikan tanda checklist (√) dan keterangan sesuai dengan riwayat kesehatan Anda / Please give checklist (√) and notes, based on your medical history.",
    tables: [
      {
        key: "diseases",
        label: "Medical History",
        labelId: "Riwayat Penyakit",
        columns: [
          { key: "disease", label: "Penyakit / Disease" },
          { key: "checked", label: "Pernah / Ever", type: "checkbox" },
          { key: "hospitalizedAt", label: "Pernah dirawat (tgl/bln/thn)" },
          { key: "notes", label: "Keterangan" },
        ],
        rows: 9,
        presets: [
          "Jantung / Heart disease",
          "Hipertensi / Hypertension",
          "Diabetes",
          "Hepatitis",
          "Kanker / Cancer",
          "TBC",
          "Asma / Asthma",
          "AIDS",
          "Penyakit lainnya / Other",
        ],
      },
    ],
  },
  {
    id: "references",
    no: "VII",
    title: "REFERENCES",
    titleId: "REFERENSI",
    tables: [
      {
        key: "refs",
        label: "References",
        labelId: "Nama kerabat untuk referensi Anda",
        columns: [
          { key: "name", label: "Nama" },
          { key: "phone", label: "No Telepon" },
          { key: "position", label: "Jabatan" },
          { key: "company", label: "Perusahaan" },
          { key: "relation", label: "Hubungan" },
        ],
        rows: 2,
        addable: true,
      },
      {
        key: "emergency",
        label: "Emergency Contacts",
        labelId: "Orang yang dapat dihubungi segera dalam keadaan mendesak/darurat",
        columns: [
          { key: "name", label: "Nama" },
          { key: "relation", label: "Hubungan" },
          { key: "phone", label: "No Telepon" },
        ],
        rows: 2,
        addable: true,
      },
    ],
  },
  {
    id: "others",
    no: "VIII",
    title: "OTHERS",
    titleId: "LAIN-LAIN",
    note: "Silahkan berikan tanda checklist (√) dan keterangan sesuai dengan kesediaan Anda / Please give checklist (√) and notes, based on your availability.",
    fields: [
      {
        key: "relocate",
        label: "Willing to be relocated in other city",
        labelId: "Bersedia ditempatkan di kota lain",
        type: "checkbox",
      },
      { key: "relocateNotes", label: "Notes", labelId: "Keterangan penempatan" },
      {
        key: "businessTrip",
        label: "Willing to do business trip",
        labelId: "Bersedia melakukan perjalanan dinas",
        type: "checkbox",
      },
      { key: "businessTripNotes", label: "Notes", labelId: "Keterangan perjalanan dinas" },
      {
        key: "relativesGGB",
        label: "Do you have any relatives working in GGB Group? Please state!",
        labelId: "Apakah Anda memiliki keluarga, kerabat, atau teman yang bekerja di Group GOLDEN GREAT BORNEO? Sebutkan!",
        type: "textarea",
        full: true,
      },
      {
        key: "appliedBefore",
        label: "Have you applied to GGB Group before? When and what position?",
        labelId: "Apakah Anda pernah melamar ke Group GOLDEN GREAT BORNEO sebelumnya? Jika ya, kapan dan untuk posisi apa?",
        type: "textarea",
        full: true,
      },
      {
        key: "policeRecord",
        label: "Have you ever officially engaged with Police Department in relation to criminal issue, court of justice or civil cases?",
        labelId: "Apakah Anda pernah terlibat dengan pihak Kepolisian berkaitan dengan isu pelanggaran kriminal, persidangan atau pelanggaran perdata?",
        type: "textarea",
        full: true,
      },
      {
        key: "directorship",
        label: "Holding directorship or appointment in another company?",
        labelId: "Memiliki kepemilikan / keterikatan dengan perusahaan lain?",
        type: "textarea",
        full: true,
      },
      {
        key: "startDate",
        label: "If accepted, when can you start working?",
        labelId: "Jika diterima, kapan dapat mulai bekerja?",
      },
    ],
  },
  {
    id: "remuneration",
    no: "IX",
    title: "REMUNERATION PACKAGE",
    titleId: "PAKET REMUNERASI",
    note: "Silahkan isi bagian ini sesuai dengan fakta yang tercatat pada slip gaji atau kontrak kerja Anda. Nominal gaji dalam Rupiah (Rp.) / Please fill this section with true fact as stated on your salary slip or contract agreement.",
    tables: [
      {
        key: "salary",
        label: "Component of Salary",
        labelId: "Komponen Gaji",
        columns: [
          { key: "component", label: "Komponen / Component" },
          { key: "current", label: "Saat ini / Current" },
          { key: "expectation", label: "Diharapkan / Expectation" },
        ],
        rows: 4,
        presets: [
          "Take Home Pay / Gross Salary",
          "Fasilitas / Facility",
          "Tunjangan / Allowance",
          "Lain-lain / Others",
        ],
      },
    ],
  },
  {
    id: "declaration",
    no: "X",
    title: "DECLARATION",
    titleId: "PERNYATAAN",
    note: "Dengan ini Saya menyatakan bahwa semua data yang Saya tuliskan di atas adalah benar. Saya menyadari bahwa ketidakjujuran mengenai data-data di atas dapat mengakibatkan pembatalan atau pemutusan hubungan kerja dari pihak perusahaan. I declare that all information given herein is true and correct. I understand that any misrepresentation or omission of facts will be sufficient cause for cancellation of consideration for employment or dismissal from the Company’s service if I have been employed.",
    fields: [
      { key: "city", label: "City", labelId: "Kota" },
      { key: "date", label: "Date", labelId: "Tanggal", type: "date" },
      { key: "signatureName", label: "Name", labelId: "Nama Penanda Tangan" },
      {
        key: "agree",
        label: "I declare that all information given herein is true and correct",
        labelId: "Saya menyatakan seluruh data di atas benar dan dapat dipertanggungjawabkan",
        type: "checkbox",
      },
      {
        key: "signature",
        label: "Signature",
        labelId: "Tanda Tangan Kandidat",
        type: "signature",
        full: true,
      },
    ],
  },
];

export const LANGUAGE_LEVELS = ["Aktif / Active", "Pasif / Passive", "-"];

export type ApplicationData = Record<string, Record<string, unknown>>;

const SINGLE_INITIAL_ROW_TABLES = new Set([
  "nonFormal",
  "social",
  "awards",
  "jobs",
  "supervisors",
]);

function hasRowContent(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  return Object.values(row as Record<string, unknown>).some((value) => {
    if (typeof value === "boolean") return value;
    return String(value ?? "").trim().length > 0;
  });
}

function normalizeSingleInitialRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const lastFilledIndex = value.reduce(
    (last, row, index) => (hasRowContent(row) ? index : last),
    -1,
  );
  return value.slice(0, Math.max(1, lastFilledIndex + 1));
}

export function createEmptyData(): ApplicationData {
  const data: ApplicationData = {};
  for (const section of FORM_SECTIONS) {
    const sectionData: Record<string, unknown> = {};
    for (const field of section.fields ?? []) {
      sectionData[field.key] = field.type === "checkbox" ? false : "";
    }
    for (const table of section.tables ?? []) {
      sectionData[table.key] = Array.from({ length: table.rows }, (_, i) => {
        const row: Record<string, unknown> = {};
        table.columns.forEach((col, ci) => {
          if (ci === 0 && table.presets) row[col.key] = table.presets[i] ?? "";
          else row[col.key] = col.type === "checkbox" ? false : "";
        });
        return row;
      });
    }
    data[section.id] = sectionData;
  }
  return data;
}

export function mergeWithEmpty(stored: unknown): ApplicationData {
  const base = createEmptyData();
  if (!stored || typeof stored !== "object") return base;
  const src = stored as ApplicationData;
  for (const key of Object.keys(base)) {
    if (src[key] && typeof src[key] === "object") {
      base[key] = { ...base[key], ...src[key] };
      for (const tableKey of SINGLE_INITIAL_ROW_TABLES) {
        if (tableKey in base[key]) {
          base[key][tableKey] = normalizeSingleInitialRows(base[key][tableKey]);
        }
      }
    }
  }
  return base;
}

export const DOC_TYPES = [
  { key: "photo", label: "Foto 3x4", required: true },
  { key: "cv", label: "CV / Curriculum Vitae", required: true },
  { key: "ktp", label: "KTP", required: true },
  { key: "ijazah", label: "Ijazah", required: true },
  { key: "transkrip", label: "Transkrip Nilai", required: true },
  { key: "sertifikat", label: "Sertifikat / Lainnya", required: false },
];

export const REQUIRED_DOC_TYPES = DOC_TYPES.filter((type) => type.required);

/** Field yang boleh dikosongkan (sisanya wajib diisi). */
const OPTIONAL_FIELDS = new Set([
  "personal.simA",
  "personal.simB",
  "personal.simC",
  "personal.npwp",
  "others.relocate",
  "others.businessTrip",
  "others.relocateNotes",
  "others.businessTripNotes",
]);

/** Baris tabel yang wajib lengkap. Tabel yang tidak terdaftar bersifat opsional. */
const TABLE_RULES: Record<string, { rows: number; columns?: string[] }> = {
  spouseChildren: { rows: 1, columns: ["name", "birthday", "education", "job"] },
  familyTree: { rows: 1, columns: ["name", "birthday", "education", "job"] },
  formal: { rows: 1, columns: ["level", "school", "major", "from", "until"] },
  languages: { rows: 1, columns: ["language", "spoken", "written"] },
  refs: { rows: 1 },
  emergency: { rows: 1 },
  salary: { rows: 1, columns: ["component", "current", "expectation"] },
};

function isEmptyValue(value: unknown): boolean {
  if (typeof value === "boolean") return false;
  return String(value ?? "").trim().length === 0;
}

export type SectionErrors = {
  fields: Record<string, string>;
  tables: Record<string, string>;
};

export function validateSection(section: Section, data: ApplicationData): SectionErrors {
  const values = (data[section.id] ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const tables: Record<string, string> = {};

  for (const field of section.fields ?? []) {
    if (OPTIONAL_FIELDS.has(`${section.id}.${field.key}`)) continue;
    const value = values[field.key];
    if (field.type === "checkbox") {
      if (value !== true) fields[field.key] = "Wajib dicentang";
      continue;
    }
    if (isEmptyValue(value)) fields[field.key] = "Wajib diisi";
  }

  const maritalStatus = String(
    ((data.personal ?? {}) as Record<string, unknown>).maritalStatus ?? "",
  );
  const isSingle = maritalStatus.includes("Belum Menikah");

  for (const table of section.tables ?? []) {
    // Kandidat yang belum menikah tidak memiliki pasangan/anak untuk diisi.
    if (table.key === "spouseChildren" && isSingle) continue;
    const rule = TABLE_RULES[table.key];
    if (!rule) continue;
    const rows = (Array.isArray(values[table.key]) ? values[table.key] : []) as Record<
      string,
      unknown
    >[];
    const cols = rule.columns ?? table.columns.map((c) => c.key);
    for (let i = 0; i < rule.rows; i += 1) {
      const row = rows[i] ?? {};
      if (cols.some((col) => isEmptyValue(row[col]))) {
        tables[table.key] =
          rule.rows > 1
            ? `Lengkapi ${rule.rows} baris pertama pada tabel ini`
            : "Lengkapi baris pertama pada tabel ini";
        break;
      }
    }
  }

  return { fields, tables };
}

export function isSectionComplete(section: Section, data: ApplicationData): boolean {
  const errors = validateSection(section, data);
  return Object.keys(errors.fields).length === 0 && Object.keys(errors.tables).length === 0;
}

export function isFieldRequired(sectionId: string, fieldKey: string): boolean {
  return !OPTIONAL_FIELDS.has(`${sectionId}.${fieldKey}`);
}

export function isTableRequired(tableKey: string): boolean {
  return tableKey in TABLE_RULES;
}
