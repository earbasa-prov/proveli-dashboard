"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BRAND_LABELS: Record<string, string> = {
  "4ever": "4Ever",
  aod: "AOD",
  hallsigns: "HallSigns",
  signpost: "SignPost",
  realestatepost: "Real Estate Post",
  amazon: "Amazon",
  wayfair: "Wayfair",
  etsy: "Etsy",
  walmart: "Walmart",
  other: "Other",
};

export function BacklogHeatmap() {
  const { stats } = useProductionData();
  if (!stats) return null;

  const channelEntries = Object.entries(stats.channelBreakdown).filter(([, c]) => c > 0);
  const maxCount = Math.max(...channelEntries.map(([, c]) => c), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlog Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          {stats.uniqueOrders} unique orders / {stats.totalItems.toLocaleString()} items
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channelEntries.map(([brandId, count], idx) => {
            const intensity = count / maxCount;
            const colors = [
              "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200",
              "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-200",
              "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
              "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200",
              "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
              "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
              "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
              "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
            ];
            const colorClass = colors[idx % colors.length];
            return (
              <div
                key={brandId}
                className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2 font-medium min-w-0 ${colorClass}`}
              >
                <span className="truncate">{BRAND_LABELS[brandId] ?? brandId}</span>
                <span className="shrink-0 text-sm opacity-90">{count} orders</span>
              </div>
            );
          })}
          {channelEntries.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No channel data in selected filters</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
