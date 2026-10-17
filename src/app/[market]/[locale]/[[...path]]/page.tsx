import Link from "next/link";
import { StoreHome } from "@/components/store-home";
import { ProductGallery } from "@/components/product-gallery";
import { notFound } from "next/navigation";
import { isMarket, validContext, type Locale, type Market, type PublicProduct } from "@/lib/commerce";
import { getCataloguePage, getProductBySlug, getBundles, getBundleBySlug, getCategories, getMarketConfig, searchCatalogue, type SearchSort } from "@/lib/catalogue";
import { categoryName, marketName, t } from "@/lib/i18n";
import { productDisplayName, storefrontCopy } from "@/lib/storefront";
import { BrandLogo, Header } from "@/components/header";
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
  const market: Market = m, locale: Locale = l as Locale, base = "/" + market + "/" + locale, copy = t(locale);
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
  const browseHref = base + "/search";
  let content: React.ReactNode;

  if (section === "home" && path.length === 0) {
    const [catalogue, bundles] = await Promise.all([getCataloguePage(market, { pageSize: 24 }), getBundles(market)]);
    const products = [...catalogue.items, ...bundles];
    content = <StoreHome products={products} categories={categories} market={market} locale={locale} currency={marketConfig.currency}/>;
  } else if (section === "category" && path.length === 2 && categories.some(category => category.key === path[1])) {
    const category = categories.find(item => item.key === path[1])!;
    const categoryFilters = { ...filters, category: category.key };
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...categoryFilters, page }); } catch { /* distinct request failure */ } }
    content = <main id="main-content" className="inner-page"><div className="page-heading"><p className="eyebrow">{marketName(market, locale)} / {copy.departments}</p><h1>{category.name}</h1></div>{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={categoryFilters} categories={categories} /> : <div className="empty-state" role="status">{invalidFilters ? "Invalid price range" : "Catalogue unavailable. Please try again."}</div>}</main>;
  } else if (section === "search" && path.length === 1) {
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...filters, page }); } catch { /* distinct request failure */ } }
    content = <main id="main-content" className="inner-page"><div className="page-heading catalogue-heading"><div><p className="eyebrow">MATA3 / {q ? copy.search : copy.selection}</p><h1>{q ? copy.results : copy.shop}</h1><p className="market-caption">{storefrontCopy(locale).marketCatalogue} {marketName(market, locale)} <span aria-hidden="true">·</span> {marketConfig.currency}</p></div><SearchBox market={market} locale={locale} initialQuery={q} wide /></div><div id="categories">{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={filters} categories={categories} /> : <div className="empty-state" role="status">{invalidFilters ? "Invalid price range" : "Search unavailable. Please try again."}</div>}</div></main>;
  } else if ((section === "product" || section === "bundle") && path.length === 2) {
    const product = section === "bundle" ? await getBundleBySlug(market, path[1]) : await getProductBySlug(market, path[1]);
    if (!product) notFound();
    let related: PublicProduct[] = [];
    if (product.category) { try { related = (await getCataloguePage(market, { category: product.category, pageSize: 5 })).items.filter(item => item.slug !== product.slug).slice(0, 4); } catch { /* related catalogue unavailable */ } }
    content = <main id="main-content" className="inner-page"><nav className="breadcrumb" aria-label="Breadcrumb"><Link href={base}>{locale === "ar" ? "الرئيسية" : locale === "fr" ? "Accueil" : "Home"}</Link><span>/</span>{product.category && <><Link href={base + "/category/" + product.category}>{product.categoryLabel ?? categoryName(product.category, locale)}</Link><span>/</span></>}<span aria-current="page" dir="auto">{productDisplayName(product, locale)}</span></nav><div className="pdp-layout"><ProductGallery key={product.slug} media={product.media} name={productDisplayName(product, locale)} locale={locale}/><Purchase product={product} market={market} locale={locale} /></div>{related.length > 0 && <section className="related-products"><div className="section-heading"><div><p className="eyebrow">MATA3 / {copy.selection}</p><h2>{locale === "ar" ? "منتجات من القسم نفسه" : locale === "fr" ? "Dans la même catégorie" : "More in this category"}</h2></div><Link href={base + "/category/" + product.category}>{copy.departments} ↗</Link></div><div className="product-grid">{related.map(item => <ProductCard key={item.slug} product={item} market={market} locale={locale} />)}</div></section>}</main>;
  } else if (section === "cart" && path.length === 1) {
    content = <main id="main-content" className="inner-page"><div className="page-heading"><p className="eyebrow">MATA3 / {copy.cart}</p><h1>{copy.cart}</h1></div><Cart key={market} market={market} locale={locale} /></main>;
  } else if (section === "checkout" && path.length === 1) {
    content = <GuestCheckout key={market} market={market} locale={locale} />;
  } else if (section === "confirmation" && path.length === 1) {
    content = <OrderConfirmation market={market} locale={locale} reference={queryParams.reference ?? ""} token={queryParams.token ?? ""} />;
  } else if (section === "track" && path.length === 1) {
    content = <GuestTracking market={market} locale={locale} />;
  } else if (section === "about" && path.length === 1) {
    content = <main id="main-content" className="narrow-page"><p className="eyebrow">MATA3 / مَتاع</p><h1>{locale === "ar" ? "عن مَتاع" : locale === "fr" ? "À propos de MATA3" : "About MATA3"}</h1><p>{locale === "ar" ? "مَتاع متجر متعدد الأقسام يقدم منتجات منشورة لكل سوق بأسعارها المحلية." : locale === "fr" ? "MATA3 est une boutique multiclassement. Le catalogue et les prix sont propres à chaque marché." : "MATA3 is a multi-category store. Catalogue and prices are specific to each market."}</p><Link className="button gold" href={browseHref}>{copy.shop} ↗</Link></main>;
  } else notFound();

  return <div className="site-shell round02" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}><a className="skip-link" href="#main-content">{locale === "ar" ? "انتقل إلى المحتوى" : locale === "fr" ? "Aller au contenu" : "Skip to content"}</a>{section === "checkout" || section === "confirmation" ? <header className="checkout-header"><Link className="brand" href={base}><BrandLogo/></Link><Link href={base + "/cart"}>{copy.cart}</Link></header> : <Header market={market} locale={locale} categories={categories} />}{content}<footer className="footer"><div><Link className="brand" href={base}><BrandLogo/></Link><p>THE MODERN ARAB MERCHANT</p></div><nav aria-label={locale === "ar" ? "روابط الموقع" : "Footer navigation"}><Link href={base}>{locale === "ar" ? "الرئيسية" : locale === "fr" ? "Accueil" : "Home"}</Link><Link href={browseHref}>{copy.shop}</Link>{categories.length > 0 && <Link href={base + "/search#categories"}>{copy.departments}</Link>}<Link href={base + "/about"}>{locale === "ar" ? "عن مَتاع" : locale === "fr" ? "À propos" : "About MATA3"}</Link><Link href={base + "/track"}>{copy.track}</Link></nav><div className="footer-market">{marketName(market, locale)} · {marketConfig.currency}<small>© {new Date().getUTCFullYear()} MATA3</small></div></footer></div>;
}
