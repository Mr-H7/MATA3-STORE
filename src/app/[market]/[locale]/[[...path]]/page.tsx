import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isMarket, validContext, type Locale, type Market } from "@/lib/commerce";
import { getCataloguePage, getProductBySlug, getBundles, getBundleBySlug, getCategories, getMarketConfig, searchCatalogue, type SearchSort } from "@/lib/catalogue";
import { categoryName, marketName, t } from "@/lib/i18n";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { CatalogueGrid } from "@/components/catalogue-grid";
import { Purchase } from "@/components/purchase";
import { Cart } from "@/components/cart";
import { SearchBox } from "@/components/search-box";
import { GuestCheckout } from "@/components/guest-checkout";
import { GuestTracking, OrderConfirmation } from "@/components/guest-order-view";

type Params = Promise<{ market: string; locale: string; path?: string[] }>;
type Search = Promise<{ q?: string; page?: string; category?: string; color?: string; size?: string; minPrice?: string; maxPrice?: string; sort?: string; reference?: string; token?: string }>;
function priceFilter(value: string | undefined) {
  if (!value) return undefined;
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value)) return null;
  const [units, fraction = ""] = value.split(".");
  const minor = Number(units) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}
export default async function StorePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { market: m, locale: l, path = [] } = await params;
  if (!validContext(m, l) || !isMarket(m)) notFound();
  const market: Market = m, locale: Locale = l as Locale, base = `/${market}/${locale}`, c = t(locale);
  const [marketConfig, categories] = await Promise.all([getMarketConfig(market), getCategories(market)]);
  const queryParams = await searchParams;
  const requestedPage = Number(queryParams.page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const q = queryParams.q?.trim().slice(0, 100) || "";
  const sort: SearchSort = queryParams.sort === "price_asc" || queryParams.sort === "price_desc" ? queryParams.sort : "name_asc";
  const minPriceMinor = priceFilter(queryParams.minPrice), maxPriceMinor = priceFilter(queryParams.maxPrice);
  const filters = { q, category: queryParams.category?.slice(0, 100), color: queryParams.color?.slice(0, 100), size: queryParams.size?.slice(0, 100), minPriceMinor: minPriceMinor ?? undefined, maxPriceMinor: maxPriceMinor ?? undefined, sort };
  const invalidFilters = minPriceMinor === null || maxPriceMinor === null || (minPriceMinor !== undefined && maxPriceMinor !== undefined && minPriceMinor > maxPriceMinor);
  const section = path[0] || "home";
  const browseHref = categories[0] ? base + "/category/" + categories[0].key : base + "/search";
  let content: React.ReactNode;
  if (section === "home" && path.length === 0) {
    const [catalogue, bundles] = await Promise.all([getCataloguePage(market, { pageSize: 4 }), getBundles(market)]);
    const products = [...catalogue.items.slice(0, bundles.length ? 3 : 4), ...bundles.slice(0, 1)];
    content = <><section className="hero"><div className="hero-copy"><p className="eyebrow">MATA3 / مَتاع <span>01 — 05</span></p><h1>{c.homeTitle}</h1><p>{c.homeText}</p><Link className="button gold" href={browseHref}>{c.shop} <span>↗</span></Link></div><div className="hero-art" aria-hidden><div className="hero-ornament">م</div><span>THE MODERN<br />ARAB MERCHANT</span></div></section><section className="section"><div className="section-heading"><p className="eyebrow">01 / {c.departments}</p><h2>{c.browse}</h2></div><div className="category-grid">{categories.map((cat, i) => <Link key={cat.key} href={`${base}/category/${cat.key}`} className="category-tile"><span>0{i + 1}</span><strong>{cat.name}</strong><span>↗</span></Link>)}</div><div className="coming-tile">{locale === "ar" ? "العسل والمنتجات الطبيعية" : locale === "fr" ? "Miel et produits naturels" : "Honey & natural products"}<span>{c.coming}</span></div></section><section className="section products-section"><div className="section-heading"><p className="eyebrow">02 / {c.selection}</p><h2>{c.selection}</h2><Link href={browseHref}>{c.browse} ↗</Link></div>{products.length ? <div className="product-grid home-grid">{products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} market={market} locale={locale} />)}</div> : <div className="empty-state">{c.noProducts}</div>}</section></>;
  } else if (section === "category" && path.length === 2 && categories.some(cat => cat.key === path[1])) {
    const category = categories.find(cat => cat.key === path[1])!;
    const categoryFilters = { ...filters, category: category.key };
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...categoryFilters, page }); } catch { /* distinct request failure */ } }
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">{marketName(market, locale)} / {c.departments}</p><h1>{category.name}</h1></div>{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={categoryFilters} /> : <div className="empty-state">{invalidFilters ? "Invalid price range" : "Catalogue unavailable. Please try again."}</div>}</main>;
  } else if (section === "search" && path.length === 1) {
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...filters, page }); } catch { /* distinct request failure */ } }
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">MATA3 / {c.search}</p><h1>{c.results}</h1><SearchBox market={market} locale={locale} initialQuery={q} wide /></div>{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={filters} /> : <div className="empty-state">{invalidFilters ? "Invalid price range" : "Search unavailable. Please try again."}</div>}</main>;
  } else if ((section === "product" || section === "bundle") && path.length === 2) {
    const product = section === "bundle" ? await getBundleBySlug(market, path[1]) : await getProductBySlug(market, path[1]); if (!product) notFound();
    content = <main className="inner-page"><div className="breadcrumb"><Link href={base}>{c.departments}</Link> / {product.category ? <Link href={`${base}/category/${product.category}`}>{product.categoryLabel ?? categoryName(product.category, locale)}</Link> : null} / <span>{product.name}</span></div><div className="pdp-layout"><div className="pdp-media">{product.media.length ? product.media.map((media, i) => media.type === "VIDEO" ? <video key={i} src={media.url} controls preload="metadata" /> : <Image unoptimized key={i} width={900} height={900} src={media.url} alt={media.alt} loading={i ? "lazy" : "eager"} />) : <div className="pdp-placeholder" aria-label="Product media unavailable"><span>م</span><small>WEB PRODUCT MEDIA</small></div>}</div><Purchase product={product} market={market} locale={locale} /></div></main>;
  } else if (section === "cart" && path.length === 1) {
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">MATA3 / {c.cart}</p><h1>{c.cart}</h1></div><Cart key={market} market={market} locale={locale} /></main>;
  } else if (section === "checkout" && path.length === 1) {
    content = <GuestCheckout key={market} market={market} locale={locale} />;
  } else if (section === "confirmation" && path.length === 1) {
    content = <OrderConfirmation market={market} locale={locale} reference={queryParams.reference ?? ""} token={queryParams.token ?? ""} />;
  } else if (section === "track" && path.length === 1) {
    content = <GuestTracking market={market} locale={locale} />;
  } else if (section === "account" && path.length === 1) {
    content = <main className="narrow-page"><p className="eyebrow">MATA3 / {c.account}</p><h1>{c.account}</h1><div className="account-links"><span>{c.signIn}</span><span>{c.orders}</span><span>{c.profile}</span></div><p>{locale === "ar" ? "سيُتاح حساب العملاء عند ربط خدمة المصادقة المستقلة." : "Customer accounts will be available when the separate customer authentication service is connected."}</p></main>;
  } else notFound();
  return <div className="site-shell" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>{section === "checkout" || section === "confirmation" ? <header className="checkout-header"><Link className="brand" href={base}>مَتاع <strong>MATA3</strong></Link><Link href={base + "/cart"}>{c.cart}</Link></header> : <Header market={market} locale={locale} categories={categories} />}{content}<footer className="footer"><div><Link className="brand" href={base}>مَتاع <strong>MATA3</strong></Link><p>THE MODERN ARAB MERCHANT</p></div><nav><Link href={base}>{c.browse}</Link><Link href={`${base}/search`}>{c.search}</Link><Link href={`${base}/cart`}>{c.cart}</Link><Link href={`${base}/track`}>{c.track}</Link></nav><span>{marketName(market, locale)} · {marketConfig.currency}</span></footer></div>;
}
