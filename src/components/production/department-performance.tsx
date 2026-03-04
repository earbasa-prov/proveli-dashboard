"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DepartmentPerformance() {
  const { stats } = useProductionData();
  if (!stats) return null;

  const entries = Object.entries(stats.departmentKpis).sort(
    ([, a], [, b]) => b.totalOrders - a.totalOrders
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Time by Department</CardTitle>
        <p className="text-sm text-muted-foreground">
          YTD-style breakdown — Final Department (Bloom Alum, Vinyl REP, Bloomington Shipping, etc.)
        </p>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">On-Time</TableHead>
                <TableHead className="text-right">On-Time %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([dept, kpi]) => (
                <TableRow key={dept}>
                  <TableCell className="font-medium">{dept}</TableCell>
                  <TableCell className="text-right">{kpi.totalOrders}</TableCell>
                  <TableCell className="text-right">{kpi.onTimeOrders}</TableCell>
                  <TableCell className="text-right">
                    <span className={kpi.onTimePercent >= 94 ? "text-emerald-600" : kpi.onTimePercent < 90 ? "text-amber-600" : ""}>
                      {kpi.onTimePercent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No department data. Upload data with &quot;Final Department&quot; or &quot;Department&quot; column.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
