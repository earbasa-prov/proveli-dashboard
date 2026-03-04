"use client";

import { useMemo } from "react";
import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Target } from "lucide-react";

const BASELINE_DEFECT = 2.0;
const WEEKS_PER_MONTH = 4.33;

export function DefectProjection() {
  const { stats, hasDefectData } = useProductionData();

  const projection = useMemo(() => {
    if (!stats || !hasDefectData || stats.defectPercent <= BASELINE_DEFECT) return null;

    const currentOrders = stats.uniqueOrders;
    const currentDefectPercent = stats.defectPercent;
    const currentDefects = Math.round(currentOrders * (currentDefectPercent / 100));

    const weeklyAvg =
      stats.weeklyData.length > 0
        ? stats.weeklyData.reduce((s, w) => s + w.totalOrders, 0) / stats.weeklyData.length
        : currentOrders / 5;
    const projectedOrdersNextMonth = Math.round(weeklyAvg * WEEKS_PER_MONTH);

    const atBaseline = Math.round(projectedOrdersNextMonth * (BASELINE_DEFECT / 100));
    const atCurrentRate = Math.round(projectedOrdersNextMonth * (currentDefectPercent / 100));
    const defectsAvoided = atCurrentRate - atBaseline;

    const improve25 = currentDefectPercent * 0.75;
    const improve50 = currentDefectPercent * 0.5;
    const at25 = Math.round(projectedOrdersNextMonth * (improve25 / 100));
    const at50 = Math.round(projectedOrdersNextMonth * (improve50 / 100));

    return {
      currentDefects,
      currentDefectPercent,
      projectedOrdersNextMonth,
      atBaseline,
      atCurrentRate,
      defectsAvoided,
      improve25,
      improve50,
      at25,
      at50,
    };
  }, [stats, hasDefectData]);

  if (!stats || !hasDefectData || !projection || projection.defectsAvoided <= 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-emerald-500" />
          Next Month Projection (If Defects Improve)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on current order volume and defect rate — projections assume similar volume next month
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-muted-foreground">Projected orders (next month)</p>
            <p className="text-xl font-bold">{projection.projectedOrdersNextMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">~{projection.projectedOrdersNextMonth} orders at current pace</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-muted-foreground">At current rate ({projection.currentDefectPercent.toFixed(1)}%)</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              ~{projection.atCurrentRate} defective orders
            </p>
            <p className="text-xs text-muted-foreground">If no improvement</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              At baseline ({BASELINE_DEFECT}%)
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              ~{projection.atBaseline} defective orders
            </p>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
              Up to {projection.defectsAvoided} fewer defects if target met
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground mb-1">Improvement scenarios</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">25% improvement</span> (→ {projection.improve25.toFixed(1)}% defect): ~{projection.at25} defective orders next month
            </li>
            <li>
              <span className="font-medium text-foreground">50% improvement</span> (→ {projection.improve50.toFixed(1)}% defect): ~{projection.at50} defective orders next month
            </li>
            <li>
              <span className="font-medium text-foreground">Meet 2% baseline</span>: ~{projection.atBaseline} defective orders, avoiding ~{projection.defectsAvoided} defects vs. current rate
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
