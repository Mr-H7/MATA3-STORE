"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale, Market } from "@/lib/commerce";
import { t } from "@/lib/i18n";
type Suggestions = { products: { slug: string; name: string }[]; categories: { key: string; name: string }[] };
export function SearchBox({ market, locale, initialQuery = "", wide = false }: { market: Market; locale: Locale; initialQuery?: string; wide?: boolean }) {
  const [query, setQuery] = useState(initialQuery), [suggestions, setSuggestions] = useState<Suggestions | null>(null), [focused, setFocused] = useState(false), [failed, setFailed] = useState(false);
  const base = "/" + market + "/" + locale, copy = t(locale);
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length > 100) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/search/suggestions?" + new URLSearchParams({ market, q }), { signal: controller.signal })
        .then(async response => { if (!response.ok) throw new Error("Suggestions unavailable"); return response.json() as Promise<Suggestions>; })
        .then(value => { if (!controller.signal.aborted) { setSuggestions(value); setFailed(false); } })
        .catch(() => { if (!controller.signal.aborted) { setSuggestions(null); setFailed(true); } });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [market, query]);
  const visible = focused && query.trim().length > 0 && query.length <= 100;
  return <div className={"search-box" + (wide ? " search-box-wide" : "")} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <form className={wide ? "wide-search" : "header-search"} action={base + "/search"}>
      <input name="q" type="search" value={query} onChange={event => { setQuery(event.target.value); setSuggestions(null); setFailed(false); }} maxLength={100} placeholder={copy.search} aria-label={copy.search} autoComplete="off" />
      <button aria-label={copy.search}>{wide ? copy.search + " ↗" : "⌕"}</button>
    </form>
    {visible && <div className="search-suggestions" aria-live="polite">
      {suggestions?.products.length ? <><p>{copy.products}</p><ul>{suggestions.products.map(item => <li key={item.slug}><Link href={base + "/product/" + item.slug} onClick={() => setFocused(false)}>{item.name}</Link></li>)}</ul></> : null}
      {suggestions?.categories.length ? <><p>{copy.departments}</p><ul>{suggestions.categories.map(item => <li key={item.key}><Link href={base + "/category/" + item.key} onClick={() => setFocused(false)}>{item.name}</Link></li>)}</ul></> : null}
      {failed && <p>{locale === "ar" ? "الاقتراحات غير متاحة" : locale === "fr" ? "Suggestions indisponibles" : "Suggestions unavailable"}</p>}
    </div>}
  </div>;
}
