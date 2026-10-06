import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isMarket, validContext, type Locale, type Market, type PublicProduct } from "@/lib/commerce";
import { getCataloguePage, getProductBySlug, getBundles, getBundleBySlug, getCategories, getMarketConfig, searchCatalogue, type SearchSort } from "@/lib/catalogue";
import { categoryName, marketName, t } from "@/lib/i18n";
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
function MediaStage({ product, label }: { product: PublicProduct; label: string }) {
  const media = product.media.find(item => item.type === "IMAGE");
  return <div className="feature-media">{media ? <Image unoptimized src={media.url} alt={media.alt || product.name} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" /> : <span className="product-placeholder" role="img" aria-label={label}>م</span>}</div>;
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
    const products = [...catalogue.items.slice(0, 8), ...bundles.slice(0, 2)];
    const featured = products[0];
    content = <main>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">THE MODERN ARAB MERCHANT <span aria-hidden="true">◆</span> التاجر العربي المعاصر</p><h1>{copy.homeTitle}</h1><p>{copy.homeText}</p><div className="hero-actions"><Link className="button gold" href={browseHref}>{copy.shop} <span aria-hidden="true">↗</span></Link>{categories.length > 0 && <Link className="button outline" href="#categories">{copy.departments}</Link>}</div></div>
        <div className="hero-stage">{featured ? <Link href={base + "/" + featured.kind + "/" + featured.slug} aria-label={featured.name}><MediaStage product={featured} label={featured.name}/><span className="hero-product-caption"><span>{featured.name}</span><span>{featured.price.currency}</span></span></Link> : <div className="hero-mark" aria-hidden="true">م</div>}</div>
      </section>
      {categories.length > 0 && <section id="categories" className="section category-section"><div className="section-heading"><div><p className="eyebrow">01 / {copy.departments}</p><h2>{copy.browse}</h2></div><p>{locale === "ar" ? "تصفح المنتجات حسب القسم." : locale === "fr" ? "Parcourir les produits par catégorie." : "Explore products by category."}</p></div><div className="category-grid">{categories.map((category, index) => { const product = products.find(item => item.category === category.key && item.media.some(media => media.type === "IMAGE")); const image = product?.media.find(media => media.type === "IMAGE"); return <Link key={category.key} href={base + "/category/" + category.key} className="category-tile">{image ? <Image unoptimized src={image.url} alt="" width={800} height={600} sizes="(max-width: 760px) 100vw, 45vw" /> : <span className="category-mark" aria-hidden="true">م</span>}<span className="category-shade"/><span className="category-meta">0{index + 1} / {copy.departments}</span><strong>{category.name}</strong><span className="category-arrow" aria-hidden="true">↗</span></Link>; })}</div></section>}
      <section className="section products-section"><div className="section-heading"><div><p className="eyebrow">02 / {copy.selection}</p><h2>{copy.selection}</h2></div><Link href={browseHref}>{copy.shop} ↗</Link></div>{products.length ? <div className="product-grid home-grid">{products.slice(0, 8).map(product => <ProductCard key={product.kind + product.slug} product={product} market={market} locale={locale} />)}</div> : <div className="empty-state">{copy.noProducts}</div>}</section>
      <section className="brand-band"><p className="eyebrow">مَتاع / MATA3</p><h2>{locale === "ar" ? "تسوق بوضوح." : locale === "fr" ? "Choisir en toute simplicité." : "Choose with clarity."}</h2><Link className="button gold" href={browseHref}>{copy.shop} ↗</Link></section>
    </main>;
  } else if (section === "category" && path.length === 2 && categories.some(category => category.key === path[1])) {
    const category = categories.find(item => item.key === path[1])!;
    const categoryFilters = { ...filters, category: category.key };
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...categoryFilters, page }); } catch { /* distinct request failure */ } }
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">{marketName(market, locale)} / {copy.departments}</p><h1>{category.name}</h1></div>{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={categoryFilters} /> : <div className="empty-state" role="status">{invalidFilters ? "Invalid price range" : "Catalogue unavailable. Please try again."}</div>}</main>;
  } else if (section === "search" && path.length === 1) {
    let result: Awaited<ReturnType<typeof searchCatalogue>> | null = null;
    if (!invalidFilters) { try { result = await searchCatalogue(market, { ...filters, page }); } catch { /* distinct request failure */ } }
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">MATA3 / {copy.search}</p><h1>{q ? copy.results : copy.shop}</h1><SearchBox market={market} locale={locale} initialQuery={q} wide /></div><div id="categories">{result ? <CatalogueGrid result={result} market={market} locale={locale} filters={filters} /> : <div className="empty-state" role="status">{invalidFilters ? "Invalid price range" : "Search unavailable. Please try again."}</div>}</div></main>;
  } else if ((section === "product" || section === "bundle") && path.length === 2) {
    const product = section === "bundle" ? await getBundleBySlug(market, path[1]) : await getProductBySlug(market, path[1]);
    if (!product) notFound();
    let related: PublicProduct[] = [];
    if (product.category) { try { related = (await getCataloguePage(market, { category: product.category, pageSize: 5 })).items.filter(item => item.slug !== product.slug).slice(0, 4); } catch { /* related catalogue unavailable */ } }
    content = <main className="inner-page"><nav className="breadcrumb" aria-label="Breadcrumb"><Link href={base}>{locale === "ar" ? "الرئيسية" : "Home"}</Link><span>/</span>{product.category && <><Link href={base + "/category/" + product.category}>{product.categoryLabel ?? categoryName(product.category, locale)}</Link><span>/</span></>}<span aria-current="page">{product.name}</span></nav><div className="pdp-layout"><div className="pdp-media">{product.media.length ? product.media.map((media, index) => media.type === "VIDEO" ? <video key={index} src={media.url} controls preload="metadata" /> : <Image unoptimized key={index} width={900} height={900} sizes="(max-width: 760px) 100vw, 58vw" src={media.url} alt={media.alt || product.name} loading={index ? "lazy" : "eager"} />) : <div className="pdp-placeholder" role="img" aria-label="Product media unavailable"><span>م</span></div>}</div><Purchase product={product} market={market} locale={locale} /></div>{related.length > 0 && <section className="related-products"><div className="section-heading"><div><p className="eyebrow">MATA3 / {copy.selection}</p><h2>{locale === "ar" ? "منتجات من القسم نفسه" : locale === "fr" ? "Dans la même catégorie" : "More in this category"}</h2></div><Link href={base + "/category/" + product.category}>{copy.departments} ↗</Link></div><div className="product-grid">{related.map(item => <ProductCard key={item.slug} product={item} market={market} locale={locale} />)}</div></section>}</main>;
  } else if (section === "cart" && path.length === 1) {
    content = <main className="inner-page"><div className="page-heading"><p className="eyebrow">MATA3 / {copy.cart}</p><h1>{copy.cart}</h1></div><Cart key={market} market={market} locale={locale} /></main>;
  } else if (section === "checkout" && path.length === 1) {
    content = <GuestCheckout key={market} market={market} locale={locale} />;
  } else if (section === "confirmation" && path.length === 1) {
    content = <OrderConfirmation market={market} locale={locale} reference={queryParams.reference ?? ""} token={queryParams.token ?? ""} />;
  } else if (section === "track" && path.length === 1) {
    content = <GuestTracking market={market} locale={locale} />;
  } else if (section === "about" && path.length === 1) {
    content = <main className="narrow-page"><p className="eyebrow">MATA3 / مَتاع</p><h1>{locale === "ar" ? "عن مَتاع" : locale === "fr" ? "À propos de MATA3" : "About MATA3"}</h1><p>{locale === "ar" ? "مَتاع متجر متعدد الأقسام يقدم منتجات منشورة لكل سوق بأسعارها المحلية." : locale === "fr" ? "MATA3 est une boutique multiclassement. Le catalogue et les prix sont propres à chaque marché." : "MATA3 is a multi-category store. Catalogue and prices are specific to each market."}</p><Link className="button gold" href={browseHref}>{copy.shop} ↗</Link></main>;
  } else notFound();

  return <div className="site-shell" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>{section === "checkout" || section === "confirmation" ? <header className="checkout-header"><Link className="brand" href={base}><BrandLogo/></Link><Link href={base + "/cart"}>{copy.cart}</Link></header> : <Header market={market} locale={locale} categories={categories} />}{content}<footer className="footer"><div><Link className="brand" href={base}><BrandLogo/></Link><p>THE MODERN ARAB MERCHANT</p></div><nav aria-label={locale === "ar" ? "روابط الموقع" : "Footer navigation"}><Link href={base}>{locale === "ar" ? "الرئيسية" : "Home"}</Link><Link href={browseHref}>{copy.shop}</Link><Link href={base + "/search#categories"}>{copy.departments}</Link><Link href={base + "/about"}>{locale === "ar" ? "عن مَتاع" : "About MATA3"}</Link><Link href={base + "/track"}>{copy.track}</Link></nav><div className="footer-market">{marketName(market, locale)} · {marketConfig.currency}<small>© {new Date().getUTCFullYear()} MATA3</small></div></footer></div>;
}
