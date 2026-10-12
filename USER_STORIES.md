# USER STORIES — Swagger-easy UX

Flow covered end-to-end by `scripts/check-flow.js` (Playwright, prod build).
Statuses: **pass** (script-verified), **pass-impl** (implemented, verified by
inspection/unit reason — noted), **partial** (needs a real account or manual eye).

## Discover
1. Start-here 3 steps on home; first request within 3 clicks — **pass**
   (home → “Log in and get a token” → Send request → real response).
2. Ctrl/Cmd+K search “order”, results show method+path+summary, Enter opens — **pass**.
3. Topic groups collapsible, verbs visible, active endpoint highlighted — **pass**
   (details/summary groups, method badges, `aria-current` rail).

## Understand
4. One-sentence summary first, tooltips on jargon — **pass** (lead sentence +
   `Term` tooltips for endpoint/token/header/payload/query/status/environment).
5. Required vs optional with types, values, examples; “required” marker + text —
   **pass** (token header + path params carry a “required” badge + text; body
   fields show type/example with an explicit note that Bruno data has no
   required metadata — see ASSUMPTIONS).

## Authorize once
6. One Authorize button; token reused everywhere; lock shows unlocked — **pass**.
7. 401/403 show friendly message + one-click Authorize now — **pass**.
8. Active token visible (masked), one-click logout — **pass** (+ Clear saved data).

## Try it
9. Panel visible with prefilled values; non-auth send returns real response — **pass**
   (login endpoint with example values returns a real API answer).
10. Snippets update live as you type — **pass** (live cURL preview + per-block
    copy; static shiki examples remain for SEO).
11. One Production server, always visible with a persistent
    “Production: requests affect real data” banner — **pass** (no picker and
    no custom URL: with a single real server there is nothing to switch; the
    live preview and every request use its URL).
12. Result: plain-words status, time, size, headers (collapsed), pretty JSON;
    loading <100ms, no layout shift — **pass** (sync loading state, fixed
    `min-h-16` region, `aria-live`).
13. Friendly message + fix for 400/401/403/404/422/500/network/timeout — **pass**
    (401/403/400 sampled live; full matrix in `lib/friendly.js`).
14. One-click Reset + Copy response/cURL/request — **pass**.

## Flow across endpoints
15. Login → “Use this token”; IDs → “Copy ID” in one click — **partial**.
    Implemented (JWT/ID detection in `lib/token.js`, chips in the response
    viewer) but not e2e-verified: no test account exists, and registering one
    would write to the live production database.
16. “Next step” per endpoint from Bruno folder order — **pass** (uses the
    parser’s group+seq order; see ASSUMPTIONS).

## Come back
17. Server/token/values persist locally; Clear saved data — **pass** (reload
    still shows Authorized; dialog clears).
18. Shareable link per endpoint + Copy link — **pass**.
