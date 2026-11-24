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

## The pattern book (2026-11-23, in)

Kyle: "I want these to be patterns and aesthetics that we can shuffle and use for real looks that seem intentional."
So the ground's composition is a book of named pieces, shuffled (`looks.ts`; a line there adds a look):

- **Motifs** (drawn by `tilemotifs.ts`, each with an edge that swells and pinches its own way): `hollow` (a dip of dark
  moss, its near bank in shadow), `pool` (a hollow with still water), `bald` (a worn patch of bare earth under a turf
  lip), `tallgrass` (a stand of longer blades, tufts standing thick in it), `burn` (a black heart, ash, scorched
  turf, charred ends), `ring` (red-capped mushrooms in a ring), and `drift:` leaves, bones, stones, pale flowers or
  blood-red ones, lying in a lens along the wind.
- **Scenes** (`tilescenes.ts`): grave, a row of graves, cairn, dead campfire, ring of bones, a skull on a stake.
- **Looks**: a named recipe of motifs (how many a room) and the scenes that may appear. Wood: gallows, mossy, charcoal.
  Fen: drowned, reedmoor. Fields and villages: fallow, poppy, raided. Bare yards: spoil, warcamp.

A map draws one look of its country from its own name (`lookOf`), lays the motifs on open ground off the paths
(`motifsOf`), and takes its scenes from the look. Same map, same picture on every screen; paint only.
`window.__lookOf(map)`, `__motifsOf(map)`, `__scenesOf(map)` for scripts. tests/looks.test.ts.

Also: a dirt floor is the same rippled earth as a path now, a shade warmer; its tone shifts in soft swells, not blocks.

## Water (2026-11-23, in)

A pool was a hard rectangle that the floor's grade turned grey (Sallow Carr's read as stone slabs). Now, on a job's
earth or turf (not masonry: a quay's water keeps its straight edge; not the town):

- **Banks** (`waterfield.ts` `soften`): each cell of the water's picture takes the vote of the cells a third of a tile
  round it against a bar that wanders, so corners round off and straight banks waver. Paint only: the room still
  wades the rectangles.
- **The bank's edge** (`three/redrawfloor.ts` `softWater`): the far bank's turf hangs dark over the water, the near
  bank's edge is lit, blades on it.
- **The surface** (`three/water3d.ts` DARK): its colour its own. Deep water near black, deeper toward the middle;
  shallows the bed at half its light under a murk, so a ford still reads as the way over and nothing glows.
- **Foam** (`three/wind3d.ts`): none on a still pool, only the bank's shadow; dim on a river.
- **Reeds** (`tiletrees.ts` `reedCut`): thin drawn blades with dark heads, as cards.

## Standing things (2026-11-23, in)

Bushes, boulders and dead trees were still the flat view's paintings stood up: a hedge was one green ball in a row, a
rock a grey blob, a snag a thin grey outline. Now drawn as the trees are (`tileflora.ts`, five variants each, two
sizes of bush and boulder by the map's own radius): a bush a mound of leafy lobes, some with berries the colour of
old blood; a boulder with a lit top plane, a darker face, cracks, moss on some; a dead tree a bare trunk forking into
black limbs, a crow on some, a length of old rope on others. Stumps keep their painting.

## Behind a tree (2026-11-24, in)

Nobody is lost behind a tree, and nobody looks stood in front of one. A hero hidden by a tree, a wall or a roof is
seen through it: themselves, in their own colours, on every other pixel, the thing in front on the rest
(three/figmat.ts `xrayMaterial`). Kyle chose it from four (the old pale ghost, a window cut in the canopy, the hero
solid and in shadow, and this): "See-Through is cool". A goblin behind a tree is seen the same way, and only behind a tree
(three/behindtree.ts): a wall still hides whoever waits behind it.

## Ridges (2026-11-24, in)

Flat ground is drawn stepping down toward you here and there: a low bank, a lit lip of turf over a short face of
earth and a shadow at its foot, bowing and dying into the ground at each end (tileridges.ts; the `ridge` motif of the
wood's, the fields' and the crop's looks). Paint only: you walk over it. A rise that stops you is the room's own
(ledges, three/landledges.ts).

## The laid soils (2026-11-24, in)

A hand-laid map's own ground is drawn as the floor round it is: mud is the path's ripples gone dark and cold with
water in its lowest places; a drained bed is black silt, a sixth of it standing wet; straw is stalks lying over their
shadows; a crop is the wheat floor's rows; ash is the same ground gone grey (tilesoils.ts, through soil.ts). The
ground's marks follow: churned mud, trampled ground and puddles are shapes with a wandering edge, weeds and loose
straw are the kit's small stamps (tilemarks.ts). Furrows keep their rows; rubble, scorch and ruts keep their painters
for now.

## After dark (2026-11-24, in)

A night under the open sky is moonlit, not black: the ambient has a floor (lights3d.ts `MOONLIT`, a cold blue at
about a third of the day's light), so the drawn ground and trees still read and a torch still owns the ground round
it. Fireflies drift over the book's tall grass, hollows, rings and pools at dusk and night; wisps hang over a fen's
pools (ambientglow.ts). Ferns grow at the edges of the grove floors, and a fallen log is one of the wood's scenes.

## Where the book reaches (2026-11-23)

Every room of every job on 14 days of the board, 252 rooms: fen 74, bare yards 62, wood 31, fields 28 had a look;
wheat fields 26, rock floors (mines, caves) 17 and cobbled villages 14 had none. Added: `crop` (harvest, burnt) and
`cave` (rubble, lair); a village on cobbles (earth in the redraw) is a yard. Left: 6 rooms of paved street with stone
behind, the town, rooms indoors, the Deep's halls.

2026-11-24: the paved streets and Wickhold are in, as a seventh country, `town` (rainwet, mossed): puddles and moss
on the paving only, and a drain as its scene. The Deep's halls on rock already draw the cave's looks. Left: rooms
indoors.

## Later

- Ridges on real height: the book's ridges are in (above); the earth banks of a map's own levels are the Territories chat's (three/landledges.ts), asked on the board to go darker.
- Groves inside maps: trees placed in clumps rather than one by one (the map generators, Territories' files).
- Mist banks at the edges and drifting motes (living world L4).
- (In, 2026-11-23: ANGLE in the options, HIGH, LOW or LOWEST, the ground drawn at each: tilelook.ts, tilekit.ts.)
- Looks for a paved street, the town's edges, the Deep. More looks and motifs as places ask for them; a look chosen by the place's story, not only its name.
- Groves that move a map's trees (the generators; changes fights).
