import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { DefectRecord } from "@/types/production";

const DEFECT_COLUMN_ALIASES: Record<string, string[]> = {
  "Original Order No": ["Original Order No", "Original Order No.", "OriginalOrderNo", "Original Order No"],
  "Defect Order No": ["Defect Order No", "Defect Order No.", "DefectOrderNo"],
  "Channel of original order": ["Channel of original order", "Channel of original order", "Channel", "Store", "Brand"],
  "Dept. Responsible": ["Dept. Responsible", "Dept", "Department Responsible"],
  "Person Responsible": ["Person Responsible", "Person"],
  "Order Date": ["Order Date"],
  "Defect Reported Date": ["Defect Reported Date"],
  "Defect Type": ["Defect Type", "DefectType"],
  "Reason - Question 1": ["Reason - Question 1", "Reason", "Defect Reason"],
};

function findCol(headers: string[], targetKey: keyof typeof DEFECT_COLUMN_ALIASES): string | null {
  const aliases = DEFECT_COLUMN_ALIASES[targetKey] || [targetKey];
  const lowerHeaders = headers.map((h) => (h ?? "").trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lowerHeaders.findIndex((h) => h === alias.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

/** Normalize order number for matching (e.g. "D1-1046187" -> "1046187") */
export function normalizeOrderNo(raw: string): string {
  const s = String(raw ?? "").trim();
  const match = s.match(/^(?:D\d-)?(.+)$/);
  return match ? match[1] : s;
}

export interface DefectParseResult {
  defects: DefectRecord[];
  errors: string[];
}

export async function parseDefectFile(file: File): Promise<DefectParseResult> {
  const errors: string[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseDefectCsv(file, errors);
  if (ext === "xlsx" || ext === "xls") return parseDefectExcel(file, errors);
  return { defects: [], errors: ["Unsupported file type. Use .xlsx or .csv"] };
}

async function parseDefectCsv(file: File, errors: string[]): Promise<DefectParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, unknown>[];
        if (rows.length === 0) {
          errors.push("No data rows found");
          resolve({ defects: [], errors });
          return;
        }
        const headers = Object.keys(rows[0] || {});
        resolve({ defects: mapRowsToDefects(rows, headers, errors), errors });
      },
      error: (err) => {
        errors.push(err.message || "Failed to parse CSV");
        resolve({ defects: [], errors });
      },
    });
  });
}

async function parseDefectExcel(file: File, errors: string[]): Promise<DefectParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    errors.push("No worksheet found");
    return { defects: [], errors };
  }
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  if (data.length === 0) {
    errors.push("No data rows found");
    return { defects: [], errors };
  }
  const headers = Object.keys(data[0] || {});
  return { defects: mapRowsToDefects(data, headers, errors), errors };
}

function mapRowsToDefects(
  rows: Record<string, unknown>[],
  headers: string[],
  errors: string[]
): DefectRecord[] {
  const origCol = findCol(headers, "Original Order No");
  const channelCol = findCol(headers, "Channel of original order");
  const deptCol = findCol(headers, "Dept. Responsible");
  const personCol = findCol(headers, "Person Responsible");
  const orderDateCol = findCol(headers, "Order Date");
  const defectDateCol = findCol(headers, "Defect Reported Date");
  const defectTypeCol = findCol(headers, "Defect Type");
  const reasonCol = findCol(headers, "Reason - Question 1");
  const defectOrderCol = findCol(headers, "Defect Order No");

  if (!origCol || !channelCol) {
    errors.push("Missing required columns: Original Order No, Channel of original order");
    return [];
  }

  const defects: DefectRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const originalOrderNo = String(row[origCol] ?? "").trim();
    const channel = String(row[channelCol] ?? "").trim();
    if (!originalOrderNo || !channel) continue;

    defects.push({
      originalOrderNo: normalizeOrderNo(originalOrderNo),
      defectOrderNo: defectOrderCol ? String(row[defectOrderCol] ?? "").trim() || undefined : undefined,
      channel,
      deptResponsible: deptCol ? String(row[deptCol] ?? "").trim() || undefined : undefined,
      personResponsible: personCol ? String(row[personCol] ?? "").trim() || undefined : undefined,
      orderDate: orderDateCol ? String(row[orderDateCol] ?? "").trim() || undefined : undefined,
      defectReportedDate: defectDateCol ? String(row[defectDateCol] ?? "").trim() || undefined : undefined,
      defectType: defectTypeCol ? String(row[defectTypeCol] ?? "").trim() || undefined : undefined,
      reason: reasonCol ? String(row[reasonCol] ?? "").trim() || undefined : undefined,
    });
  }
  return defects;
}
