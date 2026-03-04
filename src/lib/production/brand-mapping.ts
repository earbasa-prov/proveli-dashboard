import type { BrandId, ReportBrandId } from "@/types/production";

const BRAND_MAP: { patterns: (string | RegExp)[]; brandId: BrandId }[] = [
  {
    patterns: ["4everproducts.com", "4ever website", "4ever", "4ever rep.com", "4ever inside sales", /^4ever\s*website$/i, /4ever\s*amazon\s*us/i],
    brandId: "4ever",
  },
  {
    patterns: ["addressesofdistinction.com", "addresses of distinction", "aod amazon", "aod amazon store", /addresses?\s*of\s*distinction/i],
    brandId: "aod",
  },
  { patterns: ["hallsigns.com", "hallsigns", "hall signs", /hall\s*signs/i], brandId: "hallsigns" },
  {
    patterns: ["signpost america", "signpost canada", "signpost", "signpost america", "signpost canada", /sign\s*post\s*(america|canada)?/i],
    brandId: "signpost",
  },
  {
    patterns: ["realestatepost.com", "real estate post", "realestatepost", /real\s*estate\s*post/i],
    brandId: "realestatepost",
  },
  {
    patterns: ["amazon", "amazon aod", "amazon sam's", "amazon us", "sam's", /amazon\s*(us|aod|sam'?s?)?/i],
    brandId: "amazon",
  },
  { patterns: ["etsy", "curbimpressions", "curb impressions", /curb\s*impressions/i], brandId: "etsy" },
  { patterns: ["wayfair"], brandId: "wayfair" },
  { patterns: ["walmart"], brandId: "walmart" },
];

export function mapChannelToBrand(channel: string): BrandId {
  const normalized = channel.trim().toLowerCase();
  if (!normalized) return "other";
  for (const { patterns, brandId } of BRAND_MAP) {
    for (const pattern of patterns) {
      if (typeof pattern === "string") {
        if (normalized.includes(pattern.toLowerCase())) return brandId;
      } else if (pattern.test(channel)) {
        return brandId;
      }
    }
  }
  return "other";
}

/** Map BrandId to Report KPI brand grouping (4Ever, AOD, HallSigns, Signpost, Others) */
export function mapBrandToReportBrand(brandId: BrandId): ReportBrandId {
  if (brandId === "4ever" || brandId === "aod" || brandId === "hallsigns" || brandId === "signpost") {
    return brandId;
  }
  return "others";
}
