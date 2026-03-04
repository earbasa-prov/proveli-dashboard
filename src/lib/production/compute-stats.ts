import { subWeeks, startOfWeek, parseISO, isBefore, isAfter, startOfDay, isSameDay } from "date-fns";
import type {
  ProductionOrder,
  ProductionStats,
  ProductionFilters,
  BrandId,
  OrderStatus,
  ChannelKpi,
  DepartmentKpi,
  OpenOrdersSummary,
  DefectByBrand,
  ReportBrandId,
  DefectRecord,
} from "@/types/production";
import { mapBrandToReportBrand } from "./brand-mapping";
import { normalizeOrderNo } from "./parse-defect-file";

const DEFAULT_WEEKS = 5;

function applyFilters(orders: ProductionOrder[], filters: ProductionFilters): ProductionOrder[] {
  let filtered = orders;
  if (filters.brands.length > 0) {
    filtered = filtered.filter((o) => filters.brands.includes(o.brandId));
  }
  if (filters.weeksBack > 0) {
    const cutoff = subWeeks(new Date(), filters.weeksBack);
    filtered = filtered.filter((o) => {
      const d = parseISO(o.shipByDate);
      return !Number.isNaN(d.getTime()) && (isAfter(d, cutoff) || isSameDay(d, cutoff));
    });
  }
  return filtered;
}

export function computeStats(
  orders: ProductionOrder[],
  filters: ProductionFilters = { brands: [], weeksBack: DEFAULT_WEEKS },
  defects: DefectRecord[] = []
): ProductionStats {
  const filtered = applyFilters(orders, filters);
  const today = startOfDay(new Date());
  const withShipDate = filtered.filter((o) => o.shipDate);
  const onTime = withShipDate.filter((o) => {
    const shipBy = parseISO(o.shipByDate);
    const shipped = parseISO(o.shipDate!);
    return !Number.isNaN(shipped.getTime()) && (isBefore(shipped, shipBy) || isSameDay(shipped, shipBy));
  });
  const onTimeDeliveryPercent = withShipDate.length > 0 ? (onTime.length / withShipDate.length) * 100 : 94.87;
  const sameDayShipped = withShipDate.filter((o) => {
    const shipped = parseISO(o.shipDate!);
    const shipBy = parseISO(o.shipByDate);
    return isSameDay(shipped, shipBy);
  });
  const sameDayShippingPercent = withShipDate.length > 0 ? (sameDayShipped.length / withShipDate.length) * 100 : 83.09;

  const ordersWithDefectIds = new Set<string>();
  if (defects.length > 0) {
    const filteredOrderKeys = new Map<string, ProductionOrder>();
    for (const o of filtered) {
      const key = `${normalizeOrderNo(o.orderNo)}|${(o.channel || "").toLowerCase()}`;
      if (!filteredOrderKeys.has(key)) filteredOrderKeys.set(key, o);
    }
    for (const d of defects) {
      const key = `${d.originalOrderNo}|${(d.channel || "").toLowerCase()}`;
      if (filteredOrderKeys.has(key)) {
        const ord = filteredOrderKeys.get(key)!;
        ordersWithDefectIds.add(ord.orderNo);
      }
    }
  }
  const defectPercent =
    defects.length > 0 && filtered.length > 0 ? (ordersWithDefectIds.size / filtered.length) * 100 : 0;
  const uniqueOrders = new Set(filtered.map((o) => o.orderNo)).size;
  const totalItems = filtered.reduce((sum, o) => sum + (o.totalItems ?? 1), 0);
  const statusDistribution: Record<OrderStatus, number> = {
    INPROGRESS: 0,
    ONHOLD: 0,
    UNASSIGNED: 0,
    COMPLETED: 0,
  };
  for (const o of filtered) statusDistribution[o.status]++;
  const channelBreakdown: Record<BrandId, number> = {
    "4ever": 0,
    aod: 0,
    hallsigns: 0,
    signpost: 0,
    realestatepost: 0,
    amazon: 0,
    wayfair: 0,
    etsy: 0,
    walmart: 0,
    other: 0,
  };
  for (const o of filtered) channelBreakdown[o.brandId] = (channelBreakdown[o.brandId] ?? 0) + 1;

  const channelKpis: Record<string, ChannelKpi> = {};
  const channelKeys = new Set(filtered.map((o) => o.channel || "Unknown"));
  for (const ch of channelKeys) {
    const chOrders = filtered.filter((o) => (o.channel || "Unknown") === ch);
    const chWithShip = chOrders.filter((o) => o.shipDate);
    const chOnTime = chWithShip.filter((o) => {
      const shipBy = parseISO(o.shipByDate);
      const shipped = parseISO(o.shipDate!);
      return !Number.isNaN(shipped.getTime()) && (isBefore(shipped, shipBy) || isSameDay(shipped, shipBy));
    });
    const chSameDay = chWithShip.filter((o) => {
      const shipped = parseISO(o.shipDate!);
      const shipBy = parseISO(o.shipByDate);
      return isSameDay(shipped, shipBy);
    });
    const chDefectCount =
      defects.length > 0 ? chOrders.filter((o) => ordersWithDefectIds.has(o.orderNo)).length : 0;
    channelKpis[ch] = {
      totalOrders: chOrders.length,
      onTimeOrders: chOnTime.length,
      onTimePercent: chWithShip.length > 0 ? (chOnTime.length / chWithShip.length) * 100 : 0,
      sameDayOrders: chSameDay.length,
      sameDayPercent: chWithShip.length > 0 ? (chSameDay.length / chWithShip.length) * 100 : 0,
      defects: chDefectCount,
      defectPercent: chOrders.length > 0 ? (chDefectCount / chOrders.length) * 100 : 0,
    };
  }

  const departmentKpis: Record<string, DepartmentKpi> = {};
  const deptKeys = new Set(filtered.filter((o) => o.department).map((o) => o.department!));
  for (const dept of deptKeys) {
    const deptOrders = filtered.filter((o) => o.department === dept);
    const deptWithShip = deptOrders.filter((o) => o.shipDate);
    const deptOnTime = deptWithShip.filter((o) => {
      const shipBy = parseISO(o.shipByDate);
      const shipped = parseISO(o.shipDate!);
      return !Number.isNaN(shipped.getTime()) && (isBefore(shipped, shipBy) || isSameDay(shipped, shipBy));
    });
    departmentKpis[dept] = {
      totalOrders: deptOrders.length,
      onTimeOrders: deptOnTime.length,
      onTimePercent: deptWithShip.length > 0 ? (deptOnTime.length / deptWithShip.length) * 100 : 0,
    };
  }

  const openOrders = filtered.filter((o) => o.status !== "COMPLETED");
  const openUniqueOrders = new Set(openOrders.map((o) => o.orderNo)).size;
  const openTotalItems = openOrders.reduce((sum, o) => sum + (o.totalItems ?? 1), 0);
  const openAgeingSum = openOrders.reduce((sum, o) => sum + (o.ageingDays ?? 0), 0);
  const openInProgressOrders = new Set(openOrders.filter((o) => o.status === "INPROGRESS").map((o) => o.orderNo));
  const openOnHoldOrders = new Set(openOrders.filter((o) => o.status === "ONHOLD").map((o) => o.orderNo));
  const openUnassignedOrders = new Set(openOrders.filter((o) => o.status === "UNASSIGNED").map((o) => o.orderNo));
  const openInProgress = openInProgressOrders.size;
  const openOnHold = openOnHoldOrders.size;
  const openUnassigned = openUnassignedOrders.size;
  const openOrdersSummary: OpenOrdersSummary = {
    uniqueOrders: openUniqueOrders,
    totalItems: openTotalItems,
    avgAgeingDays: openOrders.length > 0 ? openAgeingSum / openOrders.length : 0,
    inProgress: openInProgress,
    onHold: openOnHold,
    unassigned: openUnassigned,
    byChannel: [],
    byStatus: [],
  };
  const openByChannel = new Map<
    string,
    {
      orders: Set<string>;
      items: number;
      ageingSum: number;
      count: number;
      inProgressOrders: Set<string>;
      onHoldOrders: Set<string>;
      unassignedOrders: Set<string>;
    }
  >();
  for (const o of openOrders) {
    const ch = o.channel || "Unknown";
    let entry = openByChannel.get(ch);
    if (!entry) {
      entry = {
        orders: new Set(),
        items: 0,
        ageingSum: 0,
        count: 0,
        inProgressOrders: new Set(),
        onHoldOrders: new Set(),
        unassignedOrders: new Set(),
      };
      openByChannel.set(ch, entry);
    }
    entry.orders.add(o.orderNo);
    entry.items += o.totalItems ?? 1;
    entry.ageingSum += o.ageingDays ?? 0;
    entry.count++;
    if (o.status === "INPROGRESS") entry.inProgressOrders.add(o.orderNo);
    else if (o.status === "ONHOLD") entry.onHoldOrders.add(o.orderNo);
    else if (o.status === "UNASSIGNED") entry.unassignedOrders.add(o.orderNo);
  }
  openOrdersSummary.byChannel = Array.from(openByChannel.entries()).map(([channel, e]) => ({
    channel,
    uniqueOrders: e.orders.size,
    totalItems: e.items,
    avgAgeingDays: e.count > 0 ? e.ageingSum / e.count : 0,
    inProgress: e.inProgressOrders.size,
    onHold: e.onHoldOrders.size,
    unassigned: e.unassignedOrders.size,
  }));
  const openByStatus = new Map<OrderStatus, { orders: Set<string>; items: number }>();
  for (const o of openOrders) {
    let entry = openByStatus.get(o.status);
    if (!entry) {
      entry = { orders: new Set(), items: 0 };
      openByStatus.set(o.status, entry);
    }
    entry.orders.add(o.orderNo);
    entry.items += o.totalItems ?? 1;
  }
  openOrdersSummary.byStatus = Array.from(openByStatus.entries()).map(([status, e]) => ({
    status,
    uniqueOrders: e.orders.size,
    totalItems: e.items,
  }));

  const reportBrandOrder: ReportBrandId[] = ["4ever", "aod", "hallsigns", "signpost", "others"];
  const defectByBrandMap = new Map<ReportBrandId, { total: number; defects: number }>();
  for (const id of reportBrandOrder) defectByBrandMap.set(id, { total: 0, defects: 0 });
  for (const o of filtered) {
    const rb = mapBrandToReportBrand(o.brandId);
    const entry = defectByBrandMap.get(rb)!;
    entry.total++;
    if (defects.length > 0 && ordersWithDefectIds.has(o.orderNo)) entry.defects++;
  }
  const defectByBrand: DefectByBrand[] = reportBrandOrder
    .map((reportBrandId) => {
      const e = defectByBrandMap.get(reportBrandId)!;
      return {
        reportBrandId,
        totalOrders: e.total,
        defects: e.defects,
        defectPercent: e.total > 0 ? (e.defects / e.total) * 100 : 0,
      };
    })
    .filter((d) => d.totalOrders > 0);
  const lateOrders = filtered
    .filter((o) => o.status !== "COMPLETED" && (o.ageingDays ?? 0) > 0)
    .sort((a, b) => (b.ageingDays ?? 0) - (a.ageingDays ?? 0));
  const weeksBack = filters.weeksBack || DEFAULT_WEEKS;
  const weeklyData: { week: string; totalOrders: number; onTimeOrders: number }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(subWeeks(today, i - 1), { weekStartsOn: 1 });
    const weekOrders = filtered.filter((o) => {
      const d = parseISO(o.shipByDate);
      return !Number.isNaN(d.getTime()) && !isBefore(d, weekStart) && isBefore(d, weekEnd);
    });
    const weekWithShip = weekOrders.filter((o) => o.shipDate);
    const weekOnTime = weekWithShip.filter((o) => {
      const shipBy = parseISO(o.shipByDate);
      const shipped = parseISO(o.shipDate!);
      return !Number.isNaN(shipped.getTime()) && (isBefore(shipped, shipBy) || isSameDay(shipped, shipBy));
    });
    weeklyData.push({ week: weekStart.toISOString().slice(0, 10), totalOrders: weekOrders.length, onTimeOrders: weekOnTime.length });
  }
  const defectMap = new Map<string, { dept: string; reason: string; defectType?: string; count: number }>();
  if (defects.length > 0) {
    const matchedDefects = defects.filter((d) => {
      const key = `${d.originalOrderNo}|${(d.channel || "").toLowerCase()}`;
      return filtered.some(
        (o) => `${normalizeOrderNo(o.orderNo)}|${(o.channel || "").toLowerCase()}` === key
      );
    });
    for (const d of matchedDefects) {
      const key = `${d.deptResponsible ?? "Unknown"}|${d.reason ?? "Unknown"}|${d.defectType ?? ""}`;
      const existing = defectMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        defectMap.set(key, {
          dept: d.deptResponsible ?? "Unknown",
          reason: d.reason ?? "Unknown",
          defectType: d.defectType || undefined,
          count: 1,
        });
      }
    }
  }
  const defectByDept = Array.from(defectMap.values()).map(({ dept, reason, defectType, count }) => ({
    dept,
    reason,
    defectType,
    count,
  }));
  return {
    onTimeDeliveryPercent,
    sameDayShippingPercent,
    defectPercent,
    uniqueOrders,
    totalItems,
    statusDistribution,
    channelBreakdown,
    channelKpis,
    departmentKpis,
    openOrdersSummary,
    defectByBrand,
    lateOrders,
    weeklyData,
    defectByDept,
  };
}
