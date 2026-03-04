"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const REPORT_BRAND_LABELS: Record<string, string> = {
  "4ever": "4Ever",
  aod: "AOD",
  hallsigns: "HallSigns",
  signpost: "Signpost",
  others: "Others",
};

export function DefectByBrand() {
  const { stats, hasDefectData } = useProductionData();
  if (!stats) return null;

  const defectByBrand = stats.defectByBrand;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defect % by Brand</CardTitle>
        <p className="text-sm text-muted-foreground">
          Report KPI grouping (4Ever, AOD, HallSigns, Signpost, Others) — baseline 2%. Upload defect data to populate.
        </p>
      </CardHeader>
      <CardContent>
        {!hasDefectData ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Upload defect data to see Defect % by brand</p>
        ) : defectByBrand.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Defects</TableHead>
                <TableHead className="text-right">Defect %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defectByBrand.map((row) => (
                <TableRow key={row.reportBrandId}>
                  <TableCell className="font-medium">
                    {REPORT_BRAND_LABELS[row.reportBrandId] ?? row.reportBrandId}
                  </TableCell>
                  <TableCell className="text-right">{row.totalOrders}</TableCell>
                  <TableCell className="text-right">{row.defects}</TableCell>
                  <TableCell className="text-right">
                    <span className={row.defectPercent > 2 ? "text-rose-600 font-medium" : ""}>
                      {row.defectPercent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No brand data in selected filters</p>
        )}
      </CardContent>
    </Card>
  );
}
