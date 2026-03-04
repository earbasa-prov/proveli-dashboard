export type BrandId =
  | "4ever"
  | "aod"
  | "hallsigns"
  | "signpost"
  | "realestatepost"
  | "amazon"
  | "wayfair"
  | "etsy"
  | "walmart"
  | "other";

export type OrderStatus = "INPROGRESS" | "ONHOLD" | "UNASSIGNED" | "COMPLETED";

/** Report brand grouping (4Ever, AOD, HallSigns, Signpost, Others) */
export type ReportBrandId = "4ever" | "aod" | "hallsigns" | "signpost" | "others";

export interface ProductionOrder {
  orderNo: string;
  channel: string;
  brandId: BrandId;
  shipByDate: string;
  status: OrderStatus;
  totalItems?: number;
  shipDate?: string;
  department?: string;
  ageingDays?: number;
}

/** Defect record from separate defect-data upload (not from order sheet) */
export interface DefectRecord {
  originalOrderNo: string;
  defectOrderNo?: string;
  channel: string;
  deptResponsible?: string;
  personResponsible?: string;
  orderDate?: string;
  defectReportedDate?: string;
  defectType?: string;
  reason?: string;
}

export interface ProductionFilters {
  brands: BrandId[];
  weeksBack: number;
}

export interface ChannelKpi {
  totalOrders: number;
  onTimeOrders: number;
  onTimePercent: number;
  sameDayOrders: number;
  sameDayPercent: number;
  defects: number;
  defectPercent: number;
}

export interface DepartmentKpi {
  totalOrders: number;
  onTimeOrders: number;
  onTimePercent: number;
}

export interface OpenOrdersSummary {
  uniqueOrders: number;
  totalItems: number;
  avgAgeingDays: number;
  inProgress: number;
  onHold: number;
  unassigned: number;
  byChannel: {
    channel: string;
    uniqueOrders: number;
    totalItems: number;
    avgAgeingDays: number;
    inProgress: number;
    onHold: number;
    unassigned: number;
  }[];
  byStatus: { status: OrderStatus; uniqueOrders: number; totalItems: number }[];
}

export interface DefectByBrand {
  reportBrandId: ReportBrandId;
  totalOrders: number;
  defects: number;
  defectPercent: number;
}

export interface ProductionStats {
  onTimeDeliveryPercent: number;
  sameDayShippingPercent: number;
  defectPercent: number;
  uniqueOrders: number;
  totalItems: number;
  statusDistribution: Record<OrderStatus, number>;
  channelBreakdown: Record<BrandId, number>;
  channelKpis: Record<string, ChannelKpi>;
  departmentKpis: Record<string, DepartmentKpi>;
  openOrdersSummary: OpenOrdersSummary;
  defectByBrand: DefectByBrand[];
  lateOrders: ProductionOrder[];
  weeklyData: { week: string; totalOrders: number; onTimeOrders: number }[];
  defectByDept: { dept: string; reason: string; defectType?: string; count: number }[];
}
