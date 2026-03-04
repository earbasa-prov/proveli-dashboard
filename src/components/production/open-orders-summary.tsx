"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Clock, AlertTriangle, ClockIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const CHANNEL_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#ec4899"];
const STATUS_COLORS = {
  INPROGRESS: "#22c55e",
  ONHOLD: "#f59e0b",
  UNASSIGNED: "#ef4444",
};

export function OpenOrdersSummary() {
  const { stats } = useProductionData();
  if (!stats) return null;

  const { openOrdersSummary } = stats;

  const channelData = openOrdersSummary.byChannel
    .sort((a, b) => b.uniqueOrders - a.uniqueOrders)
    .map((r, i) => ({
      name: r.channel,
      value: r.uniqueOrders,
      fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }));

  const statusData = openOrdersSummary.byStatus
    .filter((s) => s.status !== "COMPLETED")
    .map((r) => ({
      name: r.status === "INPROGRESS" ? "In Progress" : r.status === "ONHOLD" ? "On Hold" : "Unassigned",
      value: r.uniqueOrders,
      fill: STATUS_COLORS[r.status] ?? "#64748b",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Open Orders
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Current open orders by channel and status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
            <Package className="h-8 w-8 shrink-0 text-slate-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">TOTAL OPEN ORDERS</p>
              <p className="text-2xl font-bold">{openOrdersSummary.uniqueOrders}</p>
              <p className="text-xs text-muted-foreground">{openOrdersSummary.totalItems.toLocaleString()} items</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
            <Clock className="h-8 w-8 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">IN PROGRESS</p>
              <p className="text-2xl font-bold">{openOrdersSummary.inProgress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
            <AlertTriangle className="h-8 w-8 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">ON HOLD</p>
              <p className="text-2xl font-bold">{openOrdersSummary.onHold}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
            <ClockIcon className="h-8 w-8 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">UNASSIGNED</p>
              <p className="text-2xl font-bold">{openOrdersSummary.unassigned}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {channelData.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Orders by Channel</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {channelData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {statusData.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Status Distribution</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        {openOrdersSummary.byChannel.length > 0 && (
          <div className="min-w-0 overflow-x-auto">
            <h4 className="mb-2 text-sm font-semibold">By Channel</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CHANNEL</TableHead>
                  <TableHead className="text-right">UNIQUE ORDERS</TableHead>
                  <TableHead className="text-right">ITEMS</TableHead>
                  <TableHead className="text-right">AVG AGEING</TableHead>
                  <TableHead className="text-right">IN PROGRESS</TableHead>
                  <TableHead className="text-right">ON HOLD</TableHead>
                  <TableHead className="text-right">UNASSIGNED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openOrdersSummary.byChannel
                  .sort((a, b) => b.uniqueOrders - a.uniqueOrders)
                  .map((r) => (
                    <TableRow key={r.channel}>
                      <TableCell className="font-medium max-w-[180px] truncate" title={r.channel}>{r.channel}</TableCell>
                      <TableCell className="text-right">{r.uniqueOrders}</TableCell>
                      <TableCell className="text-right">{r.totalItems}</TableCell>
                      <TableCell className="text-right">{r.avgAgeingDays.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{r.inProgress}</TableCell>
                      <TableCell className="text-right">{r.onHold}</TableCell>
                      <TableCell className="text-right">{r.unassigned}</TableCell>
                    </TableRow>
                  ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{openOrdersSummary.uniqueOrders}</TableCell>
                  <TableCell className="text-right">{openOrdersSummary.totalItems}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">{openOrdersSummary.inProgress}</TableCell>
                  <TableCell className="text-right">{openOrdersSummary.onHold}</TableCell>
                  <TableCell className="text-right">{openOrdersSummary.unassigned}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
