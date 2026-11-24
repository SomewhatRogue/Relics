# The Keeping Room, walkable

Mapped 2026-11-23 (Claude Opus 5.5) on Kyle's word ("claim walkable room here, map it out"). The room of
docs/design/holy-and-hungry.md section 7, today panels off the sewer grate (client/keepingui.ts), made a place you
walk into. Built by the Holy and hungry chat.

## How you get there

- **The whisper** (Kyle, 2026-11-23): your first red piece home, a voice in town tells you there's a bricked arch
  past the grate that will open for you, and a woman who knows what you're carrying. The goal line's A WHISPER row
  points at the sewer grate.
- **The grate:** its panel's THE BRICKED ARCH button, for a corrupt hero or one on the whisper's quest. It doesn't
  open the old panels any more: it takes you in, as a door does (`Game.enter`, `townInterior('keeping')`).
- **Walking out** at the bottom brings you back up at the grate.
- A clean hero not on the quest never sees the button: brick.

## The map (one interior, 12 by 11 tiles, three-quarter as every room)

```
      0 1 2 3 4 5 6 7 8 9 0 1
   0  # # # # # # # # # # # #      back wall, shelved all along
   1  # S S S S S S S S S S #      S  shelves: pewter, rings, plate, a tallow stub on each
   2  # S . . . . . . . . S #
   3  # S . c . . . . k . S #      c  the cradle among the hoard (empty, part of it)
   4  # S . . . . . . B . S #      B  the brazier, k its kettle; Dorcas stands by it (D)
   5  # S . . . D . . . . S #      T  the trough under its drip, left of the steps
   6  # T T . . . . . o . S #      o  her cot
   7  # . . . . . . . . . . #
   8  # # # # . . . . # # # #      the cistern's lip: two steps down from the arch
   9      # . . . . . . #          THE DRY ARCH: the walkway's end, the iron door
  10      # # # . . # # #          and its slot; you come in here, from the grate
```

- **Light:** none but yours, the tallow stubs (small, low, many), the brazier's coals, and at the trough the relic
  you lay there: gold waking to sick green as the pieces under it go dull (a light pool in light.ts terms).
- **Dorcas** by the brazier: walk up and talk (the room's panels: her greeting, the quest talk once, FEED A RELIC at
  the trough, GIVE TO DORCAS, later her titles).
- **The trough:** walk up to it to feed a relic (the same panel as FEED A RELIC).
- **The cradle** is part of the hoard: empty, never a child's (the lore keeper's note).

## Art (the tile way, docs/design/tile-redraw.md "Making a new asset")

Furniture that exists: `shelf` (the shelves), `bed` (the cot), `hearth` (the brazier, for a start). New, drawn in the
kit: the trough (a stone basin, a drip above), the cradle (wood, among the shelves), the brazier with a kettle, the
dry arch's iron door with its slot, the tallow stubs (a shelf variant). Floor: wet stone, the cistern's, darkest tier.
Checked on the phone in 2.5D before landing.

## Build, in slices

1. **The room:** `townInterior('keeping')`, Dorcas as a person to talk to, the trough as a thing to walk up to, the
   arch button going in, out at the grate; existing furniture as stand-ins.
2. **The art:** the new pieces above, drawn in the kit, and the room's light.
3. Dorcas's titles (docs/design/titles.md), when Kyle says yes to them.

## Whose files

Mine: `shared/keepingroom.ts` (the map), `client/keepingui.ts`, the new kit pieces in their own file. Small edits:
`shared/interiors.ts` (`townInterior`, one line), the talk router for her and the trough, `client/squareui.ts`.
