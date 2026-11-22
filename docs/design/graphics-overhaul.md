# Graphics sweep and overhaul

Plan, 2026-11-17 (Kyle and Claude Fable 5.2). Approved the same day; built slice by slice. **In so far: slices 0
and 1** (the yardstick; smooth light in both views), slice 2's first part (slate), and **the tile look's light pass**
(2026-11-19, below): TILES on by default at Kyle's yes; TILT taken out (Kyle kept today's angle).
The assessment with screenshots and the side-by-side mocks are on the page linked from docs/decisions/graphics-overhaul.md.

## Kyle's calls, 2026-11-17

- **Light: smooth pools.** No bands, no dither; the art's pixels untouched.
- **Stone: slate, 90 to 100 percent** of the way from today's olive.
- **The slices as written:** "Agreed with your slice."
- **The flat view is the weak-phone fallback; the polish goes into 2.5D.** Flat still gets the shared work (the light,
  the grade, the ground), since both views paint from the same art, but nothing is drawn for flat alone from here.
- **Lived-in world and Side view to Finished;** this chat takes `three/air3d.ts` and the scatter.
- **New, to think about: the heroes and enemies redrawn**, "more stylized and cleaner, keeping the dark RPG look and
  feel." Slice 8 below: mocks first, no drawing until he has picked a direction.

## The tile look (Kyle, 2026-11-19)

A new direction for the sweep, from a reference Kyle likes: SNES-era 16-bit tile art (Chrono Trigger the reference),
but dark and gritty. **Kept from it:** one even pixel size on a tile grid (ground, cobbles, walls laid tile by tile),
buildings seen front-on with chunky readable shapes, a limited palette a material (3 to 5 shades, strong value
contrast), light from one side, clean dark outlines on characters and props, very little noise or grain. **Ours:**
night and torchlight, cold slate, grime, damp and soot; warm light only from torches, braziers and windows. Plus the
camera tilted up a little, toward the reference's angle, as a switch to compare.

**The light pass** (in, behind switches, 2026-11-19). `?tiles=1` and `?tilt=1` (or `?tilt=<degrees>`), TILES and
TILT buttons in the options box (each saves and reloads; `client/tilelook.ts`):
- **A few shades a material** (`darkgold.ts` `tileHex`): stone snapped to five slate shades, roofs five a step darker,
  timber four, each with its lightness pushed apart first. One hue a material, no near-greys. Pale greys (lettering,
  bone), gold, moss, cloth and every figure keep the normal rules.
- **The stone floor laid tile by tile** (`tilefloor.ts`, from `world.ts`): each 16 pixel tile is four cobbles, two
  half slabs or one slab, lit from the upper left, in dark mortar, no flecks; moss in short runs in the joints. Kept
  to the bottom of the ladder so the ground stays the quietest tier. Cobble and flagstone floors only.
- **Even pixels in 2.5D, now its own switch `?even=1`** (`three/view3d.ts`; off by default since Kyle's first try: figures
  keep their own size, so they stood about a fifth bigger against the floor, which read as too close and a slow walk).
  With it a tile is exactly 16 render pixels across (it was about 19.5 on a
  phone, so floor pixels came out uneven widths); the render scale is picked to keep about as many tiles on screen.
  Everything in the tile floor that runs across is two pixels tall, so at 30 degrees (exactly half the rows) every
  floor pixel is the same size, and at 36 none drops out.
- **Outlines** (`three/post.ts`, `three/figmat.ts`): a figure's own edge pixels drawn near black; the depth outline
  round anything in front of something further off nearly black too, not a darker shade of its own colour.
- **Less grain:** no flecks in the stone floor; a third as much moss on 2.5D roofs and walls (`three/darkgold3d.ts`).
- **TILT** (`three/camera3d.ts`): the 2.5D camera at 30 degrees in place of 36, the same tiles across (so it shows
  more rows, fronts a little taller, floors a little shorter). The flat view is untouched.
- Not done in the light pass: light from one side beyond the floor's own stones (the moon and sky lights are the
  Performance sweep chat's `lights3d.ts`); walls laid tile by tile on the 2.5D buildings (they are coloured boxes, so
  that is the redraw below); the village's earth ground.

**Judged by:** the phone side-by-side of one Wickhold street (`node scripts/sweep-look.cjs <tag> <url> "tiles=1"`,
the new `street` spot, between the JOBS house and the barracks) and the square. **Kyle, 2026-11-19: "This is great"** (after the
scale fix): TILES is the default (`?tiles=0` or the button for today's look, kept a while to compare). TILT not
called yet. Next his call: whether the full redraw is worth it.

**The full redraw** (Kyle's later call, once the light pass has been seen): drawn tiles and sprite sheets, the
buildings as drawn fronts rather than coloured boxes. Its own spec when it comes.

## The three changes that would make the biggest difference

1. **Clean light: take the checker out.** The grain on a PC is not the art, it is the light. Both views shade in five
   bands and blur each band's edge with an ordered dither, at the art's pixel size. The 2.5D view paints a 1280 by 800
   laptop at 366 by 229 and shows each of those pixels 7 device pixels wide (the flat view 427 by 267, 6 wide; a phone
   6 and 5), so every lit edge, every fog band, the vignette and the lamps' haze become a field of 7 pixel squares
   across the whole screen. Light the same crisp art with light that has no dither: either clean bands or smooth
   pools. The art's pixels stay exactly as they are and stay even.
2. **Regrade by value, and come off the olive.** Dark and gold turned every stone to one green-grey. By day Wickhold's
   cobbles, steps, plinth, walls and roofs sit in the same olive at nearly the same brightness, and the only things
   that separate are orange faces. Stone goes back to a cool slate (moss stays, as an accent), and the picture is
   ordered in three tiers: the ground darkest and quietest, walls and props a step up, people and goblins the
   strongest contrast on screen. Firelight stays the only warm thing.
3. **One world, drawn once.** The two views disagree: trees, benches, lamp posts, fences, steps and buildings are
   different objects in each (screenshots on the page). 2.5D has been the default since 2026-11-03; make it the look,
   freeze the flat view as the fallback for weak phones, and bring 2.5D's props up to the painted figures beside them
   (its trees and fences are plain coloured boxes next to sharp sprites).

Mocks for 1 and 2 are built from the live game's own frames (its unlit art, its glow layer and its lights), so what
they show is what the change would draw. 3 is a call about where the work goes, shown with paired screenshots.

## Settled, not reopened here

- 1.5x bodies, about 12 tiles across a phone, even pixels (art-pass.md). The camera's tilt was settled too; Kyle
  reopened it on 2026-11-19 as the TILT switch, to compare (the tile look, above).
- The HD street look (`?look=3d&hd&street`: generated kit, chase camera, 32 px tiles) is parked and stays parked.
  Nothing in this plan raises the art's resolution or mixes pixel sizes.
- The UI is iron and ember (ui-look.md). Not touched, except where it sits over the fight (slice 3).
- The new three-level town is the default. `?sharp` figures are on for everyone. CAMERA and LIVING WORLD stay options.
- The fight: drawing never changes it. Every slice here is paint only; no sim, no tuning, no netcode.

## What I looked at

The live build (main at 455468c) in headless Chrome, a phone (390 by 844 at 3x, touch) and a laptop (1280 by 800 at
2x), both views: Wickhold by day and night, a village job at dusk, a wood by day in fog and by night, the Open Cut's
first street, the Drowned Rat. (No Node on the machine this chat ran on, so no local build; the deployed site is main.)

## Assessment

**Looks good**
- Night with fire. The Open Cut's street and the town's lamp pools: warm in cool, the idea approved on 2026-10-31,
  still the game's best picture.
- The figures. The sharper heroes, the meaner knight and goblins: they read at phone size, the red eyes carry.
- The UI. Iron and ember is the most finished thing on screen and consistent everywhere I opened it.
- The millpond's water, the red floor telegraphs, the town's levels.

**Dated or inconsistent**
- The checker (change 1). Worst by day in fog, where the whole screen is dither; visible on every lamp pool at night.
- The olive monotone by day (change 2). Dusk washes a village to one ochre; goblin skin lands on the ground's colour.
- Two views, two worlds (change 3). Same spot, different trees, benches, lamps (a torch on a pole in 2.5D, a lantern
  post flat), fences, steps (violet in 2.5D, olive flat) and buildings (a front wall in 2.5D, a brown slab seen from
  above flat).
- 2.5D's props against its figures: trees as lumps of boxes, a village fence that reads as a strip of noise.
- The ground. One cobble pattern under everything, a village's ploughland included; strong mortar lines everywhere
  compete with the figures standing on them; many lone pixels (flecks, scatter).
- Interiors. The Drowned Rat is brown boards, brown tables and townsfolk in dark coats: figures and furniture sink.

**Reads badly on a phone**
- A wood at night: fog and dark together leave about three tiles round the hero; goblins beyond are found by their
  eyes only, on a laptop too.
- The Drowned Rat and other dark rooms: people you talk to are hard to find.
- The fight's floating words stack on your own hero (two kill lines and three numbers in one spot in my shot).
- A boss plate sits over the boss at the top of an upright phone.
- The playfield is the top 63 percent of an upright phone (the controls take the rest), about 390 by 530: everything
  above has to work in that window.

## Slices

Order matters: 0, then 1, then 2 (so colour is judged under the new light), then 3, then the rest in any order.
**What the tile look moved (2026-11-19, TILES kept):** its ladder *is* slice 2's grade (the three tiers are
then judged under it, not on the old curve), its floor *is* slice 5's stone ground (slice 5 keeps the village's earth
and the scatter), and its outlines come before slice 8's figure mocks (which then start from outlined figures).
Slice 4 (2.5D props redrawn from the flat sprites) waits on Kyle's call on slice 9: if the full redraw goes ahead,
4 is folded into it rather than done twice. Slices 3, 6 and 7 are unchanged.
Main chat in stages; a Sonnet builder only for slice 4's narrow prop families. Each visual slice goes behind a switch
first (an address switch and an options button, as CAMERA and LIVING WORLD do), flips to default on Kyle's yes, and
the old path comes out a slice later.

| # | Slice | What changes | Files | Owner now | Judged by |
| --- | --- | --- | --- | --- | --- |
| 0 | The yardstick | One script that shoots eight fixed spots (town day, town night, village dusk, wood day in fog, wood night, the Open Cut, the Rat, a spell fight), both views, phone and laptop, into one contact sheet, hour and seed held | new `scripts/sweep-look.cjs` | this plan | Before and after any slice is two sheets side by side; no slice lands without one |
| 1a | Clean light, flat view | The light pass loses its dither; Kyle picks clean bands or smooth pools from the mock. Smooth: the light is worked out at the art's size into its own small buffer, read back smooth, and laid over the art read crisp, at the screen's pixels (cheap: no more light maths than now) | `src/client/light.ts`, `scene.ts` (the output canvas's size, a few lines) | light.ts unclaimed; scene.ts shared (Lived-in world and Town quests have lines in it) | The yardstick sheet: no checker anywhere at laptop size; art pixels unchanged (a diff of the unlit layer is empty); phone frame time no worse |
| 1b | Clean light, 2.5D | The same choice in the 3D materials and post pass: `toonize` without dither (more, cleaner bands) or light kept in its own buffer and laid on smooth; fog, Fenmere's mist, the vignette and the lamps' haze lose their dither too. Outlines stay | `three/post.ts`, `three/figmat.ts`, `three/air3d.ts`, `fenmistdraw.ts`, `three/hdlook.ts` (read for its smooth path, not switched on) | post.ts and air3d.ts: Lived-in world (air3d is theirs, post.ts has their lines); the rest unclaimed | As 1a; plus the same lamp pool looks the same in both views |
| 2 | Regrade | Stone from olive to cool slate with moss as an accent; three value tiers (ground, walls and props, figures); faces less orange; dusk and day tints that keep goblins off the ground's colour; 2.5D's violet steps and faces brought into the same grade | `src/client/darkgold.ts`, `darkfoe.ts`, `three/darkgold3d.ts`, `levelpaint.ts`, `groundpaint.ts` (colour tables only), `blocklook.ts` (the colour table), the sky tints (`skyfx.ts`, `lights3d.ts`) | darkgold*, levelpaint: their chats are finished, unclaimed; blocklook.ts: Art (heights), ask for the table; rest unclaimed | Each yardstick shot in greyscale: heroes, goblins, townsfolk and doors still pick out. Kyle's eye on phone and laptop |
| 3 | Phone readability | Night and fog: a higher floor under the darkest band and fog that starts further out, so a goblin is a body before it is two eyes. Dark rooms: boards a step lighter than coats. Floating words: spaced, one line an event, never over your own hero. Boss plate clear of the boss on an upright phone | `light.ts`, `three/post.ts` (FOG_BANDS, the floors), `skyfx.ts`; `fx.ts`, `gore.ts` (the words); `hud.css` (boss plate); `insidepaint.ts`, `three/insidefurn3d.ts` | fog and words unclaimed; hud.css: UI; insides: New look: interiors | On the phone sheet: every goblin on screen countable in the night wood; every townsperson in the Rat findable; no two words overlapping |
| 4 | One world: 2.5D's props painted | Kyle's call first: flat view frozen as the fallback. Then 2.5D prop families one at a time, each drawn from the flat view's painted sprite so both views show the same object: trees and bushes, fences, lamp posts and torches, benches and stalls, steps and ledges, then building fronts | `three/rounds3d.ts`, `nature3d.ts`, `fence3d.ts`, `lamps3d.ts`, `props3d.ts`, `houses3d.ts`, `buildings3d.ts`, `roofs3d.ts`, `three/ground.ts` | rounds3d, ground, buildings3d: Lived-in world has lines; `lampsdraw.ts`, `propsdraw.ts`, `cards3d.ts`: Art; the rest unclaimed | The same spot in both views shows the same things; nothing in 2.5D reads as a lump beside a figure |
| 5 | A quieter ground, by place | A village's base is earth and grass, not cobbles; mortar and joints lower in contrast so floors recede; flecks and scatter in clusters of two or three pixels in place of lone ones | `groundpaint.ts`, `soil.ts`, `world.ts` (paintMap), `scatterpaint.ts`, `shared/ground.ts` (which base a place gets) | scatterpaint: Lived-in world; world.ts has their line; rest unclaimed | Sheet: the floor never the busiest thing in a shot. Layout hash pins unchanged (paint only) |
| 6 | Interiors | The six big rooms and job houses under slice 2's value rule: floor, furniture, people in three steps; lamps doing the work | `insidepaint.ts`, `three/insidefurn3d.ts`, `insidekit.ts`, `furnish.ts` | New look: interiors | Their chat's own shots; findable people on a phone |
| 7 | Spells and effects | One language for what glows: spells and fire bloom a little under the clean light, red stays for danger only, element colours checked against the new grade | `spellground.ts`, `three/skills3d.ts`, `fire3d.ts`, `fx.ts` | unclaimed; the Deep and Instances chats' own boss effects stay theirs | The spell fight shot: every effect readable, red only where you must move |
| 8 | Heroes and enemies redrawn (Kyle, 2026-11-17: "more stylized and cleaner, keeping the dark RPG look and feel") | Mocks first: the knight, one caster and two goblins drawn two or three ways at the game's own size, on the game's floor under the smooth light, beside today's. What "cleaner" most likely means at this size: fewer colours a figure, bigger flat shapes, one dark outline, one accent (gold on heroes, the eyes on goblins), less shading noise inside the body. Kyle picks; then the looks are redrawn class by class in the same sizes, cuts and poses, so every move and timing carries over | `herolooks*.ts`, `herosides*.ts`, `sprites.ts` (goblin parts), `foekits*.ts`, `charpaint.ts`, `charmean.ts` | Art (sprites, herolooks, foekits); New look: characters (charpaint, charmean); Side view finished (herosides free) | The mock sheet first. Then the lineup page (`?lineup`) before and after, and a fight on a phone: each class and each goblin kind known from its outline alone |
| T | The tile look, light pass (2026-11-19, above) | Behind TILES and TILT: a few shades a material, the stone floor laid tile by tile, a tile exactly 16 render pixels in 2.5D, near-black outlines, less moss; the camera at 30 degrees | `tilelook.ts`, `tilefloor.ts` (new, mine); small edits in `darkgold.ts`, `three/darkgold3d.ts`, `three/post.ts`, `three/figmat.ts` (mine), `world.ts`, `three/view3d.ts`, `three/camera3d.ts`, `main.ts` | this plan | The street and square side by side on a phone, 2.5D. **In; TILES the default, TILT a switch** |
| 9 | The tile redraw (Kyle's yes, 2026-11-19) | The 2.5D world drawn as tile art: 20 a tile at 36.87 degrees so every pixel is one size, a code-drawn tile kit for floors, walls and roofs, props as front-on cards (slice 4 folded in); figures not here (slice 8) | docs/design/tile-redraw.md | the proof (R0, R1) in behind `?redraw=1`, waiting on Kyle | The street with the floor and one building drawn, before anything else |

Sizes, roughly: 0 and 1a small; 1b medium; 2 medium; 3 small pieces; 4 the big one (six prop families, each a
small slice); 5 medium; 6 with its own chat; 7 small; 8 a mock round, then large (every look), so it wants its own
chat or the Art chat once a direction is picked.

## Overlaps with the chats on the board

- **Art** (active: the Warrior's shield). Owns `sprites.ts`, `figure.ts`, `blocklook.ts`, `cards3d.ts`, `lampsdraw.ts`,
  `propsdraw.ts`. Slice 2 needs blocklook's colour table and slice 4 draws from Art's lamp and prop sprites. Suggest:
  this plan reads Art's sprites and edits only the 3D side; the colour table is one small edit, asked first.
- **Side view** (waiting on Kyle's play). No overlap. Its row could move to Finished.
- **Lived-in world** (slices in, CAMERA kept). Owns `three/air3d.ts` and `scatterpaint.ts`, with lines in `post.ts`,
  `ground.ts`, `rounds3d.ts`, `scene.ts`, `world.ts`. Slices 1b, 4 and 5 run straight through these. Suggest: that chat
  is done, so its row moves to Finished and this plan takes air3d and the scatter; or it stays and does the air's
  and the scatter's lines itself to this plan's rule (no dither, clusters).
- **New look: interiors**. Owns the insides. Suggest folding slice 6 into that chat, with slice 2's value rule as its
  brief; this plan does not edit `insidepaint.ts`.
- **New look: characters**. Owns `charpaint.ts`, `charmean.ts`, the LIVING WORLD files (`alive.ts`, `wind3d.ts`,
  `sun3d.ts`). Its open question (figures look "weirdly 3D" in play) is most likely light on the figure cards, which
  slice 1b changes. Suggest parking that question until 1b is in, then looking again. LIVING WORLD's sun and figure
  shadows are worth a second look as a default once the light is clean (Kyle's call, not in these slices).
- **UI**. Owns `hud.css`. The boss plate's place on a phone (slice 3) is theirs: a note in their log, not an edit here.
- **Dark and gold** and **Town layout** are finished; `darkgold*.ts` and `levelpaint.ts` have no owner. This plan
  claims them when slice 2 starts.
- **Instances, Deep**. Their boss and arena draws are untouched; they get the new light and grade for free through
  the shared passes. A note in each log when 1 and 2 flip to default, so they reshoot their own bosses.

## Eight facings, part of slice 8 (Kyle, 2026-11-22)

Kyle: "diagonal walking for every unit (heroes, goblins, bosses, townsfolk, the hound)". Today a figure turns through
three facings, side (mirrored for left), back and front, so a hero going up and to the right shows its back or its
side, never between. Added to slice 8:
- **Two new facings drawn, front-diagonal and back-diagonal, each mirrored for the other side**: eight directions in
  all, chosen from where the figure is going (the camera's swing still turns it, as today).
- **Walk frames first.** Attacks, blocks and reactions stay on the nearest of today's three facings until later.
- **Done as part of the hero and enemy redraw, not before it**, so nothing is drawn twice.
- **Every unit:** heroes, goblins, bosses, townsfolk, the hound.
- **One choice of facing for all of them**: a pure `facing8(fx, fy)` (with the swing), read by every painter. Today
  the choice is in several places: `charframe.ts` `facingFor` (New look: characters, for its kit figures), and for
  the figures in the game by default, the Art chat's `actors.ts` (heroes), `npcs.ts` and `npcback.ts` (townsfolk),
  `hound.ts`, and `foepose.ts` with the goblins' and bosses' sprites.
- **Who:** New look: characters owns `charframe.ts`, `charpaint.ts` and `three/chars3d.ts`; the Art chat's painters
  get small edits. Settled on the board before any code (Collisions to settle).
- **The gate:** one hero and one goblin walking in all eight directions shown to Kyle (a phone sheet in 2.5D, and the
  walk played) before it rolls out to the rest.

## Open for Kyle

- The tile redraw's proof (`?redraw=1`), then R2 on. (TILT came out at Kyle's answer: today's angle.)
- Slice 8's direction, once its mocks are up; with it the eight facings (above), one hero and one goblin first.
- The living world (docs/design/living-world.md): its three questions, then L1 (edges) on his go.
- LIVING WORLD's sun and figure shadows as a default, once the light is smooth.

## Cost and checking

No big helper agents. Slices 0 to 3 are main-chat work in stages. Slice 4's prop families can each go to one Sonnet
builder with the files named. Checks in house order: the touched tests, `npm run check`, the full suite once before a
push, the yardstick sheet for every visual slice, nothing online (no netcode is touched).
