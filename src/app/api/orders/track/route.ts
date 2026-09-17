import { NextRequest, NextResponse } from "next/server";
import { systemOrderRequest } from "@/lib/order-api";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const row = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  try {
    const result = await systemOrderRequest("orders/track", "POST", { reference: row?.reference, phone: row?.phone }, request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
    return NextResponse.json(result.value, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to retrieve order" }, { status: 404 }); }
}
