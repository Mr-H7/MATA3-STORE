"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Market } from "@/lib/commerce";

export function Gateway({ markets }: { markets: { market: Market; currency: "EGP" | "MAD"; locales: string[] }[] }) {
  const router = useRouter();
  const [market, setMarket] = useState<Market>(markets[0]?.market ?? "eg");
  const [locale, setLocale] = useState<Locale>("ar");
  useEffect(() => { const saved = localStorage.getItem("mata3-context"); if (saved && /^\/(eg|ma)\/(ar|en|fr)$/.test(saved) && markets.some(item => saved.startsWith("/" + item.market + "/") && item.locales.includes(saved.split("/")[2]))) router.replace(saved); }, [router, markets]);
  const selectMarket = (next: Market) => { setMarket(next); if (!markets.find(item => item.market === next)?.locales.includes(locale)) setLocale("ar"); };
  return <main className="gateway"><div className="gateway-mark">مَتاع <span>MATA3</span></div><div className="gateway-card"><p className="eyebrow">THE MODERN ARAB MERCHANT</p><h1>Choose your market and language<br /><span>اختر بلدك ولغتك</span></h1><div className="gateway-fields"><label>Country<select value={market} onChange={e => selectMarket(e.target.value as Market)}>{markets.map(item => <option key={item.market} value={item.market}>{item.market === "eg" ? "Egypt" : "Morocco"} · {item.currency}</option>)}</select></label><label>Language<select value={locale} onChange={e => setLocale(e.target.value as Locale)}>{(markets.find(item => item.market === market)?.locales ?? []).map(code => <option key={code} value={code}>{code === "ar" ? "العربية" : code === "fr" ? "Français" : "English"}</option>)}</select></label></div><button className="button gold" disabled={!markets.length} onClick={() => { const path = `/${market}/${locale}`; localStorage.setItem("mata3-context", path); router.push(path); }}>Continue <span aria-hidden>→</span></button></div><div className="gateway-footer">INK · METAL · PAPER</div></main>;
}
