"use client";

import { useMemo } from "react";
import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DEPT_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];

export function DefectAnalysis() {
  const { stats, hasDefectData } = useProductionData();
  if (!stats) return null;

  const { defectByDept } = stats;

  const byDept = useMemo(() => {
    const map = new Map<string, { total: number; rows: { defectType?: string; reason: string; count: number }[] }>();
    for (const row of defectByDept) {
      const dept = row.dept || "Unknown";
      let entry = map.get(dept);
      if (!entry) {
        entry = { total: 0, rows: [] };
        map.set(dept, entry);
      }
      entry.total += row.count;
      entry.rows.push({ defectType: row.defectType, reason: row.reason, count: row.count });
    }
    return Array.from(map.entries())
      .map(([dept, { total, rows }]) => ({ dept, total, rows }))
      .sort((a, b) => b.total - a.total);
  }, [defectByDept]);

  const barData = byDept.map((d, i) => ({
    name: d.dept,
    value: d.total,
    fill: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defect Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defects grouped by Dept. Responsible — from defect data upload
        </p>
      </CardHeader>
      <CardContent>
        {!hasDefectData ? (
          <p className="py-8 text-center text-muted-foreground">
            Upload defect data to see Defect Analysis by department and reason.
          </p>
        ) : defectByDept.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No defects matched orders in the selected period.
          </p>
        ) : (
          <div className="space-y-6">
            {barData.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Defects by Dept. Responsible</h4>
                <div className="h-[400px] min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.5} horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#475569" }} fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={180}
                        tick={{ fill: "#475569", fontSize: 11 }}
                        tickLine={false}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          color: "#334155",
                        }}
                      />
                      <Bar dataKey="value" name="Defects" radius={[0, 4, 4, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="min-w-0 space-y-4">
              <h4 className="mb-2 text-sm font-semibold">By Department</h4>
              {byDept.map(({ dept, total, rows }) => (
                <div key={dept} className="overflow-hidden rounded-md border">
                  <div className="border-b bg-muted/30 px-3 py-2 font-medium text-foreground">
                    {dept} ({total} defects)
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Defect Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows
                        .sort((a, b) => b.count - a.count)
                        .map((row, i) => (
                          <TableRow key={`${dept}-${i}`}>
                            <TableCell className="max-w-[140px] truncate" title={row.defectType}>{row.defectType || "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={row.reason}>
                              {row.reason}
                            </TableCell>
                            <TableCell className="text-right">{row.count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
