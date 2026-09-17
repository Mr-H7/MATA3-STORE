import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney, normalizeStoredCart, validContext } from "../src/lib/commerce.ts";
import { fixtureCatalogue } from "../src/lib/fixtures.ts";

test("market and language combinations stay isolated", () => {
  assert.equal(validContext("eg", "ar"), true);
  assert.equal(validContext("ma", "fr"), true);
  assert.equal(validContext("eg", "fr"), false);
});
test("development fixtures carry no invented Morocco conversion", () => {
  assert.equal(fixtureCatalogue.find(p => p.slug === "ps4-themed-controller").price.amountMinor, 64900);
  assert.equal(fixtureCatalogue.filter(p => p.market === "ma").length, 0);
  assert.match(formatMoney({ amountMinor: 64900, currency: "EGP" }, "en"), /649/);
});
test("saved cart uses opaque keys and migrates old local keys", () => {
  assert.deepEqual(normalizeStoredCart([{ key: "public-123", quantity: 2, observedUnitAmountMinor: 64900 }, { variantId: "legacy-456", quantity: 1 }]),
    [{ key: "public-123", quantity: 2, observedUnitAmountMinor: 64900 }, { key: "legacy-456", quantity: 1 }]);
  assert.deepEqual(normalizeStoredCart([{ key: "x", quantity: 1.5 }]), [{ key: "x", quantity: 1.5 }]);
});
test("malformed local cart rows cannot become quote requests", () => {
  assert.deepEqual(normalizeStoredCart([{ key: "", quantity: 1 }, { key: "x", quantity: Infinity }, { key: "x", quantity: 1, observedUnitAmountMinor: -4 }]),
    [{ key: "x", quantity: 1 }]);
});
