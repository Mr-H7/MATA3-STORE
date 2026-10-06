"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Market } from "@/lib/commerce";
import { BrandLogo } from "./header";

type AvailableMarket = { market: Market; currency: "EGP" | "MAD"; locales: string[] };
export function Gateway({ markets }: { markets: AvailableMarket[] }) {
  const router = useRouter();
  const [market, setMarket] = useState<Market>(markets[0]?.market ?? "eg");
  const [locale, setLocale] = useState<Locale>("ar");
  useEffect(() => {
    const saved = localStorage.getItem("mata3-context");
    if (saved && /^\/(eg|ma)\/(ar|en|fr)$/.test(saved) && markets.some(item => saved.startsWith("/" + item.market + "/") && item.locales.includes(saved.split("/")[2]))) router.replace(saved);
  }, [router, markets]);
  const selected = markets.find(item => item.market === market);
  const chooseMarket = (next: Market) => {
    setMarket(next);
    if (!markets.find(item => item.market === next)?.locales.includes(locale)) setLocale("ar");
  };
  return <main className="gateway">
    <div className="gateway-top"><BrandLogo/></div>
    <div className="gateway-content">
      <p className="eyebrow">THE MODERN ARAB MERCHANT <span aria-hidden="true">◆</span> التاجر العربي المعاصر</p>
      <h1>Choose your market <span lang="ar">اختر سوقك</span></h1>
      <p className="gateway-intro">Select your country and preferred language to continue.</p>
      <div className="gateway-markets" role="group" aria-label="Market">
        {markets.map(item => <button key={item.market} type="button" className={"gateway-market" + (market === item.market ? " selected" : "")} aria-pressed={market === item.market} onClick={() => chooseMarket(item.market)}>
          <span className="gateway-market-top"><span>{item.currency}</span><span aria-hidden="true">{market === item.market ? "✓" : "◇"}</span></span>
          <span className="gateway-market-name">{item.market === "eg" ? "Egypt" : "Morocco"} <span lang="ar">{item.market === "eg" ? "مصر" : "المغرب"}</span></span>
        </button>)}
      </div>
      <fieldset className="gateway-languages"><legend>Preferred language <span lang="ar">اللغة المفضلة</span></legend><div>{selected?.locales.map(code => <button key={code} type="button" className={locale === code ? "selected" : ""} aria-pressed={locale === code} onClick={() => setLocale(code as Locale)}>{code === "ar" ? "العربية" : code === "fr" ? "Français" : "English"}</button>)}</div></fieldset>
      <button className="button gold gateway-enter" disabled={!markets.length} onClick={() => { const path = "/" + market + "/" + locale; localStorage.setItem("mata3-context", path); router.push(path); }}>{locale === "ar" ? "دخول مَتاع" : locale === "fr" ? "Entrer chez MATA3" : "Enter MATA3"} <span aria-hidden="true">↗</span></button>
    </div>
    <div className="gateway-footer">مَتاع · MATA3</div>
  </main>;
}
