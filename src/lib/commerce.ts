export type Market = "eg" | "ma";
export type Locale = "ar" | "en" | "fr";
export type CategoryId = string;
export type Money = { amountMinor: number; currency: "EGP" | "MAD" };
export type PublicMedia = { url: string; alt: string; type: "IMAGE" | "VIDEO" };
export type PublicVariant = { id: string; label: string; available: boolean; attributes: Record<string, string>; price?: Money; media?: PublicMedia[] };
export type PublicProduct = {
  id: string; slug: string; name: string; category: CategoryId; categoryLabel?: string; market: Market;
  publication: "PUBLISHED"; price: Money; media: PublicMedia[]; variants: PublicVariant[];
  kind: "product" | "bundle"; components?: { productId: string; quantity: number }[];
};
export type CartLine = { key: string; quantity: number; observedUnitAmountMinor?: number };
export type QuoteCode = "INVALID_KEY" | "INVALID_QUANTITY" | "WRONG_MARKET" | "NOT_PUBLIC" | "UNAVAILABLE" | "BUNDLE_UNAVAILABLE" | "INSUFFICIENT_STOCK" | "PRICE_CHANGED";
export type PublicQuoteLine = {
  key: string; quantity: number; valid: boolean; codes: QuoteCode[];
  kind?: "product" | "bundle"; slug?: string; name?: string; label?: string;
  unitPrice?: Money; lineTotal?: Money;
};
export type PublicCartQuote = {
  version: 1; market: "EGYPT" | "MOROCCO"; currency: "EGP" | "MAD";
  lines: PublicQuoteLine[]; itemsSubtotal: Money; canProceed: boolean; reservation: false;
};

export const markets = { eg: { currency: "EGP", locales: ["ar", "en"] }, ma: { currency: "MAD", locales: ["ar", "fr", "en"] } } as const;
export function isMarket(value: string): value is Market { return value === "eg" || value === "ma"; }
export function isLocale(value: string): value is Locale { return value === "ar" || value === "en" || value === "fr"; }
export function validContext(market: string, locale: string): market is Market {
  return isMarket(market) && isLocale(locale) && (markets[market].locales as readonly string[]).includes(locale);
}
export function formatMoney(money: Money, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-MA" : "en-US", { style: "currency", currency: money.currency, maximumFractionDigits: 2 }).format(money.amountMinor / 100);
}

export function normalizeStoredCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((item): CartLine[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const key = typeof row.key === "string" ? row.key : typeof row.variantId === "string" ? row.variantId : null;
    if (!key || key.length > 100 || !(typeof row.quantity === "number" && Number.isFinite(row.quantity))) return [];
    const observed = Number.isSafeInteger(row.observedUnitAmountMinor) && (row.observedUnitAmountMinor as number) >= 0 ? row.observedUnitAmountMinor as number : undefined;
    return [{ key, quantity: row.quantity as number, ...(observed !== undefined ? { observedUnitAmountMinor: observed } : {}) }];
  });
}
