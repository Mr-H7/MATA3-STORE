"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Market } from "@/lib/commerce";

export function Gateway() {
  const router = useRouter();
  const [market, setMarket] = useState<Market>("eg");
  const [locale, setLocale] = useState<Locale>("ar");
  useEffect(() => { const saved = localStorage.getItem("mata3-context"); if (saved && /^\/(eg|ma)\/(ar|en|fr)$/.test(saved)) router.replace(saved); }, [router]);
  const selectMarket = (next: Market) => { setMarket(next); if (next === "eg" && locale === "fr") setLocale("ar"); };
  return <main className="gateway"><div className="gateway-mark">مَتاع <span>MATA3</span></div><div className="gateway-card"><p className="eyebrow">THE MODERN ARAB MERCHANT</p><h1>Choose your market and language<br /><span>اختر بلدك ولغتك</span></h1><div className="gateway-fields"><label>Country<select value={market} onChange={e => selectMarket(e.target.value as Market)}><option value="eg">Egypt · EGP</option><option value="ma">Morocco · MAD</option></select></label><label>Language<select value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="ar">العربية</option><option value="en">English</option>{market === "ma" && <option value="fr">Français</option>}</select></label></div><button className="button gold" onClick={() => { const path = `/${market}/${locale}`; localStorage.setItem("mata3-context", path); router.push(path); }}>Continue <span aria-hidden>→</span></button></div><div className="gateway-footer">INK · METAL · PAPER</div></main>;
}
