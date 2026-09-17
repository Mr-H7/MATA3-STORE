"use client";
import { useState } from "react";
import Link from "next/link";
import { type Locale, type Market, type PublicProduct, formatMoney } from "@/lib/commerce";
import { t } from "@/lib/i18n";
import { addCartLine } from "./cart";

export function Purchase({ product, market, locale }: { product: PublicProduct; market: Market; locale: Locale }) {
  const c = t(locale), [selected, setSelected] = useState<Record<string, string>>({}), [quantity, setQuantity] = useState(1), [added, setAdded] = useState(false);
  const attrs = [...new Set(product.variants.flatMap(v => Object.keys(v.attributes)))];
  const [simpleId, setSimpleId] = useState("");
  const variant = attrs.length ? (attrs.every(attr => selected[attr]) ? product.variants.find(v => attrs.every(attr => v.attributes[attr] === selected[attr])) : undefined) : product.variants.length === 1 ? product.variants[0] : product.variants.find(v => v.id === simpleId);
  const choose = (attr: string, value: string) => {
    const next = { ...selected, [attr]: value };
    for (const later of attrs.slice(attrs.indexOf(attr) + 1)) if (next[later] && !product.variants.some(v => v.available && v.attributes[later] === next[later] && attrs.slice(0, attrs.indexOf(later)).every(key => !next[key] || v.attributes[key] === next[key]))) delete next[later];
    setSelected(next); setAdded(false);
  };
  return <div className="purchase-panel"><p className="eyebrow">MATA3 / {product.kind === "bundle" ? "BUNDLE" : "PRODUCT"}</p><h1>{product.name}</h1><div className="pdp-price">{formatMoney(product.price, locale)}</div>{attrs.length ? attrs.map(attr => <fieldset key={attr}><legend>{attr}</legend><div className="variant-list">{[...new Set(product.variants.map(v => v.attributes[attr]).filter(Boolean))].map(value => { const available = product.variants.some(v => v.available && v.attributes[attr] === value && attrs.slice(0, attrs.indexOf(attr)).every(key => !selected[key] || v.attributes[key] === selected[key])); return <button key={value} disabled={!available} aria-pressed={selected[attr] === value} onClick={() => choose(attr, value)}>{value}</button>; })}</div></fieldset>) : product.variants.length > 1 && <fieldset><legend>{c.product}</legend><div className="variant-list">{product.variants.map(v => <button key={v.id} disabled={!v.available} aria-pressed={simpleId === v.id} onClick={() => { setSimpleId(v.id); setAdded(false); }}>{v.label}</button>)}</div></fieldset>}<p className="availability">{variant?.available ? "" : c.unavailable}</p><label className="quantity-control">{c.quantity}<input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label><button className="button gold purchase-button" disabled={!variant?.available || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99} onClick={() => { if (!variant) return; addCartLine(market, { productId: product.id, variantId: variant.id, quantity }); setAdded(true); }}>{c.add} ↗</button>{added && <Link className="cart-confirm" href={`/${market}/${locale}/cart`}>{c.cart} →</Link>}{product.kind === "bundle" && <div className="bundle-note"><h2>Bundle</h2><ul>{product.components?.map(component => <li key={component.productId}>{component.productId.replaceAll("-", " ")}</li>)}</ul></div>}</div>;
}
