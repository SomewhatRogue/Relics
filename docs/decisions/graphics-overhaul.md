# Graphics sweep and overhaul: decisions

This chat's log for docs/design/graphics-overhaul.md. Plan first; nothing is built until Kyle says yes.

## 2026-11-17: the look read, the plan and the mocks

- Read every look spec and log (the look of 2026-10-31, art pass, dark and gold, the new look and its four chats,
  town layout, lived-in world, side view, the UI look and its mock canvas) and mapped the drawing: both views, the
  lit and glow layers, the light pass, the 2.5D post pass.
- Looked at the live build (main at 455468c) on a phone (390 by 844 at 3x) and a laptop (1280 by 800 at 2x), both
  views: the town by day and night, a village at dusk, a wood by day in fog and by night, the Open Cut, the Drowned
  Rat. This chat ran on a machine without Node, so no local build: headless Chrome against the deployed site, driven
  by a small script of its own (not in the repo).
- What the numbers say: the flat view paints a laptop at 427 by 267 and scales by 6; 2.5D at 366 by 229 and scales
  by 7 (a phone 5 and 6). The light's five bands, the fog's four, the vignette and the lamps' haze are all dithered
  at that size. That checker is the grain Kyle saw on a PC, more than the art.
- The plan (docs/design/graphics-overhaul.md): three changes first (clean light, a regrade by value and off the
  olive, one world with 2.5D as the look), then eight slices with their files, today's owners and how each is judged.
  Overlaps with Art, Lived-in world, New look: interiors, New look: characters and UI are listed there with a
  suggestion for each. No file claimed yet.
- The page for Kyle, with the screenshots and the mocks: https://claude.ai/artifact/LxogAoZ4Stfj95Mgm89tbj. The mocks
  light the game's own frames (the unlit art, the glow layer and the lights, captured from the live flat view) with
  the game's own shader, today against clean bands or smooth pools, and move stone from olive to slate on a slider.
  The art's pixels are the same on both sides.
- Waiting on Kyle: smooth pools or clean bands; how far to slate; whether the flat view is frozen as the fallback;
  whether Lived-in world and Side view move to Finished.
  (Claude Fable 5.2)

## 2026-11-17: Kyle's calls; building starts

- Kyle: smooth pools; slate at 90 to 100 percent; "Agreed with your slice"; flat is the weak-phone fallback and the
  polish goes to 2.5D; yes to moving Lived-in world and Side view to Finished (done on the board, at his word; this
  chat takes `three/air3d.ts` and the scatter). New: he wants to think about redrawing the heroes and enemies, "more
  stylized and cleaner, keeping the dark RPG look and feel": slice 8 in the spec, mocks first.
- To build here Kyle chose a portable Node in this session's folder (the official Node 26 zip, checksum checked,
  nothing installed on the machine), with the project's own `npm ci`.
  (Claude Fable 5.2)

## 2026-11-17: slice 0 (the yardstick) and slice 1 (smooth light) in

- **The yardstick:** `node scripts/sweep-look.cjs <tag> [url] [switches]` shoots eight fixed spots (town day and night,
  a village at dusk, a wood by day in fog and by night, the Open Cut, the Drowned Rat, a Mage's fight held still) in
  both views on a phone and a laptop, into `shots/sweep/<tag>/` with an `index.html` that lays them out as one sheet.
  The world's clock is pinned so a job's sky is the same each run; a new hero's arrival scene is ended first (in a door
  and out again). `ONLY=` reshoots a few; `CHANNEL=chrome` drives an installed Chrome.
- **LIGHT: SMOOTH or BANDS** (`client/lightswitch.ts`): a button in the options box under CAMERA, live, remembered on
  the device; `?light=smooth` or `?light=bands` wins. **Smooth is the default** (Kyle picked it from the mock); BANDS is
  the light as it was, kept to compare until he has played it, then it comes out.
- **Flat view** (`client/smoothlight.ts`, from `light.ts`): two draws. The light alone at the art's small size, unstepped
  (half floats where the device has them, bytes otherwise), with the fog's thickness beside it; then the picture at the
  screen's own pixels, the art and the glow read crisp and the light read back smooth. `scene.ts` makes the output
  canvas the screen's size while smooth is on (the art is still painted small). Fenmere's mist unstepped too
  (`fenmistdraw.ts` gained `mistRaw`; `mistK` is as it was). The same pass serves the hero ring, the lineup, the gear
  pages, the pastimes and the Deep's and the watch's views (they all use `Lighting`): checked the ring and the lineup.
- **2.5D** (`three/post.ts`, `three/air3d.ts`, one line in `view3d.ts`): one shared `uSmooth` in every toon material
  and the post pass. With it on, the light's five steps, the fog's four, the mist, the lamps' haze, the vignette and the
  glow's bloom are all unstepped and undithered. Outlines, telegraph hatching, see-through cards and the blob shadows
  under figures keep their dither (they are marks, not light). Here the light is smooth from one art pixel to the next,
  not inside a pixel as in the flat view: geometry in 2.5D is drawn at the art's size, so the light is too. If steps
  ever show, the next move is the light in its own buffer, laid on at the screen's pixels as flat does.
- A side effect to know: the bands rounded each channel of the night's ambient on its own (0.27, 0.25, 0.33 became
  0.2, 0.2, 0.4), which is where the violet night came from. Smooth keeps the numbers as written, so night is a
  little brighter and less violet. Slice 2 (the regrade) sets the night's colour on purpose.
- Checks: tsc clean; the full suite 1976 of 1977. The one failure, `tests/relaybudget.test.ts` (a heartbeat's write
  count against the clock), fails the same way on this Windows machine before any change, so it is this machine's
  timing, not the build. `tests/fen.test.ts` reads the mist's lines in `post.ts` and `light.ts` as text: kept as they
  were. Before and after sheets shot (`bands` and `smooth`). Not measured on a real phone; the flat view's second draw
  is three texture reads a pixel.
- For other chats: your look scripts now shoot the smooth light. Add `&light=bands` for the old.
  (Claude Fable 5.2)

## 2026-11-17: slice 2, first part: stone to slate

- Kyle: slate, 90 to 100 percent. The stone family's grade (`client/darkgold.ts`, one line and a named hue) goes from
  the green-grey at hue 90 to a slate at 214, the mock's own colour at about 95 percent; roofs of grey stone a step
  darker and bluer than before so a roof still parts from the wall under it. Moss, timber, rust, gold and the foe and
  folk rules are untouched, so moss now reads as the accent it was meant to be.
- Everything that goes through the grade follows: the floor and back walls, every block, the 2.5D buildings, rocks,
  the Lantern's dais and the statue. `three/darkgold3d.ts` knew stone by its green (to lay moss on low walls): now by
  its slate. The 2.5D retaining walls and steps (`three/layoutledges.ts`, the finished Town layout chat's) had their
  own violet outside the grade, which is why they glowed purple at night beside olive cobbles: now through the grade.
- Still to do in slice 2: the three brightness tiers (ground, walls and props, figures), faces less orange, the dusk
  and day tints against goblin skin. Those need the yardstick sheets side by side and Kyle's eye.
  (Claude Fable 5.2)

## 2026-11-17: slice 8, the mock: three ways to paint the same figures

- Kyle: "Yes, mock them" (the heroes and enemies, "more stylized and cleaner, keeping the dark RPG look and feel").
- Every figure is painted from its colour grid by one function (`charpaint.ts` `paintSharp`, from `sprites.ts`
  `makeSprite`), and capes and cloaks shade through the same `shade`. So a new look for every hero, goblin, boss and
  townsperson is one painter, with no sprite redrawn. Three painters tried, in a local build only (not committed, not in
  the game), shot with the game's own lineup page and in real play (the Open Cut, the town):
  - **A, clean:** lone near-tone pixels merged into their neighbours (the mail's checker, shading flecks), then flat
    shapes with one shadow (the far side of the body and the edges facing away) and one lit edge; black outline.
  - **B, ink and accent:** A, with everything but gold, strong red, goblin green and glowing eyes pushed dark and
    cool, and the lit edge a cold rim of light so a dark figure parts from a dark floor.
  - **C, bold:** A, a step brighter than the world, accents richer, faces paler and less orange, the outline a deep
    shade of the colour beside it in place of black.
- What the shots say: paint alone changes goblins, butchers and townsfolk a lot (today's speckle goes) and the knight
  least (his shield and cape cover him). Shapes were left alone: Kyle liked the redrawn knight and goblins on
  2026-11-16. The three can be mixed.
- On the page (https://claude.ai/artifact/LxogAoZ4Stfj95Mgm89tbj), first section. Waiting on Kyle's pick. Then the
  painter goes in behind a switch, with New look: characters' go-ahead for `charpaint.ts` (theirs) or folded into this
  chat at Kyle's word.
  (Claude Fable 5.2)

## 2026-11-17: the paints look alike; how many pixels a figure needs (research)

- Kyle on the three painters: "they all look kind of the same... it's not huge differences. Maybe we have too few
  pixels and need to do a LOT of pixels and then shrink down or something? ... lets do research and figure out how to
  do this right." So paint alone is not slice 8; no painter goes in.
- Why they look alike: a hero is 18 by about 35 pixels, some 350 filled pixels, a face three wide. Paint moves the
  colour of those pixels; it cannot add a shape. The pictures Kyle gave as the feel (docs/design/ref/heroes-four.jpg,
  hooded-reaper.jpg) are drawn about 100 pixels tall.
- The scale test (first section of the page): those reference figures cut out, shrunk to 35, 52, 70, 105 and 210
  pixels tall with no blending left (alpha snapped, a locked palette, the outline redrawn) and stood on a real shot of
  Wickhold's square at a hero's size on screen. At 35 nothing of them survives; at 70 (a figure pixel half a world
  pixel, 3 screen pixels on a 3x phone or retina laptop) they read as themselves.
- What the research says:
  - Detail is set by the final pixel count, not by how big the source was drawn. Shrinking a painting gives mud
    (blended edges, too many colours, stray pixels); it works only as a pipeline that shrinks without blending, locks
    the palette and puts the outline back.
  - Dead Cells is the known case of that pipeline: simple 3D models, a homebrew tool that "renders the mesh in a very
    small size and without antialiasing", figures about 50 pixels tall, a toon shader over normal maps. One artist;
    they chose it because every retake of a hand-drawn frame was too slow, and say they "chose animation over detail".
  - Tools exist for the other routes: PixelOver (bones over art, output as pixel art, not AI), and pixel-native
    generators such as PixelLab (a sprite as a skeleton to pose and turn, output on a true grid). Our own try with a
    general image model's sheets (New look: characters, 2026-11-15) was found flat and dear.
  - Tile and figure size are one decision in most games: 16 px tiles with figures about a tile and a half to two
    tall, 32 px tiles with figures 32 to 64. Mixing a finer figure onto a coarser world is what HD-2D does the other
    way round; here it would be figures at half-size pixels on today's 16 px world.
- What it means here: twice the height is four times the pixels in every frame of every pose, so typing pixel maps
  stops being the way to make figures. The routes: (1) simple 3D figures drawn straight into the 2.5D view at half-size
  pixels, banded and outlined (the Dead Cells way; turning, walking, striking and gear swaps come free; `?figs=3d` box
  figures and the parked `?hd` double resolution are a start; KayKit's rigged adventurers are CC0 and Kyle already
  works with that rig in another game); (2) each look's parts drawn once at double size and posed by today's pose code;
  (3) pixel-native generated sheets, cleaned up. Kyle said of 3D-looking figures on 2026-11-15 "that's lame", so (1)
  has to be judged in motion, as pixels, before anything is decided.
- Proposed next: a bench with one knight made each way at 70 tall in the same real street, walking and striking.
  Waiting on Kyle.
  Sources: gamedeveloper.com "Art Design Deep Dive: Using a 3D pipeline for 2D animation in Dead Cells";
  80.lv "Case study: Dead Cells character art pipeline"; pixelover.io/docs; kaylousberg.itch.io/kaykit-adventurers.
  (Claude Fable 5.2)

## 2026-11-17: Kyle wants the reference figures' look; the new-figures spec; a first knight in Blender

- Kyle on the scale test: 70 and 210 "both look so good, especially with 32 colors", "can we have both", "we'd have to
  rebuild EVERYTHING", "Basically I want those figures" (the knight's legs look weird), and builder agents and Blender
  on his PC are there to use.
- docs/design/new-figures.md: 70 tall and 32 colours in play; the same model with no visible pixels wherever a
  figure is shown big and still (so both, from one model); the world to 32 px a tile after. The references are other
  artists' work: their language, our own designs, a line a class. One skeleton, poses from the room's clocks, and the
  model either drawn live in 2.5D with a pixel pass or baked to sheets: the knight's bench decides.
- Blender 5.2 on Kyle's PC runs scripts headless. `scripts/figures/kit.py` and `knight.py` build and render a first
  knight (blackened plate, gold rims, crimson surcoat and cape, sword and heater shield) in about an hour. Put through
  the scale test's shrink beside the references (the page, last figure): the route works; the figure is plain and
  stout beside them, so the finish needs a real modelling pass. Not in the game.
- Next, on Kyle's word: the knight end to end (finished, rigged, walking and striking, in a real street at 70).
  (Claude Fable 5.2)

## 2026-11-17: the knight end to end (a bench, not in the game)

- Kyle: "Yes, do the knight." Rebuilt slimmer on a skeleton (`scripts/figures/rig.py`: joints, rigid parts, no
  skinning), with guard, walk and one sword blow as poses (`moves.py`: the walk by ground covered, the blow by its
  own time with the wind-up as the tell, as the room's clocks would drive them). `bake.py` puts out, in 16 seconds,
  a sheet of 160 frames (8 facings by 20, 70 pixels tall, no smoothing) and the model with every move's samples.
- The bench (https://claude.ai/artifact/GgoKXqc7Arzz1NbNbL3Ypy): the knight walked and struck with by keys or touch
  in three real frames of the live game (the Open Cut's street, Wickhold by day and night: the flat view's unlit art,
  glow and lights, captured), drawn at half-size pixels and lit by the game's smooth light, today's knight and
  goblins frozen in the frame beside him. Three ways to draw him: Blender's baked frames; the model drawn live in the
  same 8 facings and frame steps; the model drawn live and free. Plus the same model large and smooth.
- Measured: live in steps against baked, 25 poses and facings: the outline differs by 0 to 7 pixels of about 1,700
  and the colour by about 1 percent (one frame 13 percent, a band falling either side of its edge). So the two are
  the same picture, and the choice between them is about cost, not look: baked needs a sheet for every look and
  weapon; live needs none. Live and free is the one that shows edges crawling as he turns.
- What it is not: he is not in the game (no card, no switch, nothing in Art's or the characters chat's files). Three
  moves only. He walks over things, not behind them. The design is mine in the references' language and scripted from
  simple shapes; beside today's stocky knight he is slim and reads lighter, which a phone may not forgive.
- Waiting on Kyle: whether the figure is right in motion, and baked or live in steps. Then the game: a figure layer
  at twice the art's pixels in the 2.5D view, the hook where the parked `three/chars3d.ts` hung.
  (Claude Fable 5.2)
