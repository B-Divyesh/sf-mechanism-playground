# Mechanism Playground — visual thesis

## Direction: a living blueprint drafting sheet

Mechanism Playground should feel like a patient inventor has handed a child a
real drawing board: precise enough to teach, warm enough to touch. The interface
is a single-mode cyanotype workbench rather than a dashboard. A faint 16 px
drafting grid establishes scale; cream paper tabs carry explanations; moving
parts use crisp outlines, registration marks, and one vermilion pencil color for
energy and selection. The mechanism itself receives the visual weight.

This product intentionally has one dark blueprint treatment. Switching to a
light theme would dissolve the metaphor and lower the contrast of the white-line
mechanical drawing. All controls remain above WCAG AA contrast.

## Tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Deep blueprint | `--blue-950` | `#071e2f` | page background |
| Drawing board | `--blue-900` | `#0b2c43` | workbench and panels |
| Raised blueprint | `--blue-800` | `#123e59` | control surfaces |
| Grid line | `--blue-600` | `#2d617b` | non-text drafting grid |
| Chalk | `--paper-50` | `#f4f0df` | primary text and mechanism lines |
| Manila | `--paper-200` | `#d9d1b5` | secondary text (7:1+ on blue) |
| Pencil red | `--red-400` | `#ff765f` | primary action, selection, energy |
| Signal mint | `--mint-300` | `#7fe0c0` | solved/connected state |
| Amber | `--amber-300` | `#f6c667` | caution and paused state |
| Danger | `--danger-300` | `#ff9b93` | destructive/error text |

Focus is a 3 px vermilion/cream double ring; state is never expressed by color
alone. The palette comes from cyanotype paper, chalk lines, manila labels, and a
carpenter's red pencil.

## Type and spacing

Titles use self-hosted **Atkinson Hyperlegible Bold** when available, falling
back to `Arial`, because its open counters read like highly legible workshop
signage. Controls and measurements use the local system monospace stack
(`ui-monospace`, `SFMono-Regular`, `Consolas`) for drafting notation. The app
ships no third-party font request; a small licensed WOFF2 subset may be added
later, while the current system fallback preserves the intended contrast.

Scale: 12 px annotation, 14 px compact utility, 16 px body/control minimum,
20 px panel title, 28–38 px product title. Spacing follows a 4 px base with
8/12/16/24/32 px group intervals. Touch targets are at least 44 px.

## Layout and interaction grammar

Desktop is a drafting desk: a narrow part drawer on the left, the board in the
center, and a puzzle notebook on the right. On phones, the board stays primary;
the part drawer becomes a two-row horizontal tray and the notebook becomes a
bottom sheet. The header drops nonessential prose but retains mode, save, help,
and install/update state.

Parts are placed by selecting a drawer item and tapping the board, or by drag
and drop with a pointer. Snap points enlarge on approach. One selected part
reveals a contextual inspector near the bottom edge. Delete is undoable. The
hand crank is the single vermilion primary action; its rotation drives the
deterministic mechanism graph. Space toggles motion; arrow keys nudge; `R`
rotates; Delete removes; Escape clears selection.

## Motion policy

UI changes use 160–220 ms opacity/transform transitions and emerge from their
source (drawer, notebook edge, toast corner). Machine motion has physical logic
but no collision or inertial simulation: one shared phase is propagated through
connected parts, ensuring identical output for identical layouts. Rotation is
limited to 30 FPS in slow mode and 60 FPS in normal mode.

With `prefers-reduced-motion`, UI transforms become instant and the machine does
not auto-run; a scrub range and single-step button expose every state without
continuous animation. Nothing flashes or loops without an adjacent pause.

## Original asset plan and provenance

The interface icons and all mechanism drawings are hand-authored SVG/path art in
the application source under the MIT project license. One generated illustration
appears in the first-run lesson and social preview: a tabletop cyanotype drawing
of a whimsical crank-to-bell machine, visibly illustrative rather than a claim
about physics fidelity.

### Prompt sheet

- Subject: compact hand-cranked machine assembled from a large gear, small gear,
  eccentric cam, follower, linkage, lever and tiny bell; clear readable chain.
- World/materials: cyanotype technical drawing on worn deep-blue drafting paper,
  chalk and cream ink, faint square grid, carpenter's red pencil registration
  marks, subtle paper fibers.
- Light/lens: flat archival scan, orthographic overhead view, no perspective,
  even illumination.
- Palette words: midnight blueprint, chalk cream, manila, one vermilion accent,
  restrained mint completion mark.
- Negative list: no people or hands, no photorealism, no 3D render, no gradients,
  no UI, no text, no letters, no numbers, no watermark, no logos, no brands,
  no illegible pseudo-writing, no extra loose pieces outside the mechanism.

Generation: Azure OpenAI factory image deployment via
`/opt/fleet/lib/gen-image.sh`, generated 2026-08-27. The chosen result and prompt
sidecar live in `assets/src/`; optimized WebP output lives in `public/assets/`.
Generated imagery is original to this product and disclosed in the footer.
