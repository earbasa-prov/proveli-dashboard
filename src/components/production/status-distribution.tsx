"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  INPROGRESS: "#6366f1",
  ONHOLD: "#f59e0b",
  UNASSIGNED: "#ec4899",
  COMPLETED: "#10b981",
};

export function StatusDistribution() {
  const { stats } = useProductionData();
  if (!stats) return null;

  const data = Object.entries(stats.statusDistribution).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    fill: STATUS_COLORS[name] ?? "#64748b",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">Orders by INPROGRESS, ONHOLD, UNASSIGNED, COMPLETED</p>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fill: "#475569" }} fontSize={12} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#475569" }} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#334155",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
