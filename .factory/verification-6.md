# Independent release verification 6 — PASS

Candidate: 3dc80f3d4ce624a66cd8d08af1da8d4560d010d4  
Production URL: https://mechanism-playground.sociobot.in/  
Verified: 2026-08-28 UTC

## Decision

**PASS — release candidate accepted.** Fresh independent evidence shows that the live deployment is byte-for-byte the requested candidate build and that the mobile-friendly, local-first mechanism workshop works for its stated job: a player can build and operate a crank-to-output chain, including with only a keyboard. No P0, P1, high, medium, or low-severity defect was found.

This result supersedes the earlier deployment-only concern. The earlier keyboard and cached-license repairs were exercised again rather than accepted on the builder's assertion.

## Clean checkout and quality gates

A new detached worktree was created at the exact SHA, cleaned, and installed with npm ci before verification. No product source files were changed.

| Check | Fresh result |
| --- | --- |
| npm ci | Passed; 61 packages audited, 0 vulnerabilities. |
| npm test | Passed: 8/8 Vitest unit tests. |
| npm run build | Passed: strict tsc --noEmit and Vite production build; dist/ emitted. |
| Lint/type checks | No lint command is declared; strict TypeScript passed in the build. |
| Playwright install | Passed for repository Playwright 1.62. |
| npm run test:e2e -- --workers=2 | Passed: 19 browser tests, 1 intentional desktop-only skip; desktop and Pixel 5 projects ran. |
| Lighthouse, live mobile | Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, TBT 170 ms, CLS 0.035. |

Fresh assets meet static-PWA budgets: JS index-Bcbop2sm.js is 25,979 B raw / 9,401 B gzip; CSS index-pa_KLhgM.css is 13,993 B raw / 3,751 B gzip; the first-run WebP is 47,036 B. This is a static PWA, not a library, CLI, or backend, so consumer-install, concurrency, persistence-server, and health endpoint checks do not apply.

## Independent end-to-end exercise

Fresh production Chromium sessions recorded no pageerror or console-error events.

- Confirmed all 10 primitives and all 10 local puzzle cards, with the age 10+ label.
- Completed Puzzles 01–03. Puzzle 01 used only keyboard input: start the card, select Small gear, move the focused board marker seven ArrowLeft presses, press Enter, then focus the crank and press Enter plus R. It solved and selected/rotated the crank to 45 degrees. Puzzle 02 solved with Large + Small gear; Puzzle 03 solved with Eccentric cam + Follower.
- Boundary placement safely snapped to Small gear · 64, 48 · 0° and Bell · 736, 448 · 0°.
- A malformed Blueprint JSON file stayed in the dialog with the plain recovery text “This file is not valid JSON”; the existing sheet remained usable. A quote/event-handler-containing imported ID was rejected before SVG rendering, did not set the harmless test marker, and produced no page error.
- The passing repository browser suite also covers persistence, export, malformed/unknown/hostile import recovery, cached invalid-license notice, keyboard undo/deletion, and phone export.

## Accessibility, responsive, and motion evidence

- Live desktop and exact 390 x 844 mobile Axe scans had zero serious or critical findings; the repository's documented aria-roledescription exclusion was retained.
- The app has lang=en, a descriptive title, exactly one h1, one main, a skip link, legal navigation, and alt text for the lesson illustration.
- At 390 px, scrollWidth = clientWidth = 390. With reduced motion, the crank initially remained paused. The first Tab reached Skip to workbench with a visible solid 3 px focus outline.
- Desktop/mobile screenshots were visually reviewed: cyanotype drafting sheet, cream lesson card, high-contrast controls, and the phone-stacked layout match .factory/design.md.

## PWA, privacy, and response-policy evidence

- Production worker control was confirmed. After installation, ordinary Chromium HTTP cache was cleared, the context was offline, and reload still rendered the full workshop (10 tools and 10 cards); the offline event showed the offline-workshop notice.
- Resolved worker cache mechanism-playground-70f77a9055cd install-precaches final hashed JS/CSS, shell, legal pages, illustration, and icons.
- A two-version worker fixture served exact dist/ first, then an in-memory byte-different sw.js. It made two worker requests, showed “A fresh workshop is ready. Update now”, and retained controller after update activation. SKIP_WAITING and clients.claim are implemented.
- A normal fresh visit made requests only to the product origin: no analytics, tracking, third-party fonts/scripts, chat, or outbound request was observed. Source review finds only documented optional Sociobot license verification/checkout after a license or purchase action. Local storage and export are accurately disclosed; /privacy/ and /terms/ returned 200.
- Production sends HSTS, Referrer-Policy: strict-origin-when-cross-origin, X-Content-Type-Options: nosniff, and restrictive self CSP; only https://api.sociobot.in is permitted in connect-src. Hashed JS/CSS are one-year immutable; HTML/manifest revalidate; sw.js is no-store; manifest MIME is application/manifest+json.

## Deployment identity

| Artifact | SHA-256 |
| --- | --- |
| index.html | f670aa9fd32f8b51dfc51b7e4478ee4204644099afbcbd23c4c10b9f75d53661 |
| assets/index-Bcbop2sm.js | ed13470ed76e73181882a0b56e02213525c24522d7032b5d81bf9785f32f0abe |
| assets/index-pa_KLhgM.css | fd688d938109c13036cb185948f1b0c22f5c00171793c3077ab2d00ccb7dde5f |
| sw.js | 638720a3f77d3f938d8b7e321b8fd2ed68ffaa056dcf4a4d076171eaaee25b18 |
| manifest.webmanifest | 0d9305b93de5c00b6fbb55b8cb82950fdb0c8ef25abc4d1204a3fd24264f61f3 |

## Defects by severity

| Severity | Findings |
| --- | --- |
| P0 / P1 / High / Medium / Low | None found. |

## Reproduce

    npm ci
    npm test
    npm run build
    npx playwright install chromium
    npm run test:e2e -- --workers=2

For live confirmation, use a fresh Chromium profile, wait for worker control, clear the ordinary HTTP cache, set the context offline, reload, and exercise keyboard Puzzle 01 at 390 px and desktop.
