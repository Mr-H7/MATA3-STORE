import { NextRequest, NextResponse } from "next/server";
import { systemOrderRequest } from "@/lib/order-api";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Confirmation unavailable" }, { status: 404 });
  try {
    const result = await systemOrderRequest("orders/confirm", "POST", body);
    return NextResponse.json(result.value, { status: result.status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return NextResponse.json({ error: "Confirmation unavailable" }, { status: 404 }); }
}
