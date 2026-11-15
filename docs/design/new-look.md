# The new look: a full town in HD-2D light

Kyle, 2026-11-15, after the dark-and-gold pass (docs/design/dark-gold.md): "super grainy on pc", "doesn't really fit
the images I had used as references... I think we have to redesign in general", "Honestly 'pixel' might not even
be the right term for it", and "I prefer a more 'full' looking town that overlaps a little with town squares and
buildings you can go in defined by their guild signs". Then "ya lets do it."

## The pictures

- `ref/dense-town-day.png`: the camera and the density. High above at a steep angle (Relic's camera now), houses
  packed and overlapping, timber framing, roofs drawn tile by tile, ivy, flower boxes, barrels, a well, paths worn
  into the grass, almost no lone pixels. **Wickhold by day.**
- `ref/hd2d-town-night.png`: the light. HD-2D (Octopath Traveler, Dragon Quest III HD-2D): pixel characters and
  pixel-textured buildings in a real 3D world, warm lamps in cool fog, bloom, the top and bottom of the screen soft.
  **Wickhold by night.**
- `ref/gothic-hall.png`, `ref/lantern-bearer.png` (and the dark-gold pictures): the mood for the dungeons, the Deep
  and the heroes. Grey stone, firelight, dark figures with one bright accent.
- `ref/grain-before.png`: what we have now on a laptop, for comparison.

## Kyle's calls, 2026-11-15 (after the concepts)

- "the WHOLE aesthetic is what I want. entirely": the concept shots in his ElevenLabs flow "Relic: HD-2D look tests"
  (`ref/concept-squares.png`, `ref/dense-town-night.png`) are the target for everything, characters included.
- **In town, a low chase camera** (`ref/town-chase-camera.png`): lower and closer behind your hero, the fronts seen
  nearly face-on. Jobs keep the steep camera, where the fight needs the floor.
- **The town dense and overlapping**, as in the concepts: rows of gable-fronted houses packed along its lanes and
  squares, guild signs on the ones you can go in.
- **The art is generated**, in his ElevenLabs workspace, then cut and cleaned by `scripts/kitprep.py` into crisp
  32 px textures (`src/client/three/kit/`). Ours, so it can live in the public repo; no pack licence in the way.

## Why it's grainy now

The world is painted at 16 pixels a tile (heroes 31 to 40 tall) and blown up by a whole number: 3x on a phone, 4x
to 6x on a laptop (scene.ts, the `118000`). Every lone pixel becomes a visible square, and there are many: grass
blades and flecks on every tile, the ground scatter, the light's checker dither at band edges.

## The target

1. **The camera stays steep.** Relic is a top-down action game: red floor telegraphs, dodges, goblins all round.
   Octopath's low camera hides the floor; the dense-town picture's angle keeps the fight readable.
2. **Twice the density.** 32 pixels a tile, heroes about 70 to 90 tall, the picture scaled 2x to 3x, not 4x to 6x.
   Clusters of two or three shades, almost no lone pixels.
3. **HD-2D light in the 2.5D view.** Real point lights from torches, windows and the Lantern, smooth falloff (not
   stepped bands), bloom on flames and windows, fog, a soft blur at the top and bottom of the screen. Sprites stay
   crisp. The 2.5D view becomes the main one.
4. **A full town.** Wickhold re-laid out: houses packed and overlapping round its squares and lanes; the buildings
   you can go in marked by hanging guild signs (an anvil for the smithy, a tankard for the Drowned Rat, a lantern
   for the church) and a lit door; greenery and clutter filling the gaps. Nothing in a lane or doorway that blocks
   a path (the town tests hold it).
5. **Day and night.** The town by day like the dense-town picture, by night like the HD-2D square. The clock exists.

## What changes, what doesn't

- **Stays:** the fight, the room, reach and timing, netcode, jobs, quests, the economy, the UI.
- **Redone:** the town's layout, buildings, ground, props; then the jobs' maps, the heroes, the goblins and
  townsfolk, the dungeons and the Deep, at the new density.
- **Open:** whether the flat view stays as a light fallback for weak phones, or goes (Kyle, after the test street).

## Where the art comes from

Code-drawn art won't reach the pictures' finish at this density. Tiles, buildings and props come from a licensed
pack (or several) at 32 pixels a tile; characters from a pack, an artist, or layered parts the pose code moves.
Generated art is fine for concepts and may do for some props, never mixed into a pack whose licence forbids it.

**Licences, checked 2026-11-15** (re-check before buying):
- **Mana Seed (Seliel the Shaper): ruled out.** Its licence forbids using the art alongside anything AI-made,
  including code; Relic's code is written by Claude.
- Packs that say "nothing AI-related" are ruled out for the same reason.
- **Szadi art, Fantasy Lands Houses** (32x32, many house variants, roofs, interiors, decorations; commercial use,
  edits allowed, no resale; no AI clause found).
- **Cainos, Pixel Art Top Down Village** (32x32, 20 buildings, 203 props, 55 plants, terrain; commercial use,
  edits allowed, no redistribution; no AI clause found).
- Both read brighter and cosier than the night picture; the light and grade make the night.

**The repo is public.** These licences forbid redistributing the files, and a pack's PNGs in a public GitHub repo
are redistributed. Before any pack goes in: make the repo private (Vercel deploys from private repos), or keep the
art in a private repo the build pulls in. Kyle's call.

## Slices

0. **The test street** (this before anything else is redone):
   a. The HD-2D render in the 2.5D view behind a switch (`?look=hd`): higher internal resolution, smooth lights,
      bloom, fog, the tilt-shift blur, on today's art, so the light can be judged alone.
   b. Wickhold's buildings from the generated kit behind `?street` (with `?hd`): each block a row of gable-fronted
      houses at their natural size, its own front (forge, tavern, chapel) in the middle, slate roofs, guild signs, the
      cobbles; the camera lower (24 degrees) and closer. First pass in.
   c. Next: props from the kit (barrels, crates, lamps, stalls, the well, braziers, trees); a true perspective chase
      camera in town; the town re-laid out dense (slice 1); then heroes and goblins in the concepts' style.
1. The town re-laid out (shared/town.ts, with the Town quests, Lived-in world and Art chats).
2. The jobs' maps and the dungeons.
3. Heroes, 4. enemies, 5. townsfolk, at the new size.

## Supersedes

dark-gold.md's drawing approach (recolouring the code-drawn art). Its palette notes still guide the night, the
dungeons and the heroes. lived-in-world.md's slices 4 and 5 (light and air in 2.5D, a wider camera) fold into
slice 0a.
