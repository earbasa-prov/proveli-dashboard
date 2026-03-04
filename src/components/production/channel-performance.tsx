"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ChannelPerformance() {
  const { stats, hasDefectData } = useProductionData();
  if (!stats) return null;

  const entries = Object.entries(stats.channelKpis).sort(([, a], [, b]) => b.totalOrders - a.totalOrders);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel-Specific Performance (Report KPI)</CardTitle>
        <p className="text-sm text-muted-foreground">
          On-Time %, Same-Day %, and Defect % per store — aligned with Weekly Reports
        </p>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">On-Time %</TableHead>
                <TableHead className="text-right">Same-Day %</TableHead>
                <TableHead className="text-right">Defect %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([channel, kpi]) => (
                <TableRow key={channel}>
                  <TableCell className="font-medium">{channel}</TableCell>
                  <TableCell className="text-right">{kpi.totalOrders}</TableCell>
                  <TableCell className="text-right">
                    <span className={kpi.onTimePercent >= 94 ? "text-emerald-600" : kpi.onTimePercent < 90 ? "text-amber-600" : ""}>
                      {kpi.onTimePercent.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={kpi.sameDayPercent >= 83 ? "text-emerald-600" : kpi.sameDayPercent < 75 ? "text-amber-600" : ""}>
                      {kpi.sameDayPercent.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasDefectData ? (
                      <span className={kpi.defectPercent > 2 ? "text-rose-600" : "text-slate-600"}>
                        {kpi.defectPercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No channel data in selected filters</p>
        )}
      </CardContent>
    </Card>
  );
}
