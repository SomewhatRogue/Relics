# Decisions: the UI chat (the look, iron and ember: docs/design/ui-look.md)

From 2026-11-12. Newest at the bottom. Sign each entry with the model name.

## 2026-11-12 (Claude Opus 5.5)

- Took the UI row on the board. Owns `src/client/ironui.css`, `ironui.ts`, `scripts/iron-look.cjs` and the
  `.css` files it restyles. Markup in another chat's file gets class names only, asked here first.
  (Claude Opus 5.5)
- Step 1, `src/client/ironui.css`: the colour tokens (`--i-*`, the guide's table) and the parts: the panel
  (`.iron`: one 28 px pixel frame as a border-image holding the plate, its bevel, a brass rivet lit top-left
  in each corner and the sunk well's edge, so it scrolls with a long panel and needs no extra markup), the
  heading rule (`.irule`), buttons (`.ib` iron, `.ib.leaf` gold leaf, `.ib.sunk`; pressed flips the bevel;
  48 px), bars (`.ibar` with `.gold`, `.green`, `.red`, ember by default, `.fuse` sparks at the end), item
  frames (`.iframe` in the tier's `--t`, `.leaf` with the glint, `.hungry` green, `.wait` pulses), gold-leaf
  words (`.ileaf`), the gift box (`.igift`), brass labels (`.ilabel`) and torchlight behind a panel
  (`.itorch`). All motion moves in steps. Fonts: Silkscreen labels, Grenze Gotisch names, Alegreya Sans
  sentences, all bundled already. (Claude Opus 5.5)
- The MOTION switch: `src/client/ironui.ts` loads the sheet and wires a MOTION button in the gear box
  (one line in index.html, two in main.ts). Off sets `data-still` on <html> and the glints, pulses, sparks and
  flicker stand still. Remembered on the device; with no choice, a phone that asks for less motion starts
  still. Test: `tests/ironui.test.ts`. (Claude Opus 5.5)
- Step 2a, the job board and the map table (`board.css`, no markup changed: `boardui.ts` is Art's): the
  panel is iron through `#panel:has(.jlist)`; each job a sunk slot with its kind's colour down the left edge,
  the title in Alegreya Sans, tags and pay in Silkscreen, danger as sunk studs lit red; the card a forged
  panel with the blackletter title, the posting in a sunk box, brass labels, TAKE THE JOB in gold leaf,
  GATHER A PARTY iron, BACK sunk. Torchlight flickers behind. Phone shots via `scripts/iron-look.cjs`.
  (Claude Opus 5.5)
- For the Art chat: on main today five test files fail to load (raise, rats, recapboard, runux, wading):
  `src/client/sprites.ts:114` makes canvases at import, and there is no `document` in Node. Not from this
  chat's changes (same failure with them stashed). (Claude Opus 5.5)
