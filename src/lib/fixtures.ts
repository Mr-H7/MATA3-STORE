import type { PublicProduct, CategoryId } from "./commerce";

// Known Egypt names and prices from the user brief. No stock, technical details or web media are inferred.
const entries: [string, string, CategoryId, number][] = [
  ["ps4-themed-controller", "PS4-style Themed Controller", "gaming", 649],
  ["ps4-black-controller", "PS4-style Normal Black Controller", "gaming", 579],
  ["ps3-compatible-controller", "PS3-style Compatible Controller", "gaming", 379],
  ["dobe-ps4-charging-dock", "DOBE PS4 Charging Dock", "gaming", 399],
  ["hp-m100-mouse", "HP M100 Mouse", "computer-accessories", 149],
  ["gamma-m32-mouse", "Gamma M32 Mouse", "computer-accessories", 449],
  ["mouse-pad-90x40", "Mouse Pad 90×40", "computer-accessories", 379],
  ["utopia-u200-keyboard-mouse", "Utopia U200 Keyboard + Mouse", "computer-accessories", 649],
  ["gamma-key-7-keyboard", "Gamma Key 7 Keyboard", "computer-accessories", 399],
  ["t-dagger-t-tgk313-keyboard", "T-Dagger T-TGK313 Mechanical Keyboard", "computer-accessories", 949],
  ["baggo-patterned-laptop-bag", "BAGGO Patterned Laptop Bag", "computer-accessories", 349],
  ["baggo-plain-laptop-bag", "BAGGO Plain Laptop Bag", "computer-accessories", 329],
  ["hp-laptop-bag", "HP Laptop Bag", "computer-accessories", 329]
];
export const fixtureCatalogue: PublicProduct[] = entries.map(([slug, name, category, price]) => ({
  id: slug, slug, name, category, market: "eg", publication: "PUBLISHED", kind: "product",
  price: { amountMinor: price * 100, currency: "EGP" }, media: [],
  variants: [{ id: "default", label: name, attributes: {}, available: false }]
}));
fixtureCatalogue.push({
  id: "ps4-player-bundle", slug: "ps4-player-bundle", name: "PS4 Player Bundle", category: "gaming", market: "eg", publication: "PUBLISHED", kind: "bundle",
  price: { amountMinor: 94900, currency: "EGP" }, media: [], variants: [{ id: "default", label: "PS4 Player Bundle", attributes: {}, available: false }],
  components: [{ productId: "ps4-themed-controller", quantity: 1 }, { productId: "dobe-ps4-charging-dock", quantity: 1 }]
});
