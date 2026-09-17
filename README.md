# MATA3 Customer Store

Next.js App Router storefront for MATA3. Market (`eg` or `ma`) and language (`ar`, `en`, `fr`) occupy separate URL segments. Arabic uses RTL; English and French use LTR. Prices are configured per market and never converted.

## Start

```sh
npm install
npm run dev
```

Open `/` for the first entry gateway. The chosen context is remembered locally. During development, the isolated catalogue adapter displays only names and Egypt prices supplied in the implementation brief. Availability is unknown, so fixture purchase actions are disabled. Production returns no products until a customer-safe API is configured.

Copy `.env.example` to `.env.local` and set `MATA3_PUBLIC_API_BASE_URL` once the Commerce OS storefront contract exists. The optional server token is never sent to the browser. Run `npm run typecheck`, `npm test`, and `npm run build` before release.

## Boundaries

- `src/lib/commerce.ts`: public contracts, money formatting, market rules, cart validation.
- `src/lib/catalogue.ts`: server-only public catalogue adapter, publication and market filtering.
- `src/lib/fixtures.ts`: brief-derived development values; no invented stock, specifications or public media.
- `src/components`: shared commerce and navigation UI.
- `src/app/api/cart/validate`: server revalidation contract. It does not authorize checkout.

The Commerce OS must provide dedicated customer-safe catalogue and web product media, exact variants and availability, market listings, checkout methods, authoritative order creation and frozen snapshots, restricted guest tracking, and separate customer authentication with order ownership checks. Until these exist, checkout cannot submit, tracking cannot disclose an order, and account access remains unavailable. No internal staff data or authentication is used here.

The supplied Stitch HTML and images were used for visual composition only. Generated claims, operational details and imagery are not treated as product facts.
