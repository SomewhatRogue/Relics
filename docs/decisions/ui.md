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
- Step 2b, the town's shops and stores (`shop.css`, `stores.css`, the tiles in `cells.css`; no markup
  changed). The panel's shell (plate, rivets, well, the blackletter title, torchlight) and its bottom button
  row (CLOSE sunk, the main choice in gold leaf, the rest iron) now go on every panel over the game; a
  panel's body (its own buttons, its headings) goes iron screen by screen, through the list
  `#panel:has(.jlist, .shop, .store)` in ironui.css. The button variants are plain selector lists, not
  `:is()`, so each screen's own button rules still outweigh them. Shops: the keeper as a brass label, the
  goods as sunk slots with the picture in a small frame and the price in gold, the item card a forged panel
  with a brass hairline over its buttons, tabs sunk with the open one raised. Tiles (stores and the pack)
  are item frames: a sunk well with the tier's colour round it. Item names come in capitals, which the
  blackletter can't carry, so the card's name is in the bold sans for now. (Claude Opus 5.5)
- For the Trading chat: `tradeui.ts` builds on the shop's `.shop` and `.goods`, so the trade screen wears
  these through CSS alone. None of your markup changed; say in your log if anything reads wrong.
  (Claude Opus 5.5)
- Step 2c, the home cards (title.ts): `src/client/ironhome.css` (new, loaded by ironui.ts) overrides
  style.css's `#title .slot` rules, which stay as the fallback (style.css is shared; not edited). Each hero a
  forged plate, the hero in a sunk alcove, the name in the bold sans (hero names come in capitals), the
  class, level and gold in the small pixel face, PLAY in gold leaf, the dots iron, the hero's options sunk
  with DELETE edged red; NEW HERO iron, the recovery code sunk. Shots: `scripts/iron-home.cjs`. Same five
  test files fail to load as before (Art's sprites.ts at import). (Claude Opus 5.5)
- Step 3a, the hero panel and the pack (`pack.css`; no markup changed): the pack a forged panel, the hero in
  a sunk alcove with an item frame on each part, brass headings with a hairline, KNACKS iron and the cross
  sunk (both now 48 px), the card under the doll a sunk box, the relics' shelf a sunk well, every relic
  framed in gold leaf with the glint (and NEW and the empty slot's pulse in steps; all still with MOTION
  off). The shared panel rule no longer sets `position` on the pack (it is fixed); the pack's cross keeps
  skins.css's drawn X; the selected tile drops skins.css's bone outline for the gold one. Shots:
  `scripts/iron-pack.cjs`. (Claude Opus 5.5)
- Step 3b, the boss plate and the HUD bars (`hud.css`, an iron block at its foot; no markup changed): the
  boss plate a riveted iron plate (`--i-rivets`, new in ironui.css: four rivets as background layers, for a
  plate that can't take the frame image), a little see-through over the fight and kept short so the
  objective banner still clears it; the boss's name in the blackletter, the pair's names in the small pixel
  face. Every bar (health, stamina, magic, faith, the boss's) now sits in the sunk trough; every fill and
  state (the trail, poisoned, low, winded, the spell's cost mark, the Cleric's cut) is kept as it was. The
  hero's name in the small pixel face, the level on a gold-leaf badge. Shots: `scripts/iron-hud.cjs`.
  (Claude Opus 5.5)
- Steps 1 to 3 of the guide are in. Left: step 4, screens other chats own (the Deep's loot roll card and
  checkpoint, trading), class names only, asked in their logs or once they finish. Every panel over the game
  already wears the iron frame and button row; their bodies are theirs till then. (Claude Opus 5.5)

## 2026-11-13 (Claude Opus 5.5)

- Step 4, Kyle's go: the screens other chats own, restyled through the class names they already render, from
  a sheet of this chat's (`src/client/ironpeers.css`, loaded by ironui.ts). None of their files changed and no
  class names were needed. The rules are weighted (html, body, div) to sit over the owners' sheets; any of
  them can move into its owner's sheet whenever that chat likes. Shots: `scripts/iron-peers.cjs`.
  (Claude Opus 5.5)
- For the Deep chat (`rollcard.ts`, `loot.css`, `deepui.ts`, `deep.css`): the roll card is a riveted iron
  strip; the piece in a gold-leaf frame that pulses while it asks, its name in gold leaf with the glint, the
  time left an ember fuse that sparks, NEED in gold leaf, GREED iron, PASS sunk. Still the slim strip on a
  phone (Kyle, 2026-11-12) with the piece's lines folded, but the buttons are 48 px (were 34): the guide's
  touch size. A unique's line (`.uline`, here and on the item card) is a gift line in a sunk box, no longer
  teal italic. The checkpoint: each way on a sunk slot with a brass edge, its name in the small pixel face,
  the good green and the cost red; the party's choices under the brass rule. If a rule fights something
  you're building, say so in your log and it moves or goes. (Claude Opus 5.5)
- For the Trading chat: the trade window already wore the shop's iron (yesterday's note); now its gold steps
  (-100 to +100) are small iron keys, 48 px tall. (Claude Opus 5.5)
- All four steps of the guide are in. (Claude Opus 5.5)
- The top of the screen never hides danger (Kyle: "if UI is ever blocking an enemy or an important thing").
  New `src/client/uncover.ts`, drawing only, run each frame beside underbtn.ts:
  - The top line: on an upright phone, the lowest edge of what's docked at the top (unit frame, boss plate,
    tracker, loot roll card) is measured four times a second and handed to `phoneband.ts` (`setTopLine`,
    `HUD_LINE` 100 px: the unit frame and folded tracker with nothing extra up). `topPush()` is now the
    plate's push or the line's overhang, the larger, so both cameras make room under the roll card (and an
    opened tracker) the way they already did for the plate. Seen: the roll card up, the fight slides down
    about 100 px and both Doorkeepers clear it.
  - The fade: the unit frame, plate, tracker, roll card and corner buttons go to 30% (ironui.css
    `.uncovered`, in steps) while a live enemy's body, my hero or a red telegraph is under them, with a red
    notch (`.unotch`) on the lower edge over the danger. Still tappable. Shares underbtn.ts's telegraph
    shapes (`shape` now exported). Test: `tests/uncover.test.ts`. Shots: `scripts/iron-uncover.cjs`.
  Small edits in shared files: `phoneband.ts` (the line), `underbtn.ts` (the export), `main.ts` (two lines).
  For the Deep chat: the roll card counts in the top line while it shows; nothing in rollcard.ts changed.
  Not done: panels opening mid-fight, and the roll card folding to a chip when danger comes near (the
  Deep's card: theirs to say). (Claude Opus 5.5)
