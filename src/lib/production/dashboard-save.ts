import type { ProductionOrder, DefectRecord } from "@/types/production";
import { parseISO } from "date-fns";

const STORAGE_KEY = "proveli_saved_dashboards";

export interface DashboardExport {
  orders: ProductionOrder[];
  defects: DefectRecord[];
  dateRange: { min: string; max: string };
  exportedAt: string;
}

export function getDateRangeFromOrders(orders: ProductionOrder[]): { min: string; max: string } | null {
  if (orders.length === 0) return null;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  for (const o of orders) {
    const d = parseISO(o.shipByDate);
    if (Number.isNaN(d.getTime())) continue;
    if (!minDate || d < minDate) minDate = d;
    if (!maxDate || d > maxDate) maxDate = d;
  }
  if (!minDate || !maxDate) return null;
  return {
    min: minDate.toISOString().split("T")[0],
    max: maxDate.toISOString().split("T")[0],
  };
}

function getVersionForKey(dateRangeKey: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, number> = stored ? JSON.parse(stored) : {};
    return (map[dateRangeKey] ?? 0) + 1;
  } catch {
    return 1;
  }
}

function setVersionForKey(dateRangeKey: string, version: number): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, number> = stored ? JSON.parse(stored) : {};
    map[dateRangeKey] = version;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function saveDashboard(orders: ProductionOrder[], defects: DefectRecord[]): string | null {
  if (orders.length === 0) return null;
  const dateRange = getDateRangeFromOrders(orders);
  if (!dateRange) return null;

  const dateRangeKey = `${dateRange.min}_to_${dateRange.max}`;
  const version = getVersionForKey(dateRangeKey);
  setVersionForKey(dateRangeKey, version);

  const baseName = `Dashboard-${dateRange.min}_to_${dateRange.max}`;
  const filename = version === 1 ? `${baseName}.json` : `${baseName}-v${version}.json`;

  const payload: DashboardExport = {
    orders,
    defects,
    dateRange,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, filename);
  return filename;
}
