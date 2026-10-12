# ASSUMPTIONS — E-commerce Masar docs build

Design reference: `https://dummy.my/high-contrast` returns a title-only stub
listing style characteristics (maximum readability, WCAG AAA, black/white/
yellow, accessible design, bold statements) with no extractable colors, fonts,
or layout (checked via fetch on 2026-10-04). Only those characteristics were
taken (they confirm the monochrome + yellow-focus direction); every token
follows the task spec. Re-verify against the live reference when reachable.
(Prior themes fully removed and replaced.)

Source files found (names differ from brief):
- Bruno collection lives at `./Ecommerce Masar/` (not `./bruno-export/`).
- HTML doc is `./Ecommerce Masar-documentation.html` (not `./docs.html`).
- Parser (`scripts/parse-bruno.js`) reads from either location so both layouts work.

Collection facts (34 request files):
- Groups (Bruno folders): Users (8), addresses (4), brands (3), carts (4),
  Categories (2), Coupons (2), orders (5), products (2), reviews (2),
  sub categories (2). Folder `assets/` holds a sample image only.
- Environments: only one server is real. The Bruno env file is named
  `Masar-production` but it is displayed as `Production` (its functional
  name); the `Production` Bruno env file is fake per the owner, so the parser
  skips it (`EXCLUDED_ENVIRONMENTS`) and the proxy allowlist contains only the
  real URL. There is no custom-URL option: with a single server there is
  nothing to switch between.
- Auth scheme: custom `token` request header. The value is the account key
  `osama` glued directly in front of the raw token with no space
  (`osama<token>`). Users paste the raw token; the playground and snippets add
  the prefix when sending.
- Required vs optional: the `.bru` files carry no required/optional metadata,
  so only the `token` header and path params are marked "required" (both are
  structurally mandatory). Body fields show type + example with an explicit
  note instead of invented required markers.
- Next-step ordering: "Next step" follows the parser's endpoint order (group,
  then Bruno `seq`), the closest available proxy for a login→…→order flow.
- `docs.html` is a Bruno-generated viewer embedding the same collection
  (`collectionData` JS string). No extra business context beyond the per-example
  `description` blocks, which are merged verbatim as endpoint descriptions.
- No rate-limit, versioning, webhook, or pagination spec found beyond ApiFeatures
  hints inside list-endpoint descriptions. Rate Limits page therefore states
  "not documented in source" instead of inventing numbers.
- Error shapes: only inferred from success examples (`{ message, data }`);
  Errors page documents observed status codes (200/201/400/401/404/500 pattern
  common to Express) and marks them as inferred, not source-quoted.
- Some URLs embed concrete ids (e.g. `/addresses/soft-delete/6ac15e...`,
  `/brands/specific?id=...`). These are preserved as defaults but path/query
  params are extracted so the playground can edit them.
- Slugification: group slug = lowercased folder name, spaces → `-`
  (e.g. `sub categories` → `sub-categories`, `Categories` → `categories`).
  Endpoint slug = lowercased request name, non-alphanumerics → `-`.
- Social links use the placeholders from the brief:
  YouTube `https://youtube.com/@masar1424`, portfolio
  `https://osama.osamaoriginal77.workers.dev/`, credit "Made by Osama".
