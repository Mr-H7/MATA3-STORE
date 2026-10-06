"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney, type Locale, type Market, type Money } from "@/lib/commerce";

type OrderView = {
  reference: string; market: string; currency: "EGP" | "MAD"; status: string; paymentStatus: string; placedAt: string;
  customerName: string; address: { region: string; city: string; detailedAddress: string };
  delivery: { label: string; amount: Money }; payment: { label: string };
  itemsSubtotal: Money; grandTotal: Money;
  lines: { kind: string; name: string; variantLabel?: string; quantity: number; unitPrice: Money; lineTotal: Money }[];
  availableCustomerActions: string[];
};
function label(locale: Locale, en: string, ar: string, fr: string) { return locale === "ar" ? ar : locale === "fr" ? fr : en; }
function statusLabel(value: string, locale: Locale) {
  const names: Record<string, [string, string, string]> = {
    RECEIVED: ["Received", "تم الاستلام", "Reçue"], PROCESSING: ["Processing", "قيد المعالجة", "En préparation"],
    SHIPPED: ["Shipped", "تم الشحن", "Expédiée"], DELIVERED: ["Delivered", "تم التوصيل", "Livrée"],
    CANCELLED: ["Cancelled", "ملغي", "Annulée"], PENDING: ["Pending", "قيد الانتظار", "En attente"],
    PAID: ["Paid", "مدفوع", "Payée"], UNPAID: ["Unpaid", "غير مدفوع", "Non payée"],
  };
  const entry = names[value];
  return entry ? entry[locale === "ar" ? 1 : locale === "fr" ? 2 : 0] : value;
}
function Details({ order, market, locale, confirmation }: { order: OrderView; market: Market; locale: Locale; confirmation: boolean }) {
  const base = "/" + market + "/" + locale;
  return <div className="order-view">
    <div className="order-result-head"><p className="eyebrow">MATA3 / {confirmation ? label(locale,"ORDER RECEIVED","تم استلام الطلب","COMMANDE REÇUE") : label(locale,"ORDER STATUS","حالة الطلب","STATUT DE COMMANDE")}</p><h1>{confirmation ? label(locale,"Order received","تم استلام طلبك","Commande reçue") : label(locale,"Order status","حالة الطلب","Statut de commande")}</h1>{confirmation && <p>{label(locale,"Your order has been created successfully.","تم إنشاء طلبك بنجاح.","Votre commande a été créée.")}</p>}</div>
    <div className="order-reference"><span>{label(locale,"Order reference","رقم الطلب","Référence")}</span><strong dir="ltr">{order.reference}</strong><button type="button" className="text-button" onClick={() => void navigator.clipboard.writeText(order.reference)}>{label(locale,"Copy reference","نسخ الرقم","Copier")}</button></div>
    <dl className="order-status-list"><div><dt>{label(locale,"Order status","حالة الطلب","Statut")}</dt><dd>{statusLabel(order.status,locale)}</dd></div><div><dt>{label(locale,"Payment status","حالة الدفع","Statut du paiement")}</dt><dd>{statusLabel(order.paymentStatus,locale)}</dd></div><div><dt>{label(locale,"Placed","تاريخ الطلب","Date")}</dt><dd>{new Date(order.placedAt).toLocaleString(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-MA" : "en-US")}</dd></div></dl>
    <div className="summary-card order-summary"><h2>{label(locale,"Order summary","ملخص الطلب","Résumé de commande")}</h2><div className="order-lines">{order.lines.map((line,index) => <div key={index} className="order-line"><span>{line.name}{line.variantLabel ? " · " + line.variantLabel : ""}<small>× {line.quantity}</small></span><strong>{formatMoney(line.lineTotal,locale)}</strong></div>)}</div><dl><div><dt>{label(locale,"Items subtotal","مجموع المنتجات","Sous-total")}</dt><dd>{formatMoney(order.itemsSubtotal,locale)}</dd></div><div><dt>{label(locale,"Delivery","التوصيل","Livraison")} · {order.delivery.label}</dt><dd>{formatMoney(order.delivery.amount,locale)}</dd></div><div className="order-total"><dt>{label(locale,"Total","الإجمالي","Total")}</dt><dd>{formatMoney(order.grandTotal,locale)}</dd></div></dl><p>{label(locale,"Payment method","طريقة الدفع","Moyen de paiement")}: {order.payment.label}</p><p>{label(locale,"Destination","الوجهة","Destination")}: {[order.address.region,order.address.city].filter(Boolean).join(" / ")}</p></div>
    <div className="order-actions"><Link className="button gold" href={base + "/track"}>{label(locale,"Track order","تتبع الطلب","Suivre la commande")} ↗</Link><Link className="button outline" href={base}>{label(locale,"Continue shopping","متابعة التسوق","Continuer les achats")}</Link></div>
  </div>;
}
export function OrderConfirmation({ market, locale, reference, token }: { market: Market; locale: Locale; reference: string; token: string }) {
  const [order,setOrder]=useState<OrderView|null>(null),[done,setDone]=useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const capability = token || sessionStorage.getItem("mata3-confirm-" + reference) || "";
    void fetch("/api/orders/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,token:capability}),signal:controller.signal})
      .then(async response => response.ok ? await response.json() as OrderView : null)
      .then(value => { if (!controller.signal.aborted) { setOrder(value); setDone(true); } })
      .catch(() => { if (!controller.signal.aborted) setDone(true); });
    return () => controller.abort();
  },[reference,token]);
  return <main className="inner-page">{!done ? <div className="empty-state" role="status">{label(locale,"Loading confirmation…","جارٍ تحميل التأكيد…","Chargement de la confirmation…")}</div> : order ? <Details order={order} market={market} locale={locale} confirmation /> : <div className="empty-state"><h1>{label(locale,"Confirmation unavailable","التأكيد غير متاح","Confirmation indisponible")}</h1><Link className="button outline" href={"/"+market+"/"+locale+"/track"}>{label(locale,"Track order","تتبع الطلب","Suivre la commande")}</Link></div>}</main>;
}
export function GuestTracking({ market, locale }: { market: Market; locale: Locale }) {
  const [reference,setReference]=useState(""),[phone,setPhone]=useState(""),[order,setOrder]=useState<OrderView|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    try {
      const response=await fetch("/api/orders/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,phone})});
      if (!response.ok) { setError(response.status === 429 ? label(locale,"Too many attempts. Please try again later.","محاولات كثيرة. حاول لاحقًا.","Trop de tentatives. Réessayez plus tard.") : label(locale,"We couldn't find an order matching those details. Check the reference and phone number and try again.","لم نجد طلبًا مطابقًا لهذه البيانات. تحقق من رقم الطلب والهاتف وحاول مجددًا.","Aucune commande ne correspond à ces informations. Vérifiez la référence et le téléphone.")); return; }
      setOrder(await response.json() as OrderView);
    } catch { setError(label(locale,"Order tracking is unavailable. Please try again.","تتبع الطلب غير متاح الآن. حاول مجددًا.","Le suivi est indisponible. Réessayez.")); }
    finally { setLoading(false); }
  };
  return <main className="narrow-page tracking-page"><p className="eyebrow">MATA3 / {label(locale,"ORDER TRACKING","تتبع الطلب","SUIVI")}</p><h1>{label(locale,"Track your order","تتبع طلبك","Suivre votre commande")}</h1><p>{label(locale,"Enter your order reference and the phone number used during checkout.","أدخل رقم الطلب ورقم الهاتف المستخدم عند إتمامه.","Saisissez la référence et le numéro de téléphone utilisés lors de la commande.")}</p><form className="stack-form" onSubmit={submit}><label>{label(locale,"Order reference","رقم الطلب","Référence")}<input required value={reference} onChange={event=>setReference(event.target.value)} autoComplete="off" /></label><label>{label(locale,"Phone number","رقم الهاتف","Numéro de téléphone")}<input required type="tel" value={phone} onChange={event=>setPhone(event.target.value)} autoComplete="tel" /></label><button className="button gold" disabled={loading}>{loading ? label(locale,"Searching…","جارٍ البحث…","Recherche…") : label(locale,"Track order","تتبع الطلب","Suivre la commande")}</button></form>{error && <div className="tracking-error" role="alert"><strong>{error}</strong><button type="button" className="text-button" onClick={() => setError("")}>{label(locale,"Try again","حاول مجددًا","Réessayer")}</button></div>}{order && <Details order={order} market={market} locale={locale} confirmation={false}/>}</main>;
}
