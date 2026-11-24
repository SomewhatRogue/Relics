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

## Later

- Ridges: drawn earth lips where the land rises (the height levels we have).
- One or two small scenes a map (a waystone, a lamp and bench, a cairn): the pieces drawn here, placed by each map's
  owner (Territories), or by this chat with their yes.
- Groves inside maps: trees placed in clumps rather than one by one (the map generators, Territories' files).
- Mist banks at the edges and drifting motes (living world L4).
