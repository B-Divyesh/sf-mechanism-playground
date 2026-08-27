# Independent release verification — FAIL

**Candidate:** `ff07db21a8882b03082c97c726076ac94f797c19`  
**Production URL:** https://mechanism-playground.sociobot.in/  
**Verified:** 2026-08-27 UTC

## Decision

**FAIL — do not release this candidate.** The full browser suite fails on a 390 px phone and the production URL does not serve the candidate that was tested.

## Defects

### High — H1: production does not identify as the tested candidate

The candidate build produced `dist/index.html` SHA-256 `1f24cb08a27e853ea5e5c45e4fbf2cdc007147faf432d6ad8edf2a4a0cb0538d` and referenced `/assets/index-CClMJpw1.js` and `/assets/index-Vp2DNR6w.css`. Production returned root SHA-256 `3e0b8dbfd6d5f41e393e9c3bd57c4b662de51051e3c4e156c480573404604f27`, referencing `/assets/index-DJUlDQtU.js` and `/assets/index-429qQlkG.css`. The root documents differ in length (9,179 vs 9,478 bytes), content, and import-error strings. A release gate cannot approve a commit that the public URL does not serve.

### Medium — M1: local Blueprint file tools are inaccessible at 390 px

At `max-width: 680px`, `src/styles.css` applies `.text-button { display: none; }`. The only entry point for the advertised **Blueprint file** import/export dialog uses that class. A keyboard, touch, or screen-reader user on a 390 px phone cannot export local work or import a blueprint.

Fresh `npm run test:e2e` result: **10 passed, 2 failed**. Both mobile import regressions timed out waiting for the hidden `Blueprint file` button: `rejects a quote-containing imported part ID without interpreting it as markup` and `rejects unknown imported part types and lets the player recover with a valid blueprint`. This violates the mobile-friendly, local-first PWA contract and fails the required full test gate.

## Fresh local evidence

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities |
| `npm test` | Passed; 5/5 Vitest tests |
| `npm run build` | Passed; TypeScript `--noEmit` and Vite build produced `dist/` |
| `npm run test:e2e` | **Failed: 10 passed, 2 failed** (M1) |
| Lint/type scripts | No lint script is declared; the production build performs the available TypeScript check |

Candidate bundle sizes: JavaScript 24,076 B raw / 8,870 B gzip; CSS 13,587 B raw / 3,650 B gzip; illustration 47,036 B. The manifest parsed with standalone display, versioned start URL, and 192, 512, and maskable icons.

## Product, accessibility, privacy, and PWA exercise

I exercised the deployed product separately on desktop (1440x900) and mobile (390x844). On both, Puzzle 01 solved after placing the small gear; keyboard `R` changed it to 45 degrees; malformed JSON kept the dialog open with a parse error; quote-containing IDs and unknown types were rejected; and a subsequent valid import recovered. The hostile-ID attempt did not set the test-only `data-qa-executed` body value.

Both live viewports had one `h1`, `lang=en`, a `main` landmark, no horizontal overflow, visible 3 px focus on the first-tab Skip to workbench link, no console or page errors, and zero axe serious/critical findings. Reduced motion on mobile set transition duration to `0.00001s` and started paused. After the service worker became ready, an offline reload displayed the app and offline banner.

Normal first-visit requests were same-origin only. Source inspection found no analytics, chat, or third-party font/script; it uses IndexedDB/localStorage locally and only contacts `https://api.sociobot.in` after optional license restore/verification. Live responses provided a restrictive CSP, HSTS, strict referrer policy, nosniff, immutable hashed-asset/icon caching, revalidating HTML, manifest MIME, and no-cache/no-store `sw.js`.

Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, CLS 0.035, TBT 20 ms. These positive results apply to the different deployed build, not this candidate.

## Required next steps

1. Restore a visible/focusable mobile Blueprint-file path and make both 390 px import tests pass.
2. Deploy the exact candidate output and compare root and referenced hashed assets with a fresh `npm run build` before requesting approval again.
3. Rerun `npm ci && npm test && npm run build && npm run test:e2e`, browser smoke tests, and the deployment identity comparison.
