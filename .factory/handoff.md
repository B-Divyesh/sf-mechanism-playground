# Mechanism Playground — build handoff

## QA repair release gate (2026-08-27 UTC): **PASS — ready for Standard static deployment**

This repair addresses every finding against base candidate
`9513ff036eb485b16571d6c9feacb8f006fa9466`:

- Imported part IDs must be unique 1–128-character safe identifiers; malformed
  quote-containing IDs are rejected before state changes. The SVG board now
  creates imported part attributes through DOM APIs, so imported values never
  pass through an HTML/SVG markup parser.
- Imported part types are checked against the closed ten-part `PART_TYPES`
  list before mutation. Unsupported types keep the file dialog open with a
  plain-language recovery message and the player can immediately choose a
  valid file.
- Unit and Playwright regressions cover the exact quote/event-attribute ID
  payload and unknown-type recovery path on desktop and Pixel 5.
- Hashed Vite assets and icons receive one-year immutable cache headers through
  both Standard static `_headers` and `staticwebapp.config.json`; HTML remains
  revalidating and `sw.js` is no-cache. The service-worker cache and manifest
  version are bumped to v2 so installed copies update normally. A restrictive
  CSP also blocks inline event handlers as defense in depth.

## Shipped

- A complete responsive 2D mechanism workbench with ten primitives: hand crank,
  large gear, small gear, eccentric cam, follower, linkage rod, lever, slider,
  belt wheel, and bell.
- Deterministic grid/port snapping and graph-based motion propagation. A shared
  phase drives recognisable SVG motion for every powered part; this is
  intentionally not a rigid-body or stress simulation.
- Pointer placement, drag/drop, touch dragging, keyboard nudge/rotate/remove,
  undo, clear/reset confirmation, hand-crank run/pause, slow motion, manual step,
  and position scrubbing (also suitable for reduced-motion users).
- Ten local puzzle cards with adaptive crank/bell starting positions, live
  missing-part feedback, completion state, and local progress. Puzzles 1–5 and
  free build are free; the optional Forge Edition unlocks puzzles 6–10.
- Sociobot one-time paid unlock: production checkout URL, return-token capture,
  local license storage, once-daily background verification, offline optimistic
  verdict, inactive-license notice, and paste-to-restore flow.
- IndexedDB autosave with localStorage fallback, plus explicit JSON export and
  validated import. No account, analytics SDK, tracking, chat, or cloud project
  storage.
- Installable PWA manifest with 192/512/maskable icons, versioned service-worker
  shell, navigation fallback, cache-first assets, update toast, and offline
  notice/page. Privacy and terms routes are included.
- Product-specific cyanotype drafting visual system, hand-authored SVG machine
  art and icon, and one reviewed/generated original onboarding illustration.
  Provenance and the complete prompt are recorded in `.factory/design.md`; the
  optimized WebP is 47 KB.
- README, MIT license, privacy/terms, robots/sitemap, and this handoff.

## Run and verify

```sh
npm ci
npm test
npm run build
npx playwright install chromium   # once on a new worker
npm run test:e2e
npm run preview
```

The deployment command is exactly `npm run build`. Static output is `./dist`,
with `./dist/index.html` at its root.

Verification on 2026-08-27:

- `npm ci`: passed from the committed lockfile, with 0 reported vulnerabilities.
- `npm test`: 5/5 deterministic engine and import-validation tests passed.
- `npm run build`: passed; Vite emitted `dist/index.html`.
- `npm run test:e2e`: 12/12 Chromium checks passed across desktop and Pixel 5.
  This includes solved simulation, keyboard rotation/undo, persistence,
  mobile overflow, axe serious/critical scan, PWA install/offline reload, and
  both import regression cases.
- The E2E axe suite reported zero serious or critical accessibility findings;
  the 390 px mobile and complete offline PWA reload checks passed.
- Build output contains both supported Standard-static cache configurations and
  the v2 worker. Initial JS is 24.08 KB raw / 8.87 KB gzip; CSS is 13.59 KB raw /
  3.65 KB gzip; the 47 KB onboarding WebP remains below all budgets.
- Standard Static deployment completed from commit `d3392c1`. Live production
  serves the repaired hashed bundle, `Cache-Control: public, max-age=31536000,
  immutable` for `/assets/*`, `Cache-Control: no-cache` for `sw.js`, CSP, and
  `application/manifest+json` for the manifest.
- Live 390 px Chromium smoke: HTTP 200, expected title/`lang`/one `h1`/`main`,
  no horizontal overflow, zero console or page errors, zero axe serious/critical
  findings, service-worker control, and a successful offline reload.

## Known gaps and release notes

- The factory must register `mechanism-playground` with the Sociobot billing API
  and configure its return URL before a real purchase can complete. No secret or
  test product identifier is committed.
- The deterministic model teaches motion paths; it deliberately omits collision,
  force, torque, material stress, CAD export, multiplayer, and user markets, as
  required by the brief. The UI and terms explicitly say it is not engineering
  software.
- Real-user Core Web Vitals are unavailable before deployment. The checked
  local and live browser results are synthetic checks, not field telemetry.

No infrastructure, DNS, billing registration, or secrets were changed.
