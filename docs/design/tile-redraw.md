# The tile redraw: the 2.5D world as drawn tile art

Spec, 2026-11-19 (Kyle and Claude Opus 5.5). Slice 9 of docs/design/graphics-overhaul.md: after the tile look's light
pass (TILES, on by default), Kyle said yes to the full redraw. **Not built. Nothing starts until Kyle has answered the
three questions at the foot.**

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

## Where the art comes from

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
| R0 | The grid: 20 a tile, 36.87 degrees, the render scale per screen; the 2.5D floor painted at 20 by 12 a tile from the kit (stone street and flags first). The ground's marks, soil, puddles and scatter repainted at the new size, not stretched | The street from the light pass side by side on a phone: same tiles across, every floor pixel one size |
| R1 | **One building, drawn:** the JOBS house on that street, its front and roof from the kit | Kyle's eye on the street shot. **The proof: nothing past R1 until he has seen it** |
| R2 | Every house kind in town (cottage, hall, shop, the church, the keep) and the town's walls, steps and ledges | The town sheet, day and night, phone and laptop |
| R3 | Props as front-on cards | The town and a village: nothing reads as a lump of boxes |
| R4 | The rest of the places, a theme at a time: a village (on earth, slice 5's call), a wood, the Open Cut, the Deep's floors | The full yardstick sheet |

## Cost

Main chat in stages for R0 and R1 (the grid touches the camera, the view's sizing and the ground: one hand on them).
From R2, a Sonnet builder per material family with its files named, at most two at once, as CLAUDE.md asks. No
credits spent on generation unless Kyle picks it for a set piece. Paint only: the fight, the sizes and the netcode
are untouched.

## For Kyle

1. **The grid:** 20 a tile at 36.87 degrees, with TILT taken out. Agreed?
2. **The art:** drawn by code from a tile kit (recommended), or generated and cut to the palette?
3. **The proof first:** the floor and one building on the street (R0 and R1), then your eye before the rest?
