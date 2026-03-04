import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT id, saved_at, saved_date, date_range_min, date_range_max, orders, defects, unique_orders, total_items
      FROM saved_dashboards
      WHERE id = ${id}::uuid
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: row.id,
      savedAt: row.saved_at,
      savedDate: row.saved_date,
      dateRangeMin: row.date_range_min,
      dateRangeMax: row.date_range_max,
      orders: row.orders ?? [],
      defects: row.defects ?? [],
      uniqueOrders: row.unique_orders,
      totalItems: row.total_items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
