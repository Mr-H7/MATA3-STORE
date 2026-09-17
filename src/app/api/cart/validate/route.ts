import { NextRequest, NextResponse } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import { isMarket, validateCart, type CartLine } from "@/lib/commerce";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as { market?: unknown; lines?: unknown };
  if (typeof input.market !== "string" || !isMarket(input.market) || !Array.isArray(input.lines) || input.lines.length > 50 || !input.lines.every((line): line is CartLine => !!line && typeof line === "object" && typeof line.productId === "string" && typeof line.variantId === "string" && Number.isSafeInteger(line.quantity))) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const catalogue = await getCatalogue(input.market);
    const result = validateCart(input.lines, catalogue, input.market);
    return NextResponse.json({ currency: result.currency, subtotalMinor: result.subtotalMinor, lines: result.valid.map(item => ({ productId: item.product.id, variantId: item.variant.id, quantity: item.quantity, unitMinor: item.product.price.amountMinor, lineMinor: item.lineMinor })), invalid: result.invalid.map(item => ({ productId: item.line.productId, variantId: item.line.variantId, reason: item.reason })), checkoutAvailable: false });
  } catch { return NextResponse.json({ error: "Catalogue unavailable" }, { status: 503 }); }
}
