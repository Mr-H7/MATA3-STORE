"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { categories, type CategoryId, type Locale, type Market, type PublicProduct } from "@/lib/commerce";
import { categoryName, t } from "@/lib/i18n";
import { ProductCard } from "./product-card";

export function CatalogueGrid({ products, market, locale, category, query }: { products: PublicProduct[]; market: Market; locale: Locale; category?: CategoryId; query?: string }) {
  const c = t(locale), [sort, setSort] = useState("name"), [filter, setFilter] = useState<CategoryId | "all">(category || "all"), [open, setOpen] = useState(false);
  const shown = useMemo(() => products.filter(p => (filter === "all" || p.category === filter) && (!query || p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))).sort((a, b) => sort === "low" ? a.price.amountMinor - b.price.amountMinor : sort === "high" ? b.price.amountMinor - a.price.amountMinor : a.name.localeCompare(b.name)), [products, filter, query, sort]);
  return <div className="catalogue-layout"><aside className={`filter-panel ${open ? "open" : ""}`}><div className="filter-title"><h2>{c.filters}</h2><button onClick={() => { setFilter("all"); setOpen(false); }}>{c.clear}</button></div><div className="filter-options"><button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{c.all}</button>{categories.map(cat => <button key={cat} aria-pressed={filter === cat} onClick={() => setFilter(cat)}>{categoryName(cat, locale)}</button>)}</div><button className="button gold mobile-only" onClick={() => setOpen(false)}>{c.choose}</button></aside><div className="catalogue-results"><div className="result-toolbar"><span>{shown.length} {c.products}</span><button className="mobile-only" onClick={() => setOpen(true)}>{c.filters} ☷</button><label><span className="sr-only">Sort</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="name">{c.newest}</option><option value="low">{c.priceLow}</option><option value="high">{c.priceHigh}</option></select></label></div>{shown.length ? <div className="product-grid">{shown.map(p => <ProductCard key={p.id} product={p} market={market} locale={locale} />)}</div> : <div className="empty-state"><h2>{query ? c.searchEmpty : c.noProducts}</h2>{query && <><p><bdi>{query}</bdi></p><Link href={`/${market}/${locale}/search`}>{c.clear}</Link></>}</div>}</div></div>;
}
