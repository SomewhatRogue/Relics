# The new look: Wickhold's insides

Kyle, 2026-11-15 (new-look.md, "Interiors to match"): "the insides are way too small now... the barracks and church
etc. let's re-imagine and design." The church, the barracks, the town hall, the Drowned Rat, the forge and the
infirmary, at the new scale and to match their new outsides (the kit's landmark fronts: the gothic church with its rose
window, the arcaded town hall with its clock and banners, the three-storey Rat with its balcony, the stone forge with
its open mouth).

## Today

Each is a shoebox 12 to 18 tiles wide and 8 or 9 deep, its back wall 2.4 tiles tall (ground.ts `WALL_H`). The tall
heroes stand about as high as the wall; under `?look=3d&hd&street` the room fills only the middle third of the
screen. Shots: `shots/before-*.png` from `scripts/inside-look.cjs`.

## The concepts

In Kyle's ElevenLabs flow "Relic: HD-2D look tests", one node a building, four takes each. The picks (Kyle may swap):

| Building | Pick | What it gives |
| --- | --- | --- |
| The church | `ref/inside-church.jpg` | A long nave between two rows of pillars, the rose window over the altar up its steps, a side chapel with the cot, the font, the verger's table by the door |
| The barracks | `ref/inside-barracks.jpg` | The map table in the middle, a roped sand ring with the dummy, bunks under a gallery, the quartermaster's counter and armour stands, the banner and shields |
| The town hall | `ref/inside-townhall.jpg` | The council table on a great rug, the valley map between two boards, the clock over a gallery, banners, a fireplace |
| The Drowned Rat | `ref/inside-tavern.jpg` | The bar under the rat sign, a hearth, a stair to a gallery, Whisper's curtained booth, the knife board, tables everywhere |
| The forge | `ref/inside-forge.jpg` | The great hearth and hood at the back with the bellows, the anvil before it, the quench tub, racks of arms, Ivo's bench of glowing relics |
| The infirmary | `ref/inside-infirmary.jpg` | A middle aisle, beds both sides with curtains, the hearth and kettle at the back, herbs from the beams, tall windows |

What they share, and what we build: **about twice as wide and deep**, **walls three hero heights tall**, the **back wall
the showpiece** (what the outside promises), **posts or pillars and a gallery** giving height, **beams overhead**,
**tall windows letting in moonlight**, and **a low front wall** across the bottom with the door gap (the cutaway).

## The rooms

Sizes in tiles (a hero is about two tall). Everyone stays: same names, words, looks, trades and trainers.

- **The church** 24 by 20, walls 7. The nave up the middle, five pillars a side, four pews a side, the runner to the
  altar three steps up at the back under the rose window (Father Odric). The side chapel west: Mother Isolde, the
  cot, herbs. Verger Oswin's table by the door; the font across from it; Marta in a pew; tomb slabs in the floor.
- **The barracks** 24 by 16, walls 5.5. Corporal Brisk at the map table in the middle; Master Cole and Squire Pell
  at the sand ring west with the dummy; Quartermaster Nell's counter and armour stands north-east; bunks under a gallery
  down the east wall; racks, the banner and shields on the back wall.
- **The town hall** 22 by 16, walls 6.5. Reeve Hollis at the middle of the council table on its rug, Alder Bram and
  Goodwife Sell either side under their boards (the `vote` hangs stay, so voteboards.ts and councilui.ts work as now);
  the valley map between them, the clock above on a gallery, banners, the fireplace east. Room on the walls for
  Lantern Square's "Best in Wickhold" boards later.
- **The Drowned Rat** 26 by 16, walls 5. Barkeep Gannet behind the bar along the back under the rat sign, casks and
  bottles behind him; the hearth west; the stair up to the gallery east; Whisper's curtained booth in the north-east
  corner with Nettle by it; the knife board on the back wall past the booth (the card sharp); Dicer Moll's table in
  the middle; the arm-wrestling table by the door (the watchman off duty); the drunk; tables set with tankards.
- **The forge** 22 by 15, walls 6. The hearth and its hood up the back wall with the bellows, Halvard at the anvil in
  front of it; the quench tub; racks of swords, axes and helms; coal heaps; Ivo at his bench in the west corner, relics
  glowing. The front wall wide open, as the outside's forge mouth is.
- **The infirmary** 22 by 14, walls 5.5. The aisle up the middle to the hearth and kettle at the back; beds down both
  sides with curtains between, the rescued (Amos, Letty, Corin) in them as they come home; Sister Agne at her desk of
  jars by the hearth; herbs from the beams.

Same door ids and the same rule in (`townInterior`); you come in at the bottom and walk out the way you came.

## How

- **Behind `?street`**, like the town: `LAYOUT.on` picks the new rooms; nobody else's insides change. When Kyle's
  happy, the switch comes out with the town's.
- **The rooms** in a new `src/shared/bighalls.ts` (the six maps), asked by `interiors.ts`. `townhalls.ts` stays as it is
  for the old town. The pastimes inside (the arm table, the knife line, the anvil) get their new spots from
  bighalls.ts; game.ts asks for them when inside (one small edit, like `townPoint`).
- **Tall walls**: `GameMap.wallH` (optional; arena.ts, one line). The walls, pillars, gallery, beams, windows and
  moonlight, and the low front wall drawn by a new `src/client/three/insidekit.ts`, in the kit's own materials
  (`mat-stone`, `mat-timber`, `mat-planks`, `mat-flags`), so the inside reads as the same building as the outside.
  ground.ts (Buildings and camera's) skips its short walls for a map with `wallH`: one line, asked in my log.
- **New furniture** (the font, the forge hood, the sand ring, armour stands, curtained beds, the stair) in a new
  `src/client/three/insidefurn3d.ts`; a few new `BlockKind`s in arena.ts. Today's pieces (pews, bunks, the bar, the
  booth, the anvil) are reused.
- **The camera inside** faces the back wall and follows your hero round the room, a little steeper than the street's
  (about 36 degrees), never swinging. camera3d.ts's STREET lines: a few lines, asked in my log.
- **The showpieces** (slice 3): one generated sheet in the flow of back-wall pieces at the kit's 32 px a tile (the rose
  window, the clock and valley map, the rat sign and bottle wall, the forge hood, banners, the infirmary's hearth),
  cut by `scripts/kitprep.py` into `kit/inside-*.png`.

## Slices

1. **The rooms.** bighalls.ts behind `?street`, the pastime spots, `wallH`, the camera inside. Today's furniture,
   taller plain walls. Tests (`tests/insides.test.ts`): each building keeps every person (name, words, look, trade);
   every person and pastime seat reached from the door; nothing in the aisle to the exit. Screenshots of all six.
2. **The structure.** insidekit.ts: pillars, posts, galleries, beams, windows with moonlight, the low front wall, the
   kit's materials; insidefurn3d.ts's new pieces. Screenshots, land each building.
3. **The showpieces.** The back-wall sheet, cut and hung. Screenshots against the concepts.
4. **Buildings out on jobs and in the dungeons** (Kyle, 2026-11-15: "I want this same idea to extend to inside of
   buildings within the dungeons etc."): the cottages, barns, longhouses, manors and tithe barns (shared/inside.ts,
   halls.ts) and any rooms built inside the dungeons, at the same scale and with the same tall walls. A short addition
   to this spec first, once slices 1 to 3 have settled the look.

## Kyle's calls (2026-11-15)

"Yes to all of these... I love this." The picks stand; extra drinkers in the Rat, folk at prayer and in the hall
(look only); the counting house, the tower and the hunters' lodge after these six; and slice 4.
