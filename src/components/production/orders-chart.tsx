"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

const CHART_COLORS = {
  total: "#0d9488",
  onTime: "#10b981",
};

export function OrdersChart() {
  const { stats } = useProductionData();
  if (!stats?.weeklyData?.length) return null;

  const data = stats.weeklyData.map((w) => ({
    week: format(parseISO(w.week), "MMM d"),
    "Total Orders": w.totalOrders,
    "On-Time Orders": w.onTimeOrders,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders vs On-Time (5-week period)</CardTitle>
        <p className="text-sm text-muted-foreground">Total orders compared to orders shipped on time by week</p>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.5} />
              <XAxis dataKey="week" tick={{ fill: "#475569" }} fontSize={12} />
              <YAxis tick={{ fill: "#475569" }} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#334155",
                }}
              />
              <Legend />
              <Bar dataKey="Total Orders" fill={CHART_COLORS.total} radius={[4, 4, 0, 0]} />
              <Bar dataKey="On-Time Orders" fill={CHART_COLORS.onTime} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
