import Link from "next/link";
import Image from "next/image";
import type { Locale, Market, PublicProduct } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { categoryName } from "@/lib/i18n";
import { productDisplayName, storefrontCopy } from "@/lib/storefront";
import { ProductImageFallback } from "./product-image-fallback";

export function ProductCard({ product, market, locale }: { product: PublicProduct; market: Market; locale: Locale }) {
  const image = product.media.find(media => media.type === "IMAGE");
  const name = productDisplayName(product, locale), copy = storefrontCopy(locale);
  const href = `/${market}/${locale}/${product.kind}/${product.slug}`;
  const available = product.variants.some(variant => variant.available);
  return <article className="product-card">
    <Link className="product-card-link" href={href}>
    <div className="product-art">
      {image ? <Image unoptimized width={600} height={600} sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" src={image.url} alt={image.alt || name} /> :
        <ProductImageFallback locale={locale}/>}
      <span className="product-photo-link" aria-hidden="true">↗</span>
    </div>
    <div className="product-copy">
      {product.category && <span className="overline">{product.categoryLabel ?? categoryName(product.category, locale)}</span>}
      <h3 dir="auto">{name}</h3>
      <strong className="product-price">{formatMoney(product.price, locale)}</strong>
      <p className={`product-eligibility${available ? " is-available" : ""}`}><span aria-hidden="true"/>{available ? copy.available : copy.unavailable}</p>
    </div>
    </Link>
  </article>;
}
