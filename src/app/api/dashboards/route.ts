import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { ProductionOrder, DefectRecord } from "@/types/production";

export const dynamic = "force-dynamic";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

export async function GET() {
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS saved_dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        saved_date DATE NOT NULL DEFAULT CURRENT_DATE,
        date_range_min DATE,
        date_range_max DATE,
        orders JSONB NOT NULL DEFAULT '[]',
        defects JSONB NOT NULL DEFAULT '[]',
        unique_orders INTEGER,
        total_items INTEGER
      )
    `;
    const rows = await sql`
      SELECT id, saved_at, saved_date, date_range_min, date_range_max, unique_orders, total_items
      FROM saved_dashboards
      ORDER BY saved_at DESC
      LIMIT 50
    `;
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        savedAt: r.saved_at,
        savedDate: r.saved_date,
        dateRangeMin: r.date_range_min,
        dateRangeMax: r.date_range_max,
        uniqueOrders: r.unique_orders,
        totalItems: r.total_items,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orders = [], defects = [] } = body as {
      orders: ProductionOrder[];
      defects: DefectRecord[];
    };
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: "Orders required" }, { status: 400 });
    }

    let dateRangeMin: string | null = null;
    let dateRangeMax: string | null = null;
    for (const o of orders) {
      const d = o.shipByDate?.split("T")[0] ?? o.shipByDate;
      if (d) {
        if (!dateRangeMin || d < dateRangeMin) dateRangeMin = d;
        if (!dateRangeMax || d > dateRangeMax) dateRangeMax = d;
      }
    }

    const uniqueOrders = new Set(orders.map((o) => o.orderNo)).size;
    const totalItems = orders.reduce((s, o) => s + (o.totalItems ?? 1), 0);

    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS saved_dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        saved_date DATE NOT NULL DEFAULT CURRENT_DATE,
        date_range_min DATE,
        date_range_max DATE,
        orders JSONB NOT NULL DEFAULT '[]',
        defects JSONB NOT NULL DEFAULT '[]',
        unique_orders INTEGER,
        total_items INTEGER
      )
    `;

    const [row] = await sql`
      INSERT INTO saved_dashboards (orders, defects, date_range_min, date_range_max, unique_orders, total_items)
      VALUES (${JSON.stringify(orders)}, ${JSON.stringify(defects)}, ${dateRangeMin}, ${dateRangeMax}, ${uniqueOrders}, ${totalItems})
      RETURNING id, saved_at, saved_date
    `;

    return NextResponse.json({
      id: row.id,
      savedAt: row.saved_at,
      savedDate: row.saved_date,
      message: "Dashboard saved",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
