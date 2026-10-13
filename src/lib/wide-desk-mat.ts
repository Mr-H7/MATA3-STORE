import type { PublicProduct } from "./commerce";

export function isExcelShortcutsDeskMat(product: Pick<PublicProduct, "kind" | "slug">) {
  return product.kind === "product" && product.slug === "mousepad-excel";
}
