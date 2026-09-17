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
export type CartLine = { productId: string; variantId: string; quantity: number };
export type ValidatedLine = { product: PublicProduct; variant: PublicVariant; quantity: number; lineMinor: number };
export type CartValidation = { valid: ValidatedLine[]; invalid: { line: CartLine; reason: string }[]; subtotalMinor: number; currency: "EGP" | "MAD" };

export const markets = { eg: { currency: "EGP", locales: ["ar", "en"] }, ma: { currency: "MAD", locales: ["ar", "fr", "en"] } } as const;
export const categories: CategoryId[] = ["gaming", "computer-accessories", "mens-fashion", "womens-fashion", "womens-bags"];
export function isMarket(value: string): value is Market { return value === "eg" || value === "ma"; }
export function isLocale(value: string): value is Locale { return value === "ar" || value === "en" || value === "fr"; }
export function validContext(market: string, locale: string): market is Market {
  return isMarket(market) && isLocale(locale) && (markets[market].locales as readonly string[]).includes(locale);
}
export function formatMoney(money: Money, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-MA" : "en-US", { style: "currency", currency: money.currency, maximumFractionDigits: 2 }).format(money.amountMinor / 100);
}
export function validateCart(lines: CartLine[], catalogue: PublicProduct[], market: Market): CartValidation {
  const valid: ValidatedLine[] = [], invalid: CartValidation["invalid"] = [];
  for (const line of lines) {
    const product = catalogue.find(p => p.id === line.productId && p.market === market && p.publication === "PUBLISHED");
    const variant = product?.variants.find(v => v.id === line.variantId);
    if (!product || !variant || !variant.available || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
      invalid.push({ line, reason: "Item is unavailable or quantity is invalid" }); continue;
    }
    valid.push({ product, variant, quantity: line.quantity, lineMinor: (variant.price ?? product.price).amountMinor * line.quantity });
  }
  return { valid, invalid, subtotalMinor: valid.reduce((sum, item) => sum + item.lineMinor, 0), currency: markets[market].currency };
}
