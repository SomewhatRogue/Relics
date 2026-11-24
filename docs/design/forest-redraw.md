# Forests and land that feel like a place

Kyle, 2026-11-23, from Ruinsong (play.ruinsong.com, also generated): "the graphics just seem juicier ... specifically
the forests and land", "It just helps each map seem like a PLACE you know?", "its just better researched and better
skilled in execution and ya lets try one".

What their picture does that ours doesn't (both dark and rainy; the gap is execution, not palette):

1. **Woods are a mass.** Pines overlap into one canopy along the map's edge; trunks only on the front row; a big
   broadleaf as a landmark. Ours stand one by one with ground between.
2. **Trees are drawn richly.** Needle clumps lit on the upper left, each tier dark underneath, five or six shades and a
   dark outline. Ours: three tiers in two or three greens.
3. **Ground is calm.** One base tone covered evenly in tiny blade marks; flowers and tufts few and spaced. Ours: a
   blocky three-shade noise that reads as a check.
4. **The land has shape.** A drawn ridge with a dark lip curves across the meadow.
5. **Small scenes.** A lamp and a bench, a glowing waystone.

Kyle, with a second shot (the Saltgrass Downs: grass in dense leafy clumps, shore sand in ripples, land edges with a
dark drawn lip): "This but dark you know. Not light just our sort of bloody". Their craft, our palette: night, cold
slate, grime, blood; blue-black pines, olive-black leaves, near-black outlines.

## The proof: Gallows Wood, items 1 to 3

All drawn the tile way (docs/design/tile-redraw.md, "Making a new asset"), in the client only: the room, the map and
collisions don't change.

- **Grass** (`tilegrounds.ts` grass): base tone; small blade marks (a lit pixel over a dark one, two or three wide)
  spread evenly with jitter from a hash of the world pixel, so no grid shows; a broad, slow shift of tone across the
  field, no blotches. Clumps and flowers stay rare.
- **Trees** (`tiletrees.ts`, new): a pine and a broadleaf drawn by code, a few variants each, six shades, clumps lit
  upper left, tiers dark beneath, outlined; used for the card rounds `pine` and `tree` under the redraw
  (propcards.ts).
- **The wood's edge** (`three/treeline3d.ts`, new): where a map's back is `trees`, the flat wall face and lumpy crowns
  give way to three rows of overlapping drawn trees along the top edge (front row trunks, back rows crowns only) and
  down the side edges, leaving the road gaps and side ways open.

Shown to Kyle on a phone in 2.5D, before and after; landed on his "Land it", 2026-11-23, for every map with grass or
trees.

## The land (2026-11-23, in, on Kyle's "Incredible. More of this")

- **Earth** (`tilegrounds.ts` `earthAt`, used by soil.ts's earth and swept ground in the redraw): a calm dark base with
  low ripples, a pale crest over a dark trough in short wavy runs; no speckle.
- **Turf over paths** (`tileedges.ts`): a grass floor is grass to its edges too. Turf's foot and right side dark, its
  top and left lit with blades standing proud; the bare ground under it takes the turf's shadow.

## Ground layout (2026-11-23, in)

Kyle: "lets get more mindful and present with ground layout too i want this to be a beautiful but dark world." Seen
whole, the maps were sprinkled evenly from edge to edge: tufts from three places, pale stones, the same turf under a
tree as in the open. Now, in the redraw's floor:

- **A grove's floor** (`tilelitter.ts`): under every tree, pine, snag, bush and stump the turf gives way to dark needle
  litter, its edge broken into the turf's clumps, roots running out from the trunk. Trees near each other share one
  floor and read as a grove; the open ground between is calm.
- **What lies about** (`tilestrew.ts`): the scatter's own places (thick round trees, rocks, walls, water; thin in the
  open) drawn the tile way at a pixel to a pixel, dark, with our accents: rust leaves, bone, a blood-red cap on a
  mushroom, a ghost-pale flower. Growing things keep off paths and laid ground.
- **Standing tufts** (`three/tufts3d.ts`) gather round trees, rocks, walls and the map's edge; the grass stamp's own
  clumps all but gone.

## Small scenes (2026-11-23, in)

One or two a job's outdoor map (`tilescenes.ts`), chosen and placed from the map alone, off the paths, by a tree:
a shallow grave with a leaning marker and pale flowers; a cairn with a skull and a candle stub; a dead campfire with
its spit; a ring of bones round an old bloodstain, candles guttering. Mostly in the floor, one low thing standing;
paint only, never collided. A candle throws a small warm pool: the only light they have.

## Later

- Ridges: drawn earth lips where the land rises (the height levels we have).
- Groves inside maps: trees placed in clumps rather than one by one (the map generators, Territories' files).
- Mist banks at the edges and drifting motes (living world L4).
