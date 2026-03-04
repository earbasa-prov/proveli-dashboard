import * as XLSX from "xlsx";
import Papa from "papaparse";
import { differenceInDays, parseISO, parse, isBefore } from "date-fns";
import type { ProductionOrder, OrderStatus } from "@/types/production";
import { mapChannelToBrand } from "./brand-mapping";

const COLUMN_ALIASES: Record<string, string[]> = {
  "Order No": ["Order No", "Order No.", "OrderNo", "Order #", "Order Number"],
  Channel: ["Channel", "Store", "Brand"],
  "Ship By Date": ["Ship By Date", "ShipByDate", "Ship By"],
  Status: ["Status", "Order Status"],
  "Total Items": ["Total Items", "TotalItems", "Items", "Qty", "Total Quantity"],
  "Ship Date": ["Ship Date", "ShipDate", "Shipped", "Label Print Date Ship Date", "Complete Date"],
  "Final Department": ["Final Department", "Final Dept", "Department"],
};

function findColumn(headers: string[], targetKey: keyof typeof COLUMN_ALIASES): string | null {
  const aliases = COLUMN_ALIASES[targetKey] || [targetKey];
  const lowerHeaders = headers.map((h) => (h ?? "").trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lowerHeaders.findIndex((h) => h === alias.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function normalizeStatus(val: unknown): OrderStatus | null {
  if (typeof val !== "string") return null;
  const u = val.toUpperCase().replace(/\s/g, "");
  if (u === "INPROGRESS" || u === "IN_PROGRESS") return "INPROGRESS";
  if (u === "ONHOLD" || u === "ON_HOLD") return "ONHOLD";
  if (u === "UNASSIGNED") return "UNASSIGNED";
  if (u === "COMPLETED") return "COMPLETED";
  return null;
}

function excelSerialToDate(serial: number): Date {
  const utc = (serial - 25569) * 86400 * 1000;
  return new Date(utc);
}

const DATE_FORMATS = [
  "MMM d, yyyy HH:mm:ss",
  "MMM dd, yyyy HH:mm:ss",
  "MMM d, yyyy",
  "MMM dd, yyyy",
  "yyyy-MM-dd",
  "MM/dd/yyyy",
];

function parseDate(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !Number.isNaN(val) && val > 0) {
    const d = excelSerialToDate(val);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  if (!s) return null;
  let parsed = parseISO(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  for (const fmt of DATE_FORMATS) {
    parsed = parse(s, fmt, new Date());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  }
  return null;
}

export interface ParseResult {
  orders: ProductionOrder[];
  errors: string[];
}

export async function parseProductionFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCsv(file, errors);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file, errors);
  return { orders: [], errors: ["Unsupported file type. Use .xlsx or .csv"] };
}

async function parseCsv(file: File, errors: string[]): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, unknown>[];
        if (rows.length === 0) {
          errors.push("No data rows found");
          resolve({ orders: [], errors });
          return;
        }
        const headers = Object.keys(rows[0] || {});
        resolve({ orders: mapRowsToOrders(rows, headers, errors), errors });
      },
      error: (err) => {
        errors.push(err.message || "Failed to parse CSV");
        resolve({ orders: [], errors });
      },
    });
  });
}

async function parseExcel(file: File, errors: string[]): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  let sheet = workbook.Sheets["BREAKDOWN PER STORE"] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    errors.push("No worksheet found");
    return { orders: [], errors };
  }
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  if (data.length === 0) {
    errors.push("No data rows found");
    return { orders: [], errors };
  }
  const headers = Object.keys(data[0] || {});
  return { orders: mapRowsToOrders(data, headers, errors), errors };
}

function mapRowsToOrders(
  rows: Record<string, unknown>[],
  headers: string[],
  errors: string[]
): ProductionOrder[] {
  const orderNoCol = findColumn(headers, "Order No");
  const channelCol = findColumn(headers, "Channel");
  const shipByCol = findColumn(headers, "Ship By Date");
  const statusCol = findColumn(headers, "Status");
  const totalItemsCol = findColumn(headers, "Total Items");
  const shipDateCol = findColumn(headers, "Ship Date");
  const finalDeptCol = findColumn(headers, "Final Department");
  const missing: string[] = [];
  if (!orderNoCol) missing.push("Order No");
  if (!channelCol) missing.push("Channel");
  if (!shipByCol) missing.push("Ship By Date");
  if (!statusCol) missing.push("Status");
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
    return [];
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orders: ProductionOrder[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const orderNo = String(row[orderNoCol!] ?? "").trim();
    const channel = String(row[channelCol!] ?? "").trim();
    const shipByStr = parseDate(row[shipByCol!]);
    const statusVal = normalizeStatus(row[statusCol!]);
    if (!orderNo && !channel) continue;
    if (!orderNo) {
      errors.push(`Row ${i + 2}: Missing Order No`);
      continue;
    }
    if (!channel) {
      errors.push(`Row ${i + 2}: Missing Channel`);
      continue;
    }
    if (!shipByStr) {
      errors.push(`Row ${i + 2}: Invalid Ship By Date`);
      continue;
    }
    if (!statusVal) {
      errors.push(`Row ${i + 2}: Invalid Status (expected INPROGRESS, ONHOLD, UNASSIGNED, or COMPLETED)`);
      continue;
    }
    const shipDate = shipDateCol ? parseDate(row[shipDateCol]) ?? undefined : undefined;
    const shipBy = parseISO(shipByStr);
    const ageingDays =
      !Number.isNaN(shipBy.getTime()) && isBefore(shipBy, today) ? differenceInDays(today, shipBy) : 0;
    orders.push({
      orderNo,
      channel,
      brandId: mapChannelToBrand(channel),
      shipByDate: shipByStr,
      status: statusVal,
      totalItems: totalItemsCol && row[totalItemsCol] != null ? Number(row[totalItemsCol]) || undefined : undefined,
      shipDate,
      department: finalDeptCol ? String(row[finalDeptCol] ?? "").trim() || undefined : undefined,
      ageingDays,
    });
  }
  return orders;
}
