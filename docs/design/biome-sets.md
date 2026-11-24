# Biome sets: a landmark, and mutations on its theme

Kyle, 2026-11-24: "I like that as part of a thematic set for bigger maps (I think we can be bigger with maps in
general?) as well as thematic sets that you're playing through in a longer mission. I like having a big landmark and
then mutations on that theme so you know that you're in x or y biome. Later on we'll add desert etc, for now it's
woods and a little swamp and fields etc mostly. I do like the drowned chapel. Let's do it all."

The aim: places that look hand placed and tailored, made by rule, so worlds and missions can be huge.

## What is here already (build on it, do not make it twice)

- Each place has a plan of its own sort and a signature only its heart may show (shared/sites.ts, nodes.ts
  `SIGNATURE`, `LANDMARK_KINDS`; docs/terrain-nodes.md). A routed room has one set piece (shared/vignettes.ts).
- Curated zones on one big map: Hangman's Wood 72 by 48, the Fen 76 by 60 (shared/hangwood.ts, fen.ts;
  docs/plans/atlas.md). Territories, hand laid, 96 by 112 (docs/design/territories.md).
- The pattern book: a look a map from its country, motifs and small scenes painted on open ground
  (docs/design/forest-redraw.md; client/looks.ts).

What is missing is the thing over all of them that says which biome this is, at a glance, on every map of it.

## A set

A biome has one theme. A set is that theme as things to draw and place:

| | The wood: the gallows | The swamp: the drowned chapel | The fields: the broken mill |
| --- | --- | --- | --- |
| Landmark (one a map) | The great hanging oak | The belfry and gable standing in the water | A tower mill, its sails torn |
| Its mutations | The hanged; a gibbet cage; empty nooses and crows | The belfry leaning; the nave's arches; the lych gate awash | Burnt out; sails down in the corn; the wheel and race of a water mill |
| Echoes (through the map) | Old ropes in the oaks, a gibbet post, cut nooses on stumps | Grave slabs leaning in the reeds, a sunk bell, pews in the mud, crosses awash | Millstones, a torn sail, sacks split open, a stopped cart of grain |
| Ground | The wood's looks | The fen's looks | The fields' and the crop's looks |

Rules:

1. **One landmark a map**, big enough to steer by, placed where you see it coming: toward the back of the map on
   the way you travel. What a place is called says which mutation it gets where the name says anything (Hangman's
   Wood has the hanged); elsewhere the name's own roll, so a place is always the same.
2. **Echoes everywhere else**: small, many, never the landmark again. On a mission of several rooms the echoes
   thicken toward the heart, and the heart has the landmark at its grandest.
3. **A mission may cross sets**: fields, then the wood's edge, then the wood. The ground and the echoes change at
   the seam; that change is how you know you have come somewhere.
4. **The tile way**: every piece drawn by code in the kit, three to six shades a material, light from the upper
   left, dark outlines, dark and bloody. No new 3D.
5. New biomes later (the desert) are a new column in the table and nothing else.

## Slices

1. **The wood's set, drawn (in, 2026-11-24).** client/sets.ts, tilelandmarks.ts. One of the map's own oaks, the
   northmost in the middle half, is drawn as the great oak (three mutations), with old ropes in about three oaks
   in ten. Drawing only: nothing moves, the oak blocks as it did, so no fight changes. Seen through like any tree.
2. **Landmarks with ground of their own.** The belfry and the mill cannot stand on a tree's footing: they need
   blocks and a clearing. One shared step after a room is planned (shared, the room decides), used by every
   generator; the great oak gets its true girth there too. Fights change: the parity record is re-made, on its own.
3. **Echoes that are real.** The scene library: 30 to 40 small authored scenes of real props (they block, some hold
   loot), placed by rule (by the road, in a clearing, at a dead end), a set's own among them.
4. **Bigger maps as beats.** A job's room grows from 28 by 24 toward about 44 by 36, laid as an approach, the
   landmark's clearing, a fight ground and a side pocket, joined by necks, with groves for walls (the real groves).
   Needs its own look at foe counts, pacing and the phone's budget before it lands.
5. **Sets across a mission.** The heart only has the grand landmark; approach rooms have echoes and a lesser
   mutation; a mission's rooms may run fields to wood to fen.
6. **The hand-laid maps.** Territories and the curated zones take their set's landmark at the spot their story
   gives it (Sallow Carr's holm, Lowfurrow's rise), by hand.

Slices 2 to 5 touch map generators other chats own (shared/terrain.ts, sites*.ts, the territory files): each is
asked on the board first, and each is its own push with the parity record re-made.

## Open, for Kyle

- How big a job's room should go (slice 4): the proposal is about 44 by 36, two and a half times today's ground.
- Whether the Deep and the mines get a set of their own now or with the desert.
