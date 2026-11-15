# New look: buildings and camera, decisions

This chat's log (docs/design/new-look.md; inherited from docs/decisions/dark-gold.md). Everything here is behind
`?look=3d&hd&street`; without it nothing changes.

## 2026-11-15: started

- Row moved to Active. Order (Kyle): building variety (single-storey cottages, two-storey shops, landmarks bigger and
  cheated toward the camera), fronts on the sides the camera swing shows, the kit's props, sky and fog past the town
  walls, the see-through hole working with the swing; Blender briefs for the landmarks.
  (Claude Opus 5.5)

## 2026-11-15: building variety

- New art in Kyle's flow "Relic: HD-2D look tests" (four sheets of four, about 3,400 credits): single-storey cottages,
  two-storey shops, the four landmarks as grand fronts (church with its bell tower, town hall with clock and arcade,
  the Drowned Rat three storeys and jettied, the forge with its tall chimney), and long side walls (timber, stone,
  shop, a church nave). Cut by scripts/kitprep.py, which now takes sets (`cottages shops landmarks sides props`); the
  prop sheet from the test street is cut into props too (used in the props slice).
- three/streetrow.ts decides a block's row: the landmark (church, TOWN HALL, THE DROWNED RAT, FORGE) at its door,
  9 to 14 tiles tall, keeping its proportions (up to a tile wider than its block), turned up to 15 degrees toward the
  middle of town; homes (`home:`) are one cottage each; everything else a front by kind with cottages, shops and town
  houses either side, never the same kind twice running. three/streetbuild.ts builds it: the picture, side walls in
  side-wall art (taller walls repeat the upper storey), a back, the slate roof from each front's own eave and ridge,
  a stone stack behind the church's tower and the forge's chimney. Signs hang only on the block's own front.
- Same footprints, doors and collision. Kit now 5.4 MB, loaded only under `?street`, each picture when first drawn.
- scripts/street-look.cjs: shots with the swing held (`x,y,yawDeg`), `HOMES=1` for all eight homes.
  (Claude Opus 5.5)

## 2026-11-15: fronts on the sides the swing shows

- A row's end that looks out on open street (no roofed building within 2.5 tiles that way, streetrow.ts `openEnd`)
  gets a cross wing (streetbuild.ts `crossWing`): a shop or town-house front facing the side lane, fitted to the
  block's depth, with its own short gable roof running back into the house. Not on a landmark (already turned to the
  middle of town), a cottage, or a block under 2.6 tiles deep. Other ends keep the side-wall art from the variety
  slice. buildings3d.ts hands the town's blocks to streetrow.ts before building so a row can see its neighbours.
  (Claude Opus 5.5)

## 2026-11-15: the kit's props

- three/streetprops.ts: the prop sheet's pictures (cut in the variety slice) stood up as boards that turn with the
  swing (one shared yaw read in the vertex shader, so nothing is touched per frame), lit like the buildings, lanterns
  glowing. In town under `?street`: the trees, the well, the lamp posts (lantern on a post, light kept, no flame),
  the barrels, crates, sacks and the handcart from the lived-in town's round things (ground.ts); the market stalls,
  benches and the cart from their blocks (houses3d.ts). Dressing: now and then a barrel, crates or sacks against a
  front, never by the block's door (streetbuild.ts). Breakable barrels and crates (Art's props3d.ts) unchanged.
  (Claude Opus 5.5)
