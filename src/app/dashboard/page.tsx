"use client";

import { ProductionDataProvider } from "@/lib/production/production-data-context";
import { FileUploadZone } from "@/components/production/file-upload-zone";
import { DefectUploadZone } from "@/components/production/defect-upload-zone";
import { FilterSidebar } from "@/components/production/filter-sidebar";
import { KpiOverview } from "@/components/production/kpi-overview";
import { OrdersChart } from "@/components/production/orders-chart";
import { StatusDistribution } from "@/components/production/status-distribution";
import { BacklogHeatmap } from "@/components/production/backlog-heatmap";
import { ChannelPerformance } from "@/components/production/channel-performance";
import { LateOrdersList } from "@/components/production/late-orders-list";
import { DefectAnalysis } from "@/components/production/defect-analysis";
import { DefectByBrand } from "@/components/production/defect-by-brand";
import { DefectProjection } from "@/components/production/defect-projection";
import { OpenOrdersSummary } from "@/components/production/open-orders-summary";
import { DepartmentPerformance } from "@/components/production/department-performance";
import { Recommendations } from "@/components/production/recommendations";
import { useProductionData } from "@/lib/production/production-data-context";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

function ProductionDashboardContent() {
  const { hasData, saveDashboard } = useProductionData();

  const handleSave = () => {
    const filename = saveDashboard();
    if (filename) toast.success(`Saved as ${filename}`);
  };

  if (!hasData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-800 dark:text-teal-200">Production Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Upload order data first, then optionally defect data for defect KPIs</p>
        </div>
        <FileUploadZone />
        <DefectUploadZone />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-teal-800 dark:text-teal-200">Production Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Executive KPIs and backlog management</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save dashboard
          </Button>
          <FileUploadZone compact />
          <DefectUploadZone compact />
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar />
        <div className="min-w-0 flex-1 space-y-6">
          <KpiOverview />
          <Recommendations />
          <OrdersChart />
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusDistribution />
            <BacklogHeatmap />
          </div>
          <OpenOrdersSummary />
          <ChannelPerformance />
          <DepartmentPerformance />
          <LateOrdersList />
          <DefectByBrand />
          <DefectProjection />
          <DefectAnalysis />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProductionDataProvider>
      <ProductionDashboardContent />
    </ProductionDataProvider>
  );
}
