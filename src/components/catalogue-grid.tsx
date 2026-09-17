"use client";
import Link from "next/link";
import { useState } from "react";
import type { Locale, Market } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import type { SearchFilters, SearchResult, SearchSort } from "@/lib/catalogue";
import { t } from "@/lib/i18n";
import { ProductCard } from "./product-card";
type Filters = SearchFilters & { q?: string; sort: SearchSort };
function major(minor: number | undefined) { return minor === undefined ? "" : (minor / 100).toFixed(2); }
export function CatalogueGrid({ result, market, locale, filters }: { result: SearchResult; market: Market; locale: Locale; filters: Filters }) {
  const copy = t(locale), base = "/" + market + "/" + locale, [open, setOpen] = useState(false);
  const pageParams = (page: number) => {
    const params = new URLSearchParams({ page: String(page), sort: filters.sort });
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.color) params.set("color", filters.color);
    if (filters.size) params.set("size", filters.size);
    if (filters.minPriceMinor !== undefined) params.set("minPrice", major(filters.minPriceMinor));
    if (filters.maxPriceMinor !== undefined) params.set("maxPrice", major(filters.maxPriceMinor));
    return base + "/search?" + params;
  };
  const sortLabel: Record<SearchSort, string> = { name_asc: locale === "ar" ? "الاسم" : locale === "fr" ? "Nom (A–Z)" : "Name (A–Z)", price_asc: copy.priceLow, price_desc: copy.priceHigh };
  return <div className="catalogue-layout">
    <aside className={"filter-panel" + (open ? " open" : "")}>
      <div className="filter-title"><h2>{copy.filters}</h2><button type="button" className="mobile-only" onClick={() => setOpen(false)} aria-label="Close filters">×</button></div>
      <form action={base + "/search"} method="get" className="facet-form">
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {result.facets.categories.length > 0 && <label>{copy.departments}<select name="category" defaultValue={filters.category ?? ""}><option value="">{copy.all}</option>{result.facets.categories.map(item => <option key={item.key} value={item.key}>{item.name} ({item.count})</option>)}</select></label>}
        {result.facets.colors.length > 0 && <label>{locale === "ar" ? "اللون" : locale === "fr" ? "Couleur" : "Color"}<select name="color" defaultValue={filters.color ?? ""}><option value="">{copy.all}</option>{result.facets.colors.map(item => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}</select></label>}
        {result.facets.sizes.length > 0 && <label>{locale === "ar" ? "المقاس" : locale === "fr" ? "Taille" : "Size"}<select name="size" defaultValue={filters.size ?? ""}><option value="">{copy.all}</option>{result.facets.sizes.map(item => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}</select></label>}
        {result.facets.price && <fieldset><legend>{locale === "ar" ? "السعر" : locale === "fr" ? "Prix" : "Price"}</legend><p>{formatMoney({ amountMinor: result.facets.price.minAmountMinor, currency: result.facets.price.currency }, locale)} – {formatMoney({ amountMinor: result.facets.price.maxAmountMinor, currency: result.facets.price.currency }, locale)}</p><div className="price-fields"><label>{locale === "ar" ? "من" : locale === "fr" ? "Min" : "Min"}<input name="minPrice" type="number" min="0" step="0.01" defaultValue={major(filters.minPriceMinor)} /></label><label>{locale === "ar" ? "إلى" : locale === "fr" ? "Max" : "Max"}<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={major(filters.maxPriceMinor)} /></label></div></fieldset>}
        <label>{locale === "ar" ? "الترتيب" : locale === "fr" ? "Tri" : "Sort"}<select name="sort" defaultValue={result.sort}>{result.supportedSorts.map(mode => <option key={mode} value={mode}>{sortLabel[mode]}</option>)}</select></label>
        <button className="button gold" type="submit">{locale === "ar" ? "تطبيق" : locale === "fr" ? "Appliquer" : "Apply filters"}</button>
        <Link className="text-button" href={base + "/search" + (filters.q ? "?q=" + encodeURIComponent(filters.q) : "")}>{copy.clear}</Link>
      </form>
    </aside>
    <div className="catalogue-results"><div className="result-toolbar"><span>{result.total} {copy.products}</span><button className="mobile-only" type="button" onClick={() => setOpen(true)}>{copy.filters} ☷</button></div>
      {result.items.length ? <div className="product-grid">{result.items.map(item => <ProductCard key={item.kind + item.slug} product={item} market={market} locale={locale} />)}</div> : <div className="empty-state"><h2>{copy.searchEmpty}</h2></div>}
      <nav aria-label="Catalogue pages">{result.page > 1 && <Link href={pageParams(result.page - 1)}>← {locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}</Link>}{result.page * result.pageSize < result.total && <Link href={pageParams(result.page + 1)}>{locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"} →</Link>}</nav>
    </div>
  </div>;
}
