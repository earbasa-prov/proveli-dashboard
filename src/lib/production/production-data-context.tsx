"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProductionOrder, ProductionStats, ProductionFilters, DefectRecord } from "@/types/production";
import { parseProductionFile } from "./parse-production-file";
import { parseDefectFile } from "./parse-defect-file";
import { computeStats } from "./compute-stats";
import { saveDashboard } from "./dashboard-save";

interface ProductionDataContextValue {
  orders: ProductionOrder[];
  defects: DefectRecord[];
  stats: ProductionStats | null;
  filters: ProductionFilters;
  setFilters: (f: ProductionFilters | ((prev: ProductionFilters) => ProductionFilters)) => void;
  loadFromFile: (file: File) => Promise<{ success: boolean; errors: string[]; orders?: ProductionOrder[] }>;
  loadDefectFile: (file: File) => Promise<{ success: boolean; errors: string[] }>;
  saveDashboard: () => string | null;
  hasData: boolean;
  hasDefectData: boolean;
}

const ProductionDataContext = createContext<ProductionDataContextValue | null>(null);
const DEFAULT_FILTERS: ProductionFilters = { brands: [], weeksBack: 5 };

export function ProductionDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [defects, setDefects] = useState<DefectRecord[]>([]);
  const [filters, setFiltersState] = useState<ProductionFilters>(DEFAULT_FILTERS);
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
  const saveCurrentDashboard = useCallback(() => saveDashboard(orders, defects), [orders, defects]);
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
      saveDashboard: saveCurrentDashboard,
      hasData: orders.length > 0,
      hasDefectData: defects.length > 0,
    }),
    [orders, defects, stats, filters, setFilters, loadFromFile, loadDefectFile, saveCurrentDashboard]
  );
  return <ProductionDataContext.Provider value={value}>{children}</ProductionDataContext.Provider>;
}

export function useProductionData(): ProductionDataContextValue {
  const ctx = useContext(ProductionDataContext);
  if (!ctx) throw new Error("useProductionData must be used within ProductionDataProvider");
  return ctx;
}
