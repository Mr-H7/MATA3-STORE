"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type CartLine, type Locale, type Market, type PublicCartQuote, type PublicQuoteLine, type QuoteCode, formatMoney, normalizeStoredCart } from "@/lib/commerce";
import { t } from "@/lib/i18n";

export function cartKey(market: Market) { return "mata3-cart-" + market; }
export function addCartLine(market: Market, line: CartLine) {
  let lines: CartLine[] = [];
  try { lines = normalizeStoredCart(JSON.parse(localStorage.getItem(cartKey(market)) || "[]")); } catch { /* malformed local state */ }
  const existing = lines.find(item => item.key === line.key);
  if (existing) { existing.quantity = Math.min(99, existing.quantity + line.quantity); existing.observedUnitAmountMinor = line.observedUnitAmountMinor; }
  else lines.push(line);
  localStorage.setItem(cartKey(market), JSON.stringify(lines));
  window.dispatchEvent(new Event("mata3-cart-change"));
}
function issueText(code: QuoteCode, locale: Locale) {
  const english: Record<QuoteCode, string> = {
    INVALID_KEY: "This saved offer is no longer recognized.",
    INVALID_QUANTITY: "Choose a quantity from 1 to 99.",
    WRONG_MARKET: "This offer belongs to another market.",
    NOT_PUBLIC: "This item is no longer published.",
    UNAVAILABLE: "This offer is currently unavailable.",
    BUNDLE_UNAVAILABLE: "One or more bundle components are unavailable.",
    INSUFFICIENT_STOCK: "The combined requested quantity is unavailable.",
    PRICE_CHANGED: "The price has changed. Review and accept the current price.",
  };
  const arabic: Record<QuoteCode, string> = {
    INVALID_KEY: "لم يعد هذا العرض معروفًا.",
    INVALID_QUANTITY: "اختر كمية من ١ إلى ٩٩.",
    WRONG_MARKET: "هذا العرض يخص سوقًا آخر.",
    NOT_PUBLIC: "لم يعد هذا المنتج منشورًا.",
    UNAVAILABLE: "هذا العرض غير متاح حاليًا.",
    BUNDLE_UNAVAILABLE: "بعض مكونات المجموعة غير متاحة.",
    INSUFFICIENT_STOCK: "الكمية المطلوبة مع بقية الحقيبة غير متاحة.",
    PRICE_CHANGED: "تغير السعر. راجع السعر الحالي ووافق عليه.",
  };
  const french: Record<QuoteCode, string> = {
    INVALID_KEY: "Cette offre enregistrée n'est plus reconnue.",
    INVALID_QUANTITY: "Choisissez une quantité de 1 à 99.",
    WRONG_MARKET: "Cette offre appartient à un autre marché.",
    NOT_PUBLIC: "Cet article n'est plus publié.",
    UNAVAILABLE: "Cette offre est actuellement indisponible.",
    BUNDLE_UNAVAILABLE: "Un composant du lot est indisponible.",
    INSUFFICIENT_STOCK: "La quantité totale demandée est indisponible.",
    PRICE_CHANGED: "Le prix a changé. Vérifiez et acceptez le prix actuel.",
  };
  return (locale === "ar" ? arabic : locale === "fr" ? french : english)[code];
}
function price(value: PublicQuoteLine["unitPrice"], locale: Locale) { return value ? formatMoney(value, locale) : null; }
export function Cart({ market, locale }: { market: Market; locale: Locale }) {
  const c = t(locale), base = "/" + market + "/" + locale;
  const [lines, setLines] = useState<CartLine[]>([]), [ready, setReady] = useState(false), [retry, setRetry] = useState(0);
  const [quote, setQuote] = useState<PublicCartQuote | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    try { setLines(normalizeStoredCart(JSON.parse(localStorage.getItem(cartKey(market)) || "[]"))); }
    catch { setLines([]); }
    setReady(true);
  }, [market]);
  useEffect(() => {
    if (!ready || !lines.length) { setQuote(null); return; }
    const controller = new AbortController();
    void fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ market, lines }), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Quote unavailable"); return response.json() as Promise<PublicCartQuote>; })
      .then(value => { if (!controller.signal.aborted) { setQuote(value); setFailed(false); } })
      .catch(() => { if (!controller.signal.aborted) { setQuote(null); setFailed(true); } });
    return () => controller.abort();
  }, [ready, lines, market, retry]);
  const save = (next: CartLine[]) => { setLines(next); setQuote(null); setFailed(false); localStorage.setItem(cartKey(market), JSON.stringify(next)); };
  const update = (index: number, data: Partial<CartLine>) => save(lines.map((line, i) => i === index ? { ...line, ...data } : line));
  const remove = (index: number) => save(lines.filter((_, i) => i !== index));
  if (!ready) return <div className="empty-state">…</div>;
  if (!lines.length) return <div className="empty-state"><h2>{c.empty}</h2><Link className="button gold" href={base}>{c.shop}</Link></div>;
  if (failed) return <div className="empty-state"><h2>{locale === "ar" ? "تعذر تحديث الأسعار والتوفر" : locale === "fr" ? "Devis indisponible" : "Unable to verify current prices and availability"}</h2><button className="button outline" onClick={() => setRetry(value => value + 1)}>{locale === "ar" ? "إعادة المحاولة" : locale === "fr" ? "Réessayer" : "Retry quote"}</button></div>;
  if (!quote) return <div className="empty-state">{locale === "ar" ? "جارٍ التحقق من الحقيبة…" : locale === "fr" ? "Vérification du panier…" : "Checking current prices and availability…"}</div>;
  return <div className="cart-layout"><div className="cart-lines">
    {quote.lines.map((item, index) => <article className={"cart-line" + (item.valid ? "" : " invalid")} key={index}>
      <div className="cart-image">م</div><div>
        <h2>{item.slug && item.kind ? <Link href={base + "/" + item.kind + "/" + item.slug}>{item.name ?? c.product}</Link> : item.name ?? (locale === "ar" ? "عنصر محفوظ" : locale === "fr" ? "Article enregistré" : "Saved item")}</h2>
        {item.label && <p>{item.label}</p>}
        {item.unitPrice && <p>{price(item.unitPrice, locale)}{lines[index]?.observedUnitAmountMinor !== undefined && lines[index].observedUnitAmountMinor !== item.unitPrice.amountMinor ? <span className="price-change"> · {locale === "ar" ? "السعر السابق" : locale === "fr" ? "Ancien prix" : "Previously"} {formatMoney({ amountMinor: lines[index].observedUnitAmountMinor!, currency: quote.currency }, locale)}</span> : null}</p>}
        {item.codes.map(code => <p className="cart-issue" key={code}>{issueText(code, locale)}</p>)}
        {item.codes.includes("PRICE_CHANGED") && item.unitPrice && <button className="button outline" onClick={() => update(index, { observedUnitAmountMinor: item.unitPrice!.amountMinor })}>{locale === "ar" ? "اعتماد السعر الحالي" : locale === "fr" ? "Accepter le prix actuel" : "Accept current price"}</button>}
        <label>{c.quantity} <input type="number" min="1" max="99" value={lines[index]?.quantity ?? item.quantity} onChange={e => update(index, { quantity: Number(e.target.value) })} /></label>
        <button className="text-button" onClick={() => remove(index)}>{c.remove}</button>
      </div>{item.lineTotal && <strong>{formatMoney(item.lineTotal, locale)}</strong>}
    </article>)}
  </div><aside className="summary-card"><p className="eyebrow">MATA3</p><h2>{c.subtotal}</h2><strong className="summary-amount">{formatMoney(quote.itemsSubtotal, locale)}</strong><p role="status">{quote.canProceed ? (locale === "ar" ? "تم التحقق من العناصر والأسعار الحالية. إتمام الطلب غير متاح بعد." : locale === "fr" ? "Articles et prix actuels vérifiés. La commande n'est pas encore disponible." : "Current items and prices are verified. Checkout is not available yet.") : (locale === "ar" ? "راجع التغييرات أعلاه قبل المتابعة." : locale === "fr" ? "Vérifiez les modifications avant de continuer." : "Review the changes above before continuing.")}</p><p>{c.configure}</p></aside></div>;
}
