import { NextRequest, NextResponse } from "next/server";
import { getBundleBySlug, getProductBySlug } from "@/lib/catalogue";
import { isMarket } from "@/lib/commerce";

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") ?? "";
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!isMarket(market) || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug) || (kind !== "product" && kind !== "bundle"))
    return NextResponse.json({ error: "Invalid media request" }, { status: 400 });
  try {
    const item = kind === "product" ? await getProductBySlug(market, slug) : await getBundleBySlug(market, slug);
    if (!item) return NextResponse.json({ media: [] }, { headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ media: item.media.filter(media => media.type === "IMAGE").slice(0, 1) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Media unavailable" }, { status: 503 });
  }
}
