# The tile redraw: the 2.5D world as drawn tile art

Spec, 2026-11-19 (Kyle and Claude Opus 5.5). Slice 9 of docs/design/graphics-overhaul.md: after the tile look's light
pass (TILES, on by default), Kyle said yes to the full redraw. **Kyle's answers, 2026-11-19:** today's angle (so
36.87 degrees, TILT out), the art drawn by code, the proof first. **The proof (R0 and R1) is in behind `?redraw=1`:
nothing past it until Kyle has seen it.**

## What it is for

The light pass got the palette, the tile grid on the floor, the outlines and less grain. What it cannot get, because
of how the 2.5D view is made today:
- **One even pixel size.** On a phone a 2.5D tile is about 19.5 render pixels across and the floor art is 16, so floor
  pixels come out in uneven widths; walls and roofs are coloured boxes with no pixels of their own at all. Snapping
  the tile to 16 (`?even=1`) made the figures a fifth bigger against the floor: too close, a slow walk (Kyle, 2026-11-19).
- **Buildings seen front-on with chunky readable shapes.** Today a building is boxes with one colour a face. The
  reference's fronts are drawn: courses, timbers, windows, doors, signs, a roof of tiles.
- **Walls laid tile by tile**, as the floor now is.

## The idea: paint the world the way the camera sees it

SNES tile art is drawn already foreshortened: a floor tile is wider than it is tall, a wall is drawn front-on. The
redraw does the same in 2.5D:
- **A tile is 20 render pixels across**, which is today's 2.5D scale (figures keep their size against the floor, so
  the walk and the zoom feel as they do now). The render scale is picked per screen to keep about as many tiles.
- **The camera looks down at 36.87 degrees** (today 36), the angle whose sine and cosine are 0.6 and 0.8. So a floor
  tile is exactly **20 by 12** render pixels and a wall exactly **16 pixels a tile of height**. Floors are drawn at 20
  by 12 a tile, wall faces at 20 by 16, and every art pixel is one render pixel: one even pixel size everywhere.
- **TILT (30 degrees) comes out.** At 30 the wall rows are not whole numbers. The 0.87 degree change from today is
  too small to see.
- **Figures are not redrawn here.** They already have the outlines; their art is slice 8 and the paused new figures
  (docs/design/new-figures.md), Kyle's call separately.
- **The flat view stays frozen** as the weak-phone fallback, at 16 a tile with today's art and the light pass.

## Making a new asset (the rule since 2026-11-20)

Kyle: "we need to make sure in the future any new assets etc are done this way first." So, for any chat:
- **The size.** A tile is 20 render pixels across; a floor tile 20 by 12; a wall 16 a tile of height. Draw at that
  size, one pixel to one render pixel. Never stretch a 16-a-tile painting onto the 2.5D view.
- **Where it goes.** A floor kind: a stamp in `tilegrounds.ts` (or `tilekit.ts` for stone). A wall, a ledge, a fence
  or anything with faces: a canvas drawer, laid with `three/redraw3d.ts` `screenQuad` (it maps any face to the
  screen's pixels). A prop or furniture: a card, drawn in `tilefurn*.ts` or by the flat view's own painter if that is
  a real picture (`three/propcards.ts`). A building kind: `three/redraw3d.ts` `drawHouse` and the kit's faces.
- **The style.** Three to five shades a material, light from the upper left, a darker edge right and bottom, clean
  dark outlines (cards get theirs from the card material), no speckle, clear pixels where the ground should show.
  Neutral greys and plain browns, then `gradeCanvas`, so it lands on the game's slate and timber; a building's own
  colour through `tint`. The ground stays the darkest, quietest tier.
- **The check.** `node scripts/sweep-look.cjs <tag>` on the phone in 2.5D, cropped close; look for uneven pixels, a
  crate where a bench should be, a hatch on a slope. Never a 3D box as the finished look.
- **The flat view** (the weak-phone fallback) needs nothing new unless the asset changes what is where.



Tile art repeats, so it suits being drawn by code, as `tilefloor.ts` already draws the stone street: a **tile kit** of
small stamps per material, each in three to five shades of one hue, lit from the upper left, with a few variants so a
street does not repeat, and edge pieces where two materials meet (earth into stone, grass into earth).
- Floors: stone street, flagstones, earth, mud, grass, planks, rock.
- Walls: stone courses, timber frame and daub, palisade, rock face. Doors, windows (warm when lit), signs and
  chimneys as stamps laid on a face.
- Roofs: slate, thatch, shingle, drawn as tiles on the roof's slopes.
- Props (barrels, benches, lamps, stalls, trees) as front-on cards at the same 20 a tile. This is slice 4 folded in,
  so it is not done twice.

Generated art (the ElevenLabs flow, as for the knight) is kept for set pieces only if Kyle wants it (the church front,
the Lantern's statue), cut down to the kit's palette. The HD street look's generated kit stays parked; this is not it.

## Slices

Each behind `?redraw=1` and an options button first, as TILES was; on by default at Kyle's yes.

| # | Slice | Done when |
| --- | --- | --- |
| R0 (in) | The grid: 20 a tile, 36.87 degrees, the render scale per screen; the 2.5D floor painted at 20 by 12 a tile from the kit (stone street and flags first). The ground's marks, soil, puddles and scatter repainted at the new size, not stretched (in, 2026-11-20: the same painters paint onto the 20 by 12 grid; soil.ts takes the grid, the rest go through `onGrid`, which rounds every rectangle's edges to whole pixels) | The street from the light pass side by side on a phone: same tiles across, every floor pixel one size |
| R1 (in) | **One building, drawn:** the JOBS house on that street, its front and roof from the kit. Built for every roofed building at once (the same code): four wall faces (stone courses, or timber on daub over a stone plinth, windows framed, the door's hole), the roof's front slope (slate or thatch). A building turned to face east or west keeps today's roof (its slopes are seen side-on) | Kyle's eye on the street shot. **The proof: nothing past R1 until he has seen it** |
| R2 (in) | Every house kind in town (cottage, hall, shop, the church, the keep) and the town's walls, steps and ledges. In: the town's level faces as courses with a coping, every flight's treads and the risers that face the camera; a turned building's slopes, seen side-on, drawn with their courses running up the picture; each building's drawn walls and roof in its own colours (a handful of shades each), so the church is pale stone and the town hall's roof brown again | The town sheet, day and night, phone and laptop |
| R3 (in) | Props as front-on cards | The town and a village: nothing reads as a lump of boxes. In: trees, pines, bushes, dead trees, rocks, reeds, hay, wells, stones, targets, pillars, market stalls and tents as the flat view's own pictures stood up, one sprite pixel to one render pixel like the figures (`three/propcards.ts`); a map's round things share one picture and one mesh. Then the second part: benches, tables (and the map, dice, arms and skinning tables), desks, counters, pews, beds, altars, anvils, casks, sacks, carts, tubs and stumps drawn in the kit as cards that fill their footprint (`tilefurn.ts`, `tilefurn2.ts`, `tilefurnkit.ts`); fences, hurdles, stone walls and rock walls drawn as faces mapped to the screen (`tilefence.ts`, a hook in `three/walls3d.ts`). Then (2026-11-20) shelves, bookcases, racks, looms, dummies, booths, bunks, armour stands, bellows and fonts (`tilefurn3.ts`). Still built: hearths, partitions, pens, the monument, the gallows, stairs; burning or ruined ones |
| R4 (floors in) | The rest of the places, a theme at a time: a village (on earth, slice 5's call), a wood, the Open Cut, the Deep's floors | The full yardstick sheet. In 2026-11-20: grass, dirt, mud, rock and plank floors drawn as 20 by 12 stamps (`tilegrounds.ts`, routed in `three/redrawfloor.ts`), what lies on them painted onto the same grid; and (2026-11-20, later) wheat as rows of standing stalks on dark earth, and a village laid on earth (a stone floor anywhere but the town: `three/redrawfloor.ts`), its swept yards and lanes earth too |

## Cost

Main chat in stages for R0 and R1 (the grid touches the camera, the view's sizing and the ground: one hand on them).
From R2, a Sonnet builder per material family with its files named, at most two at once, as CLAUDE.md asks. No
credits spent on generation unless Kyle picks it for a set piece. Paint only: the fight, the sizes and the netcode
are untouched.

## For Kyle

Answered 2026-11-19: today's angle (36.87 is it, TILT out), drawn by code, the proof first. Kyle saw the proof and
said "Continue" each time: R0 to R3 are in, R4's floors too. **REDRAW is on by default since 2026-11-20** (Kyle:
"I think i like the redraw should we jsut have as standard"); `?redraw=0` or the button for the look before. Open: R4 (other places: a village on earth, the woods' floors, the Open
Cut, the Deep), then REDRAW as the default.

**How every drawn face is mapped** (`three/redraw3d.ts` `screenQuad`): its picture's columns and rows come from where
its corners land on screen (20 columns a tile across, 12 rows a tile of floor, 16 a tile of height), so one drawn
pixel is one render pixel whichever way the face points, and the kit draws each face as the camera sees it.

Files: `client/tilekit.ts` (the kit), `three/redraw3d.ts` (faces and slope), `three/redrawfloor.ts` (the floor), the
switch in `client/tilelook.ts`; small edits in `three/houses3d.ts`, `three/ground.ts`, `world.ts` (paintMap `bare`),
`three/camera3d.ts`, `three/view3d.ts`.
