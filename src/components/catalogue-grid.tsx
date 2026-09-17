import Link from "next/link";
import type { Locale, Market, PublicProduct } from "@/lib/commerce";
import type { CatalogueCategory } from "@/lib/catalogue";
import { t } from "@/lib/i18n";
import { ProductCard } from "./product-card";
export function CatalogueGrid({ products, market, locale, categories, category, query, page, total }: {
  products: PublicProduct[]; market: Market; locale: Locale; categories: CatalogueCategory[]; category?: string; query?: string; page: number; total: number;
}) {
  const c = t(locale), base = "/"+market+"/"+locale;
  const pageSize = 24;
  const route = category ? base + "/category/" + category : base + "/search";
  const pageLink = (number: number) => route + "?" + new URLSearchParams({ ...(query ? { q: query } : {}), page: String(number) });
  return <div className="catalogue-layout"><aside className="filter-panel open"><div className="filter-title"><h2>{c.filters}</h2></div><div className="filter-options"><Link href={base + "/search"}>{c.all}</Link>{categories.map(cat => <Link key={cat.key} aria-current={cat.key === category ? "page" : undefined} href={base + "/category/" + cat.key}>{cat.name}</Link>)}</div></aside><div className="catalogue-results"><div className="result-toolbar"><span>{total} {c.products}</span></div>{products.length ? <div className="product-grid">{products.map(p => <ProductCard key={p.slug} product={p} market={market} locale={locale} />)}</div> : <div className="empty-state"><h2>{query ? c.searchEmpty : c.noProducts}</h2></div>}<nav aria-label="Catalogue pages">{page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}{page * pageSize < total && <Link href={pageLink(page + 1)}>Next →</Link>}</nav></div></div>;
}
