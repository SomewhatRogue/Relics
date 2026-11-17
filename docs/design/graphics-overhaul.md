# Graphics sweep and overhaul

Plan, 2026-11-17 (Kyle and Claude Fable 5.2). **Not built. Nothing here starts until Kyle says yes**, slice by slice.
The assessment with screenshots and the side-by-side mocks are on the page linked from docs/decisions/graphics-overhaul.md.

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

- 1.5x bodies, about 12 tiles across a phone, no camera tilt, even pixels (art-pass.md).
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

Sizes, roughly: 0 and 1a small; 1b medium; 2 medium; 3 small pieces; 4 the big one (six prop families, each a
small slice); 5 medium; 6 with its own chat; 7 small.

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

## Questions for Kyle

1. Light: clean bands or smooth pools (the mock shows both against today)?
2. Colour: cool slate, or keep a little of the green (the mock has a slider between them)?
3. The flat view: freeze it as the weak-phone fallback and put the polish into 2.5D?
4. Lived-in world and Side view rows to Finished, and this plan takes `air3d.ts` and the scatter?

## Cost and checking

No big helper agents. Slices 0 to 3 are main-chat work in stages. Slice 4's prop families can each go to one Sonnet
builder with the files named. Checks in house order: the touched tests, `npm run check`, the full suite once before a
push, the yardstick sheet for every visual slice, nothing online (no netcode is touched).
