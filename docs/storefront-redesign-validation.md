# Public storefront redesign — 6 October 2026

## Scope

Public header/menu, homepage hero and collections, shared product cards, catalogue filters, product presentation, favourites and cart presentation. Styles are scoped to the public site and its portal surfaces; Admin, Prisma schema, migrations, commercial data and APIs are unchanged.

The existing admin-managed banner/copy and homepage product selection remain the source of truth. Collection links/images derive from active catalogue products. No mockup products, prices, images, stock or badges were imported. There is one actual image per product; no invented gallery was added.

No public customer favourites persistence existed in the previous storefront. The new hearts save a browser-local selection under `nineilhas-favorites`, without storing stale prices or changing database records. The existing cart provider and persistence remain unchanged.

## Functional validation

- Header navigation: Início, Catálogo, Condições, Sobre Nós and Conta.
- Mobile menu: open, close, Escape, navigation, nested header search; closed surfaces leave no overlay and restore body pointer events.
- Homepage: real admin-selected products, horizontal rail controls, real filtered category links, proportional existing banner.
- Catalogue: search with `prive rose` and `privé rose` returns the same product; combined brand/category/audience filters; apply/clear/close; price ordering; initial 24 cards and Ver mais to 48.
- Product: direct URL, open/close/back, share button, real variants, quantities, bottle/5 ml/10 ml; unavailable variants absent; reservation link contains the correct product name.
- Favourites: add, view, remove and persistence across reload.
- Cart: add, quantity increase/decrease, remove, correct totals, open/close. An isolated local checkout opened the WhatsApp preparation page with 9PM 5 ml and 3.50 EUR. No message was sent.
- Read-only checkout API: bottle, low-price decants (3.50/6.50 EUR), 55-EUR decants (4.50/7.50 EUR), unavailable variant, unavailable product, invalid quantity and nonexistent product. Order and stock-movement counts stayed unchanged throughout these tests.
- Cookie UI: rejected non-essential cookies leaves GA/Meta scripts absent; analytics-only consent mounts GA without Meta. Original preference restored after the test.
- Mocked tracking tests: no beacon/Meta event before consent or after rejection; internal events/search after analytics consent; Meta only after marketing consent. No external requests in these tests.
- Responsive browser checks: 320, 390, 768 and 1440 px. Catalogue uses two columns on phones and larger grids above; no page-level horizontal overflow. Product information uses two columns on desktop and image-first on phones.
- Browser: no React, hydration or application console errors in the optimized build. Development-only Fast Refresh and existing smooth-scroll advisories are non-production warnings.

## SEO and technical checks

- HTTP 200, title, description and canonical for homepage, catalogue, conditions, about and account.
- Product/Offer/Breadcrumb JSON-LD and correct InStock/BackOrder for 9PM/Chaos.
- Missing product returns 404; dynamic sitemap contains actual product links.
- Existing SEO helpers, consent/tracking helpers, APIs, cart provider, product size/price helpers and Admin files have no changes.
- ESLint, TypeScript, production build and git diff --check passed.

Production deployment and final live verification are reported with the deployed commit in the delivery message.
