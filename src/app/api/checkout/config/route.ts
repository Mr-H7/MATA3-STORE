import { NextRequest, NextResponse } from "next/server";
import { systemOrderRequest } from "@/lib/order-api";
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market");
  if (market !== "eg" && market !== "ma") return NextResponse.json({ error: "Invalid market" }, { status: 400 });
  try {
    const result = await systemOrderRequest("checkout/config?market=" + (market === "eg" ? "EGYPT" : "MOROCCO"), "GET");
    return NextResponse.json(result.value, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Checkout unavailable" }, { status: 503 }); }
}
