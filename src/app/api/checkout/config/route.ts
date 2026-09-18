import { NextRequest, NextResponse } from "next/server";
import { systemOrderRequest } from "@/lib/order-api";
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market");
  const destinationKey = request.nextUrl.searchParams.get("destinationKey");
  if (market !== "eg" && market !== "ma") return NextResponse.json({ code: "INVALID_MARKET" }, { status: 400 });
  if (destinationKey && !/^[a-f0-9-]{36}$/i.test(destinationKey)) return NextResponse.json({ code: "INVALID_DESTINATION" }, { status: 400 });
  try {
    const path = "checkout/config?market=" + (market === "eg" ? "EGYPT" : "MOROCCO") +
      (destinationKey ? "&destinationKey=" + encodeURIComponent(destinationKey) : "");
    const result = await systemOrderRequest(path, "GET");
    return NextResponse.json(result.value, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ code: "CHECKOUT_CONFIG_ERROR" }, { status: 503 }); }
}
