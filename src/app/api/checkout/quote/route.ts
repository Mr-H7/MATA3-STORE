import { NextRequest, NextResponse } from "next/server";
import { systemOrderRequest } from "@/lib/order-api";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  const row = body as Record<string, unknown>;
  if (row.market !== "eg" && row.market !== "ma") return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  try {
    const result = await systemOrderRequest("checkout/quote", "POST", { ...row, market: row.market === "eg" ? "EGYPT" : "MOROCCO" });
    return NextResponse.json(result.value, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ code: "CHECKOUT_QUOTE_ERROR" }, { status: 503 }); }
}
