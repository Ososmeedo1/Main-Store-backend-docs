# DESIGN_SYSTEM — High Contrast

## 1. Context and goals

Re-skin of the E-commerce Masar API documentation site as a stark, maximally
legible tool: pure black and white, 2px borders, large clear type,
unmistakable focus. It must read in bright sunlight and for low vision, stay
calm (whitespace, few elements, one accent), and keep every beginner flow:
Start-here path, identical endpoint order, guided Try it. Targets: Lighthouse
100 Accessibility with zero violations (95+ Performance/Best Practices/SEO),
zero horizontal overflow at 320–1920px.

Reference check: `https://dummy.my/high-contrast` returns a title-only stub
listing style characteristics (maximum readability, WCAG AAA, black/white/
yellow, accessible design, bold statements) — no colors, fonts, or layout to
extract. Only those characteristics were taken (they confirm the yellow focus
and monochrome direction); all tokens come from the task spec. Re-verify
against the live reference when reachable (see QA checklist).

## 2. Tokens and foundations (with measured contrast table)

All tokens are CSS variables in `app/globals.css` (`:root` = white,
`.dark` = black) mapped into the Tailwind theme (`@theme inline`).
Components use only semantic names — never raw hex. One accent only
(black-on-white / white-on-black); links are always underlined, never
color-alone; no gradients, glass, blur, glow, or illustrations.

Body text target ≥7:1 (AAA), large text/UI ≥4.5:1, focus ≥3:1 — measured by
`node scripts/check-contrast.js` (ALL PASS, both themes):

| Pair | Ratio | Target | Status |
|---|---|---|---|
| Light body `#000` on `#fff` | 21.00 | 7 | PASS |
| Light secondary `#333a44` on `#fff` | 11.48 | 7 | PASS |
| Light tertiary `#3f4552` on `#fff` | 9.61 | 7 | PASS |
| Light primary button `#fff` on `#000` | 21.00 | 7 | PASS |
| Light links (black, underlined) | 21.00 | 7 | PASS |
| Light focus `#0033cc` on `#fff` | 8.95 | 3 | PASS |
| Light method badge text | 21.00 | 7 | PASS |
| Light success `#006636` / warning `#6b4300` / danger `#b00020` / info `#00566b` | 7.11–8.65 | 7 | PASS |
| Light subtle border `#595959` | 7.00 | 3 | PASS |
| Dark body `#fff` on `#000` | 21.00 | 7 | PASS |
| Dark secondary `#c9cfdb` on `#000` | 13.43 | 7 | PASS |
| Dark tertiary `#b0b6c6` on `#000` | 10.35 | 7 | PASS |
| Dark primary button `#000` on `#fff` | 21.00 | 7 | PASS |
| Dark links (white, underlined) | 21.00 | 7 | PASS |
| Dark focus `#ffdd00` on `#000` | 15.59 | 3 | PASS |
| Dark method badge text | 21.00 | 7 | PASS |
| Dark success `#4ade80` / warning `#fbbf24` / danger `#ff8fa3` / info `#67e8f9` | 9.71–14.49 | 7 | PASS |
| Dark subtle border `#9a9fae` | 7.94 | 3 | PASS |

Adjusted for contrast (spec values that failed, lightness changed):
- `text-secondary` light: spec `oklch(0.446…)` (~4.8:1) → `#333a44` (11.48).
- `text-tertiary` light: spec `oklch(0.554…)` (~3.6:1) → `#3f4552` (9.61).
- `text-secondary/tertiary` dark: lightened to `#c9cfdb` (13.43) / `#b0b6c6` (10.35).
- Status colors: hand-picked 7:1 pairs both themes (see table); each always
  ships with icon + text label.
- `surface-strong` keeps the spec oklab half-tone; text on it is primary only
  (15.2+ both themes).

Foundations: sans stack for everything (16px/400/24px, small 14px, headings
600–700, system mono for code — no decorative fonts). Spacing on 8px rhythm
(`space-1=8 … space-4=24`; 32/48/64 extensions). Radius `xs=8px` everywhere.
Motion: 150ms hover/focus/press only; spinner is functional loading feedback
(with “Loading…” text), killed under reduced-motion. Structure comes from 2px
borders, not shadows (none used).

## 3. Component rules

Primitives (`app/globals.css`, `@layer components` so utilities always win):
`.hc-card` (flat, 2px border), `.hc-btn` + `-primary` (solid, hover inverts)
+ `-ghost` + `-icon` (44px), `.hc-input` (2px, 16px text, labels above,
`aria-invalid` → 3px danger border), `.scroll-well` (2px, labelled
`tabindex="0"` region), `.hc-badge` + `.method-*` (bold label + distinct
border style per verb: GET solid, POST double 4px, PUT dashed, PATCH dotted
3px, DELETE solid 3px + underline), `.hc-navlink` (+ `-active`: 4px rail +
bold, not color alone), `.hc-spinner` (fixed 16px), `.term` (dotted underline
+ tooltip), stacked `.stack-table` rows under 640px (cells carry `data-label`).

Anatomy, variants, states (all seven, every interactive component):
- **Button**: default → hover (invert, 150ms) → focus (3px ring + 2px offset,
  never removed, incl. inside wells) → active (press-in) → disabled (dashed
  border + readable ≥4.5:1 text, more than opacity) → loading (spinner +
  “Sending…”/`aria-busy`, fixed height, no CLS) → error n/a (errors live in
  their region: danger border + icon + text + fix).
- **Input/select/textarea**: default 2px → hover strong bg → focus ring →
  disabled (dashed + readable) → error (3px danger border + message).
  `color-scheme` follows the theme.
- **Nav links**: default → hover (tinted + underline) → active
  (`aria-current`, rail + bold) → focus ring; ≥44px tall.
- **Method badge / status badge / required badge**: text + border style (+
  icon for status); never color-alone.
- **Code block**: server shiki (`github-*-high-contrast`), title + per-block
  copy, scrolls in a labelled focusable well.
- **Tables**: scroll in wells ≥640px; stacked labelled rows below; `scope`,
  caption, keyboard-scrollable.
- **Dialog/sheet** (mobile drawer, search, Authorize — the only modal):
  `role="dialog"` `aria-modal`, labelled, Escape/backdrop close, initial focus;
  helpful empty states (“No endpoints match. Try a different word.”).
- **Playground**: numbered steps → server line (static Production + persistent
  banner) → token state → params/body (+ Format JSON, JSON validated in plain
  words) → Advanced-collapsed extra headers → live cURL preview → one big
  **Send request** + **Reset** → result (`aria-live`: status badge with icon +
  code + plain meaning, time, size, copy, reuse chips, collapsed headers,
  body well).
- **Header controls**: server readout + banner, Authorize (lock state),
  search (⌘K, Enter opens top hit), theme System/Light/Dark select, YouTube +
  Portfolio 44px bordered icon buttons (tooltip + label + blank/noopener).
- **Copy buttons**: label + icon; success = “Copied” + check (text change).

Responsive/edge cases: `min-w-0` on all flex/grid children; paths/URLs
`break-all`, prose `break-words`; code/JSON/tables in wells; sidebar →
drawer under `lg`; header wraps (no fixed rows); SVG `max-w-full`;
`box-sizing: border-box` (preflight) so 2px borders and rings never push
layout; touch targets ≥44px.

## 4. Accessibility criteria (testable pass/fail)

- Contrast: body ≥7:1, large/UI ≥4.5:1, focus ≥3:1 — `check-contrast.js`
  ALL PASS (table above).
- Keyboard: logical tab order, visible 3px ring everywhere, Skip-to-content,
  Escape closes dialogs, `Cmd/Ctrl+K` + Enter search, Ctrl+Enter sends,
  wells are `tabindex="0"` regions.
- Names: icon-only buttons labelled; status/errors text + icon; decorative
  SVGs `aria-hidden`; live regions for async output.
- Modes: `forced-colors: active` maps to system colors (Highlight focus,
  LinkText links, ButtonText/Face primary, GrayText disabled, CanvasText
  borders) — verified via `check-a11y-shots.js` screenshots; `contrast: more`
  thickens structure borders; reduced-motion kills animation.
- Reflow: 200% zoom / 320px with no page scroll and no lost content
  (`check-overflow.js`: home, docs, endpoint, endpoint+response, dialog ×
  320/375/768/1024/1440).
- Pass criteria: Lighthouse A11y 100 + axe zero violations on `/` and one
  endpoint page; Lighthouse 95+ Performance/Best Practices/SEO mobile (run
  manually — no runner in this environment; see QA).

## 5. Content and tone (concise, confident, beginner-friendly)

Verbs + objects: “Send request”, “Reset”, “Copy cURL”, “Authorize”,
“Format JSON”, “Use this token”, “Copy ID”. Results speak plainly (“200 means
success — your request worked.”). Errors name cause + fix (“401 means the API
did not recognize you. Log in again…”). Empty: “No response yet — press Send
request and the answer appears here.” Hints show once, dismiss forever. Never
“Click here” or bare “Submit”.

## 6. Anti-patterns

- Raw hex / one-off spacing/type; low-contrast text; hidden focus;
  color-only meaning; ambiguous labels.
- `100vw`; rotated/skewed boxes without clipped wrappers; missing `min-w-0`;
  unwrapped URLs; page-level code/table scroll; fixed-width header rows;
  `overflow-x: hidden` as the fix (clip on body is safety net only);
  tooltips/dividers outside the viewport.
- Gradients, glass/blur, glow, translucent text backdrops, decorative
  illustrations, looping decoration, dog-ears/clips on focusable elements.
- Nested menus past 2 levels, multiple primary actions, modals beyond
  Authorize, custom-URL/server pickers with one server.
- Shipping a component without the seven states.

## 7. QA checklist

- [ ] `node scripts/check-contrast.js` → ALL PASS (both themes, strict targets)
- [ ] `node scripts/check-flow.js` → ALL PASS (21 checks)
- [ ] `node scripts/check-overflow.js` → ALL PASS (5 states × 5 widths)
- [ ] `node scripts/check-a11y-shots.js` → screenshots saved under `screenshots/`
- [ ] `npm run lint` clean; `next build` zero errors/warnings; zero `.ts/.tsx`
- [ ] No previous-system classes/tokens in code (`hc-*` only + utilities)
- [ ] Lighthouse mobile: A11y 100 + axe zero violations on `/` and
      `/docs/users/login`; 95+ Perf/BP/SEO (manual)
- [ ] Keyboard-only pass + 200% zoom at 320px + forced-colors visual pass
- [ ] 44px targets spot-check; reduced-motion pass; both themes
- [ ] Re-verify against the live High Contrast reference when reachable
