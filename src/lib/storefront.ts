import type { Locale, PublicProduct } from "./commerce";

const acronyms = new Set(["PS3", "PS4", "PS5", "HP", "RGB", "USB", "PC", "KB", "FIFA", "DOBE", "XL", "XXL"]);

// Presentation casing only. Catalogue wording and model identifiers stay intact.
export function tidyPublicName(name: string) {
  return name.replace(/\b[A-Z][A-Z0-9-]+\b/g, word =>
    acronyms.has(word) || /\d/.test(word) ? word : word[0] + word.slice(1).toLowerCase());
}

export function productDisplayName(product: Pick<PublicProduct, "name" | "nameAr">, locale: Locale) {
  return locale === "ar" && product.nameAr ? product.nameAr : tidyPublicName(product.name);
}

const copy = {
  en: { viewProduct: "View product", available: "Available", unavailable: "Currently unavailable", imageUnavailable: "Image unavailable", close: "Close", sort: "Sort by", apply: "Apply filters", clear: "Clear filters", allProducts: "All products", page: "Page", marketCatalogue: "Catalogue for", price: "Price", color: "Color", size: "Size", minimum: "Minimum", maximum: "Maximum", menu: "Menu" },
  ar: { viewProduct: "عرض المنتج", available: "متاح", unavailable: "غير متاح حاليًا", imageUnavailable: "الصورة غير متاحة", close: "إغلاق", sort: "ترتيب حسب", apply: "تطبيق التصفية", clear: "مسح التصفية", allProducts: "جميع المنتجات", page: "الصفحة", marketCatalogue: "منتجات", price: "السعر", color: "اللون", size: "المقاس", minimum: "من", maximum: "إلى", menu: "القائمة" },
  fr: { viewProduct: "Voir le produit", available: "Disponible", unavailable: "Actuellement indisponible", imageUnavailable: "Image indisponible", close: "Fermer", sort: "Trier par", apply: "Appliquer les filtres", clear: "Effacer les filtres", allProducts: "Tous les produits", page: "Page", marketCatalogue: "Catalogue pour", price: "Prix", color: "Couleur", size: "Taille", minimum: "Minimum", maximum: "Maximum", menu: "Menu" },
} as const;

export function storefrontCopy(locale: Locale) { return copy[locale]; }
