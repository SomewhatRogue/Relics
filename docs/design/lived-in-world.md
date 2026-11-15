# A lived-in world (after Riteborn)

Kyle, 2026-11-15, after a short of Riteborn, a pixel ARPG (youtube.com/@riteborn; frames in docs/design/ref/):
"I like their camera and graphics style." Of what the art chat saw in it he wants all but the hit flashes,
"especially the more crowded town and worlds."

What Riteborn does (ref/riteborn-town.jpg, ref/riteborn-swamp.jpg):
- A three-quarter camera with real perspective (Relic's 2.5D view is the same idea).
- **Crowded:** the town street has a smith at a lit forge, ducks crossing, people at the lamp posts, barrels,
  crates and posts; the swamp floor is thick with tufts, stones, bones, reeds, gold and a soft shoreline.
- **Drawn buildings:** timber framing, plaster, stone courses, roof tiles, shutters, lit windows, all pixel art
  on the 3D shapes.
- **Warm in cool:** muted greys and greens; light only from fire, falling in soft pools, a dark vignette.
- **Small heroes in a wide view,** a faint ring at the hero's feet.

## Slices (most wanted first)

1. **A crowded town.** More townsfolk at work where they live (the smith at the forge, a woman at the well,
   someone sweeping, a carter, children), drawn in place with small loops (streetlife.ts's way). Animals: hens
   and ducks crossing, a cat on a sill, pigeons at the square. More props on the streets: barrels, crates, sacks,
   carts, washing lines, flower boxes, lamp posts. Everything cosmetic or a fixed prop; no new collision in
   doorways, lanes or anyone's path (the town tests hold it).
2. **Crowded worlds.** A scatter pass for every job's map, by its ground: tufts, stones, twigs, bones, dead
   leaves, moss, mushrooms, puddles, reeds and a soft wet edge by water; denser at the edges and round
   rocks and trees, thinner where fights happen. Painted into the floor (shared by both views), seeded from the
   map so every player sees the same. A few bigger standing things (stumps, dead trees, reeds) as props.
3. **Drawn buildings in 2.5D.** A texture painter for the 3D houses: plaster with timber framing, stone courses,
   roof tiles in rows, shutters and glowing panes, from blocklook.ts's table so each house keeps its colours.
   The flat view's buildings already have most of this; carry their detail across.
4. **Light and air in 2.5D.** A dark vignette at the screen's edges, a gentle glow round lamps and windows
   (the light already pools; let it bloom a little), the mist where jobs already have it.
5. **A wider camera, to try.** The tall heroes take more of the screen than Riteborn's; try the camera a step
   further out (the `118000` in scene.ts and view3d.ts) and a faint ring at your own hero's feet. Kyle decides.

## Not changing

The fight, the room, reach and timing. The stepped light bands of the flat view (Kyle approved them on
2026-10-31) stay unless Kyle asks. Hit flashes are out (Kyle).

## Who

A fresh art chat, once the side-view or gear chat is done. Slices 1 and 2 touch shared/town.ts, shared/ground.ts,
client/soil.ts and new files; check the board for anyone holding them.
