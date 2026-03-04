import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }
  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT 1 as connected`;
    return NextResponse.json({
      ok: true,
      neon: result[0]?.connected === 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 503 }
    );
  }
}
