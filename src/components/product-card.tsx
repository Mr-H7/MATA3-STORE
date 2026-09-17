import Link from "next/link";
import type { Locale, Market, PublicProduct } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { categoryName, t } from "@/lib/i18n";

export function ProductCard({ product, market, locale }: { product: PublicProduct; market: Market; locale: Locale }) {
  return <article className="product-card"><Link className="product-art" href={`/${market}/${locale}/${product.kind === "bundle" ? "bundle" : "product"}/${product.slug}`}>{product.media.find(m => m.type === "IMAGE") ? <img src={product.media.find(m => m.type === "IMAGE")!.url} alt={product.media.find(m => m.type === "IMAGE")!.alt} /> : <span className="product-placeholder" aria-hidden>م</span>}</Link><div className="product-copy"><span className="overline">{product.categoryLabel ?? categoryName(product.category, locale)}</span><h3><Link href={`/${market}/${locale}/${product.kind === "bundle" ? "bundle" : "product"}/${product.slug}`}>{product.name}</Link></h3><div className="product-bottom"><strong>{formatMoney(product.price, locale)}</strong><Link href={`/${market}/${locale}/${product.kind === "bundle" ? "bundle" : "product"}/${product.slug}`}>{t(locale).product} ↗</Link></div></div></article>;
}
