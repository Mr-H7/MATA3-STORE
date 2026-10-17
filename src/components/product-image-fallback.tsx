import type { Locale } from "@/lib/commerce";
import { storefrontCopy } from "@/lib/storefront";

export function ProductImageFallback({ locale }: { locale: Locale }) {
  return <span className="product-photo-empty">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="8" y="9" width="32" height="30" rx="2"/><circle cx="18" cy="19" r="3"/><path d="m9 33 10-9 8 7 5-5 8 8"/></svg>
    <span>{storefrontCopy(locale).imageUnavailable}</span>
  </span>;
}
