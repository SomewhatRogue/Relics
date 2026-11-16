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

## 2026-11-15: sky and haze past the town walls

- three/streetsky.ts (from view3d.ts under `?street`, town only). The chase camera looks down 26 degrees through a 28
  degree lens, so even the screen's top row points below the horizon: what showed black was the land past the walls,
  not the sky. So the haze lives on the land: dark earth to just past the walls, then thinning into the hour's haze
  (blue-grey at night, pale by day). Standing in it, a ring of roofs, chimneys, spires and trees 10 tiles out with a
  few lit windows after dark, and hills 55 tiles out. Only the side of each ring beyond the town's middle is drawn
  (the camera backs off outside it). A sky dome too, for any view that does look up.
- Colours go in raw (this pipeline has colour management off); a first try converted them and came out black.
- Open: the silhouettes are smooth shapes, not pixel art; a generated skyline strip could replace them.
  (Claude Opus 5.5)

## 2026-11-15: the see-through hole knows the swing

- streethole.ts `hides`: a building goes see-through round your hero when the line from your hero toward the swung
  camera meets its footprint before climbing over its roof (a slab test), not "north of it" as before. So with the
  camera swung east you can stand at a building's east side and still be seen. tests/streethole.test.ts.
  (Claude Opus 5.5)

## 2026-11-15: Blender briefs for the landmarks

- docs/design/blender/: a README with the rules for all four (a tile a unit, the front toward +Z, origin under the
  door, the block's footprint plus up to a tile of overhang at the front, pixel textures at 32 px a tile snapped to
  a palette, a `glow` material for lit windows, under 4,000 triangles, `.glb` to `kit/models/`), and a brief each
  for the church, the town hall, the Drowned Rat and the forge, from the kit's landmark takes and the town-layout
  spec's placings. Models are made straight; the game turns them to their block's facing and toward the square.
  (Claude Opus 5.5)

## 2026-11-15: the kit follows the new town's facings

- The town layout chat's new Wickhold (behind the same `?street`) gives every block a `face`. streetbuild.ts now
  builds each kit block in its own frame (front to the south, middle at the origin) and turns it to its facing: front
  south by default, north for 'S', east for 'W', west for 'E'. Open ends are asked in world terms (streetrow.ts
  `openEnd` takes a direction); landmarks turn toward the map's middle by half the angle, at most 15 degrees.
- Backs are in the side-wall art too (windows, timber, barrels), since turned buildings show their backs to lanes:
  the Drowned Rat fronts north up the Rat Steps, so the lane below sees its back.
- camera3d.ts: the chase camera rises with the level under your hero (eased), so on Kirkhill it looks at you, not
  the square's height. Merged with the layout's lifts: kit props stand on their level too (ground.ts).
- For Kyle: with the swing capped at 45 degrees, north-facing fronts (the Rat, the lodge, half of Rescue Row) are
  only ever seen from behind. Options: let the camera swing round further when you walk toward one, or keep fronts
  south-ish. Yours to call.
  (Claude Opus 5.5)

## 2026-11-15: closer, and crisp

- Kyle: zoom in, and keep the art crisp (everything is 32 px a tile). Under `?street` a tile is now always 32 render
  pixels at your hero (`STREET_PPU`, one art pixel to one render pixel) and the zoom is how many screen pixels each
  render pixel takes, a whole number (`streetScale`, streetkit.ts; view3d.ts's `S`). So a tile is 32, 64, 96 ...
  screen pixels and no pixel is wider than its neighbour. Aimed at about 30 CSS px a tile upright (a phone sees about
  12 tiles across, was 16) and 54 lying down (a retina laptop takes 48, about 30 tiles across, was 40; a plain 1440
  screen 64, 22 across). `&zoom=N` picks the step outright, for trying.
- Steps only: on one screen the zoom can't land between two of them. Figures (figs3d.ts) already draw a sprite pixel
  as a whole number of render pixels: 16 px sprites at 2, so 32 a tile like the kit. For the characters chat: a 32 px
  a tile sheet should be drawn at 1 (k = ppu / 32).
  (Claude Opus 5.5)

## 2026-11-15: town at zoom 4, a bigger hole

- Kyle: `&zoom=4` is solid for town. Town now aims at 42 CSS px a tile upright and 64 lying down, so a 3x phone and a
  retina laptop both land on 4 screen pixels an art pixel; jobs keep the earlier aim. view3d.ts re-sizes when you go
  between town and a job (`streetScale(..., town)`).
- The see-through hole: a radius of 3.5 tiles round your hero, was 2.2. Then Kyle: still annoying, bigger: 5.5 tiles
  (11 across, wider than a phone at zoom 4).
  (Claude Opus 5.5)

## 2026-11-15: no hole; silhouettes and a whole-building fade

- Kyle found the big hole dizzying. Research (Diablo fades what's in the way softly; Torchlight 2 draws characters
  through walls as a silhouette; Octopath designs it out with fixed views and places kept to one screen): a circle
  that follows you over hollow box buildings moves, pops and shows their insides. Kyle agreed the plan:
  - Your hero's silhouette through a building straight away (the x-ray pass that was there); foes now too, in red
    (cards3d.ts, a small edit: `xray: 'foe'` for live foes not lurking, under `?street` only; figs3d.ts and
    figmat.ts take a tint).
  - The whole building fades as one piece (streetkit.ts `fadeKit`: its own copies of its materials, a dither
    screen down to 30% of pixels, no blending or sorting) once you've been behind it half a second, or straight
    away if it hides a live foe within 10 tiles; a quarter second down, a quarter back (buildings3d.ts).
  - `&hole=old` brings back the round hole for comparing.
- For the town layout chat: lanes behind buildings as short cut-throughs, not places to stand about.
- scripts/street-look.cjs now keeps the camera off the arrival scene and stands the hero on its level (as
  town-look.cjs does).
  (Claude Opus 5.5)

## 2026-11-15: houses from parts, a test lane (`&parts`)

- Kyle: the houses look blocky, not made of parts. Behind `&parts`, plain houses (the homes, the unnamed ones) are
  built from parts in place of a picture on a box (three/streethouse.ts on three/streetparts.ts): a stone plinth;
  fieldstone or plaster below; an upper storey jettied over the street on joists with a sill beam; every wall framed
  in oak standing proud (posts, rails, a brace) and windowed (cheeks, lintel and sill standing out from the face);
  the door with posts, lintel and a step; a roof with real eaves, fascia, bargeboards and ridge, gable or eaves to
  the street, slate or thatch, a dormer now and then; windows in the gables; a capped chimney. Each wall is built in
  its own frame and turned onto its side (Parts.map), so backs and sides get the same as fronts. Merged by material:
  a house is a handful of draws.
- Art: one sheet "Kit: house parts" in the flow (plaster, oak beam, thatch, fieldstone tiles; four windows; four
  doors), cut by kitprep.py's new `parts` set (the plaster toned down for the night). The flow's ElevenLabs plan ran
  out of credits on it (three of four variations refused; 93 credits left).
- Landmarks and named buildings keep their picture fronts.
- Open, for Kyle: in town, a closer camera that turns all the way round behind you (so north-facing doors such as
  the Hunters' Lodge are easy to find), jobs keeping the wide view.
  (Claude Opus 5.5)
