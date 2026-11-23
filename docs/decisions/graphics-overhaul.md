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

## 2026-11-17: the knight's second pass: a model drawn as dark pixels

- Kyle on the first bench: "a little too HD or not stylized... I liked how it looked in that first-pass that you gave
  me to look at sizes, it was just a much cooler looking knight and characters in general." Then, with a screenshot of
  the scale test (the wizard, the knight and the hooded one at the finer size): "making it 3d but looking like a
  dark-pixel might be the play. otherwise it's sort of runescape-esque which i'm not really going for. I like the
  higher definition but pixel look in this screenshot a LOT. like i want these."
- What made the first knight read clean and 3D: big flat mid-grey shapes, thick bright gold bands, a square stance,
  shading that only multiplied one colour. What the reference figures do: nearly black with sparse highlights, gold as
  one-pixel lines, many small layered pieces, a big outline shape (hat, cloak, weapon), a pose.
- The second pass (`scripts/figures/knight.py`, `moves.py`): near-black blue steel in more pieces (two-lame pauldrons,
  waist lames, tassets, cuisses over mail, a beaked bascinet drawn to a point), gold only as 2.6 cm lines, a horsehair
  plume, a fur mantle, a cape to the ankle with a torn hem, a longer sword held forward, and a guard stance (a foot
  forward, the body turned behind the shield). The camera on a figure down from 25 degrees to 12, nearer the front,
  as the reference figures and the game's own sprites are drawn.
- The pixel pass, in the drawer (on the bench now; the game's when he goes in): each part's colour becomes four
  shades (two shadows turned toward blue, itself, a light turned warm), the light band kept small; a dark line where
  one joint's parts cross another's (drawn from each pixel's joint number); a cold edge on dark pixels at the lit
  side of the outline; a dark outline. Drawn in the 8 facings and frame steps only, never free.
- Size is now a number: the same model at 70 tall (a figure pixel half a world pixel) or 105 (a third), which is the
  finer look in Kyle's screenshot. The bench has both in the street and both rows in the comparison.
- `bake.py` now puts out the model and the big check picture by default; the baked sheet is an option (plain cel,
  since the final shading is the drawer's). Baked and live were measured the same, so live in steps is the way.
- The bench (same link, https://claude.ai/artifact/GgoKXqc7Arzz1NbNbL3Ypy): the four reference heroes at 70 and 105
  beside ours now, ours turned, and the first pass; then the street. Honest gap: theirs have hand-placed texture
  inside the shapes; ours are cleaner inside, and his red and his edge light are still stronger than theirs.
- Waiting on Kyle: is this the look; 70 or 105 (105 means the world at three times today's pixels to match, not two).
  (Claude Fable 5.2)

## 2026-11-17: the knight's third pass: the reference's design, and checker shading

- Kyle on the second pass: "I want the reference at 70 tall in that same sort of style. I get that it's a reference
  but that's the exact look and feel that I want, not what we've had to this point. That sort of pixel shaded but
  still clean look. Same at 105, so less about height, more about the actual design of the knight itself."
- The reference knight studied at its own pixels (docs/design/ref/heroes-four.jpg, the fourth figure). What it is made
  of: a greatsword held upright before him in both hands, the blade half a body again above the helm; a great cloak
  from the shoulders to the ankle that wraps him like a shell, dark outside, a red lining drawn in concentric rings,
  a gold line all round; round pauldrons under a collar plate with a gold edge; the waist in alternating light and
  dark bands; a wide stance, feet out. And how it is shaded: about four tones a colour from black to a pale light,
  with a one-pixel checker of two tones wherever they meet, black between the plates, a black outline, no edge light.
  That checker is the "pixel shaded" look.
- The third knight (`scripts/figures/knight.py`, our own model on those ideas; the picture itself is not used): all of
  the above. The sword has a joint of its own at the grip with both fists on it (rig.py: a pose can now move a joint
  as well as turn it), so the blow is the sword carried up and back, then over and down, the arms following. The
  cloak is three lengths of a sheet that curves round to flank him, carrying its lining's colour (kit.py `sheet`
  `inner`), its gold line laid just past its own edge so it shows from every side. The camera on a figure 6 degrees
  above level. `moves.py`: guard, walk (the sword carried upright), a two-handed overhead blow.
- The drawer's pixel pass now: four tones a colour (black, a dark, the part's own, a light) with the checker where
  two meet, the light kept rare; a cloak seen from the body's side draws its lining in rings round three centres;
  each part has a number, and a black line is drawn where two parts meet (never over gold); a dark outline. The
  edge light of the second pass is gone.
- On the bench (same link): the four reference heroes at 70 and 105 with ours from the front, turned and behind;
  then the street. Where ours still differs: stiffer (arms a straight bar, legs straight), plainer inside the plates,
  the rings more regular. It is a model shaded by rule beside a figure whose every pixel was placed.
- A note for the game: the Warrior blocks with a shield. This knight is the greatsword look; sword and shield wants
  its own guard on the same body, and each other class its own model on the same skeleton.
  (Claude Fable 5.2)

## 2026-11-17: the reference's look is not reached; stop iterating, choose where the art comes from

- Kyle on the third (3D) knight: "I prefer the design but can we just do it pixel, maybe we DON'T do it as a full 3d
  honestly. I kinda like the older pixel style." Then: "ours looks nothing like that reference, it looks fat and
  weird."
- He is right. Four tries now: a clean 3D knight, a dark one, one on the reference's own design, and (not published)
  the same design typed by hand as a pixel map at today's size and doubled by rule. The 3D ones come out wide and
  stiff; the hand-typed one a rectangle with a sword. None has the reference's slim, bent, hand-placed drawing.
- What that says: the look he wants is a skilled pixel artist's drawing. Shapes scripted in Blender and pixel maps
  typed by a model do not reach it, and more passes of either will not. Also seen: at today's pixel size (35 tall)
  the reference itself is an unreadable blob; it needs about 70.
- What did work and stays useful whatever the art's source: (1) the shrink (scale test): any good large drawing in
  that style becomes a clean 70 or 105 tall sprite with no blending, a locked palette and its outline back; (2) the
  game's own way of moving a sprite (cut into head, arms and legs, posed by figure.ts), which is the "older pixel
  style" of motion and works on any sprite; (3) smooth light and slate, which are live.
- So the question is where the drawings come from, not how to render them: (a) the artist or pack the reference
  pictures came from, licensed or commissioned, for exactly that look; (b) our own figures made with an image
  generator from a written description of the style (never from that artist's picture), then shrunk, cut and posed
  by the game: cheap to test on one knight, quality not known, and the generated sheets of 2026-11-15 were found
  flat, though those were whole animation sheets in another style; (c) today's sprites kept.
- The 3D knight's scripts stay in `scripts/figures/` as a record; nothing of them is in the game.
  (Claude Fable 5.2)

## 2026-11-17: a generated knight reaches the look

- Kyle: "Test generating one." Four takes of one knight in his ElevenLabs workspace from a written description of
  the style and the design (no picture given to the generator): 760 credits, about 15 cents. Then the size test's
  shrink (no blending left, 32 colours, the outline back) to 70 and 105 tall, beside the reference knight.
- All four sit in the reference's family: slim, dark plate, the greatsword upright in both hands, a cloak with a
  ringed red lining and a gold edge, pixel shading. The first try of any kind that does. Differences: steel a
  little greener and lighter, the lining a brighter red, shading a little smoother; one take keeps a magenta pixel at
  the sword's point (the cut-out's tolerance).
- Kept in docs/design/ref/knight-gen/ with the description used; the shrink as scripts/figures/shrink/sheet.html.
  The page: https://claude.ai/artifact/QqBTqamaBdq6zYtD5FNntv.
- Not shown yet: a back and a side, and motion. Next to prove: one take cut into head, arms and legs and moved by
  the game's own pose code (the older pixel style of motion), walking in a real street at 70.
  (Claude Fable 5.2)

## 2026-11-17: the generated knight walks in a 2.5D frame; credits out

- Kyle on the takes: "yes this is dope, can i see walking around? we'd want to update all enemies etc into this
  type as well too though ya? I also want to make sure we don't have a disjointed 3d look, we like the 2.5d."
- Walking, on the same page (https://claude.ai/artifact/QqBTqamaBdq6zYtD5FNntv): take 2 shrunk to 70 (or 105), cut
  by rule into the body and two legs (the steel below the tassets either side of the blade, the cloak's lining filled
  in behind them), the legs lifting in turn and shown shorter, as figure.ts moves a sprite now. He stands in a frame
  of the live game's 2.5D view of Wickhold's square (the view's own 366 by 229 pixels, HUD hidden), today's knight
  beside him. The demo's code is kept as scripts/figures/shrink/walk-demo.js.
- Front view only. The back and side views (the same knight from a reference of take 2) were refused: the
  ElevenLabs workspace is at 64,983 of 65,000 credits. Its counter resets about 2026-12-03, or Kyle tops up.
- His two questions. Enemies: yes, every goblin, butcher, boss and townsperson would be made the same way, or the
  new heroes would stand among figures of another kind. The 2.5D: these are flat sprites on cards, exactly what the
  2.5D view already stands in its 3D world, so nothing about the view changes; what will show is the world's plainer
  pieces (box trees, fences) beside finer figures, which is slice 4 of the sweep and the world at twice its pixels.
- Rough count for the art, at 190 credits a picture: a figure wants a front, back and side (3 pictures, a few takes
  each to choose from, so about 12, 2,300 credits); five classes with three looks each, about fifteen goblin kinds,
  a dozen bosses and a dozen townsfolk is some fifty figures: on the order of 100,000 to 150,000 credits before
  retakes, against a plan of 65,000 a month. Weapons and armour looks drawn by the game over the sprite, as now,
  keep that from multiplying.
  (Claude Fable 5.2)

## 2026-11-17: new figures paused; the overhaul goes slowly, a month's credits at a time

- Kyle: "any way that we can make this sort of knight in the standard drawn pixel style that we're doing today? If
  not we should pause it for now. I refill credits each month. Like we can slowly make the graphics overhaul as a
  whole but honestly it's sort of just the style that I like but not enough to full yolo into it yet."
- The answer given: only partly. At today's size (18 by about 35) the design's big ideas fit (a long cloak with a
  red lining and a gold edge, darker plate, the greatsword carried upright), and today's knight already has the
  closed helm, blackened plate and red cape; the fine look does not fit, since the reference itself is a blob at that
  size. So the new figures are **paused**, not dropped.
- Where they stand, to pick up when credits refill (65,000 a month, about a hundred kept pictures):
  1. The knight's back and side from take 2 as the reference, then a run (the same cut, a longer stride) and a blow.
     The first thing to learn is whether the generator keeps one character across views.
  2. One goblin and one more hero the same way; all three in the 2.5D view behind a switch.
  3. Then a few figures a month. Nothing new shown to players until a whole set (the five heroes and the common
     goblins) exists, so the game never has two kinds of figure at once.
  The takes, the description, the shrink and the walk demo are in docs/design/ref/knight-gen/ and
  scripts/figures/shrink/. The 3D knight's scripts stay as a record.
- Live and staying: smooth light, slate stone. Open again in the sweep: the rest of slice 2 (brightness tiers,
  dusk), slice 3 (phone readability), slices 4 to 7.
  (Claude Fable 5.2)

## 2026-11-17: a cloak-and-colours mock on the knight of today (shown, not in the game)

- Kyle said yes to a small mock. Two versions of Warrior look 1 at the size of today, drawn by the game code on the
  lineup page, beside the knight as he is: https://claude.ai/artifact/P6vwTqrcQ9FV4EuSmaZH1z
  - A: a charcoal cloak lined in red, steel a shade lighter and greener, the red surcoat stripe gone.
  - B: the red of today outside, a darker lining, the steel of today.
  - Both: the cloak widens two pixels a side toward the hem and carries a gold edge and hem.
- What it showed: the gold edge reads facing you; from behind A is a dark slab (the red cape is how the knight is
  picked out walking away), B keeps it; the steel change in A barely shows by torchlight. Shot on the flat lineup
  only, not in 2.5D.
- Nothing in the game changed. The mock is docs/design/ref/knight-cloak/cloak-mock.patch (git apply; then
  ?lineup=warrior&cloak or &cloak=red; it also adds a walking-away column to the lineup). If Kyle picks one it wants
  doing properly: no URL switch, the lookkit fields named for good, the herolife test run.
  (Claude Fable 5.2)

## 2026-11-17: the knight's cloak B is in, and his helm is closed from the side

- Kyle on the mock: "Ya B is good. this is solid btw fits our theme still." And: "I think I like the full face mask /
  templar style helmat more than seeing the face sideways."
- **Cloak B** (Warrior look 1, the sharp knight only): his red a touch brighter outside, a darker lining, the cloak two
  pixels wider a side toward the hem, a gold edge down its open sides and along the hem. Facing you, from behind and
  in profile. New file `src/client/capelined.ts` (the colours and the lined rows); a look asks for it with `lining`
  and `trim` (lookkit.ts `Life`); herolife.ts calls it from the cape's own loop, so sway, trail, wind and the eye
  dial's darkening carry over. The other two Warrior looks and `?sharp=0` are as they were.
- **The helm in profile**: the knight's side head was still the old open helm with a face. Now the closed great helm
  (`herosides.ts` `W_SIDE_HELM`): the visor slit at the front with one dim glint at the eye pixel (so the eye dial
  still reddens it), breathing holes under it. The neck under it is steel from the front and the side too
  (herolooks.ts `warrior`, `closed`). His hands are still bare; say if he should wear gauntlets.
- The lineup has a walking-away column now (`walk n`), so every look's back shows.
- The Art chat owns herolife.ts, herolooks.ts, lookkit.ts and lineupcast.ts: these are small edits with Kyle's
  go-ahead, as the board row says. charmean.ts is untouched (its `KNIGHT_CAPE` is no longer read).
- Checked: tsc clean; the full suite 1962 of 1963 run (the one failure is tests/relaybudget.test.ts, which fails on
  this PC without the change); the lineup shot before and after on the laptop size. Not shot in 2.5D or on a phone.
- Kyle also floated: "Or we make it like the shield - you can customize it (and we let all classes customize
  theirs)." Not built. It is a system of its own (a choice saved, sent to the party, a page at the barracks, a cloak
  or its like for five classes), so it wants a short spec and his yes first.
  (Claude Fable 5.2)

## 2026-11-17: a spec for cloaks chosen at the trainer, for every class (not built)

- Kyle said yes to a spec for his idea ("make it like the shield ... and we let all classes customize theirs"):
  docs/design/cloak-choice.md. A colour (the look as drawn, or the six fields of the shield), an edge (none, gold,
  silver, iron) and, for the Warrior, a cut; kept and sent as the shield is; drawn by swapping the colours of the
  cloth in each look before the sharp painting. Three slices: the Warrior first, then Ranger and Rogue, then Mage
  and Healer.
- It waits on six calls from Kyle (free or not, the default, the colours, the cut, the pale robe of the Healer, who
  builds it). Nothing is built.
  (Claude Fable 5.2)

## 2026-11-17: the cloak spec reworked: earned by deeds, made by a tailor (not built)

- Kyle: "Lets make it something you can unlock - also where does it come from? Like doing x number of things
  killing goblins, quests, etc let you unlock a new color or effect to a new article of clothing. Maybe its a new
  vendor in town."
- docs/design/cloak-choice.md now says: each dye, edge and cut is earned by a deed the game already counts (the
  tallies of the Roll of the Brave in shared/progress.ts, the level, the deepest floor, the hero quests), so nothing
  new is counted and deeds already done count; one tailor in town for all classes shows what is earned and how far
  along the rest is; only what is worn is saved. A first table of deeds is in the spec, its numbers first guesses
  for the balance thread.
- One rule written down: an effect is never red eyes, embers or ash, which are the mark of the eye dial.
- It waits on seven calls from Kyle. Nothing is built.
  (Claude Fable 5.2)

## 2026-11-17: the cloth choice, slice 1: deeds earn it, Hester the tailor makes it, the Warrior wears it

- Kyle: "Yes, build it" (the suggested answers in docs/design/cloak-choice.md: earned and free, deeds already done
  count, one tailor by Tobin, every Warrior keeps the lined cut, the Healer's robe stays pale, this chat builds
  slice 1).
- **The rules** (`src/shared/clothlook.ts`, pure): three rows (dye, edge, cut), entry 0 of each the look's own.
  `DEEDS` says what earns each entry, read from the tallies the game already keeps (`Profile.stats`, `deepBest`, the
  hero quests), so nothing new is counted. `earned`, `wearable` (drops what is not earned), `fitCloth`, a pack of
  three numbers. `tests/clothlook.test.ts`, 7 tests.
- **Kept and sent as the shield is**: `Profile.cloth` holds only what is worn (save.ts fits it against the tallies);
  `Hero.clothLook`; `Game.chooseCloth`; town presence carries `cl` and says it again when it changes.
- **Drawn** on the Warrior's cape only (`src/client/clothlife.ts`): the dye is the cape's two colours, the edge its
  trim (a hem line on a plain cape; the sides too on a lined one), the cut makes it lined or ragged. One line in
  herolife.ts asks for it. The six dyes are deep colours; WHITE is a bone white.
- **Hester the tailor** stands between the pawn stall and the trader's on the square (the old town: below Tobin).
  Her page (`src/client/clothui.ts`): the hero facing you and walking away in whatever is picked, the three rows,
  entries not earned dimmed. A dimmed entry can be looked at and says what earns it ("Not earned yet: BROUGHT HOME
  9 OF 25."); WEAR IT keeps only what is earned. Other classes get a line saying she has nothing cut for them yet.
- **Words**: her name and three lines went through one lore-keeper call and one line-editor call (both run as
  plain agents told to follow the repo's agent files, since this session has no such agent types). The lore keeper
  asks that she be recorded in the story bible as working old stock, never new cloth from outside: not done here,
  the lore files are not mine.
- **Checked**: tsc clean; the cloth test and the town tests; the full suite (see the commit); played in the local
  build at phone and laptop size: the page, a dimmed entry, wearing blue with an iron edge, and the cloak on the hero
  in the square. Not checked: two players seeing each other's cloth (it rides the same word as the shield), a real
  phone.
- **Known and left**: she is drawn as the plain villager, the same as Tobin beside her, and has no stall or sign of
  her own. Her first spot was in front of the hall's door, so she was moved between the stalls. The coin tally shows
  as a bare number. The page waits for her line to type out before the rows show, as the shield's does.
  (Claude Fable 5.2)

## 2026-11-17: bands are gone; smooth light is the light

- Kyle: "light (smooth) is the right option shoudl kill bands."
- The LIGHT button, its saved setting and `?light=` are removed (`lightswitch.ts` and its css deleted). The flat view
  draws smooth light wherever the device can (light.ts `full`); the old banded pass stays in light.ts only as what a
  device that cannot make the smooth pass falls back to. In 2.5D `SMOOTH_U` is fixed at 1; the stepped sums it
  switches off are still written in the shaders (post.ts, air3d.ts), left there because tests/fen.test.ts matches one
  of those lines. A device with "bands" saved from before simply gets smooth light.
- CLAUDE.md, "The look": "in stepped bands with a little ordered dither" now reads "in smooth pools of light over the
  crisp art".
- Checked: tsc clean; fen, daylight and cloth tests; both views and an old saved "bands" setting loaded in the local
  build at night with no errors and no button. The full suite ran a few minutes before on the cloth change (two
  known timing failures on this PC, relaybudget and the heavy hound test, which passes alone).
  (Claude Fable 5.2)

## 2026-11-17: the cloth choice, slice 2: the Ranger's and the Rogue's cloaks

- Kyle: "Yes, next two."
- Their cloth is part of the body, not a cape drawn behind it, so it is dyed in the pixels. A look now names the
  colours its cloth is drawn in (lookkit.ts `cloth`; herolooks.ts sets it for the Ranger and the Rogue). New file
  `src/client/clothsprites.ts`: `lookDefIn` and `heroLookIn` give a look in a chosen cloth, front, back and profile,
  made once and kept. A dye swaps the cloth's colours before the sharp painting; an edge is a line of metal along the
  hem (the lowest cloth in each column, within four rows of the cloak's foot). actors.ts asks for the hero's look
  through them (three lines). The trapper's fur edge is left as it is: only his hood and cloak take the dye.
- The rules: `rowsFor(cls)` in shared/clothlook.ts. The Warrior has dye, edge and cut; the Ranger and the Rogue dye
  and edge; the Mage and the Healer nothing yet. `wearable` now also drops a row the tailor has not for the class.
  Hester's page shows only the class's rows.
- Checked: tsc clean; the cloth test (9 tests); the full suite (see the commit); a sheet of all three looks of both
  classes in every dye with an edge, front, back and side, from the game's own drawing hook; the tailor's page as a
  Ranger on the phone size (wearing blue with an iron edge), and as a Mage (her line, no rows).
- Left: the small portraits (the unit frame, the pack, the Roll) still show the look undyed. Silver reads nearly white
  under the sharp painting.
  (Claude Fable 5.2)

## 2026-11-17: the tailor's page fixed (a tap closed it), locks that explain themselves, and slice 3: Mage and Healer

- Kyle, playing it: "not clear that things arn't available or are locked or how you unlock them and also when I click
  on one I just sort of...go back out of the shop? I don't get it."
- **The bug**: the page's own choices carried `data-i`, which the panel reads as one of its own buttons (panels.ts), so
  a tap on the second entry of any row pressed CLOSE and a tap on the first pressed WEAR IT. They carry `data-n` now.
  My check had clicked them by script and never looked at whether the panel was still up; the script now says so.
- **Locks**: an entry not earned shows a small padlock. Picking one says "WHITE is locked. You can look at it, but
  not wear it yet." Under the rows a list, LOCKED: HOW TO EARN EACH, gives every locked entry with its deed and how
  far along you are. WEAR IT and CLOSE stay pinned at the foot of the card while the list scrolls. These are plain
  labels; her spoken lines are unchanged.
- **Slice 3** (Kyle: "Yes, last two"): the Mage's robe, sleeves and hat take the dye, the edge is a line of metal at
  the robe's foot. The Healer's tabard takes the dye and the edge is the tabard's own metal: its edges, its hem and
  the Lantern. The friar has no tabard, so his habit and cowl take the dye and the edge runs along its foot (my call;
  Kyle can say it should stay brown). A look can now name the metal on its cloth (lookkit.ts `edge`); what moves (a
  hem, a hat's tip, a tabard's foot) is dyed with the body. All five classes have rows now.
- Checked: tsc clean; the cloth test; the full suite (see the commit); sheets of all three looks of the Mage and the
  Healer in every dye, front, back and side; the page on the phone size, tapped, still open, the list and the pinned
  buttons looked at.
- Kyle also asks to rethink how the pawn stall and the tailor look on the square ("kind of hard to tell and see
  them"): not started; to be proposed and mocked first.
  (Claude Fable 5.2)

## 2026-11-17: the tailor gets her own stall, and the market's stalls are told apart

- Kyle: "I also want us to look and rethink how the Pawnshop and Tailor look. Maybe we put them in a house and give
  them more space or something right or decorate their stalls, kind of hard to tell and see them." Offered: dress the
  stalls first, a shop building as the other way. Kyle: "Do it."
- **Found on the way**: Hester stood half a tile from MARKET ROW's spot at the seam of the two stalls, so a hero
  walking up from the square reached the market, not her. She was also drawn as the plain villager, the same as
  Tobin beside her.
- **Her own stall**, labelled TAILOR, the other side of the town hall's door from Tobin's (new town: 32.5 to 36.1
  by 18.5 to 21.1; she stands before it at 34.3, 21.7). The row now reads TAILOR, the hall's door, PAWN, the
  trader's. Standing before her, or to her side, reaches her; before Tobin, him; at the seam, MARKET ROW as before.
  The first spot tried put a lamp post inside the stall and tests/layout.test.ts caught it, so it sits 0.5 west.
- **Awnings**: the tailor's blue and cream, the pawnbroker's black and old gold; the trader's keeps the market's red
  and cream. **Wares** hang from the awning's front lip, where they show under it from the square: four cloaks with
  their hems on hers; a lantern, a pot, a shield and a sword on his. Nothing hung is walked into.
  `src/client/three/stalldress3d.ts` for 2.5D, `src/client/stalldress.ts` for the flat view (the awning, and one ware
  either side of the name). One line each in walls3d.ts and blocks.ts asks them.
- **Hester's look** (`tailor` in npcs.ts LOOKS): a madder dress edged in gold, a pale apron, grey hair past her ears
  and a bun.
- Checked: tsc clean; the town tests; the full suite (see the commit); both views on the laptop size by day, and who
  is reached from four standing places. Not looked at: the phone shot and the night shot (taken, no errors), a real
  phone. In the flat view a vendor still stands over the middle of their stall's name, as Tobin always has.
- Not done: a shop building for either. Say if the stalls are not enough.
  (Claude Fable 5.2)

## 2026-11-17: a player standing at a stall no longer takes the vendor's place

- Kyle: "trading is annoying a bit if another player is in front of a merchant." The game talked to whatever was
  nearest, and another player counted the same as a vendor, so someone standing at a stall took the tap ("TRADE:
  their name"). Offered three ways; Kyle picked the first: people, doors and spots always win, and a player is
  offered for a trade only when nothing else is in reach (as a Ranger's own hound already is).
- One change, `Game.near` in game.ts (a shared file): two passes over the same list, players second.
- Checked in the local build with a stand-in player: between you and Tobin, and on top of you at his stall, Tobin
  answers; alone on the square, "TRADE: FRIEND"; nobody about, nothing. tsc clean; the five test files that use
  `near` pass. Not checked with two real players.
- Cost of the rule: to trade with a friend who stands at a stall, both step a couple of paces away.
  (Claude Fable 5.2)

## 2026-11-19: the tile look, light pass, behind TILES and TILT

- Kyle, from a reference (SNES-era tile art, Chrono Trigger, but dark and gritty): keep one even pixel size on a tile
  grid, front-on chunky buildings, 3 to 5 shades a material with strong value contrast, light from one side, clean dark
  outlines, little grain; ours is night, torchlight, cold slate, grime. A light pass first inside the plan, a camera
  tilted up as a switch, a phone side-by-side of one Wickhold street before rolling out. (The reference picture did
  not come through to this session; built from his list.)
- In, behind switches only: `?tiles=1`, `?tilt=1` (or `?tilt=<degrees>`), TILES and TILT buttons under CAMERA in the
  options box, each saving and reloading (the grade is painted into cached canvases, the pitch into every card).
  Details in docs/design/graphics-overhaul.md, "The tile look"; what it moves in the slices is written there too.
- Found on the way: on a phone the 2.5D floor drew a tile about 19.5 render pixels across, so the floor's art pixels
  came out in uneven widths. Under TILES a tile is exactly 16 and the render scale is picked to keep the tiles across.
- First try had the floor the loudest thing on screen (mortar near black, stones bright); taken down to the bottom of
  the ladder and to more slabs than cobbles. The tilt first zoomed in (the view kept its floor area); now it keeps
  today's tiles across.
- New in the yardstick: a `street` spot (Wickhold at night, 24, 23: the JOBS house, the barracks, the stalls).
- Small edits outside my own files: `world.ts` (the floor's hook), `three/view3d.ts` (the 16 pixel tile, the zoom
  under TILT), `three/camera3d.ts` (one line, the pitch), `main.ts` (the buttons). Off the switches nothing changes:
  the pitch, the size sums and every shader are as before.
- Checked: tsc clean; the full suite 2199 passed, 1 skipped; the street and the square shot on the phone in 2.5D
  today, TILES, and TILES with TILT. Not looked at: laptop, the flat view, jobs and the Deep under TILES, a real phone.
  (Claude Opus 5.5)

## 2026-11-19: the tile look, Kyle's first try: too close, the walk too slow

- Kyle: "I think i like it but it makes walking speed seem superrrr slow. And its a little too zoomed in."
- Measured: the tiles across were about the same (a phone 10.5 against 10), but the even 16 pixel tile made figures
  about a fifth bigger against the floor (half again on a big phone), since they keep their own pixel size. Bigger
  bodies covering the same ground read as closer and slower.
- The even tile is now its own switch, `?even=1`, off; TILES keeps today's 2.5D scale exactly. A cobble street is now
  mostly small cobbles (slabs one tile in twelve), so the ground ticks past under a walk. The walk itself is untouched.
- Left as it is: TILT makes a walk up or down the screen cover about 15 percent fewer pixels (30 degrees against 36).
- Checked: tsc clean; the street on the phone in 2.5D against today's shot, same scale. (Claude Opus 5.5)

## 2026-11-19: TILES on by default

- Kyle, after the scale fix: "This is great post fix yes." Taken as yes to TILES as the default; TILT not called,
  so it stays a switch. `?tiles=0`, or the button, gives today's look until the old path comes out.
- Before flipping it, the whole yardstick under TILES (both views, phone and laptop): no page errors. Jobs on grass,
  the Open Cut and the Drowned Rat barely change (their floors are not cobble or flagstone). A village's street is
  stone, so it takes the tile grid: darker and colder than today's warm cobbles, goblins easier to pick out; a
  village on earth, not stone, is still slice 5.
- For other chats: your look scripts now shoot the tile look. Add `&tiles=0` for the old. (Claude Opus 5.5)

## 2026-11-19: the tile redraw, spec (slice 9)

- Kyle: "Yes" to the full redraw. Spec in docs/design/tile-redraw.md; nothing built.
- The core of it, found from the `?even=1` lesson: keep today's 2.5D scale (20 a tile, figures as they are) and look
  down at 36.87 degrees (sine 0.6, cosine 0.8), so a floor tile is exactly 20 by 12 render pixels and a wall 16 a
  tile of height. Floors and fronts drawn at that size give one even pixel everywhere. TILT's 30 does not fit and
  would come out.
- Art from a code-drawn tile kit (floors, walls, roofs, stamps for doors and windows), props as front-on cards
  (slice 4 folded in); figures stay slice 8's. The proof first: the floor and the JOBS house on the street.
- Waiting on Kyle: the grid, where the art comes from, the proof first. (Claude Opus 5.5)

## 2026-11-19: the tile redraw's proof (R0 and R1), behind ?redraw=1; TILT out

- Kyle's answers to the spec: "Whichever one was the today tilt and scene you linked" (today's angle: 36.87 is it,
  so TILT comes out), the art drawn by code, the proof first.
- **R0:** under REDRAW the 2.5D camera looks down at 36.87 degrees and a tile is 20 render pixels (the render scale
  picked per screen for the same tiles across), so a floor tile is 20 by 12 and a wall 16 a tile of height. A stone
  street or flags is drawn at that size from the kit (`tilekit.ts` `floorStamp`, `three/redrawfloor.ts`); what lies
  on it (soil, marks, water, scatter) is today's painting with its base left clear (`world.ts` paintMap `bare`),
  laid over stretched for now. Blood lands at the new size (`three/ground.ts`).
- **R1:** every roofed building (the same code as for one): four wall faces drawn (stone courses four pixels a
  course; or timber on daub over a stone plinth with braces; windows framed with a sill; a clear hole for the 3D
  door), and the roof's front slope (slate courses, or thatch) as a child of the roof, so it lifts with it
  (`three/redraw3d.ts`, small edits in `three/houses3d.ts`: no posts or window timbers in 3D under REDRAW). A building
  turned east or west keeps today's roof: its slope drawn showed a hatch, being seen side-on.
- TILT removed from `tilelook.ts` and the options; REDRAW is the second button there.
- Checked: tsc clean; the street and the square on the phone in 2.5D, against today's default. (Claude Opus 5.5)

## 2026-11-19: the tile redraw, R2 (the town), behind ?redraw=1

- Kyle, after the proof: "Continue." R2 in, still behind the switch.
- Every drawn face is now mapped by where its corners land on screen (`three/redraw3d.ts` `screenQuad`): one drawn
  pixel is one render pixel whichever way it faces. That let a turned building's roof be drawn (its slopes are seen
  side-on, so its courses run up the picture: `tilekit.ts` `roofCanvas` `side`); the hatch is gone.
- The town's level faces toward the camera drawn as courses with a coping, every flight's treads and the risers that
  face the camera (`three/layoutledges.ts`, small edits; the Town layout chat is finished). The first steps had a pale
  front edge on every tread and read as a grate: the edge is one shade up now.
- On the laptop the town had gone one slate (the church's pale front and the town hall's brown roof lost): each
  building's drawn walls and roof now take its own colours (`tilekit.ts` `tint`), still a handful of shades each.
  A timber house's daub takes its colour; its plinth stays stone. The street is a shade darker than the walls.
- Checked: tsc clean; the street at night, the church and the square by day on the phone and the church on the
  laptop, against today's default; no page errors. (Claude Opus 5.5)

## 2026-11-19: the tile redraw, R3 first part (props as cards), behind ?redraw=1

- Kyle: "Continue." Props as the flat view's own pictures stood up as cards (`three/propcards.ts`, mine): painted once
  by `drawRound` / `drawBlock` onto a scratch pair, cut to what was drawn, one sprite pixel to one render pixel as the
  figures are, snapped to whole render pixels. A map's round things share one picture and one mesh (a wood is one
  draw); a felled tree's rebuild redraws them. Hooks: `three/ground.ts` (the trees' rebuild and the other rounds) and
  `three/houses3d.ts` (stalls and tents).
- Tried and taken back on sight: benches, tables, casks and stumps as cards. The flat view paints them as plain slabs,
  which stood up read as crates, worse than the built ones. They stay built until the kit draws them.
- Checked: tsc clean; the whole yardstick under `redraw=1` on the phone, no page errors. (Claude Opus 5.5)

## 2026-11-19: the tile redraw, R3 second part (furniture, fences, walls), behind ?redraw=1

- Kyle: "Continue." Built by two Sonnet builders at once in this folder (no worktrees in this session: each built
  to its own folder and port, neither committed), reviewed here against the spec.
- Furniture and stumps drawn in the kit as cards filling their footprint (`tilefurn.ts`, `tilefurn2.ts`,
  `tilefurnkit.ts`, routed in `three/propcards.ts`). On review the square's benches read as dark tables (a plank top
  over the whole footprint): a bench's seat is now a narrow plank at the front, the floor behind it.
- Fences, hurdles, stone walls and rock walls drawn as screen-mapped faces (`tilefence.ts`, a two-line hook in
  `three/walls3d.ts`): posts and rails with the ground between, coursed stone with a coping. Not seen on any map: a
  fence or hurdle running north and south, and a rock wall. The tavern's tables lost the mugs the flat painting had.
- Checked: tsc clean; the whole yardstick under `redraw=1` on the phone, no page errors; the square, a village, a wood
  and the tavern against the first part's shots. (Claude Opus 5.5)
- Caught by the full suite: `tests/parity3d.test.ts` could not load, because the fence hook pulled in the camera, the
  camera the ground, the ground the prop cards and the flat view's sprites (which need a page). `three/redraw3d.ts`
  now reads the pitch from `tilelook.ts`. Suite then green.

## 2026-11-20: the tile redraw, R0 second half (what lies on the ground), behind ?redraw=1

- Kyle: "ya this is great please continue."
- On a stone floor under the redraw, what lies on it is no longer today's 16-a-tile picture stretched (uneven
  slivers: one-pixel columns beside two-pixel ones). The same painters paint onto the 20 by 12 grid
  (`three/redrawfloor.ts`): the soil through a new optional `at` grid on `soil.ts` `paintSoil` (Art's file, one
  parameter, today's grid by default); water, scatter, marks, grime, a job's rock shelves and torch feet through
  `onGrid`, which moves each rectangle onto the grid with its edges rounded to whole pixels, so a fleck stays one pixel.
  `world.ts` exports `ledge`; the `bare` option on `paintMap` came out again.
- Checked: tsc clean; the town on the phone, ground zoomed before and after: even two-by-two soil, square stones.
  (Claude Opus 5.5)

## 2026-11-20: figures flicking a pixel as the mouse moves (computer)

- Kyle: on a computer, moving the mouse round, figures "jitter in place a little", as if clipping into a spot.
- Cause found: the camera looks a little ahead of where your hero faces (the mouse, on a computer), so it eases as
  the mouse moves, snapped to whole pixels. With an odd view width or height the screen's middle is half a pixel, so
  under the redraw (a whole 20 pixels a tile) a figure's card sat exactly half a pixel off the floor's grid, and the
  rounding went either way by the float's noise as the camera moved. Measured in a 1511 by 981 window: the card's
  offset from a floor point was always x.50 down the screen before, whole after.
- Fix: the camera sits half a pixel over on an odd side (`three/camera3d.ts`), so the world's pixel grid lands on
  whole screen pixels (floor texels too); a figure's rounding gets a hair's bias so a tie always goes the same way
  (`three/figs3d.ts`). Small edits in both (finished chats' files). (Claude Opus 5.5)

## 2026-11-20: R4's floors; the hero's walk; REDRAW on by default

- R4's floors, by a Sonnet builder reviewed here: grass, dirt, mud, rock and planks as 20 by 12 stamps
  (`tilegrounds.ts`, routed in `three/redrawfloor.ts`); what lies on them is painted onto the same grid. Wheat keeps
  today's painting. On review: the wood's floor even, the dither under trees a clean shadow, each floor its material.
  Rock and mud are on no yardstick map; seen only as stamps.
- Kyle: "just walking around town the hero sort of stutters up and down or left and right ... like it's vibrating."
  Not reproduced here (software rendering is too slow for the camera's lag to show; the walk measured the same before
  and after). The likely cause at a real frame rate: the camera (eased, lagging) and the hero are rounded to whole
  pixels apart, so they step on different frames. Fix: the camera is the hero's whole-pixel spot plus its lag rounded
  on its own (`three/camera3d.ts` `follow` `anchor`, passed from `three/view3d.ts`). Waiting on Kyle to say if it holds.
- Kyle: "I think i like the redraw should we jsut have as standard." Yes: REDRAW on by default (`tilelook.ts`);
  `?redraw=0` or the button for the look before. Paint only; in town it adds 44 textures and 18 shapes to the frame.
  (Claude Opus 5.5)
- On the default: Node's tests have no page, so the switch read as unset and so on, and the 2.5D parity tests built
  fences through the drawn path. On by default in a page only; the tests keep building today's 3D. Suite green.

## 2026-11-20: villages on earth, wheat drawn (the redraw)

- Kyle: "dope. continue."
- A village lies on trodden earth under the redraw: a stone floor anywhere but the town (whose back is stone) is
  drawn as dirt (`three/redrawfloor.ts`). The first try keyed on a palisade behind, but a village job's map has trees
  behind; checked on the map itself. Slice 5's village base, approved with the plan. At dusk it reads very brown:
  for Kyle's eye.
- Wheat drawn as a stamp (`tilegrounds.ts`): dark earth, two rows of standing stalks a tile, an ear a shade up,
  some gone. Seen on a field job (Hobb's Acre) on the phone. (Claude Opus 5.5)
- The last box furniture drawn as cards by a Sonnet builder (`tilefurn3.ts`, two lines in `tilefurn.ts`): shelves,
  bookcases, racks, looms, dummies, booths, bunks, armour stands, bellows, fonts. Seen in the game: shelf, booth; the
  rest on a test page. Left built: hearths, partitions, pens, the monument, the gallows, stairs. Ten stray preview
  servers from the session's checks stopped by PID. Suite green. (Claude Opus 5.5)

## 2026-11-20: the town's animals, rats and folk know the new town

- Kyle: "the rats in the main town area etc. and some of those dont seem to recognize where they're at in the NEW
  map and should".
- Found (a throwaway probe over today's town): the rats' haunts were still the old town's points, unmoved (so they
  gathered mid-town, not at the grate or the Rat's step); the folk's work drawing told anvil from forge, tub from pond,
  block from pile by the old town's fixed spots (the old anvil's spot is inside today's church; the washerwoman's new
  round runs pond, tub, line west to east, so she'd have scrubbed at the pond); 15% of the hens' places were in a wall;
  the ducks walked through the handcart and the works board; in 2.5D animals and rats stood at ground height on the
  town's raised levels (the flat view already lifted them).
- Fixed: rat haunts moved with their districts (`rats.ts`, `townPoint`): the grate's at the grate; folk tell what they
  are at by which of their own round's stops they stand at (`folkwork.ts` `stopAt`), any layout; a flock kept on open
  ground at its own level (`townbeasts.ts` `keepOn`); the ducks' file round the cart and the board
  (`shared/layoutmove.ts` DUCKS); animals and rats on their level in 2.5D (`three/cards3d.ts`, `three/extras3d.ts`, one
  line each). Probe after: hens and ducks never in a wall, water (hens) or a cart. Small edits in finished chats' files.
  (Claude Opus 5.5)

## 2026-11-22: the living world spec; eight facings into slice 8

- Kyle: "Ya id like that" (a spec for making the world feel alive, edges first): `docs/design/living-world.md`,
  four slices (L1 edges, L2 what moves and reacts with more rats, L3 lived-in fronts, L4 each place its own), three
  questions for him. Nothing built.
- Kyle: diagonal walking for every unit, front- and back-diagonal drawn and mirrored, walks first, as part of the
  hero and enemy redraw, coordinated with New look: characters, one hero and one goblin in eight directions shown
  first. Written into graphics-overhaul.md slice 8 ("Eight facings"). Found: the facing is chosen in New look:
  characters' `charframe.ts` for its kit figures, but for the figures in the game by default in the Art chat's
  `actors.ts`, `npcs.ts`, `npcback.ts`, `hound.ts`, `foepose.ts`; so a shared `facing8` and the owner are put on the
  board's Collisions to settle. (Claude Opus 5.5)

## 2026-11-22: the living world, L1 (edges where materials meet)

- Kyle on the spec: "Ha looks good. Also not too too busy for two and kepe things silent for now" (order as written,
  a lightly peopled night street, silent). L1 built.
- `tileedges.ts` (mine): on the redraw's floor after the soil, each 2 by 2 block compared with its neighbours; where
  materials meet, edges drawn as tile art draws them, lit from the upper left (grass: shadowed lip below, lit fringe
  and the odd blade above; a patch set into the floor with a rim; mud wet-rimmed). `soil.ts` (Art's file, small
  edits): `calm` for the redraw's grid (a material per 2 by 2, colour from the slow noise only, a third of the
  flecks, tree shade one soft shadow) and `soilAt` (the material at a point, its boxes cached). Today's flat view
  painting unchanged.
- First try judged edges 4 by 4, so outlines showed every step of the staircase (the village's fields); 2 by 2 now.
- Seen, not L1's: a dithered shadow from the lighting pass under figures and trees; the town's raised level meets the
  ground below in a straight seam with no face. Checked: tsc clean; village, town by day, a wood on the phone, before
  and after. (Claude Opus 5.5)

## 2026-11-22: the living world, L2 (what moves and reacts)

- Kyle: "Continue." The frame here (`ambient.ts`, mine: one list of ambient figures a frame, at most 24, drawn as
  cards in 2.5D and sorted in by depth in the flat view; one-line hooks in `three/cards3d.ts` and `scene.ts`), the two
  halves by two Sonnet builders at once in this folder (each to its own build folder and port, no git), reviewed here.
- Town (`ambienttown.ts`): moths round lit lamps near a hero after dusk, bats over the roofs at dusk, the forge's
  sparks; five more rat haunts in `ratspots.ts`, each checked on open ground after the move into the new town.
- Wild (`ambientwild.ts`, `ambientwild2.ts`, `ambientwildkit.ts`): leaves under trees, birds flushing from cover,
  crows lifting as you pass (moved here from `streetlife.ts`, which no longer draws them), drips in mines. Reactions
  proven in a throwaway test (crows 0.1 to 2 tiles up with a hero 1.5 tiles off, back down after); not caught on
  screen. A flush's timing is a per-screen memo, not the room's: cosmetic, the trigger the same for all.
- Checked here: tsc clean; the town at dusk and at night on the phone, ambient figures present, no page errors; the
  builders' crops (leaves, a mine's drip, moths at a torch, sparks over the forge). Bats not told apart from pigeons in
  a still. (Claude Opus 5.5)

## 2026-11-22: living world L3, lived-in fronts

- Stone faces in the kit (`tilekit.ts` faceCanvas) get a grime band under the eaves, soot above each window, and
  ivy climbing from a foot corner on about a third of them. Plain tables are laid again with mugs and plates
  (`tilefurn.ts` `laid`).
- Wickhold's fronts (`townfronts.ts`, with `townfrontart.ts`, `townsigns.ts`, `townlaundry.ts`, all mine, built by a
  Sonnet builder): 12 doorstep things on 9 doors, 7 hanging signs with a trade picture and no words (forge, tavern,
  infirmary, lodge, counting house, tailor, pawnbroker), 2 laundry lines in the one lane wide enough, 3 notices
  pinned beside the JOBS board. Placed from the map's doors, so they follow a re-laid town; silent, Wickhold only.
- Open: the tavern's plank floor is speckled by the scatter painter, louder than the rest; some east-wall clutter
  sits under the eave in 2.5D.
- Checked: tsc clean; full suite 274 files passed; phone 2.5D crops of each kind, no page errors. (Claude Opus 5.5)
- Follow-up the same night: the tavern's speckle was its `sawdust` mark (hallfloor.ts, a tenth of the floor in pale
  flecks) painted onto the drawn planks; the redraw floor now lays sawdust and rushes the tile way, about one dull fleck
  or straw a tile (`three/redrawfloor.ts` `strewn`). Doorstep clutter on a side wall stands 0.6 out, clear of the eave;
  none on a back wall. L4 asked of Territories and the Deep's chat on the board (Collisions). (Claude Opus 5.5)
- Kyle, 2026-11-22: "i thought trees and wind and grass that moved etc were in here but i dont see them", then "we want
  beautiful and dynamic worlds that you impact". Since REDRAW became the default, trees, bushes and reeds are cards
  (propcards.ts) and the wind's bend (wind3d.ts `windify`) only reached the old 3D trees. Now `swayCards`: a card's top
  leans with the same gust plus a slow rock, at most 2 render pixels for trees and 1 for bushes, reeds and dead trees,
  snapped to whole pixels, the foot still. Felling still rebuilds the cards; mown rye and reeds are blocks, untouched.
  Checked: two frames of a wood differ only at the trees' edges and the hero; no shader errors; full suite passed.
  (Claude Opus 5.5)

## 2026-11-23: no boxes on the gate road; burning stalls burn

- Kyle: "the boxes on your way from the main entrance gate to the town square are extremely annoying please remove them".
  The market's crate pile (layoutmove.ts, at 46.1, 20.7, a solid round at the road's mouth into the square) and the
  two single crates moved with it are gone; the doorstep clutter (townfronts.ts) keeps off the gate road (x 42.5 to 49,
  y under 24). Checked in a phone 2.5D shot of the road.
- The redraw audit: a stall, tent or piece of furniture alight, charred or burned down now goes the old way with its
  flames (houses3d.ts `blockState(b) === 0` before the card path); as cards they burned without fire. Felling, mowing,
  decals, burning fences and houses were already kept. (Claude Opus 5.5)

