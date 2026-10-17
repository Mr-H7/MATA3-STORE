import test from "node:test";
import assert from "node:assert/strict";
import { productDisplayName, tidyPublicName } from "../src/lib/storefront.ts";

test("product presentation uses the published Arabic name without inventing translations", () => {
  const product = { name: "CHARGEUR PS4 WIRELESS 4x", nameAr: "قاعدة شاحن بلاي 4" };
  assert.equal(productDisplayName(product, "ar"), "قاعدة شاحن بلاي 4");
  assert.equal(productDisplayName(product, "en"), "Chargeur PS4 Wireless 4x");
  assert.equal(productDisplayName(product, "fr"), "Chargeur PS4 Wireless 4x");
  assert.equal(productDisplayName({ name: "MOUSEPAD EXCEL" }, "ar"), "Mousepad Excel");
  assert.equal(product.name, "CHARGEUR PS4 WIRELESS 4x");
});

test("display casing preserves acronyms, model identifiers and mixed-case public wording", () => {
  assert.equal(tidyPublicName("HP M100 USB MOUSE"), "HP M100 USB Mouse");
  assert.equal(tidyPublicName("T-TGK313 RGB KEYBOARD"), "T-TGK313 RGB Keyboard");
  assert.equal(tidyPublicName("PS4 FIFA EDITION CONTROLLER 2"), "PS4 FIFA Edition Controller 2");
  assert.equal(tidyPublicName("Excel Shortcuts Desk Mat 90×40"), "Excel Shortcuts Desk Mat 90×40");
});
