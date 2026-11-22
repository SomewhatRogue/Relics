# A living world

Spec, 2026-11-22 (Kyle and Claude Opus 5.5). Kyle: "are there other assets we should think through based off the maps to
make the world feel more alive?", then "Ya id like that", with drawn edges as slice one. **Not built. Slice L1 starts
on Kyle's go.**

## What is there, what is missing

There already: hens, ducks, the cat, pigeons that scatter (`client/townbeasts.ts`); the smith, the washerwoman and the
woodcutter at work (`client/folkwork.ts`); rats at the grate and the Drowned Rat's step (`client/rats.ts`); folk on
their rounds; the tile redraw (`docs/design/tile-redraw.md`) under all of it. Missing, in three kinds:
1. **Edges.** Grass, earth, mud and stone meet in hard, squarish lines. Tile art frays one into the other.
2. **What moves in the air and what reacts to you.** Almost nothing moves that is not a person or a hen.
3. **The lived-in look up close.** Fronts are clean; doorsteps empty; the tavern's tables lost their mugs in the redraw.

## The rules for all of it

- **The tile way** (CLAUDE.md, tile-redraw.md "Making a new asset"): 20 render pixels a tile, drawn by code in the kit,
  three to five shades, lit from the upper left, clean outlines, no noise; checked on the phone in 2.5D.
- **Paint only.** Nothing here blocks a step or changes a fight. Anything that would (a pen's fence that stops you, a
  cart you hide behind) is a room change and is asked for separately.
- **Cosmetic and cheap.** Driven by the clock and a seeded cosmetic `Rng`; small things share one picture a map
  (`three/propcards.ts` `CardSheet`), so a busy street stays a handful of draws on a phone.
- **Reacting** means to a hero's nearness only (as the pigeons do today): seen the same by everyone in a party.
- **Both views** where it is cheap; the flat view (the weak-phone fallback) may skip what moves.

## Slices

| # | Slice | What | Done when |
| --- | --- | --- | --- |
| L1 | **Edges where materials meet** | Drawn edge pieces on the 2.5D floor where soil areas, floors and water meet: grass frays into earth, earth into mud, cobbles break up into earth at a village's or the lower quarter's edge, a bank lip where ground meets water. A new `tileedges.ts`, laid by `three/redrawfloor.ts` from what each tile and its neighbours are | No stepped, square boundary left on the yardstick maps (`scripts/sweep-look.cjs`), phone, 2.5D |
| L2 | **What moves and reacts** | Chimney smoke and the forge's sparks; moths round lit lamps at night; bats at dusk; leaves drifting in the woods; drips in the mines and the Deep. Reacting: crows on the fields lift as you pass, birds flush from the woods' edges. **More rats**: round the market at night, behind the tavern, down the alleys, as well as the grate (new haunts in `client/ratspots.ts`, moved with the town as the others are) | Each seen on its map at the right time of day; rats and crows scatter from a hero |
| L3 | **Lived-in fronts and doorsteps** | Soot above torches and windows; ivy on the old walls; notices on the JOBS house; laundry lines between houses; shop signs that swing; barrels, crates and brooms by doors; mugs and plates on the tavern's tables again | The town sheet: no front bare, no doorstep empty, the tavern's tables laid |
| L4 | **Each place its own** | A village: pens with pigs or sheep, a scarecrow, a bucket on the well; a raided one smoking, belongings strewn. Fields: cart ruts, wheat swaying. Woods: ferns, mushrooms, fallen logs, fireflies at night. Sallow Carr: reeds swaying, frogs, ripples, wisps in the mist. Mines: rails and carts, timber props, lanterns on hooks, ore that glints. The Deep: drips, slime | A place at a time, each with its owner's yes (below) |

Order: L1, then L2 (movement is what sells "alive"), then L3, then L4 place by place.

## Who else

- L1 and L3 are the Graphics sweep's own files (`tilegrounds.ts`, `tilefurn*.ts`, `three/redrawfloor.ts`,
  `three/propcards.ts`), with small edits in `three/redraw3d.ts`.
- L2's rats: `client/rats.ts`, `client/ratspots.ts` (small edits, as on 2026-11-20).
- L4 touches other chats' maps: **Territories** (Lowfurrow, Tollan's Farm, Sallow Carr, the Copperdeep Shafts) and
  the chat that owns the Deep. Each place is asked for on the board first; the drawing is done the tile way either way.

## For Kyle

1. The order: edges, then movement, then fronts, then the places. Right?
2. How busy a night street should be: a few rats and moths, or a lot?
3. Should what moves be heard too (a crow's caw, a drip), or stay silent for now?
