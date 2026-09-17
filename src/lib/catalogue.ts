import "server-only";
import { fixtureCatalogue } from "./fixtures";
import type { Market, Money, PublicProduct, PublicVariant, PublicMedia } from "./commerce";

export type CatalogueCategory = { key: string; name: string; department: string };
export type CataloguePage = { items: PublicProduct[]; page: number; pageSize: number; total: number };
type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
const string = (value: unknown, max = 300) => typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
const apiMarket = (market: Market) => market === "eg" ? "EGYPT" : "MOROCCO";
const expectedCurrency = (market: Market) => market === "eg" ? "EGP" : "MAD";
function money(value: unknown, market: Market): Money | null {
  const row = object(value);
  return row && Number.isSafeInteger(row.amountMinor) && (row.amountMinor as number) >= 0 && row.currency === expectedCurrency(market) ? { amountMinor: row.amountMinor as number, currency: expectedCurrency(market) } : null;
}
function absoluteMedia(url: string) {
  if (url.startsWith("https://")) return url;
  const base = process.env.MATA3_PUBLIC_API_BASE_URL;
  return base && url.startsWith("/") ? base.replace(/\/$/, "") + url : url;
}
function media(value: unknown): PublicMedia | null {
  const row = object(value), url = string(row?.url, 2000), alt = typeof row?.altText === "string" ? row.altText.slice(0, 300) : null;
  if (!row || !url || alt === null || !["IMAGE", "VIDEO"].includes(row.type as string) || !(url.startsWith("/") || url.startsWith("https://"))) return null;
  return { url: absoluteMedia(url), alt, type: row.type as PublicMedia["type"] };
}
function category(value: unknown): { key: string; name: string } | null {
  const row = object(value), key = string(row?.key, 100), name = string(row?.name);
  return key && name ? { key, name } : null;
}
function productBase(value: RecordValue, market: Market) {
  const slug = string(value.slug, 120), name = string(value.nameEn) || string(value.nameAr) || string(value.name), price = money(value.price, market), cat = category(value.category);
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !name || !price || typeof value.purchasable !== "boolean") return null;
  const cover = media(value.cover);
  return { id: slug, slug, name, category: cat?.key ?? "", categoryLabel: cat?.name, market, publication: "PUBLISHED" as const, price, media: cover ? [cover] : [] as PublicMedia[] };
}
export function projectPublicProduct(value: unknown, market: Market): PublicProduct | null {
  const row = object(value);
  if (!row || row.kind !== "product") return null;
  const base = productBase(row, market);
  if (!base) return null;
  return { ...base, kind: "product", variants: [{ id: "", label: "", available: base.price.amountMinor >= 0 && row.purchasable === true, attributes: {} }] };
}
export function projectPublicProductDetail(value: unknown, market: Market): PublicProduct | null {
  const row = object(value), base = row && productBase(row, market);
  if (!row || row.kind !== "product" || !base || !Array.isArray(row.offers) || !Array.isArray(row.media)) return null;
  const variants: PublicVariant[] = row.offers.flatMap(value => {
    const offer = object(value), id = string(offer?.offerId, 100), price = money(offer?.price, market), rawAttributes = object(offer?.attributes);
    if (!id || !price || typeof offer?.purchasable !== "boolean") return [];
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawAttributes ?? {})) if (typeof value === "string" && value.length <= 100) attributes[key] = value;
    return [{ id, label: string(offer?.label) ?? "Standard", available: offer.purchasable, attributes, price, media: Array.isArray(offer.media) ? offer.media.map(media).filter((item): item is PublicMedia => !!item) : [] }];
  });
  if (!variants.length) return null;
  return { ...base, kind: "product", media: row.media.map(media).filter((item): item is PublicMedia => !!item), variants };
}
export function projectPublicBundle(value: unknown, market: Market): PublicProduct | null {
  const row = object(value), base = row && productBase(row, market), offerId = string(row?.offerId, 100);
  if (!row || row.kind !== "bundle" || !base || !offerId || !Array.isArray(row.components) || !Array.isArray(row.media)) return null;
  const components = row.components.map(object).filter((item): item is RecordValue => !!item && !!string(item.name) && Number.isInteger(item.quantity) && (item.quantity as number) > 0).map(item => ({ productId: item.name as string, quantity: item.quantity as number }));
  if (components.length !== row.components.length || !components.length) return null;
  return { ...base, kind: "bundle", media: row.media.map(media).filter((item): item is PublicMedia => !!item), variants: [{ id: offerId, label: "Bundle", available: row.purchasable === true, attributes: {}, price: base.price }], components };
}
async function fetchPublic(path: string): Promise<unknown> {
  const base = process.env.MATA3_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("Public catalogue API is not configured");
  const response = await fetch(base.replace(/\/$/, "") + "/api/public/v1/" + path, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Catalogue unavailable");
  return response.json();
}
export async function getCategories(market: Market): Promise<CatalogueCategory[]> {
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) { if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured"); return [...new Set(fixtureCatalogue.filter(p => p.market === market).map(p => p.category))].map(key => ({ key, name: key, department: "" })); }
  const body = object(await fetchPublic("categories?market=" + apiMarket(market)));
  if (!body || body.version !== 1 || body.market !== apiMarket(market) || !Array.isArray(body.items)) throw new Error("Invalid categories response");
  return body.items.map(object).filter((item): item is RecordValue => !!item && !!string(item.key, 100) && !!string(item.name)).map(item => ({ key: item.key as string, name: item.name as string, department: string(item.department) ?? "" }));
}
export async function getAvailableMarkets(): Promise<{ market: Market; code: string; currency: "EGP" | "MAD"; locales: string[] }[]> {
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured");
    return [{ market: "eg", code: "EGYPT", currency: "EGP", locales: ["ar", "en"] }, { market: "ma", code: "MOROCCO", currency: "MAD", locales: ["ar", "fr", "en"] }];
  }
  const body = object(await fetchPublic("markets"));
  if (body?.version !== 1 || !Array.isArray(body.items)) throw new Error("Invalid market configuration");
  return body.items.map(object).filter((item): item is RecordValue => !!item && (item.code === "EGYPT" || item.code === "MOROCCO") && item.currency === expectedCurrency(item.code === "EGYPT" ? "eg" : "ma") && Array.isArray(item.locales)).map(item => ({ market: item.code === "EGYPT" ? "eg" as const : "ma" as const, code: item.code as string, currency: item.currency as "EGP" | "MAD", locales: (item.locales as unknown[]).filter((locale): locale is string => typeof locale === "string") }));
}
export async function getMarketConfig(market: Market) {
  const match = (await getAvailableMarkets()).find(item => item.market === market);
  if (!match) throw new Error("Market unavailable");
  return match;
}
export async function getCataloguePage(market: Market, options: { page?: number; pageSize?: number; category?: string; query?: string } = {}): Promise<CataloguePage> {
  const page = options.page ?? 1, pageSize = options.pageSize ?? 24;
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured");
    const rows = fixtureCatalogue.filter(p => p.kind === "product" && p.market === market && (!options.category || p.category === options.category) && (!options.query || p.name.toLowerCase().includes(options.query.toLowerCase())));
    return { items: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length };
  }
  const params = new URLSearchParams({ market: apiMarket(market), page: String(page), pageSize: String(pageSize) });
  if (options.category) params.set("category", options.category);
  if (options.query) params.set("q", options.query);
  const body = object(await fetchPublic("products?" + params));
  if (!body || body.version !== 1 || body.market !== apiMarket(market) || !Array.isArray(body.items) || !Number.isInteger(body.total)) throw new Error("Invalid product list");
  return { items: body.items.map(item => projectPublicProduct(item, market)).filter((item): item is PublicProduct => !!item), page, pageSize, total: body.total as number };
}
export async function getProductBySlug(market: Market, slug: string): Promise<PublicProduct | null> {
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) { if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured"); return fixtureCatalogue.find(p => p.market === market && p.slug === slug) ?? null; }
  return projectPublicProductDetail(await fetchPublic("products/" + encodeURIComponent(slug) + "?market=" + apiMarket(market)), market);
}
export async function getBundles(market: Market): Promise<PublicProduct[]> {
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) { if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured"); return fixtureCatalogue.filter(p => p.market === market && p.kind === "bundle"); }
  const body = object(await fetchPublic("bundles?market=" + apiMarket(market)));
  if (!body || body.version !== 1 || body.market !== apiMarket(market) || !Array.isArray(body.items)) throw new Error("Invalid bundle list");
  return body.items.map(item => projectPublicBundle(item, market)).filter((item): item is PublicProduct => !!item);
}
export async function getBundleBySlug(market: Market, slug: string): Promise<PublicProduct | null> {
  if (!process.env.MATA3_PUBLIC_API_BASE_URL) { if (process.env.NODE_ENV === "production") throw new Error("Public catalogue API is not configured"); return fixtureCatalogue.find(p => p.market === market && p.kind === "bundle" && p.slug === slug) ?? null; }
  return projectPublicBundle(await fetchPublic("bundles/" + encodeURIComponent(slug) + "?market=" + apiMarket(market)), market);
}
