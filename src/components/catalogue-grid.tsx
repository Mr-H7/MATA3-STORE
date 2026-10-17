"use client";
import Link from "next/link";
import { useState } from "react";
import type { Locale, Market } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import type { CatalogueCategory, SearchFilters, SearchResult, SearchSort } from "@/lib/catalogue";
import { t } from "@/lib/i18n";
import { storefrontCopy } from "@/lib/storefront";
import { ProductCard } from "./product-card";
import { StoreDialog } from "./store-dialog";

type Filters = SearchFilters & { q?: string; sort: SearchSort };
function major(minor: number | undefined) { return minor === undefined ? "" : (minor / 100).toFixed(2); }

export function CatalogueGrid({ result, market, locale, filters, categories = [] }: { result: SearchResult; market: Market; locale: Locale; filters: Filters; categories?: CatalogueCategory[] }) {
  const copy = t(locale), ui = storefrontCopy(locale), base = "/" + market + "/" + locale;
  const [open, setOpen] = useState(false);
  const filterHref = (changes: Partial<Filters>, page = 1) => {
    const values = { ...filters, ...changes };
    const params = new URLSearchParams({ sort: values.sort });
    if (page > 1) params.set("page", String(page));
    for (const key of ["q", "category", "color", "size"] as const) if (values[key]) params.set(key, values[key]!);
    if (values.minPriceMinor !== undefined) params.set("minPrice", major(values.minPriceMinor));
    if (values.maxPriceMinor !== undefined) params.set("maxPrice", major(values.maxPriceMinor));
    return base + "/search?" + params;
  };
  const categoryOptions = categories.length ? categories : result.facets.categories;
  const sortLabel: Record<SearchSort, string> = { name_asc: locale === "ar" ? "الاسم" : locale === "fr" ? "Nom (A–Z)" : "Name (A–Z)", price_asc: copy.priceLow, price_desc: copy.priceHigh };
  const chips = [
    ...(filters.category ? [{ label: categoryOptions.find(item => item.key === filters.category)?.name ?? filters.category, change: { category: undefined } }] : []),
    ...(filters.color ? [{ label: ui.color + ": " + filters.color, change: { color: undefined } }] : []),
    ...(filters.size ? [{ label: ui.size + ": " + filters.size, change: { size: undefined } }] : []),
    ...(filters.minPriceMinor !== undefined ? [{ label: ui.minimum + ": " + formatMoney({ amountMinor: filters.minPriceMinor, currency: market === "eg" ? "EGP" : "MAD" }, locale), change: { minPriceMinor: undefined } }] : []),
    ...(filters.maxPriceMinor !== undefined ? [{ label: ui.maximum + ": " + formatMoney({ amountMinor: filters.maxPriceMinor, currency: market === "eg" ? "EGP" : "MAD" }, locale), change: { maxPriceMinor: undefined } }] : []),
  ];
  const clearHref = base + "/search" + (filters.q ? "?q=" + encodeURIComponent(filters.q) : "");
  const hasFacets = categoryOptions.length > 0 || result.facets.colors.length > 0 || result.facets.sizes.length > 0 || !!result.facets.price || chips.length > 0;
  return <div className="catalogue-layout">
    {categoryOptions.length > 0 && <nav className="catalogue-category-nav" aria-label={copy.departments}>
      <Link href={filterHref({ category: undefined })} aria-current={!filters.category ? "page" : undefined}>{ui.allProducts}</Link>
      {categoryOptions.map(item => <Link key={item.key} href={filterHref({ category: item.key })} aria-current={filters.category === item.key ? "page" : undefined}>{item.name}</Link>)}
    </nav>}
    <div className="catalogue-controls">
      <p className="catalogue-count"><strong>{result.total}</strong> {copy.products}</p>
      <div className="catalogue-tools">
        {hasFacets && <button className="filter-toggle" type="button" aria-expanded={open} onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--background)"/><circle cx="15" cy="17" r="2" fill="var(--background)"/></svg>
          {copy.filters}{chips.length > 0 && <span className="filter-count">{chips.length}</span>}
        </button>}
        <form action={base + "/search"} method="get" className="sort-form">
          {filters.q && <input type="hidden" name="q" value={filters.q}/>}
          {filters.category && <input type="hidden" name="category" value={filters.category}/>}
          {filters.color && <input type="hidden" name="color" value={filters.color}/>}
          {filters.size && <input type="hidden" name="size" value={filters.size}/>}
          {filters.minPriceMinor !== undefined && <input type="hidden" name="minPrice" value={major(filters.minPriceMinor)}/>}
          {filters.maxPriceMinor !== undefined && <input type="hidden" name="maxPrice" value={major(filters.maxPriceMinor)}/>}
          <label><span className="sr-only">{ui.sort}</span><select name="sort" aria-label={ui.sort} defaultValue={result.sort} onChange={event => event.currentTarget.form?.requestSubmit()}>
            {result.supportedSorts.map(mode => <option key={mode} value={mode}>{sortLabel[mode]}</option>)}
          </select></label>
          <noscript><button type="submit">{ui.apply}</button></noscript>
        </form>
      </div>
    </div>
    {chips.length > 0 && <div className="active-filters" aria-label={copy.filters}>{chips.map(chip => <Link key={chip.label} href={filterHref(chip.change)} aria-label={copy.remove + ": " + chip.label}>{chip.label}<span aria-hidden="true">×</span></Link>)}<Link className="clear-filters" href={clearHref}>{ui.clear}</Link></div>}
    <div className="catalogue-results">
      {result.items.length ? <div className="product-grid">{result.items.map(item => <ProductCard key={item.kind + item.slug} product={item} market={market} locale={locale} />)}</div> : <div className="empty-state"><h2>{!filters.q && !chips.length && result.page === 1 ? copy.noProducts : copy.searchEmpty}</h2>{(filters.q || chips.length > 0 || result.page > 1) && <><p>{locale === "ar" ? "جرب بحثًا آخر أو تصفح المنتجات." : locale === "fr" ? "Essayez une autre recherche ou parcourez le catalogue." : "Try a different search or explore the catalogue."}</p><Link className="button outline" href={base + "/search"}>{ui.allProducts}</Link></>}</div>}
      {(result.total > result.pageSize || result.page > 1) && <nav className="catalogue-pagination" aria-label={locale === "ar" ? "صفحات المنتجات" : locale === "fr" ? "Pages du catalogue" : "Catalogue pages"}>
        {result.page > 1 ? <Link href={filterHref({}, result.page - 1)}><span aria-hidden="true">←</span>{locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}</Link> : <span/>}
        <span>{ui.page} {result.page}{result.page <= Math.ceil(result.total / result.pageSize) && <> / {Math.ceil(result.total / result.pageSize)}</>}</span>
        {result.page * result.pageSize < result.total ? <Link href={filterHref({}, result.page + 1)}>{locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}<span aria-hidden="true">→</span></Link> : <span/>}
      </nav>}
    </div>
    {open && <StoreDialog label={copy.filters} className="filter-dialog" onClose={() => setOpen(false)}>
      <div className="dialog-heading"><div><p className="eyebrow">MATA3</p><h2>{copy.filters}</h2></div><button type="button" className="dialog-close" aria-label={ui.close + " · " + copy.filters} onClick={() => setOpen(false)}>×</button></div>
      <form action={base + "/search"} method="get" className="facet-form">
        {filters.q && <input type="hidden" name="q" value={filters.q}/>}
        <input type="hidden" name="sort" value={result.sort}/>
        {categoryOptions.length ? <label>{copy.departments}<select name="category" defaultValue={filters.category ?? ""}><option value="">{copy.all}</option>{categoryOptions.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label> : filters.category && <input type="hidden" name="category" value={filters.category}/>}
        {(result.facets.colors.length > 0 || filters.color) && <label>{ui.color}<select name="color" defaultValue={filters.color ?? ""}><option value="">{copy.all}</option>{filters.color && !result.facets.colors.some(item => item.value === filters.color) && <option value={filters.color}>{filters.color}</option>}{result.facets.colors.map(item => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}</select></label>}
        {(result.facets.sizes.length > 0 || filters.size) && <label>{ui.size}<select name="size" defaultValue={filters.size ?? ""}><option value="">{copy.all}</option>{filters.size && !result.facets.sizes.some(item => item.value === filters.size) && <option value={filters.size}>{filters.size}</option>}{result.facets.sizes.map(item => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}</select></label>}
        {(result.facets.price || filters.minPriceMinor !== undefined || filters.maxPriceMinor !== undefined) && <fieldset><legend>{ui.price}</legend>{result.facets.price && <p>{formatMoney({ amountMinor: result.facets.price.minAmountMinor, currency: result.facets.price.currency }, locale)} – {formatMoney({ amountMinor: result.facets.price.maxAmountMinor, currency: result.facets.price.currency }, locale)}</p>}<div className="price-fields"><label>{ui.minimum}<input name="minPrice" type="number" min="0" step="0.01" defaultValue={major(filters.minPriceMinor)}/></label><label>{ui.maximum}<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={major(filters.maxPriceMinor)}/></label></div></fieldset>}
        <div className="filter-actions"><button className="button gold" type="submit">{ui.apply}</button><Link className="text-button" href={clearHref} onClick={() => setOpen(false)}>{ui.clear}</Link></div>
      </form>
    </StoreDialog>}
  </div>;
}
