"use client";

import { useMemo } from "react";
import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle2 } from "lucide-react";

const BASELINE = { onTime: 94.87, sameDay: 83.09, defect: 2.0 };
const REPORT_BRAND_LABELS: Record<string, string> = {
  "4ever": "4Ever",
  aod: "AOD",
  hallsigns: "HallSigns",
  signpost: "Signpost",
  others: "Others",
};

interface Recommendation {
  type: "improve" | "maintain";
  priority: "high" | "medium" | "low";
  message: string;
}

function buildRecommendations(stats: NonNullable<ReturnType<typeof useProductionData>["stats"]>, hasDefectData: boolean): Recommendation[] {
  const recs: Recommendation[] = [];
  const { openOrdersSummary, defectByBrand, defectByDept, channelKpis, departmentKpis, lateOrders } = stats;

  if (stats.onTimeDeliveryPercent < BASELINE.onTime) {
    const gap = (BASELINE.onTime - stats.onTimeDeliveryPercent).toFixed(1);
    recs.push({
      type: "improve",
      priority: stats.onTimeDeliveryPercent < 90 ? "high" : "medium",
      message: `On-Time Delivery (${stats.onTimeDeliveryPercent.toFixed(1)}%) is below baseline (${BASELINE.onTime}%). Consider reviewing capacity, scheduling, or late-stage bottlenecks — target closing the ${gap}% gap.`,
    });
  }

  if (stats.sameDayShippingPercent < BASELINE.sameDay) {
    const gap = (BASELINE.sameDay - stats.sameDayShippingPercent).toFixed(1);
    recs.push({
      type: "improve",
      priority: stats.sameDayShippingPercent < 75 ? "high" : "medium",
      message: `Same-Day Shipping (${stats.sameDayShippingPercent.toFixed(1)}%) is below baseline (${BASELINE.sameDay}%). Consider improving cut-off timing or increasing same-day capacity.`,
    });
  }

  if (hasDefectData && stats.defectPercent > BASELINE.defect) {
    recs.push({
      type: "improve",
      priority: stats.defectPercent > 5 ? "high" : "medium",
      message: `Overall Defect % (${stats.defectPercent.toFixed(1)}%) exceeds baseline (${BASELINE.defect}%). Prioritize quality review and root-cause analysis on high-defect brands and departments.`,
    });
  }

  if (openOrdersSummary.unassigned > 0) {
    recs.push({
      type: "improve",
      priority: "high",
      message: `${openOrdersSummary.unassigned} order(s) are unassigned. Assign these to departments or teams to avoid delays.`,
    });
  }

  if (openOrdersSummary.avgAgeingDays > 14) {
    recs.push({
      type: "improve",
      priority: openOrdersSummary.avgAgeingDays > 30 ? "high" : "medium",
      message: `Open orders average ${openOrdersSummary.avgAgeingDays.toFixed(0)} days ageing. Prioritize backlog clearance and consider capacity or prioritization rules.`,
    });
  }

  const highAgeingChannels = openOrdersSummary.byChannel
    .filter((c) => c.avgAgeingDays > 14)
    .sort((a, b) => b.avgAgeingDays - a.avgAgeingDays)
    .slice(0, 3);
  if (highAgeingChannels.length > 0) {
    const names = highAgeingChannels.map((c) => `${c.channel} (${c.avgAgeingDays.toFixed(0)}d)`).join(", ");
    recs.push({
      type: "improve",
      priority: "medium",
      message: `Channels with highest ageing: ${names}. Focus resources or expedite these channels.`,
    });
  }

  if (hasDefectData && defectByBrand.length > 0) {
    const aboveBaseline = defectByBrand.filter((b) => b.defectPercent > BASELINE.defect);
    if (aboveBaseline.length > 0) {
      const names = aboveBaseline.map((b) => `${REPORT_BRAND_LABELS[b.reportBrandId] ?? b.reportBrandId} (${b.defectPercent.toFixed(1)}%)`).join(", ");
      recs.push({
        type: "improve",
        priority: aboveBaseline.some((b) => b.defectPercent > 5) ? "high" : "medium",
        message: `Defect % above baseline for: ${names}. Review quality processes for these brands.`,
      });
    }
  }

  if (hasDefectData && defectByDept.length > 0) {
    const byDeptTotal = new Map<string, number>();
    for (const d of defectByDept) {
      const dept = d.dept || "Unknown";
      byDeptTotal.set(dept, (byDeptTotal.get(dept) ?? 0) + d.count);
    }
    const topDepts = Array.from(byDeptTotal.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topDepts.length > 0 && topDepts[0][1] >= 3) {
      const names = topDepts.map(([dept, count]) => `${dept} (${count})`).join(", ");
      recs.push({
        type: "improve",
        priority: topDepts[0][1] >= 10 ? "high" : "medium",
        message: `Top defect departments: ${names}. Conduct process review and training.`,
      });
    }
  }

  const worstChannels = Object.entries(channelKpis)
    .filter(([, k]) => k.totalOrders >= 5 && k.onTimePercent < BASELINE.onTime)
    .sort((a, b) => a[1].onTimePercent - b[1].onTimePercent)
    .slice(0, 2);
  if (worstChannels.length > 0) {
    const names = worstChannels.map(([ch, k]) => `${ch} (${k.onTimePercent.toFixed(0)}% on-time)`).join(", ");
    recs.push({
      type: "improve",
      priority: "medium",
      message: `Channels below on-time baseline: ${names}. Investigate delivery performance.`,
    });
  }

  const worstDepts = Object.entries(departmentKpis)
    .filter(([, k]) => k.totalOrders >= 3 && k.onTimePercent < BASELINE.onTime)
    .sort((a, b) => a[1].onTimePercent - b[1].onTimePercent)
    .slice(0, 2);
  if (worstDepts.length > 0) {
    const names = worstDepts.map(([dept, k]) => `${dept} (${k.onTimePercent.toFixed(0)}%)`).join(", ");
    recs.push({
      type: "improve",
      priority: "medium",
      message: `Departments below on-time baseline: ${names}. Support capacity or process improvements.`,
    });
  }

  if (lateOrders.length > 0) {
    const veryLate = lateOrders.filter((o) => (o.ageingDays ?? 0) >= 14).slice(0, 5);
    if (veryLate.length > 0) {
      recs.push({
        type: "improve",
        priority: "high",
        message: `${veryLate.length}+ open order(s) ageing 14+ days. Expedite or escalate these orders.`,
      });
    }
  }

  if (
    stats.onTimeDeliveryPercent >= BASELINE.onTime &&
    stats.sameDayShippingPercent >= BASELINE.sameDay &&
    (!hasDefectData || stats.defectPercent <= BASELINE.defect) &&
    openOrdersSummary.unassigned === 0
  ) {
    recs.push({
      type: "maintain",
      priority: "low",
      message: "KPIs at or above baseline. Continue current processes and monitor trends.",
    });
  }

  return recs.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

export function Recommendations() {
  const { stats, hasDefectData } = useProductionData();
  const recommendations = useMemo(
    () => (stats ? buildRecommendations(stats, hasDefectData) : []),
    [stats, hasDefectData]
  );

  if (!stats || recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Recommendations for Improvement
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Data-driven suggestions based on KPIs, open orders, defects, and channel/department performance
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recommendations.map((rec, i) => (
            <li
              key={i}
              className={`flex gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                rec.type === "maintain"
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : rec.priority === "high"
                    ? "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"
                    : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              }`}
            >
              {rec.type === "maintain" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lightbulb className={`h-5 w-5 shrink-0 ${rec.priority === "high" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`} />
              )}
              <span className="min-w-0 flex-1">{rec.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
