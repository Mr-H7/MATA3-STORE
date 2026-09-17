import { NextRequest, NextResponse } from "next/server";
import { quoteSystemCart } from "@/lib/catalogue";
import { isMarket, type CartLine } from "@/lib/commerce";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid quote request" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  const input = body as { market?: unknown; lines?: unknown };
  if (typeof input.market !== "string" || !isMarket(input.market) || !Array.isArray(input.lines) || input.lines.length > 50) return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  const lines: CartLine[] = [];
  for (const value of input.lines) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
    const row = value as Record<string, unknown>;
    if (typeof row.key !== "string" || row.key.length > 100 || typeof row.quantity !== "number") return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
    if (row.observedUnitAmountMinor !== undefined && (!Number.isSafeInteger(row.observedUnitAmountMinor) || (row.observedUnitAmountMinor as number) < 0)) return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
    lines.push({ key: row.key, quantity: row.quantity, ...(row.observedUnitAmountMinor !== undefined ? { observedUnitAmountMinor: row.observedUnitAmountMinor as number } : {}) });
  }
  try { return NextResponse.json(await quoteSystemCart(input.market, lines), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Cart quote unavailable" }, { status: 503 }); }
}
