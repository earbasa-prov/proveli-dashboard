"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProductionOrder, ProductionStats, ProductionFilters, DefectRecord } from "@/types/production";
import { parseProductionFile } from "./parse-production-file";
import { parseDefectFile } from "./parse-defect-file";
import { computeStats } from "./compute-stats";

export interface SavedDashboardMeta {
  id: string;
  savedAt: string;
  savedDate: string;
  dateRangeMin: string | null;
  dateRangeMax: string | null;
  uniqueOrders: number | null;
  totalItems: number | null;
}

interface ProductionDataContextValue {
  orders: ProductionOrder[];
  defects: DefectRecord[];
  stats: ProductionStats | null;
  filters: ProductionFilters;
  setFilters: (f: ProductionFilters | ((prev: ProductionFilters) => ProductionFilters)) => void;
  loadFromFile: (file: File) => Promise<{ success: boolean; errors: string[]; orders?: ProductionOrder[] }>;
  loadDefectFile: (file: File) => Promise<{ success: boolean; errors: string[] }>;
  saveDashboard: () => Promise<{ success: boolean; message: string }>;
  savedDashboards: SavedDashboardMeta[];
  fetchSavedDashboards: () => Promise<void>;
  loadSavedDashboard: (id: string) => Promise<{ success: boolean; error?: string }>;
  hasData: boolean;
  hasDefectData: boolean;
}

const ProductionDataContext = createContext<ProductionDataContextValue | null>(null);
const DEFAULT_FILTERS: ProductionFilters = { brands: [], weeksBack: 5 };

export function ProductionDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [defects, setDefects] = useState<DefectRecord[]>([]);
  const [filters, setFiltersState] = useState<ProductionFilters>(DEFAULT_FILTERS);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardMeta[]>([]);
  const setFilters = useCallback(
    (updater: ProductionFilters | ((prev: ProductionFilters) => ProductionFilters)) => {
      setFiltersState((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    []
  );
  const loadFromFile = useCallback(async (file: File) => {
    const result = await parseProductionFile(file);
    if (result.orders.length > 0) setOrders(result.orders);
    return {
      success: result.orders.length > 0,
      errors: result.errors,
      orders: result.orders.length > 0 ? result.orders : undefined,
    };
  }, []);
  const loadDefectFile = useCallback(async (file: File) => {
    const result = await parseDefectFile(file);
    if (result.defects.length > 0) setDefects(result.defects);
    return { success: result.defects.length > 0, errors: result.errors };
  }, []);

  const fetchSavedDashboards = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboards");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSavedDashboards(Array.isArray(data) ? data : data?.dashboards ?? []);
    } catch {
      setSavedDashboards([]);
    }
  }, []);

  const saveDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders, defects }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.error ?? "Save failed" };
      await fetchSavedDashboards();
      const name = data.savedDate
        ? `Dashboard saved ${data.savedDate}`
        : data.message ?? "Saved";
      return { success: true, message: name };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Save failed" };
    }
  }, [orders, defects, fetchSavedDashboards]);

  const loadSavedDashboard = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/dashboards/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setDefects(data.defects ?? []);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Load failed" };
    }
  }, []);

  const stats = useMemo(
    () => (orders.length === 0 ? null : computeStats(orders, filters, defects)),
    [orders, filters, defects]
  );
  const value = useMemo(
    () => ({
      orders,
      defects,
      stats,
      filters,
      setFilters,
      loadFromFile,
      loadDefectFile,
      saveDashboard,
      savedDashboards,
      fetchSavedDashboards,
      loadSavedDashboard,
      hasData: orders.length > 0,
      hasDefectData: defects.length > 0,
    }),
    [orders, defects, stats, filters, setFilters, loadFromFile, loadDefectFile, saveDashboard, savedDashboards, fetchSavedDashboards, loadSavedDashboard]
  );
  return <ProductionDataContext.Provider value={value}>{children}</ProductionDataContext.Provider>;
}

export function useProductionData(): ProductionDataContextValue {
  const ctx = useContext(ProductionDataContext);
  if (!ctx) throw new Error("useProductionData must be used within ProductionDataProvider");
  return ctx;
}
