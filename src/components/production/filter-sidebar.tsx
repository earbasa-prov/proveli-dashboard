"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import type { BrandId } from "@/types/production";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BRAND_OPTIONS: { id: BrandId; label: string }[] = [
  { id: "4ever", label: "4Ever" },
  { id: "aod", label: "AOD" },
  { id: "hallsigns", label: "HallSigns" },
  { id: "signpost", label: "SignPost" },
  { id: "realestatepost", label: "Real Estate Post" },
  { id: "amazon", label: "Amazon" },
  { id: "wayfair", label: "Wayfair" },
  { id: "etsy", label: "Etsy" },
  { id: "walmart", label: "Walmart" },
  { id: "other", label: "Others" },
];

export function FilterSidebar() {
  const { filters, setFilters } = useProductionData();

  const toggleBrand = (brandId: BrandId) => {
    setFilters((prev) => {
      const brands = prev.brands.includes(brandId)
        ? prev.brands.filter((b) => b !== brandId)
        : [...prev.brands, brandId];
      return { ...prev, brands };
    });
  };

  return (
    <aside className="w-56 shrink-0 space-y-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
      <div>
        <Label className="mb-2 block font-semibold">Time Period</Label>
        <Select
          value={String(filters.weeksBack)}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, weeksBack: Number(v) }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 1 week</SelectItem>
            <SelectItem value="2">Last 2 weeks</SelectItem>
            <SelectItem value="3">Last 3 weeks</SelectItem>
            <SelectItem value="5">Last 5 weeks (default)</SelectItem>
            <SelectItem value="8">Last 8 weeks</SelectItem>
            <SelectItem value="12">Last 12 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-3 block font-semibold">Brand</Label>
        <p className="mb-3 text-xs text-muted-foreground">Leave empty to show all brands</p>
        <div className="space-y-2">
          {BRAND_OPTIONS.map(({ id, label }) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent/50",
                filters.brands.includes(id) && "bg-accent/30"
              )}
            >
              <input
                type="checkbox"
                checked={filters.brands.includes(id)}
                onChange={() => toggleBrand(id)}
                className="h-4 w-4 rounded border-input"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
