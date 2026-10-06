"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Locale, type Market, type PublicProduct, formatMoney } from "@/lib/commerce";
import { t } from "@/lib/i18n";
import { addCartLine } from "./cart";
import { QuantityStepper } from "./quantity-stepper";

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
  return <div className="purchase-panel"><p className="eyebrow">MATA3 / {product.kind === "bundle" ? "BUNDLE" : "PRODUCT"}</p><h1>{product.name}</h1><div className="pdp-price">{formatMoney(variant?.price ?? product.price, locale)}</div>{attrs.length ? attrs.map(attr => <fieldset key={attr}><legend>{attr}</legend><div className="variant-list">{[...new Set(product.variants.map(v => v.attributes[attr]).filter(Boolean))].map(value => { const available = product.variants.some(v => v.available && v.attributes[attr] === value && attrs.slice(0, attrs.indexOf(attr)).every(key => !selected[key] || v.attributes[key] === selected[key])); return <button key={value} disabled={!available} aria-pressed={selected[attr] === value} onClick={() => choose(attr, value)}>{value}</button>; })}</div></fieldset>) : product.variants.length > 1 && <fieldset><legend>{c.product}</legend><div className="variant-list">{product.variants.map(v => <button key={v.id} disabled={!v.available} aria-pressed={simpleId === v.id} onClick={() => { setSimpleId(v.id); setAdded(false); }}>{v.label}</button>)}</div></fieldset>}{!variant?.available && <p className="availability">{!variant && product.variants.length > 1 ? (locale === "ar" ? "اختر النسخة المتاحة" : locale === "fr" ? "Choisissez une option" : "Select an available option") : c.unavailable}</p>}{variant?.media?.length ? <div className="variant-media">{variant.media.map((item, i) => item.type === "VIDEO" ? <video key={i} src={item.url} controls preload="metadata" /> : <Image unoptimized key={i} width={120} height={120} src={item.url} alt={item.alt} />)}</div> : null}<div className="quantity-control"><span>{c.quantity}</span><QuantityStepper value={quantity} onChange={setQuantity} label={c.quantity} /></div><button className="button gold purchase-button" disabled={!variant?.available || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99} onClick={() => { if (!variant) return; addCartLine(market, { key: variant.id, quantity, observedUnitAmountMinor: (variant.price ?? product.price).amountMinor }); setAdded(true); }}>{c.add} ↗</button>{added && <Link className="cart-confirm" aria-live="polite" href={`/${market}/${locale}/cart`}>{c.cart} →</Link>}</div>;
}
