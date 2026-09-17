"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartKey } from "./cart";
import { formatMoney, normalizeStoredCart, type CartLine, type Locale, type Market, type PublicCartQuote } from "@/lib/commerce";
type Config = { version: 1; checkoutAvailable: boolean; currency: "EGP" | "MAD"; deliveryMethods: { code: string; label: string; amountMinor: number; currency: "EGP" | "MAD" }[]; paymentMethods: { code: string; label: string }[] };
type Fields = { fullName: string; phone: string; email: string; region: string; city: string; address: string; addressNotes: string };
const initial: Fields = { fullName: "", phone: "", email: "", region: "", city: "", address: "", addressNotes: "" };
export function GuestCheckout({ market, locale }: { market: Market; locale: Locale }) {
  const base = "/" + market + "/" + locale;
  const [lines, setLines] = useState<CartLine[]>([]), [config, setConfig] = useState<Config | null>(null), [quote, setQuote] = useState<PublicCartQuote | null>(null);
  const [fields, setFields] = useState<Fields>(initial), [deliveryCode, setDeliveryCode] = useState(""), [paymentCode, setPaymentCode] = useState("");
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [sending, setSending] = useState(false);
  useEffect(() => {
    let cart: CartLine[] = [];
    try { cart = normalizeStoredCart(JSON.parse(localStorage.getItem(cartKey(market)) || "[]")); } catch { /* invalid saved cart */ }
    setLines(cart);
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/checkout/config?market=" + market, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() as Promise<Config>; }),
      cart.length ? fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ market, lines: cart }), signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() as Promise<PublicCartQuote>; }) : Promise.resolve(null),
    ]).then(([configuration, currentQuote]) => { if (!controller.signal.aborted) { setConfig(configuration); setQuote(currentQuote); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError("Checkout is temporarily unavailable."); setLoading(false); } });
    return () => controller.abort();
  }, [market]);
  const update = (key: keyof Fields, value: string) => setFields(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config?.checkoutAvailable || !quote?.canProceed || !deliveryCode || !paymentCode || sending) return;
    setSending(true); setError("");
    const cartSignature = JSON.stringify(lines);
    const storageKey = "mata3-order-attempt-" + market;
    let saved: { signature: string; key: string } | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* new attempt */ }
    const key = saved?.signature === cartSignature ? saved.key : crypto.randomUUID();
    sessionStorage.setItem(storageKey, JSON.stringify({ signature: cartSignature, key }));
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        market, lines, idempotencyKey: key, customer: {
          fullName: fields.fullName, phone: fields.phone, region: fields.region, city: fields.city, address: fields.address,
          ...(fields.email ? { email: fields.email } : {}), ...(fields.addressNotes ? { addressNotes: fields.addressNotes } : {}),
        }, deliveryCode, paymentCode,
      }) });
      const value = await response.json() as { code?: string; order?: { reference: string }; confirmationToken?: string };
      if (!response.ok || !value.order || !value.confirmationToken) {
        setError(value.code === "CART_CHANGED" || value.code === "OUT_OF_STOCK" ? "Your cart changed. Review its current prices and availability before trying again." :
          value.code === "INVALID_INPUT" ? "Check your contact and address details." :
          value.code === "CHECKOUT_UNAVAILABLE" ? "Checkout configuration is unavailable for this market." : "Unable to place your order. Please try again.");
        return;
      }
      localStorage.removeItem(cartKey(market));
      sessionStorage.removeItem(storageKey);
      sessionStorage.setItem("mata3-confirm-" + value.order.reference, value.confirmationToken);
      window.location.assign(base + "/confirmation?reference=" + encodeURIComponent(value.order.reference));
    } catch { setError("Unable to place your order. Please try again."); }
    finally { setSending(false); }
  };
  const label = (en: string, ar: string, fr: string) => locale === "ar" ? ar : locale === "fr" ? fr : en;
  return <main className="inner-page guest-checkout"><div className="page-heading"><p className="eyebrow">MATA3 / {label("GUEST CHECKOUT","إتمام الطلب كضيف","Commande invité")}</p><h1>{label("Checkout","إتمام الطلب","Commande")}</h1></div>
    {loading ? <div className="empty-state">{label("Checking checkout availability…","جارٍ التحقق من الإتمام…","Vérification de la commande…")}</div> :
    !config?.checkoutAvailable ? <div className="empty-state"><h2>{label("Checkout is not available for this market yet.","إتمام الطلب غير متاح لهذا السوق بعد.","La commande n'est pas encore disponible pour ce marché.")}</h2><p>{label("A delivery method and rate must be configured first.","يجب إعداد طريقة وتكلفة التوصيل أولاً.","Une méthode et un tarif de livraison doivent être configurés.")}</p><Link className="button outline" href={base + "/cart"}>{label("Return to cart","العودة إلى الحقيبة","Retour au panier")}</Link></div> :
    !quote?.canProceed ? <div className="empty-state"><h2>{label("Review your cart before checkout.","راجع حقيبتك قبل إتمام الطلب.","Vérifiez votre panier avant de commander.")}</h2><Link className="button gold" href={base + "/cart"}>{label("Review cart","مراجعة الحقيبة","Vérifier le panier")}</Link></div> :
    <form onSubmit={submit} className="guest-checkout-layout"><div className="checkout-steps">
      <section><span>01</span><h2>{label("Contact","بيانات التواصل","Contact")}</h2>
        <label>{label("Full name","الاسم الكامل","Nom complet")}<input required maxLength={120} autoComplete="name" value={fields.fullName} onChange={e => update("fullName",e.target.value)} /></label>
        <label>{label("Phone","رقم الهاتف","Téléphone")}<input required type="tel" maxLength={40} autoComplete="tel" value={fields.phone} onChange={e => update("phone",e.target.value)} /></label>
        <label>{label("Email (optional)","البريد الإلكتروني (اختياري)","E-mail (facultatif)")}<input type="email" maxLength={254} autoComplete="email" value={fields.email} onChange={e => update("email",e.target.value)} /></label>
      </section><section><span>02</span><h2>{label("Address","العنوان","Adresse")}</h2>
        <label>{label("Governorate / Region","المحافظة / الجهة","Région")}<input required maxLength={100} autoComplete="address-level1" value={fields.region} onChange={e => update("region",e.target.value)} /></label>
        <label>{label("City / Area","المدينة / المنطقة","Ville / Zone")}<input required maxLength={100} autoComplete="address-level2" value={fields.city} onChange={e => update("city",e.target.value)} /></label>
        <label>{label("Detailed address","العنوان بالتفصيل","Adresse détaillée")}<textarea required maxLength={300} autoComplete="street-address" value={fields.address} onChange={e => update("address",e.target.value)} /></label>
        <label>{label("Address notes (optional)","ملاحظات العنوان (اختياري)","Notes d'adresse (facultatif)")}<textarea maxLength={300} value={fields.addressNotes} onChange={e => update("addressNotes",e.target.value)} /></label>
      </section><section><span>03</span><h2>{label("Delivery","التوصيل","Livraison")}</h2>
        {config.deliveryMethods.map(method => <label className="method-option" key={method.code}><input type="radio" name="delivery" required checked={deliveryCode === method.code} onChange={() => setDeliveryCode(method.code)} />{method.label} · {formatMoney({ amountMinor: method.amountMinor, currency: method.currency },locale)}</label>)}
      </section><section><span>04</span><h2>{label("Payment method","طريقة الدفع","Paiement")}</h2>
        {config.paymentMethods.map(method => <label className="method-option" key={method.code}><input type="radio" name="payment" required checked={paymentCode === method.code} onChange={() => setPaymentCode(method.code)} />{method.label}</label>)}
        <p>{label("Payment is not marked received when you place the order.","لا يُعد الدفع مستلماً عند إرسال الطلب.","Le paiement n'est pas marqué reçu à la commande.")}</p>
      </section><section><span>05</span><h2>{label("Review","المراجعة","Vérification")}</h2><p>{label("Prices and availability are checked again when you place the order.","تُراجع الأسعار والتوفر مجددًا عند إرسال الطلب.","Les prix et la disponibilité sont revérifiés à la commande.")}</p></section>
    </div><aside className="summary-card"><p className="eyebrow">MATA3</p><h2>{label("Order summary","ملخص الطلب","Résumé")}</h2>{quote.lines.map((line,index) => <p key={index}>{line.name} × {line.quantity} {line.lineTotal ? "· " + formatMoney(line.lineTotal,locale) : ""}</p>)}<strong className="summary-amount">{formatMoney(quote.itemsSubtotal,locale)}</strong><p>{label("Items subtotal. The selected delivery amount is shown above. Final total is confirmed by System when the order is created.","مجموع المنتجات. تكلفة التوصيل مذكورة أعلاه. يؤكد النظام المبلغ النهائي عند إنشاء الطلب.","Sous-total des articles. Le tarif de livraison est indiqué ci-dessus. Le total final est confirmé à la création.")}</p>{error && <p className="checkout-error" role="alert">{error}</p>}<button className="button gold" disabled={sending || !deliveryCode || !paymentCode}>{sending ? label("Placing order…","جارٍ إرسال الطلب…","Commande en cours…") : label("Place order","إرسال الطلب","Confirmer la commande")}</button></aside></form>}
    {error && !config?.checkoutAvailable && <p role="alert">{error}</p>}
  </main>;
}
