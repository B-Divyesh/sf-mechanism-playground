# Mechanism Playground

A friendly, deterministic 2D construction toy for curious players, families,
and classrooms (ages 10+). Place ten kinds of gears, cams, linkages, levers, and
outputs on a cyanotype drawing board, snap their ports together, and turn the
hand crank to see motion travel. It is intentionally a kinematic learning toy,
not an engineering or material-stress simulator.

The app includes free build, ten local puzzle cards (five free and five in the
one-time Forge Edition), keyboard and touch controls, slow motion and position
scrubbing, undo, IndexedDB autosave, JSON import/export, and a complete offline
PWA shell. No account, advertising, analytics SDK, chat, or cloud project
storage is used.

Live: <https://mechanism-playground.sociobot.in>

## Run locally

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

Then open the URL printed by Vite. Production output is static:

```sh
npm test
npm run build       # writes dist/index.html
npm run preview
npm run test:e2e    # Chromium; run `npx playwright install chromium` once
```

## Controls

- Choose a drawer part and tap/click the drawing sheet, or drag it onto the
  sheet. Nearby round ports snap together.
- Drag a placed part, or focus it and use arrow keys to nudge. Press `R` to
  rotate, `Delete` to remove, `Space` to run/pause, and use Undo to reverse a
  board change.
- Select a puzzle card to load its crank and bell. Every required part must be
  in the powered crank-to-bell graph.
- “Blueprint file” exports and imports portable JSON; it never uploads data.

## Architecture and deployment

Vite + strict TypeScript with dependency-free SVG rendering. `src/engine.ts`
contains the deterministic snap graph and puzzle evaluation; `src/app.ts`
contains the workbench interaction and rendering. The service worker uses a
versioned app-shell cache, network-first navigation, and cache-first assets.
Deploy the contents of `dist/` as a static site; the factory owns DNS and
infrastructure.

Forge Edition uses only the Sociobot hosted checkout and license verification
contract. No payment provider is embedded in the app.

See [`.factory/design.md`](.factory/design.md) for the visual system and asset
provenance, and [`.factory/handoff.md`](.factory/handoff.md) for verification.

## License

MIT. Generated artwork is original to this product and included with the
project under the same license.
