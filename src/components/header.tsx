"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { normalizeStoredCart, type Locale, type Market } from "@/lib/commerce";
import { marketName, t } from "@/lib/i18n";
import { SearchBox } from "./search-box";

type Category = { key: string; name: string };
export function BrandLogo() {
  return <span className="brand-logo"><span className="merchant-mark" aria-hidden="true"><Image src="/icon.png" width={36} height={36} alt="" /></span><span className="brand-wordmark"><span>مَتاع</span><strong>MATA3</strong></span></span>;
}
function Icon({ name }: { name: "search" | "cart" | "menu" | "close" }) {
  if (name === "search") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/></svg>;
  if (name === "cart") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 4h2l2.1 11.2a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>;
  if (name === "menu") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>;
}
export function Header({ market, locale, categories }: { market: Market; locale: Locale; categories: Category[] }) {
  const path = usePathname(), router = useRouter(), base = "/" + market + "/" + locale, copy = t(locale);
  const [menu, setMenu] = useState(false), [search, setSearch] = useState(false), [scrolled, setScrolled] = useState(false);
  useEffect(() => { setMenu(false); setSearch(false); }, [path]);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => { if (!menu && !search) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenu(false); setSearch(false); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [menu, search]);
  const change = (nextMarket: Market, nextLocale: Locale) => {
    if (nextMarket !== market) {
      let count = 0;
      try { count = normalizeStoredCart(JSON.parse(localStorage.getItem("mata3-cart-" + market) || "[]")).length; } catch { /* invalid saved cart */ }
      if (count && !window.confirm(locale === "ar" ? "تغيير البلد؟ قد تختلف المنتجات والأسعار والتوفر. لن تنتقل حقيبتك إلى البلد الجديد. هل تريد المتابعة؟" : locale === "fr" ? "Changer de pays ? Les produits et les prix peuvent varier. Votre panier restera dans le pays actuel. Continuer ?" : "Change market? Products, prices and availability may differ. Your cart will remain in the current market. Continue?")) return;
    }
    const next = "/" + nextMarket + "/" + nextLocale;
    localStorage.setItem("mata3-context", next);
    router.push(nextMarket === market ? path.replace(/^\/(eg|ma)\/(ar|en|fr)/, next) : next);
    setMenu(false);
  };
  const marketControl = <label className="header-select"><span className="sr-only">{copy.country}</span><select aria-label={copy.country} value={market} onChange={event => change(event.target.value as Market, locale === "fr" && event.target.value === "eg" ? "ar" : locale)}><option value="eg">{marketName("eg", locale)} · EGP</option><option value="ma">{marketName("ma", locale)} · MAD</option></select></label>;
  const languageControl = <label className="header-select"><span className="sr-only">{copy.language}</span><select aria-label={copy.language} value={locale} onChange={event => change(market, event.target.value as Locale)}><option value="ar">العربية</option><option value="en">English</option>{market === "ma" && <option value="fr">Français</option>}</select></label>;
  return <>
    <header className={"site-header" + (scrolled ? " is-scrolled" : "")}>
      <Link className="brand" href={base} aria-label="MATA3 home"><BrandLogo/></Link>
      <nav className="desktop-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
        <Link href={base}>{locale === "ar" ? "الرئيسية" : locale === "fr" ? "Accueil" : "Home"}</Link>
        <Link href={base + "/search"}>{locale === "ar" ? "تسوق" : locale === "fr" ? "Boutique" : "Shop"}</Link>
        <Link href={base + "/search#categories"}>{copy.departments}</Link>
        <Link href={base + "/about"}>{locale === "ar" ? "عن مَتاع" : "About MATA3"}</Link>
      </nav>
      <div className="header-actions">
        <button className="header-icon" type="button" aria-label={copy.search} aria-expanded={search} onClick={() => setSearch(true)}><Icon name="search"/><span className="desktop-only">{copy.search}</span></button>
        <div className="desktop-only header-context">{marketControl}{languageControl}</div>
        <Link className="header-icon" href={base + "/cart"} aria-label={copy.cart}><Icon name="cart"/><span className="desktop-only">{copy.cart}</span></Link>
        <button className="header-icon mobile-only" type="button" aria-label={locale === "ar" ? "افتح القائمة" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(true)}><Icon name="menu"/></button>
      </div>
    </header>
    {search && <div className="search-overlay" role="dialog" aria-modal="true" aria-label={copy.search} onMouseDown={event => { if (event.target === event.currentTarget) setSearch(false); }}><div className="search-overlay-panel"><div className="search-overlay-head"><span className="eyebrow">MATA3 / {copy.search}</span><button className="header-icon" type="button" aria-label={locale === "ar" ? "إغلاق البحث" : "Close search"} onClick={() => setSearch(false)}><Icon name="close"/></button></div><SearchBox market={market} locale={locale} wide autoFocus/><Link className="search-all" href={base + "/search"} onClick={() => setSearch(false)}>{locale === "ar" ? "تصفح جميع المنتجات" : locale === "fr" ? "Voir le catalogue" : "Explore all products"} ↗</Link></div></div>}
    {menu && <div className="menu-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setMenu(false); }}><aside className="mobile-menu" role="dialog" aria-modal="true" aria-label={locale === "ar" ? "القائمة" : "Menu"}><div className="menu-head"><BrandLogo/><button className="header-icon" type="button" autoFocus aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"} onClick={() => setMenu(false)}><Icon name="close"/></button></div><nav><Link href={base}>{locale === "ar" ? "الرئيسية" : locale === "fr" ? "Accueil" : "Home"}</Link><Link href={base + "/search"}>{locale === "ar" ? "تسوق" : locale === "fr" ? "Boutique" : "Shop"}</Link>{categories.map(category => <Link key={category.key} href={base + "/category/" + category.key}>{category.name}</Link>)}<Link href={base + "/about"}>{locale === "ar" ? "عن مَتاع" : "About MATA3"}</Link><Link href={base + "/track"}>{copy.track}</Link></nav><div className="menu-selects">{marketControl}{languageControl}</div></aside></div>}
  </>;
}
