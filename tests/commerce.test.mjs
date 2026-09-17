import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney, validateCart, validContext } from "../src/lib/commerce.ts";
import { fixtureCatalogue } from "../src/lib/fixtures.ts";

test("market and language combinations are independent but valid", () => {
  assert.equal(validContext("eg", "ar"), true);
  assert.equal(validContext("ma", "fr"), true);
  assert.equal(validContext("eg", "fr"), false);
});
test("fixtures preserve verified Egypt prices without Morocco conversion", () => {
  assert.equal(fixtureCatalogue.find(p => p.slug === "ps4-themed-controller").price.amountMinor, 64900);
  assert.equal(fixtureCatalogue.find(p => p.slug === "ps4-player-bundle").price.amountMinor, 94900);
  assert.equal(fixtureCatalogue.filter(p => p.market === "ma").length, 0);
  assert.match(formatMoney({ amountMinor: 64900, currency: "EGP" }, "en"), /649/);
});
test("unknown availability prevents adding fixture items", () => {
  const result = validateCart([{ productId: "ps4-themed-controller", variantId: "default", quantity: 1 }], fixtureCatalogue, "eg");
  assert.equal(result.valid.length, 0);
  assert.equal(result.invalid.length, 1);
  assert.equal(result.subtotalMinor, 0);
});
test("cart prices and market are authoritative", () => {
  const product = { ...fixtureCatalogue[0], variants: [{ id: "v", label: "v", attributes: {}, available: true }] };
  const result = validateCart([{ productId: product.id, variantId: "v", quantity: 2 }], [product], "eg");
  assert.equal(result.subtotalMinor, 129800);
  assert.equal(validateCart([{ productId: product.id, variantId: "v", quantity: 2 }], [product], "ma").invalid.length, 1);
});
test("bundle availability follows components", () => {
  const bundle = { ...fixtureCatalogue.find(p => p.kind === "bundle"), variants: [{ id: "v", label: "v", attributes: {}, available: true }] };
  const result = validateCart([{ productId: bundle.id, variantId: "v", quantity: 1 }], [bundle], "eg");
  assert.equal(result.valid.length, 0);
});
