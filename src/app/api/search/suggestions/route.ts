import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/catalogue";
import { isMarket } from "@/lib/commerce";
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") ?? "";
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!isMarket(market) || q.length > 100) return NextResponse.json({ error: "Invalid suggestions request" }, { status: 400 });
  try { return NextResponse.json(await getSearchSuggestions(market, q), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Suggestions unavailable" }, { status: 503 }); }
}
