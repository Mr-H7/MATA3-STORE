import type { PublicProduct } from "./commerce";

export function isExcelShortcutsDeskMat(product: Pick<PublicProduct, "kind" | "name" | "slug">) {
  if (product.kind !== "product") return false;
  const identity = `${product.name} ${product.slug}`.toLowerCase();
  return identity.includes("excel") && identity.includes("shortcut") &&
    /(?:desk[ -]?mat|mouse[ -]?pad)/.test(identity) && /90\s*[×x-]\s*40/.test(identity);
}
