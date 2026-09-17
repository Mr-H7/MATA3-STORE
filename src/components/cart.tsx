"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type CartLine, type Locale, type Market, formatMoney } from "@/lib/commerce";
import { t } from "@/lib/i18n";
type ValidLine = { productId: string; slug: string; kind: "product" | "bundle"; name: string; variantId: string; quantity: number; unitMinor: number; lineMinor: number };
type Result = { currency: "EGP" | "MAD"; subtotalMinor: number; lines: ValidLine[]; invalid: { productId: string; variantId: string; reason: string }[]; checkoutAvailable: false };
export function cartKey(market: Market) { return "mata3-cart-" + market; }
export function addCartLine(market: Market, line: CartLine) {
  let lines: CartLine[] = [];
  try { lines = JSON.parse(localStorage.getItem(cartKey(market)) || "[]") as CartLine[]; } catch { /* malformed local state */ }
  const existing = lines.find(item => item.productId === line.productId && item.variantId === line.variantId);
  if (existing) existing.quantity = Math.min(99, existing.quantity + line.quantity); else lines.push(line);
  localStorage.setItem(cartKey(market), JSON.stringify(lines));
  window.dispatchEvent(new Event("mata3-cart-change"));
}
export function Cart({ market, locale }: { market: Market; locale: Locale }) {
  const c = t(locale), base = "/" + market + "/" + locale;
  const [lines, setLines] = useState<CartLine[]>([]), [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(cartKey(market)) || "[]") as CartLine[]); } catch { setLines([]); } setReady(true); }, [market]);
  useEffect(() => {
    if (!ready || !lines.length) { setResult(null); return; }
    const controller = new AbortController();
    void fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ market, lines }), signal: controller.signal })
      .then(response => response.ok ? response.json() : null).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(() => { if (!controller.signal.aborted) setResult(null); });
    return () => controller.abort();
  }, [ready, lines, market]);
  const save = (next: CartLine[]) => { setLines(next); localStorage.setItem(cartKey(market), JSON.stringify(next)); };
  const remove = (productId: string, variantId: string) => save(lines.filter(line => line.productId !== productId || line.variantId !== variantId));
  if (!ready) return <div className="empty-state">…</div>;
  if (!lines.length) return <div className="empty-state"><h2>{c.empty}</h2><Link className="button gold" href={base}>{c.shop}</Link></div>;
  if (!result) return <div className="empty-state">{c.unavailable}</div>;
  return <div className="cart-layout"><div className="cart-lines">
    {result.lines.map(item => <article className="cart-line" key={item.productId + item.variantId}><div className="cart-image">م</div><div><h2><Link href={base + "/" + item.kind + "/" + item.slug}>{item.name}</Link></h2><p>{formatMoney({ amountMinor: item.unitMinor, currency: result.currency }, locale)}</p><label>{c.quantity} <input type="number" min="1" max="99" value={item.quantity} onChange={e => save(lines.map(line => line.productId === item.productId && line.variantId === item.variantId ? { ...line, quantity: Number(e.target.value) } : line))} /></label><button className="text-button" onClick={() => remove(item.productId, item.variantId)}>{c.remove}</button></div><strong>{formatMoney({ amountMinor: item.lineMinor, currency: result.currency }, locale)}</strong></article>)}
    {result.invalid.map(item => <article className="cart-line invalid" key={item.productId + item.variantId}><p>{item.reason}</p><button onClick={() => remove(item.productId, item.variantId)}>{c.remove}</button></article>)}
  </div><aside className="summary-card"><p className="eyebrow">MATA3</p><h2>{c.subtotal}</h2><strong className="summary-amount">{formatMoney({ amountMinor: result.subtotalMinor, currency: result.currency }, locale)}</strong><p>{c.configure}</p></aside></div>;
}
