"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Truck, AlertTriangle } from "lucide-react";

const BASELINE = { onTime: 94.87, sameDay: 83.09, defect: 2.0 };

export function KpiOverview() {
  const { stats, hasDefectData } = useProductionData();
  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-l-4 border-l-teal-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-400">On-Time Delivery</CardTitle>
          <Truck className="h-4 w-4 text-teal-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.onTimeDeliveryPercent.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">Rolling 5-week avg (baseline: {BASELINE.onTime}%)</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Same-Day Shipping</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.sameDayShippingPercent.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">Rolling 5-week avg (baseline: {BASELINE.sameDay}%)</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Defect %</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {hasDefectData ? `${stats.defectPercent.toFixed(2)}%` : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            {hasDefectData ? `Overall (baseline: ${BASELINE.defect}%)` : "Upload defect data to see Defect %"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
