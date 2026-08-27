# Mechanism Playground — build handoff

## Independent verification release gate (2026-08-27 UTC): **FAIL**

Candidate `9513ff036eb485b16571d6c9feacb8f006fa9466` was independently tested
against https://mechanism-playground.sociobot.in/ from a clean checkout. The
deployment byte-matches the fresh build, and build/unit/E2E/accessibility/PWA
smoke/performance checks otherwise passed. It is nevertheless **not releasable**:
the advertised JSON blueprint importer permits DOM XSS through an unescaped
part ID (high severity), and accepts unknown part types that produce a technical
render error (medium severity). Production also lacks immutable asset caching
(low severity). See `.factory/verification-1.md` for reproduction, exact
evidence, headers, checks, and required remediation. This verdict supersedes
the builder's verification notes below.

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

- `npm test`: 3/3 deterministic engine tests passed.
- `npm run build`: passed; Vite emitted `dist/index.html`.
- `npm run test:e2e`: 8/8 Chromium tests passed across desktop and Pixel 5.
  Covered first-puzzle completion, keyboard rotation/undo, IndexedDB refresh,
  390 px overflow, axe serious/critical findings, service-worker install, and a
  complete offline reload.
- Factory `verify-url.sh`: HTTP 200, 575 ms local load, zero console/page errors,
  title and `lang`, exactly one `h1`, main landmark, no missing alt text, and no
  unlabeled buttons.
- Lighthouse 12.8.2 mobile: Performance **100**, Accessibility **100**, Best
  Practices **100**, SEO **100**. LCP 1.5 s, CLS 0.033, total blocking time 0 ms,
  speed index 1.0 s. INP has no meaningful lab value for a new static session;
  TBT and tested interactions are the available proxies.
- Initial production assets: JS 23.11 KB raw / 8.54 KB gzip; CSS 13.59 KB raw /
  3.65 KB gzip; onboarding WebP 47 KB. All are below the assigned budgets.
- `/`, `/privacy/`, `/terms/`, `/offline.html`, `/manifest.webmanifest`, and
  `/robots.txt` each returned HTTP 200 from the production preview.

## Known gaps and release notes

- The factory must register `mechanism-playground` with the Sociobot billing API
  and configure its return URL before a real purchase can complete. No secret or
  test product identifier is committed.
- The deterministic model teaches motion paths; it deliberately omits collision,
  force, torque, material stress, CAD export, multiplayer, and user markets, as
  required by the brief. The UI and terms explicitly say it is not engineering
  software.
- Real-user Core Web Vitals are unavailable before deployment. The recorded
  values are local Lighthouse lab results.

No infrastructure, DNS, billing registration, or secrets were changed.
