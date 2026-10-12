# Main Store API Docs

Visual + functional clone of the E-commerce-backend-docs site, sourced from the
Bruno collection in this repo. Same stack (Next.js App Router, JS only, Mica
theme), same components/layout — only content differs.

## Sources

- Bruno collection: `./API_Docs/Ecommerce/` (holds `bruno.json`, `name: "Ecommerce"`;
  `./API_Docs/` is the fallback if the nested folder is absent)
- Environments: `./API_Docs/Ecommerce/environments/` (`Dev`, `Production`)
- Legacy HTML: `./API_Docs/Ecommerce-documentation.html` (noted in generated data only)
- Generated data: `data/api.json` + `data/search-index.json` via `scripts/parse-bruno.js`

## How to add / update `.bru` files

1. Edit files under `./API_Docs/Ecommerce/` (folders = sidebar sections, file name = endpoint title).
2. Per-request fields the parser reads:
   - `meta { name, seq }` → endpoint title + ordering within group
   - `get/post/put/patch/delete { url, body }` → method + path (`{{url}}` stripped)
   - `headers`, `params:query` → headers + query tables (`token` header = auth required)
   - `body:json` → request body + inferred schema table
   - `body:multipart-form` / `body:form-urlencoded` → form-fields table + sample (`~disabled` skipped, `@file(local path)` reduced to filename)
   - `example { description, response }` (`docs { }` fallback) → rendered description + sample response (plain `description:` lines work, not just `'''` quotes)
3. Environments: add/edit `./API_Docs/Ecommerce/environments/*.bru` with `vars { url, ... }` —
   each becomes an entry in the environment switcher and proxy allowlist.
4. Refresh: `npm run parse && npm run dev` (parse also runs automatically on
   `npm run build` / `prebuild`).

## How the parser works

- `scripts/parse-bruno.js` resolves the collection root from
  `[./API_Docs/Ecommerce, ./API_Docs]` (prefers the one holding `bruno.json`),
  walks it for `*.bru` (skips `environments/`), parses the Bruno DSL
  block-by-block (brace-aware, `'''` strings opaque), and emits:
  - `data/api.json` — groups, endpoints (method/path/params/headers/body/auth/
    description/response/prev-next), environments, baseUrls
  - `data/search-index.json` — lightweight search index (id/group/name/method/path)
- Every run logs the resolved `Collection root` + `Collection name (bruno.json)`
  so the source is unambiguous.
- Single swap point: `adaptBrunoToDocModel(file, collectionRoot)` — to change the
  data source later, replace only this function and keep the endpoint shape stable.
- Nothing is invented: missing docs/bodies stay empty and the UI hides those sections.

## Run / build

```bash
npm install
cp .env.example .env   # optional; defaults already match Bruno envs
npm run parse          # regenerate data/api.json from .bru files
npm run dev            # http://localhost:3000
npm run build          # parse + next build (49 endpoints, 10 groups)
npm start              # serve production build
```

Env vars (`ALLOWED_BASE_URLS` = proxy allowlist) default to the Bruno env URLs
(`http://ecommerce-backend-orpin-five.vercel.app`, `http://localhost:3000`).
