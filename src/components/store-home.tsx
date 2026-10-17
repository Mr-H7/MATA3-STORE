import Image from "next/image";
import Link from "next/link";
import { formatMoney, type Locale, type Market, type PublicProduct } from "@/lib/commerce";
import type { CatalogueCategory } from "@/lib/catalogue";
import { marketName, t } from "@/lib/i18n";
import { productDisplayName } from "@/lib/storefront";
import { ProductCard } from "./product-card";

export function StoreHome({ products, categories, market, locale, currency }: { products: PublicProduct[]; categories: CatalogueCategory[]; market: Market; locale: Locale; currency: string }) {
  const copy = t(locale), base = `/${market}/${locale}`;
  const photographed = products.filter(product => product.media.some(item => item.type === "IMAGE"));
  const featured = photographed[0];
  const cover = featured?.media.find(item => item.type === "IMAGE");
  const companion = photographed[1];
  const companionImage = companion?.media.find(item => item.type === "IMAGE");
  const shop = locale === "ar" ? "تسوق المنتجات" : locale === "fr" ? "Voir les produits" : "Shop products";
  const selected = locale === "ar" ? "اكتشف مَتاع" : locale === "fr" ? "Découvrir MATA3" : "Discover MATA3";
  return <main id="main-content" className="commerce-home">
    <section className={`merchant-hero${featured ? "" : " merchant-hero-empty"}`}>
      <div className="merchant-hero-copy">
        <p className="merchant-hero-position">{locale === "ar" ? "التاجر العربي المعاصر" : "The modern Arab merchant"}</p>
        <h1>{copy.homeTitle}</h1>
        <p className="merchant-hero-description">{copy.homeText}</p>
        <div className="merchant-hero-action"><Link className="button gold" href={base + "/search"}>{shop}<span aria-hidden="true">↗</span></Link><p>{marketName(market, locale)} <span aria-hidden="true">/</span> {currency}</p></div>
      </div>
      {featured && cover ? <Link className="merchant-hero-photograph" href={`${base}/${featured.kind}/${featured.slug}`}>
        <div className="merchant-hero-image"><Image unoptimized priority src={cover.url} alt={cover.alt || productDisplayName(featured, locale)} width={1000} height={1200} sizes="(max-width:760px) 100vw, 48vw"/></div>
        <div className="merchant-photo-caption"><span dir="auto">{productDisplayName(featured, locale)}</span><strong>{formatMoney(featured.price, locale)}</strong><span aria-hidden="true">↗</span></div>
      </Link> : <div className="editorial-empty"><p>{copy.noProducts}</p></div>}
      {companion && companionImage && <Link className="merchant-hero-study" href={`${base}/${companion.kind}/${companion.slug}`}>
        <Image unoptimized src={companionImage.url} alt={companionImage.alt || productDisplayName(companion, locale)} width={640} height={300} sizes="(max-width:760px) 40vw, 32vw"/>
        <div className="merchant-photo-caption"><span dir="auto">{productDisplayName(companion, locale)}</span><strong>{formatMoney(companion.price, locale)}</strong></div>
      </Link>}
    </section>
    {categories.length > 0 && <section className="discovery-section" id="categories"><div className="editorial-heading"><h2>{copy.browse}</h2><Link href={base + "/search"}>{shop} <span aria-hidden="true">↗</span></Link></div><div className="discovery-grid">{categories.map(category => { const image = photographed.find(product => product.category === category.key)?.media.find(item => item.type === "IMAGE"); return <Link className="discovery-card" href={base + "/category/" + category.key} key={category.key}><div className="discovery-title"><h3>{category.name}</h3><span aria-hidden="true">↗</span></div>{image && <Image unoptimized src={image.url} alt="" width={600} height={450} sizes="(max-width:760px) 50vw, 33vw"/>}</Link>; })}</div></section>}
    <section className="editorial-products"><div className="editorial-heading"><div><p className="merchant-position">{selected}</p><h2>{copy.selection}</h2></div><Link href={base + "/search"}>{shop} <span aria-hidden="true">↗</span></Link></div>{products.length ? <div className="product-grid home-grid">{(photographed.length ? photographed : products).slice(0, 8).map(product => <ProductCard key={product.kind + product.slug} product={product} market={market} locale={locale}/>)}</div> : <p className="empty-state">{copy.noProducts}</p>}<div className="editorial-more"><Link className="button outline" href={base + "/search"}>{shop} <span aria-hidden="true">↗</span></Link></div></section>
  </main>;
}
