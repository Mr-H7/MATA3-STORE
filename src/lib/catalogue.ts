import "server-only";
import { fixtureCatalogue } from "./fixtures";
import { categories, type Market, type PublicProduct, type PublicMedia, type PublicVariant } from "./commerce";

function object(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function safeText(value: unknown, max = 200): string | null { return typeof value === "string" && value.length > 0 && value.length <= max ? value : null; }
function projectMedia(value: unknown): PublicMedia | null {
  const item = object(value), url = safeText(item?.url, 2000), alt = safeText(item?.alt, 300);
  if (!item || !url || !alt || !(/^https:\/\//.test(url) || url.startsWith("/")) || (item.type !== "IMAGE" && item.type !== "VIDEO")) return null;
  return { url, alt, type: item.type };
}
function projectVariant(value: unknown): PublicVariant | null {
  const item = object(value), id = safeText(item?.id, 100), label = safeText(item?.label, 200), rawAttributes = object(item?.attributes);
  if (!item || !id || !label || typeof item.available !== "boolean" || !rawAttributes) return null;
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawAttributes)) if (safeText(key, 50) && safeText(value, 100)) attributes[key] = value as string;
  const media = Array.isArray(item.media) ? item.media.map(projectMedia).filter((m): m is PublicMedia => !!m) : undefined;
  return { id, label, available: item.available, attributes, ...(media ? { media } : {}) };
}
export function projectPublicProduct(value: unknown, market: Market): PublicProduct | null {
  const item = object(value), price = object(item?.price), id = safeText(item?.id, 100), slug = safeText(item?.slug, 100), name = safeText(item?.name, 300);
  if (!item || !price || !id || !slug || !name || !/^[a-z0-9-]+$/.test(slug) || item.publication !== "PUBLISHED" || item.market !== market || !categories.includes(item.category as PublicProduct["category"]) || !Number.isSafeInteger(price.amountMinor) || (price.amountMinor as number) < 0 || price.currency !== (market === "eg" ? "EGP" : "MAD") || !Array.isArray(item.media) || !Array.isArray(item.variants) || (item.kind !== "product" && item.kind !== "bundle")) return null;
  const variants = item.variants.map(projectVariant).filter((v): v is PublicVariant => !!v);
  if (!variants.length) return null;
  const media = item.media.map(projectMedia).filter((m): m is PublicMedia => !!m);
  const components = item.kind === "bundle" && Array.isArray(item.components) ? item.components.map(object).filter((c): c is Record<string, unknown> => !!c && !!safeText(c.productId, 100) && Number.isSafeInteger(c.quantity) && (c.quantity as number) > 0).map(c => ({ productId: c.productId as string, quantity: c.quantity as number })) : undefined;
  if (item.kind === "bundle" && !components?.length) return null;
  return { id, slug, name, category: item.category as PublicProduct["category"], market, publication: "PUBLISHED", price: { amountMinor: price.amountMinor as number, currency: price.currency as PublicProduct["price"]["currency"] }, media, variants, kind: item.kind, ...(components ? { components } : {}) };
}
export async function getCatalogue(market: Market): Promise<PublicProduct[]> {
  const base = process.env.MATA3_PUBLIC_API_BASE_URL;
  if (!base) return process.env.NODE_ENV === "production" ? [] : fixtureCatalogue.filter(p => p.market === market);
  const response = await fetch(`${base.replace(/\/$/, "")}/storefront/products?market=${market}`, {
    headers: process.env.MATA3_STORE_API_TOKEN ? { Authorization: `Bearer ${process.env.MATA3_STORE_API_TOKEN}` } : {},
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Catalogue unavailable");
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error("Invalid catalogue response");
  return body.map(item => projectPublicProduct(item, market)).filter((item): item is PublicProduct => !!item);
}
