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

- `src/lib/commerce.ts`: public contracts, money formatting, market rules, cart validation.
- `src/lib/catalogue.ts`: server-only public catalogue adapter, publication and market filtering.
- `src/lib/fixtures.ts`: brief-derived development values; no invented stock, specifications or public media.
- `src/components`: shared commerce and navigation UI.
- `src/app/api/cart/validate`: server revalidation contract. It does not authorize checkout.

The Commerce OS now provides the v1 customer-safe catalogue, WebProductMedia, exact offer IDs, market prices, and purchase eligibility. Checkout methods, authoritative order creation, restricted guest tracking, and separate customer authentication remain future work. Checkout cannot submit, tracking cannot disclose an order, and account access remains unavailable. No internal staff data or authentication is used here.

The supplied Stitch HTML and images were used for visual composition only. Generated claims, operational details and imagery are not treated as product facts.
