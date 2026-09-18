"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cartKey } from "./cart";
import { formatMoney, normalizeStoredCart, type CartLine, type Locale, type Market, type PublicCartQuote } from "@/lib/commerce";
type Destination = { key: string; parentKey: string | null; kind: "REGION" | "CITY" | "DISTRICT"; name: string };
type Delivery = { code: string; label: string; amountMinor: number; currency: "EGP" | "MAD"; pricingProvenance: "APPROVED_TARIFF" };
type Config = { version: 2; checkoutAvailable: boolean; shippingStatus: "NOT_CONFIGURED" | "UNAVAILABLE" | "AVAILABLE"; currency: "EGP" | "MAD";
  destinations: Destination[]; deliveryMethods: Delivery[]; paymentMethods: { code: string; label: string }[] };
type CheckoutQuote = { version: 1; cart: PublicCartQuote; itemsSubtotal: { amountMinor: number; currency: "EGP" | "MAD" };
  delivery: { code: string; label: string; amount: { amountMinor: number; currency: "EGP" | "MAD" } }; grandTotal: { amountMinor: number; currency: "EGP" | "MAD" }; canProceed: boolean };
type Fields = { fullName: string; phone: string; email: string; address: string; addressNotes: string };
const initial: Fields = { fullName: "", phone: "", email: "", address: "", addressNotes: "" };
export function GuestCheckout({ market, locale }: { market: Market; locale: Locale }) {
  const base = "/" + market + "/" + locale;
  const [lines, setLines] = useState<CartLine[]>([]), [config, setConfig] = useState<Config | null>(null), [quote, setQuote] = useState<PublicCartQuote | null>(null);
  const [fields, setFields] = useState<Fields>(initial), [destinationKey, setDestinationKey] = useState(""), [deliveryCode, setDeliveryCode] = useState(""), [paymentCode, setPaymentCode] = useState("");
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [shippingState, setShippingState] = useState<"idle" | "loading" | "available" | "unavailable" | "failure">("idle"), [sending, setSending] = useState(false);
  const label = (en: string, ar: string, fr: string) => locale === "ar" ? ar : locale === "fr" ? fr : en;
  useEffect(() => {
    let cart: CartLine[] = [];
    try { cart = normalizeStoredCart(JSON.parse(localStorage.getItem(cartKey(market)) || "[]")); } catch { /* invalid saved cart */ }
    setLines(cart);
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/checkout/config?market=" + market, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() as Promise<Config>; }),
      cart.length ? fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ market, lines: cart }), signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() as Promise<PublicCartQuote>; }) : Promise.resolve(null),
    ]).then(([configuration, currentQuote]) => { if (!controller.signal.aborted) { setConfig(configuration); setQuote(currentQuote); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError("Checkout configuration could not be loaded. Please try again."); setLoading(false); } });
    return () => controller.abort();
  }, [market]);
  useEffect(() => {
    if (!destinationKey) return;
    const controller = new AbortController();
    void fetch("/api/checkout/config?market=" + market + "&destinationKey=" + encodeURIComponent(destinationKey), { signal: controller.signal })
      .then(r => { if (!r.ok) throw Error(); return r.json() as Promise<Config>; })
      .then(next => { if (!controller.signal.aborted) { setConfig(next); setShippingState(next.deliveryMethods.length ? "available" : "unavailable"); } })
      .catch(() => { if (!controller.signal.aborted) setShippingState("failure"); });
    return () => controller.abort();
  }, [market, destinationKey]);
  useEffect(() => {
    if (!destinationKey || !deliveryCode || !lines.length) return;
    const controller = new AbortController();
    void fetch("/api/checkout/quote", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market, destinationKey, deliveryCode, lines }), signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(r.status === 409 ? "UNAVAILABLE" : "FAILURE"); return r.json() as Promise<CheckoutQuote>; })
      .then(next => { if (!controller.signal.aborted) { setCheckoutQuote(next); setShippingState("available"); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) { setCheckoutQuote(null); setShippingState(reason instanceof Error && reason.message === "UNAVAILABLE" ? "unavailable" : "failure"); } });
    return () => controller.abort();
  }, [market, destinationKey, deliveryCode, lines]);
  const destination = config?.destinations.find(d => d.key === destinationKey);
  const path = useMemo(() => {
    const values: Destination[] = [];
    let current = destination;
    while (current && values.length < 6) { values.unshift(current); current = config?.destinations.find(d => d.key === current?.parentKey); }
    return values;
  }, [config?.destinations, destination]);
  const region = path.find(d => d.kind === "REGION")?.name ?? "";
  const city = path.find(d => d.kind === "CITY")?.name ?? "";
  const update = (key: keyof Fields, value: string) => setFields(current => ({ ...current, [key]: value }));
  const selectDestination = (value: string) => { setDestinationKey(value); setDeliveryCode(""); setCheckoutQuote(null); setConfig(current => current ? { ...current, deliveryMethods: [] } : current); setShippingState(value ? "loading" : "idle"); setError(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config?.checkoutAvailable || !checkoutQuote?.canProceed || !destinationKey || !deliveryCode || !paymentCode || sending || shippingState !== "available") return;
    setSending(true); setError("");
    try {
      const latestResponse = await fetch("/api/checkout/quote", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, destinationKey, deliveryCode, lines }) });
      if (!latestResponse.ok) { setShippingState(latestResponse.status === 409 ? "unavailable" : "failure"); setError("Delivery or checkout pricing needs review."); return; }
      const latest = await latestResponse.json() as CheckoutQuote;
      if (!latest.canProceed || latest.grandTotal.amountMinor !== checkoutQuote.grandTotal.amountMinor ||
        latest.itemsSubtotal.amountMinor !== checkoutQuote.itemsSubtotal.amountMinor) {
        setCheckoutQuote(latest); setError("The current total changed. Review it before placing your order."); return;
      }
      const payload = { market, lines, customer: { fullName: fields.fullName, phone: fields.phone, region, city, address: fields.address,
        ...(fields.email ? { email: fields.email } : {}), ...(fields.addressNotes ? { addressNotes: fields.addressNotes } : {}) },
        destinationKey, deliveryCode, paymentCode };
      const signature = JSON.stringify(payload), storageKey = "mata3-order-attempt-" + market;
      let saved: { signature: string; key: string } | null = null;
      try { saved = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* new attempt */ }
      const key = saved?.signature === signature ? saved.key : crypto.randomUUID();
      sessionStorage.setItem(storageKey, JSON.stringify({ signature, key }));
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey: key }) });
      const value = await response.json() as { code?: string; order?: { reference: string }; confirmationToken?: string };
      if (!response.ok || !value.order || !value.confirmationToken) {
        setError(value.code === "CART_CHANGED" || value.code === "OUT_OF_STOCK" ? "Your cart changed. Review its current prices and availability." :
          value.code === "INVALID_INPUT" ? "Check your contact and address details." :
          value.code === "CHECKOUT_UNAVAILABLE" ? "Delivery configuration changed. Select an available method again." : "Unable to place your order. Please try again.");
        if (value.code === "CHECKOUT_UNAVAILABLE") { setShippingState("unavailable"); setCheckoutQuote(null); }
        return;
      }
      localStorage.removeItem(cartKey(market)); sessionStorage.removeItem(storageKey);
      sessionStorage.setItem("mata3-confirm-" + value.order.reference, value.confirmationToken);
      window.location.assign(base + "/confirmation?reference=" + encodeURIComponent(value.order.reference));
    } catch { setError("Unable to place your order. Please try again."); }
    finally { setSending(false); }
  };
  return <main className="inner-page guest-checkout"><div className="page-heading"><p className="eyebrow">MATA3 / {label("GUEST CHECKOUT","إتمام الطلب كضيف","Commande invité")}</p><h1>{label("Checkout","إتمام الطلب","Commande")}</h1></div>
    {loading ? <div className="empty-state">{label("Checking checkout availability…","جارٍ التحقق من الإتمام…","Vérification de la commande…")}</div> :
    !config ? <div className="empty-state" role="alert">{error}</div> :
    config.shippingStatus === "NOT_CONFIGURED" ? <div className="empty-state"><h2>{label("Checkout is not available for this market yet.","إتمام الطلب غير متاح لهذا السوق بعد.","La commande n'est pas encore disponible pour ce marché.")}</h2><p>{label("Delivery configuration must be approved first.","يجب اعتماد إعدادات التوصيل أولاً.","La livraison doit d'abord être configurée.")}</p><Link className="button outline" href={base + "/cart"}>{label("Return to cart","العودة إلى الحقيبة","Retour au panier")}</Link></div> :
    !quote?.canProceed ? <div className="empty-state"><h2>{label("Review your cart before checkout.","راجع حقيبتك قبل إتمام الطلب.","Vérifiez votre panier avant de commander.")}</h2><Link className="button gold" href={base + "/cart"}>{label("Review cart","مراجعة الحقيبة","Vérifier le panier")}</Link></div> :
    <form onSubmit={submit} className="guest-checkout-layout"><div className="checkout-steps">
      <section><span>01</span><h2>{label("Contact","بيانات التواصل","Contact")}</h2>
        <label>{label("Full name","الاسم الكامل","Nom complet")}<input required maxLength={120} autoComplete="name" value={fields.fullName} onChange={e => update("fullName",e.target.value)} /></label>
        <label>{label("Phone","رقم الهاتف","Téléphone")}<input required type="tel" maxLength={40} autoComplete="tel" value={fields.phone} onChange={e => update("phone",e.target.value)} /></label>
        <label>{label("Email (optional)","البريد الإلكتروني (اختياري)","E-mail (facultatif)")}<input type="email" maxLength={254} autoComplete="email" value={fields.email} onChange={e => update("email",e.target.value)} /></label>
      </section><section><span>02</span><h2>{label("Address","العنوان","Adresse")}</h2>
        <label>{label("Destination","الوجهة","Destination")}<select required value={destinationKey} onChange={e => selectDestination(e.target.value)}><option value="">{label("Select a configured destination","اختر وجهة مُعَدّة","Choisir une destination configurée")}</option>
          {config.destinations.filter(d => d.kind !== "REGION" && (d.kind !== "DISTRICT" || !!d.parentKey)).map(d => <option key={d.key} value={d.key}>{config.destinations.find(p => p.key === d.parentKey)?.name ?? ""} / {d.name}</option>)}</select></label>
        {!config.destinations.some(d => d.kind === "CITY") && <p>{label("No delivery destinations are configured yet.","لم تُضبط وجهات التوصيل بعد.","Aucune destination de livraison configurée.")}</p>}
        {destinationKey && <p>{region}{city ? " / " + city : ""}{destination?.kind === "DISTRICT" ? " / " + destination.name : ""}</p>}
        <label>{label("Detailed address","العنوان بالتفصيل","Adresse détaillée")}<textarea required maxLength={300} autoComplete="street-address" value={fields.address} onChange={e => update("address",e.target.value)} /></label>
        <label>{label("Address notes (optional)","ملاحظات العنوان (اختياري)","Notes d'adresse (facultatif)")}<textarea maxLength={300} value={fields.addressNotes} onChange={e => update("addressNotes",e.target.value)} /></label>
      </section><section><span>03</span><h2>{label("Delivery","التوصيل","Livraison")}</h2>
        {shippingState === "loading" && <p>{label("Checking delivery…","جارٍ التحقق من التوصيل…","Vérification de la livraison…")}</p>}
        {shippingState === "unavailable" && <p>{label("No approved delivery method is available for this destination.","لا توجد طريقة توصيل معتمدة لهذه الوجهة.","Aucune livraison approuvée pour cette destination.")}</p>}
        {shippingState === "failure" && <p role="alert">{label("Delivery information could not be loaded. Please try again.","تعذر تحميل معلومات التوصيل. حاول مرة أخرى.","Impossible de charger la livraison. Réessayez.")}</p>}
        {config.deliveryMethods.map(method => <label className="method-option" key={method.code}><input type="radio" name="delivery" required checked={deliveryCode === method.code} onChange={() => { setDeliveryCode(method.code); setCheckoutQuote(null); setShippingState("loading"); }} />{method.label} · {formatMoney({ amountMinor: method.amountMinor, currency: method.currency },locale)}</label>)}
      </section><section><span>04</span><h2>{label("Payment method","طريقة الدفع","Paiement")}</h2>
        {config.paymentMethods.map(method => <label className="method-option" key={method.code}><input type="radio" name="payment" required checked={paymentCode === method.code} onChange={() => setPaymentCode(method.code)} />{method.label}</label>)}
        <p>{label("Payment is not marked received when you place the order.","لا يُعد الدفع مستلماً عند إرسال الطلب.","Le paiement n'est pas marqué reçu à la commande.")}</p>
      </section><section><span>05</span><h2>{label("Review","المراجعة","Vérification")}</h2><p>{label("Prices and availability are checked again when you place the order.","تُراجع الأسعار والتوفر مجددًا عند إرسال الطلب.","Les prix et la disponibilité sont revérifiés à la commande.")}</p></section>
    </div><aside className="summary-card"><p className="eyebrow">MATA3</p><h2>{label("Order summary","ملخص الطلب","Résumé")}</h2>{quote.lines.map((line,index) => <p key={index}>{line.name} × {line.quantity} {line.lineTotal ? "· " + formatMoney(line.lineTotal,locale) : ""}</p>)}
      <p>{label("Items subtotal","مجموع المنتجات","Sous-total")} · {formatMoney(checkoutQuote?.itemsSubtotal ?? quote.itemsSubtotal,locale)}</p>
      {checkoutQuote && <><p>{label("Delivery","التوصيل","Livraison")} · {formatMoney(checkoutQuote.delivery.amount,locale)}</p><strong className="summary-amount">{label("Grand total","الإجمالي","Total")} · {formatMoney(checkoutQuote.grandTotal,locale)}</strong></>}
      {!checkoutQuote && <p>{label("Select a destination and delivery method to see the approved total.","اختر الوجهة وطريقة التوصيل لعرض الإجمالي المعتمد.","Choisissez la destination et la livraison pour voir le total approuvé.")}</p>}
      {error && <p className="checkout-error" role="alert">{error}</p>}
      <button className="button gold" disabled={sending || !checkoutQuote?.canProceed || !deliveryCode || !paymentCode || shippingState !== "available"}>{sending ? label("Placing order…","جارٍ إرسال الطلب…","Commande en cours…") : label("Place order","إرسال الطلب","Confirmer la commande")}</button></aside></form>}
  </main>;
}
