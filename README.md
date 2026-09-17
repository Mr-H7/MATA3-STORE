# MATA3 Customer Store

Next.js App Router storefront for MATA3. Market (`eg` or `ma`) and language (`ar`, `en`, `fr`) occupy separate URL segments. Arabic uses RTL; English and French use LTR. Prices are configured per market and never converted.

## Start

```sh
npm install
npm run dev
```

Open `/` for the first entry gateway. The chosen context is remembered locally. During development, the isolated catalogue adapter displays only names and Egypt prices supplied in the implementation brief. Availability is unknown, so fixture purchase actions are disabled. Production requires the MATA3-SYSTEM public catalogue API and fails closed when its origin is not configured.

Copy `.env.example` to `.env.local` and set `MATA3_PUBLIC_API_BASE_URL` to the MATA3-SYSTEM origin. Store calls the versioned public list, detail, category, market, and bundle routes server-side. Run `npm run typecheck`, `npm test`, and `npm run build` before release.

## Boundaries

- `src/lib/commerce.ts`: public contracts, money formatting, market rules, and saved cart normalization.
- `src/lib/catalogue.ts`: server-only public catalogue adapter, public search, and authoritative quote parsing.
- `src/lib/fixtures.ts`: brief-derived development values; no invented stock, specifications or public media.
- `src/components`: shared commerce and navigation UI.
- `src/app/api/cart/validate`: alias for the authoritative cart quote route. It does not authorize checkout.

The Commerce OS now provides the v1 customer-safe catalogue, WebProductMedia, exact offer IDs, market prices, and purchase eligibility. Checkout methods, authoritative order creation, restricted guest tracking, and separate customer authentication remain future work. Checkout cannot submit, tracking cannot disclose an order, and account access remains unavailable. No internal staff data or authentication is used here.

The supplied Stitch HTML and images were used for visual composition only. Generated claims, operational details and imagery are not treated as product facts.


## v1.2B search and cart

Search pages request the System /api/public/v1/search list contract, preserving q, category, real variant color/size, price range, supported sort, and page in the URL. Suggestions come from the System product/category endpoint. Zero results and request failures have different states. Development fixtures are isolated to a missing API base URL outside production.

The local cart stores market-separated opaque offer keys, quantities, and an optional previously observed unit amount. /api/cart/quote forwards these to System and displays canonical current prices and per-line validity. A changed price requires explicit acceptance and a new quote; unavailable or stale items are shown with stable reason codes. System remains authoritative. The quote never reserves inventory, submits checkout, or creates an order. Run npm run typecheck, npm run lint, npm test, and npm run build before release. The old /api/cart/validate path aliases the authoritative quote route.
