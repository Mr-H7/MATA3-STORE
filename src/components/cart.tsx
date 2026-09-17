"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type CartLine, type Locale, type Market, type PublicProduct, validateCart, formatMoney } from "@/lib/commerce";
import { t } from "@/lib/i18n";

export function cartKey(market: Market) { return `mata3-cart-${market}`; }
export function addCartLine(market: Market, line: CartLine) {
  let lines: CartLine[] = [];
  try { lines = JSON.parse(localStorage.getItem(cartKey(market)) || "[]") as CartLine[]; } catch { /* reset malformed local state */ }
  const existing = lines.find(item => item.productId === line.productId && item.variantId === line.variantId);
  if (existing) existing.quantity = Math.min(99, existing.quantity + line.quantity); else lines.push(line);
  localStorage.setItem(cartKey(market), JSON.stringify(lines));
  window.dispatchEvent(new Event("mata3-cart-change"));
}
export function Cart({ market, locale, products }: { market: Market; locale: Locale; products: PublicProduct[] }) {
  const c = t(locale), base = `/${market}/${locale}`;
  const [lines, setLines] = useState<CartLine[]>([]), [ready, setReady] = useState(false);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(cartKey(market)) || "[]") as CartLine[]); } catch { setLines([]); } setReady(true); }, [market]);
  const save = (next: CartLine[]) => { setLines(next); localStorage.setItem(cartKey(market), JSON.stringify(next)); };
  const result = validateCart(lines, products, market);
  if (!ready) return <div className="empty-state">…</div>;
  if (!lines.length) return <div className="empty-state"><h2>{c.empty}</h2><Link className="button gold" href={base}>{c.shop}</Link></div>;
  return <div className="cart-layout"><div className="cart-lines">{result.valid.map(({ product, variant, quantity, lineMinor }) => <article className="cart-line" key={`${product.id}-${variant.id}`}><div className="cart-image">م</div><div><h2><Link href={`${base}/product/${product.slug}`}>{product.name}</Link></h2>{Object.entries(variant.attributes).map(([key, value]) => <p key={key}>{key}: {value}</p>)}<p>{formatMoney(product.price, locale)}</p><label>{c.quantity} <input type="number" min="1" max="99" value={quantity} onChange={e => save(lines.map(line => line.productId === product.id && line.variantId === variant.id ? { ...line, quantity: Number(e.target.value) } : line))} /></label><button className="text-button" onClick={() => save(lines.filter(line => line.productId !== product.id || line.variantId !== variant.id))}>{c.remove}</button></div><strong>{formatMoney({ amountMinor: lineMinor, currency: result.currency }, locale)}</strong></article>)}{result.invalid.map((entry, i) => <article className="cart-line invalid" key={i}><p>{entry.reason}</p><button onClick={() => save(lines.filter(line => line !== entry.line))}>{c.remove}</button></article>)}</div><aside className="summary-card"><p className="eyebrow">MATA3</p><h2>{c.subtotal}</h2><strong className="summary-amount">{formatMoney({ amountMinor: result.subtotalMinor, currency: result.currency }, locale)}</strong><p>{c.configure}</p><Link className="button outline" href={`${base}/checkout`}>{c.checkout} →</Link></aside></div>;
}
