# The Open Cut: its story and its ways (spec)

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). The Instances chat's. Builds on docs/design/open-cut-map.md (one map
in stretches, gates, lulls) and the frame in docs/design/instances.md.

## What Kyle asked for (2026-11-11)

"Anchoring each one in a story arc would be really cool, with maybe a FEW choices like going down into the dungeon or
through the main hall and kitchen; different bigger maps can load with its own miniboss and boss and eventually path
back to the start. We might want to design out those narratives and pathways along with who the bosses are." The fork:
"majority rules, all have to line up on it." The end boss: the Overman, for now; "each one will have their own theme".

## The rule for every instance

- **A story in acts**, each act a big map of its own (loaded in turn, as rooms are now), each map a few places walked
  through in stretches with lulls between.
- **One fork** (later instances may have two): two ways on, each its own map with its own **mini-boss and boss**. A run
  sees one; the other is a reason to come back (its boss's pool, its story).
- **The ways meet again** for the last act and the end boss, and **the way out leads back to the start**: the run ends
  where it began, not at a dead end.
- **The fork vote:** at the fork, two marked ways. The whole party has to stand on one or the other; when everyone is
  standing on one, the way with more heroes on it opens. A tie opens nothing (move till there isn't one). Alone, your
  way is the way. The vote shows over each way as heroes step on it ("2 of 3").

## The Open Cut's story

Rakehead's diggers were roped and walked down into the Open Cut. They're alive: worked in the pit for ore the
goblins want hauled to the forge (Coldscar, chapter 3: on screen only "the forge"), and counted. THE OVERMAN keeps the
count: heads and loads, never names or where anyone went (that's the Tally Man's ledger, chapter 4), chalked in
strokes of five in the miners' own pay office, the reckoning house, as if it ran the mine. The party goes out to
Copperdeep to bring them home.

### Act 1: Rakehead (map 1)

1. **The rows.** The cottages up the hill, doors unbroken. THE DROVER drives a roped line up the street (mini-boss;
   CUT FREE the diggers and it's OPEN).
2. *A lull:* the top of the street, a body by the well-head.
3. **The reckoning house.** The pay office turned into the goblins' counting house: ledgers torn and restacked, the
   scales, the tally board with every digger chalked on it in strokes of five, pay tins. A pack at the books, a chalker
   at the board. A side room, the clerk's, with a chest and the clerk's book, its strokes in fives, and a mark that is
   the Overman's. (The place Kyle meant by "libraries".)
4. **The fork yard,** behind the reckoning house: the winding house's gantry steps on one side (OVER THE TOP), the old
   adit's mouth on the other (UNDER THE HILL). The vote.

### Act 2, one of two

**Over the top (map 2a).**
1. **The winding house.** The headframe and its great drum, half burnt; an elite pack on the gantry above you, coming
   down the stair.
2. *A lull* along the top of the incline.
3. **The incline.** THE BRAKESMAN at its brake at the top, carts sent down striped lanes at you as you climb. Hold
   attack and let go as a cart reaches you and it goes back up at the brake (Kyle: "time a power hit at it so it flips
   back"); GRAB a spent one at the foot does it too, slowly (mini-boss). *Built 2026-11-11, with the winding house.*
4. **The ropeway and the loading stage** at the lip of the pit: THE HAULIER under its ropes and loads (boss).

**Under the hill (map 2b).**
1. **The old adit.** Timbered tunnels, a branch to a cave-in (a chest, a pack trapped behind the fall).
2. **The lamp room** where the miners' lamps hung (not the Wickhold watch lamp at the adit's mouth, the atlas's trace of
   the chapter 2 traitor, which stays apart): THE LAMPMAN keeps the dark, its own doing and nothing deeper. It puts out the lamps one
   by one and fights in the dark; relight them (BURN at a lamp) and it's OPEN (mini-boss).
3. *A lull:* the water rising underfoot.
4. **The drowned workings and the washing floor:** THE SLUICER and THE RAKER, the Sluicer flooding the floor in waves,
   the Raker dragging it out again; kill both close together (boss).

### Act 3: the pit floor (map 3)

Plain ore and timber down here: nothing glowing, old or carved, and nobody who "knows" (the Copperdeep shard stays
hidden).

1. **The terraces,** the Cut's stepped sides down to the floor: few packs, tough, one on each step; a branch along a
   ledge to a chest.
2. **The working face** where the taken dig, under guard: free them (CUT FREE) as you go.
3. **THE OVERMAN** in its three stages (docs/design/open-cut-map.md): the tiers, the floor, the face.
4. **The cage.** The freed diggers get the winding cage running; it lifts the party and the diggers up to the
   rows. The run ends in Rakehead's street, the diggers home, said quietly: what was saved and what it cost. A story
   that plays again each run, not a change to the town.

### Who's who

| Who | Where | Kind | Loot |
| --- | --- | --- | --- |
| THE DROVER | The rows | Mini-boss | Its pool (docs/design/instances.md) |
| THE BRAKESMAN | Over the top: the incline | Mini-boss | Its pool |
| THE HAULIER | Over the top: the loading stage | Boss of the way | Its pool |
| THE LAMPMAN | Under the hill: the lamp room | Mini-boss | A new pool *(lore keeper)* |
| THE SLUICER and THE RAKER | Under the hill: the washing floor | Boss of the way | Their pool |
| THE OVERMAN | The pit floor | End boss, three stages | A piece per hero present, a relic *(which: Kyle; the bible has the Grappling Hook from Hempen)*, a purse |

Lore keeper, 2026-11-11: on theme. Names kept (THE OVERMAN, a real mine word; THE LAMPMAN, the real job; offered if
wanted: THE CHECKWEIGHMAN, THE TRIMMER or THE DOUSER, THE BAILER for the Raker). The Sluicer overlaps the atlas's
Damsman (who also opens sluices). For the bible: the Open Cut and what's worked there, the reckoning house, the fork
yard's two ways, the Overman, the cage.

## Building it

1. **Ways and acts:** an instance as acts, an act as one map or a fork of two (`run.way`); the fork vote at the end of
   a map (two way-out marks, the majority opens, shown over each); the last map's way out back to the start.
2. **Act 1:** the rows (built) + the reckoning house + the fork yard.
3. **Over the top:** the winding house, the incline (the Brakesman's rework), the loading stage (the Haulier as this
   way's boss, its arena in the map).
4. **Under the hill:** the adit, the lamp room and THE LAMPMAN, the washing floor with the flood.
5. **The pit floor:** the terraces, the working face, THE OVERMAN, the cage back up.
6. **Loot:** pools wired to the party roll, the end boss's piece per hero.
7. **Intros** for every mini-boss and boss as each lands.
