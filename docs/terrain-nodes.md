# Terrain nodes: rooms that feel like moving on

Design doc, not built. Claude Opus 5.5, 2026-11-04, for Kyle and whoever builds it.

Kyle: "each of the terrains kind of seemed to be the same map each time that you went up ... the same
sort of houses, the same sort of elements across each one. I would like them to fit in thematically
with each other, unless you reach a spot where it's like going to the woods or going to the cave. But
from frame to frame, there should be pretty noticeable differences, so it feels like you are advancing
or moving from location to location." And earlier: jobs "almost always keep going up, never moving out
to the right or left".

**The idea in one paragraph.** A job stops being "one place, N copies of its plan" and becomes a short
walk through **nodes**: room types with their own layouts, landmark and set piece, picked from a
shared vocabulary and joined by a small grammar. The job's place is the **heart** (the last room, the
one that's the same every visit so Barrowby still feels like Barrowby); the rooms before it are the
**approach** and change every job. Rooms have **ports** on any side, so a route can turn, branch, loop
and dead-end. The same nodes later tile the big map, so there is one vocabulary for both.

---

## 1. What makes rooms feel the same today

Measured with a throwaway script (`planRoom` in Node over 13 places, 8 to 30 board days; "alike" is
the share of solid tiles two rooms have in common, 1.0 = identical):

| Place | Plan | Same room, another job | Next room, same job |
|---|---|---|---|
| Barrowby | green | 0.93 | 0.76 |
| Tollan's Farm | farmstead | 0.91 | 0.78 |
| Hesketh Hall | manor | 0.87 | 0.82 |
| Fennick Ford | street | 0.91 | 0.64 |
| Copperdeep Shafts | mine | 0.93 | 0.57 |
| Sheepwash | sheepwash | 0.98 | 0.51 |

(Woods, camps and the carr score low on this measure only because their trees and shacks scatter;
their structure is the same every room, see below.)

What repeats, concretely:

1. **One plan per place, every room.** `sites.ts` maps each place to one plan function and seeds it by
   the place's name and the room index. Every room of a Barrowby job is the same three rows of cottages
   at y 2.4, 9 and 15.6, either side of a lane at x 14, with hedges at x 6 and x 21 and strip fields
   outside them. Room 2 of the job differs from room 0 by a missing cottage and a cart.
2. **The same landmark in every room.** Over 50 rooms each: Barrowby has a well in 96% and a shrine in
   98%; Hangman's Wood has its gallows in 90%; Hesketh Hall has the burned hall front in 96%, the
   fountain in 96% and statues in 100%; every Copperdeep room has the same rock walls at x 4.4 and
   x 22.4 and pit props every 4.4 tiles.
3. **The same place on every visit, by design.** `tests/places.test.ts` asserts the same soil whatever
   the job ("the same every time you go there", DECISIONS 2026-11-01). This doc reverses that for
   every room but the heart.
4. **Always bottom to top.** 690 rooms over 30 days: 540 leave at x 13, y 0 (top middle), the other 150
   are forks leaving at the top-left and top-right corners. `SPAWN` is always (14, 22).
5. **A clear lane up the middle.** `terrain.ts free()` and `sitekit.ts blocked()` both keep everything
   solid off the column `|x - 14| < 1.4`, and every plan draws its path from (M, H) to (M, 0). So every
   room has a straight run up the middle, whatever the place.
6. **The objective always at the top middle.** Cages at (4, 2.2), (24, 2.2), (14, 2.8); the named
   butcher at (14, 4.5); the chained chest at (16.2, 3.2). Raised ground, when there is any, is always
   in a top corner.
7. **The fork is cosmetic.** Always the second-to-last room, always HIGH and LOW at the top corners,
   and both roads lead to the same final room (same soil, same exit); the high road adds a ledge, the
   low road a cage.
8. **No change of scene inside a job.** Floor, back wall, light, hour, music and spider rules come from
   the place's kind, so all rooms of a job share one palette. Nothing ever takes you from fields into a
   wood or from a yard into a mine.
9. **The room's furniture of fights.** Two goblin fires in every room, a heap of the dead in 60%, the
   same four torch spots on the back wall.

What already helps, and stays: each house's look and fate (`houses.ts`), the hour (`timeofday.ts`),
the back of the pack and spiders on their own seeded streams.

---

## 2. The node vocabulary

### 2.1 What a node is

A node is a room type, written once in `shared/nodes.ts` as data plus a plan function:

| Field | Meaning |
|---|---|
| `id` | `woodedge`, `lane`, `gallery`... |
| `biome` | Barrowfields, Greyhollow, Fenmere, Copperdeep, ruins, the hungry's, under Wickhold, connector |
| `role` | **heart** (a named place's own, fixed per visit), **theme** (belongs to one biome), **connector** (fits any biome, skinned by its neighbours), **transition** (half one biome, half the next), **dead end** (one port: a side room) |
| `ports` | which sides it can be entered and left by (S, N, E, W; "any") |
| `layouts` | two to four sub-layouts, each mirrorable |
| `landmarks` | the pool its one landmark comes from |
| `slots` | where set pieces and vignettes can go |
| `hosts` | objectives it can hold (final room) and side tasks (any room) |
| `palette` | floor, soil mix, back wall, light (ambient, moon, torches), music |

Objectives: **rescue**, **hunt**, **larder**, **burn** (dens), **story**. Side tasks from PLAN's big-map
list: **poison** (the larder), **wreck** (a siege engine), **free** (prisoners), **hold** (a spot).
What a heart needs to host an objective: hunt, open ground about 10 by 8; burn, three den spots (2.6 by
1.6 with oil by each); rescue, two or three cage spots or houses; larder, three rack spots.

"(new)" marks a piece that doesn't exist yet. Everything else is already a `RoundKind`, `BlockKind`,
`MarkKind`, soil or grim kind in `shared/arena.ts`.

### 2.2 Connectors (any scenario)

Short, lighter fights, often the room a vignette lives in. Each is **skinned** by the biome it sits
in: the same `ford` is reeds and willows in Fenmere, hedges and sheep pens in Barrowfields, rocks and
spoil at Copperdeep.

- **`track`**: a lane or track between banks.
  Signature: earth path with ruts; hedges (fields), trees (wood), reeds (fen) or rock (Copperdeep) as
  its banks; a waymark stone or wayside `shrine`. Hosts: clear, free, hold. Layouts: bend, S-bend,
  **hollow way** (sunk lane, its banks raised ground with archers on them), fallen tree across it (the
  path goes round). Ports: any two.
- **`crossroads`**: where three or four tracks meet. Signature: trampled earth, a shrine or a
  `cross`, a wrecked `cart`. Hosts: clear, hold, free. Layouts: T, four-way, offset. Ports: any; the
  natural fork and the natural side branch.
- **`ford`**: a river across the room, waded at a shallow. Signature: deep `water` with one or two
  fords, stepping stones, reeds, mud at the banks. Hosts: clear, free, hold (hold the ford).
  Layouts: one wide ford, two fords, stepping stones, flood (more deep, one ford). Ports: across the
  water (S to N, or W to E with the river running down the room).
- **`bridge`**: the same river, crossed on a bridge. Signature: a 3-wide deck with `wall` parapets over
  deep water. Layouts: whole, **broken** (deck gone in the middle; `debris` and `planks` marks; wade
  downstream), burning (a goblin vignette). Hosts: clear, hold, wreck. Ports: across.
- **`gate`**: a boundary with one gap: a field gate in a hedge, a farm's palisade gate, a park wall's
  gate piers, a rock cleft, a sewer grate. Hosts: hold (the choke point), clear. Layouts: gap middle,
  gap to one side, two gaps (one barricaded with `hurdle`s). Ports: through the boundary.
- **`clearing`**: open ground ringed by whatever's around (trees, hedges, rocks). Hosts: hunt, burn,
  hold. Layouts: round, long, with a stream through. Ports: any.

### 2.3 Barrowfields: village and farm

Grass, earth and furrow; palisades and hedges; open sky. Ruin 1, so houses mostly standing.

- **`green`** (heart: Barrowby). Today's `green()`: cottages round the green, the well and the
  shrine, strip fields beyond the hedges. Hosts: all five. Stays the same every visit (its heart).
- **`lane`**: a row of cottages on one lane. Signature: `house` blocks with yards and fences, kitchen
  gardens, a barrel or two. Hosts: rescue (houses), clear, free. Layouts: one-sided row (fields across
  the lane), two-sided row, **village end** (the row gives out into fields halfway up), a burned row.
  Landmark: a lit window, a smithy's chimney, a collapsed house. Ports: along the lane, with a gap
  between houses as a side way.
- **`farmyard`** (heart: Tollan's Farm is one of its layouts). Signature: `house`, `barn`, `well`,
  `cart`, paddock fences, hay. Hosts: all five. Layouts: today's farmstead, **courtyard** (barns in a
  U, the yard inside), **longhouse farm** (one big house, byre at the end), burned farm.
- **`stackyard`**: hayricks, a threshing barn, carts. Signature: `hay` big and small, `barn`, `straw`
  soil. Hosts: burn (hay burns), larder, clear. Layouts: rows of ricks, a rick-yard round the barn.
- **`strips`** (heart: Lowfurrow Fields is one layout). Today's `fields()`. Layouts: standing grain,
  stubble with stooks, ploughed with a plough left in the furrow (new prop). Ports: any.
- **`orchard`**: rows of `tree`s, a press shed, windfalls (new mark). Hosts: clear, rescue (pens in
  it when occupied). Layouts: rows, old and overgrown. Ports: any.
- **`mill`**: a watermill on its leat, the millpond above it. Signature: a big `barn`-like block with
  a wheel (new), deep pond `water`, a sluice ford. Hosts: larder (the mill is where they'd keep it),
  hunt, rescue. Layouts: wheel left or right, pond above or beside.
- **`churchyard`**: a small church, graves, a yew. Signature: `church` block, `mound` marks and
  headstones (new round), a lychgate (a `gate` connector built in), one big `tree`. Hosts: hunt,
  rescue (in the church), hold. Layouts: church at the back, church to one side. Lore keeper first
  (see section 7).
- **`ketterby`** (heart: Ketterby). Today's `ruinvillage()`.
- **`sheepwash`** (heart: the Sheepwash). Today's `sheepwash()`.

### 2.4 Greyhollow: the woods

Grass going to leaf litter, trees as the back wall, less sky and darker as you go in. Spiders allowed.

- **`woodedge`** (transition, fields to wood): the bottom third is the last field (hedge, stile,
  furrow), the top two thirds trees thickening to the back wall. Signature: coppice stools (`stump`),
  a log pile (new, or `rack`), a woodcutter's `shack`. Hosts: clear, free, hold. Layouts: hedge with a
  stile, a felled ride (a straight cut through), the edge on a slope (raised ground). Ports: in from
  the fields side (S, E or W), out into the trees (N or a side).
- **`coppice`**: a managed wood. Signature: rows of `stump`s and poles, charcoal hearth rings (`ash`),
  `hurdle` stacks. Hosts: clear, burn. Layouts: rows, a ride crossing.
- **`deepwood`**: old trees close together, roots and boulders, a faint path. Signature: big `tree`s
  and `pine`s, `rock`s, a `deadtree`, no buildings. Light: ambient about 0.6 of today's forest, moon
  0.2; goblin fires and spells are most of the light. Hosts: hunt, clear, spiders (nests). Layouts:
  narrow winding path, **deadfall** (a tangle you go round), a rocky rise (raised ground). Ports: any.
- **`glade`**: open grass inside the wood with a stream. Signature: `grass` soil, a stream (shallow
  water), flowers (`flowers` mark). Hosts: hunt, hold. Layouts: stream across, stream down one side,
  the **hanging tree** set piece. Ports: any; also a dead end.
- **`charcoal`** (heart: the Charcoal Camps). Today's `camp()` in the woods with its clamps.
- **`hangman`** (heart: Hangman's Wood). Today's `wood()` with the gallows, the gallows only here.
- **`carr`** (heart: Sallow Carr; also the transition wood to fen). Today's `carr()`.

### 2.5 Fenmere: river and fen

Mud and water, reeds, willows, a pale low light. Dawn's mist allowed at any hour here.

- **`causeway`** (transition, field to fen): a raised earth track with bog water close on both sides.
  Signature: deep `water` either side, `reed`s, boards (`planks` marks), a punt (new). Hosts: hold,
  free, clear. Layouts: straight, dog-leg, broken (a gap to wade). Ports: straight, either axis.
- **`reedbed`**: channels and pools in reeds. Signature: many small pools, `reed`s, a heron's stake
  (`post`). Hosts: clear, spiders. Layouts: channels across, pools scattered.
- **`peat`** (heart: the Peat Cuts). Today's `peat()`.
- **`fordtown`** (heart: Fennick Ford). Today's `street()`. Its other layouts become approach nodes:
  the **market** (stalls, the cross or fountain), the **walled garden**, the **merchant's yard**.
- **`hallgrounds`** (heart: Hesketh Hall). Today's `manor()` split three ways: the **drive** (statues,
  gate piers, the burned front), the **walled garden** (parterre, fountain), the **stable court** (barn,
  well, cart). The heart is the drive; the other two are approach rooms on Hesketh jobs.

### 2.6 Copperdeep: mine and cave

Rock floor, rock face, no sky underground. Torches only where people worked; caves are dark.

- **`orebridge`** (heart: Brokenbridge). Today's `camp()` by the river with the broken bridge.
- **`minehead`** (transition, outside to under): the yard at the top of the workings. Signature:
  spoil heaps (`rubble`), a headframe (new block), ore carts and `ruts`, the adit as the top exit (the
  dark gap in a `rockface` back wall is what a top exit already looks like). Hosts: clear, wreck,
  larder. Layouts: headframe left or right, spoil across the middle.
- **`gallery`**: today's `mine()`. Layouts: today's straight gallery, a **crossing** (galleries at
  right angles: the natural four-port node), a **stepped** gallery (ore shelves as raised ground).
- **`orechamber`**: a big worked-out room with pillars of rock left standing. Signature: big `rock`
  rounds as pillars, ore heaps, a winch (new). Hosts: hunt, larder, burn. Ports: any; a good dead end.
- **`flooded`**: a drift with standing water. Signature: shallow water the length of it, a deep sump,
  floating `planks`. Hosts: clear, spiders. Ports: straight.
- **`collapse`**: a fallen-in stretch. Signature: `rubble` across most of it, a squeeze to get
  through, a broken pit prop (`support` fallen). Hosts: clear, hold. Ports: straight; a turn here
  feels natural ("the way is blocked, the passage goes round").
- **`cave`**: natural rock beyond the workings. Signature: irregular big `rock`s, pools, no pit
  props, no torches, webs in the spider variant. Hosts: hunt (a deep job's bottom), spiders, larder.
  Layouts: winding, chamber, spider warren. Ports: any. Lore: never shows "what was down there first".

### 2.7 Ruins

Any biome at high ruin can have these; they also make good approach rooms for Ketterby and Hesketh.

- **`ruinlane`** and **`ruinmarket`**: today's `ruinvillage()` split in two (the walls where houses
  stood; the old market's columns).
- **`barrows`**: grassed burial mounds older than the valley's villages. Signature: big `mound`s,
  standing stones (`stone`), a dark opening in one. Hosts: hunt, hold, a dead end into the mound.
  New lore (section 7).
- **`ruinchapel`**: a roofless chapel with its yard. Signature: broken `wall`s in a church outline,
  `pillar`s, an `altar` in the open, graves. Hosts: hunt, rescue, hold. Lore keeper first.

### 2.8 The hungry's own

Two ways in: as **nodes**, and as an **occupation** of any node at ruin 2 and up (the farmyard turned
into a larder yard, the orchard into pens, the gallery into a den row). Occupation swaps some of the
node's pieces for the hungry's, keeps its ground and landmark, and gives the room a different job to do.

- **`warcamp`**: tents and `shack`s in a ring behind sharpened stakes (new fence kind), a big wild fire,
  a drummer, trophies. Hosts: burn, hunt, wreck (a siege engine being built), hold.
- **`denfield`**: the low windowless huts they put up themselves (bible), oil hoarded by each. Hosts:
  burn.
- **`larderyard`**: racks with their stock hung by the ankles, a cookpot. Hosts: larder, poison.
- **`pens`**: `cage`s and a wicker fold (`hurdle`s). Hosts: rescue, free.

### 2.9 Story-gated

Not in the random rotation; they appear when the chapter opens them.

- **Under Wickhold (chapter 2)**: **`outfall`** (transition: the riverbank where a culvert comes out,
  a grate to break), **`culvert`** (a channel down the middle, deep, with walkways either side and
  sluice fords), **`cistern`** (pillars in standing water), **`junction`** (four tunnels: the
  natural turning node), **`dig`** (the hungry's tunnel breaking through the brickwork). Replaces the
  sewers' borrowed `mine` plan today.
- **The keep (chapter 3)**: **`oldquarter`** (Wickhold's lanes at night), **`keepyard`**, **`wallwalk`**
  (raised ground the length of the room). Built from `street()` and `manor()` pieces.
- **The tally market (chapter 4)**: Fennick Ford's **`tallywall`**, from `fordtown`.

### 2.10 How a visit varies

In order of cost, cheapest first. Each room gets a value on every axis from its seed (section 5).

1. **Sub-layout**: two to four per node (above).
2. **Mirror**: any layout flips left to right (doors still face down the screen, so houses are fine).
3. **The lane**: where the path runs. Today it's always x 14; the way in and out move (section 3.4)
   and the plan follows a bent line between them.
4. **Landmark**: one per room from the node's pool (a well, a shrine, a big yew, a headframe, a
   broken bridge, a hanging tree, a burned house). Never the same landmark twice in a job.
5. **Set piece**: one vignette per room (section 4).
6. **Ruin level**: the room's `grimness` (already used for house fates) also picks a layout's state:
   lived-in, looted, burned, razed. Deeper rooms of a long job look worse.
7. **Occupation**: at ruin 2 and up, some nodes are the hungry's (2.8).
8. **Light drift**: on a long job the hour moves on a step across the rooms (dusk deepening to night,
   dawn's mist lifting), and each node scales the light (deep wood darker, caves none). Kyle's call:
   the board says one hour; drift only goes the way the hour already points.
9. **Weather** (new, later): rain (streaks on the glow layer, puddle marks) and fog banks (today's
   dawn mist, any hour) per job, with fen and river nodes taking fog more often. No rules change with it.

---

## 3. How nodes connect

### 3.1 The region graph

```
                 Wickhold (north gate)          Wickhold (sewer door, ch 2)
                        |                                   |
                 BARROWFIELDS ------------------------ outfall --- culvert/junction/cistern --- dig
        track, lane, farmyard, stackyard, strips,
        orchard, mill, churchyard, barrows
          |                 |                    |
      woodedge          causeway / ford      track (ore road) / ford
          |                 |                    |
     GREYHOLLOW  ---carr--- FENMERE          COPPERDEEP (surface): orebridge, minehead
  coppice, deepwood,    reedbed, peat,             |
  glade, charcoal,      fordtown,              adit (top exit of minehead)
  hangman               hallgrounds                |
                                              gallery, orechamber, flooded, collapse
                                                   |
                                                  cave
```

Connectors (`track`, `crossroads`, `ford`, `bridge`, `gate`, `clearing`) can sit anywhere on an edge
and take the skin of the side they're on. Ruins and the hungry's nodes drop into any biome.

### 3.2 Route templates

A job's route is built back from its heart (the place on the board) toward Wickhold:

| Size | Rooms | Template |
|---|---|---|
| short | 2 | approach, **heart** |
| medium | 3 | approach, middle (fork), **heart** |
| long | 5 | approach, middle, transition, middle (fork), **heart** |
| deep | 5 | edge, worse, transition (in), worst (fork), **heart** (the named butcher's lair, always inside the place's biome, light falling room by room) |

- **Approach** comes from the region you cross from Wickhold (Barrowfields, for everything outside),
  or from the place's own biome when the job is in Barrowfields.
- **Transition** is required whenever two consecutive rooms are in different biomes (wood edge,
  causeway, minehead, carr, outfall).
- Examples:
  - *Medium, Hangman's Wood*: `track` (hedged, S to E) > `woodedge` (W to N, fork: into the trees N, or
    along the stream E) > `hangman`.
  - *Long, Copperdeep Shafts*: `strips` (S to N) > `ford` (Copperdeep skin, S to W) > `minehead`
    (E to N, adit) > `gallery` crossing (S to E, fork) > the shafts' heart.
  - *Deep at the Peat Cuts*: `causeway` > `reedbed` > `hallgrounds` stable court (occupied: pens) >
    `peat` (fork) > `peat` heart.

### 3.3 Rules that make each room noticeably different

Each is a check `shared/route.ts` makes and `tests/route.test.ts` asserts over a thousand seeds.

1. **No node twice in a row**, and no sub-layout twice in a job.
2. **One landmark a room**, never repeated in the job, placed where you see it from the way in.
3. **A palette step every room**: consecutive rooms differ in at least two of floor, soil mix, back
   wall, light and music. A transition counts as the step.
4. **One set piece a room**, never the same one twice in a job.
5. **The way on moves**: no more than two rooms in a row leave by the same side, and every medium or
   longer job turns at least once.
6. **Rhythm**: on a long job no two heavy rooms (goblin count in the top third) back to back; a
   connector sits between.
7. **The heart is recognisable**: its node, layout and landmark come from the place's own seed, so the
   last room of a Barrowby job is the green with its well and shrine every time. Only the heart is
   allowed the place's signature (Hangman's gallows, Hesketh's burned front, Barrowby's well and
   shrine), which also fixes repeat 2 above.

### 3.4 Exits on any side

**Ports.** A port is a side (N, E, S, W) and a place along it (0.2 to 0.8 of the side). The way in
puts the party 1.6 tiles inside it; a way out is a 0.9-deep strip at the edge, 2 wide. Leaving by E
means the next room's way in is W, and so on.

**Shapes of room** (a room has one way in and one or more out):

| Shape | Ports | Feels like |
|---|---|---|
| straight | S to N, or W to E | today, or a crossing |
| turn | S to E, S to W, W to N, E to N | the road bends |
| fork | in, plus two outs on different sides | choose a road |
| side way | in, out, plus a side opening to a side room | a branch with something in it |
| dead end | one port (a side room) | loot, a captive, a shrine, a nest |

Entering from N (walking down toward the camera) is allowed but rare: underground going deeper, and
a loop's return. Leaving by S is only for side rooms and loops.

**Branches.** A side way is a gap at the room's edge (a field gate, a cleft, a gallery mouth, a hole
in a palisade) that leads to a **side room**: a dead-end node (glade, orechamber, churchyard, pens, a
cave pocket) with a chest, a captive, a nest or a cache of oil. It works exactly like a house on a job
today: the street stays alive while you're in it, friends go in on their own, its goblins stay dead,
its captives count toward the room (as `houseCaptives` counts the houses'). You come back out where you
went in. At most one side way a room; one or two a job.

**Loops.**
- **The fork rejoins from the side**: both roads of a fork lead to the same next room, but enter it by
  different sides (the high road from W, the low road from S), and each road is its own node, not the
  same room with a ledge. You come round to the same place a different way.
- **A side room with two ways back**: in by a gap at the bottom-left, out by one at the top-left, back
  into the parent room further on (a sunk lane behind a hedge, a side gallery round a collapse).
- **True loops** (coming back into an earlier room) wait for the big map, where they're free.

**Forks choose a path.** The fork's two outs lead to different nodes, labelled by what's ahead on the
floor as today. HIGH and LOW stay as the two road kinds (archers on heights, or more goblins and
someone caged), but each picks a different next node, so the choice changes the scenery as well as
the fight. New road labels go through the lore keeper and the line editor.

**A turning room**, S to E, in the 28 by 24 room (`@` way in, `>` way out, `L` landmark):

```
############################   back wall (trees)
#  t   t     t   t   t   t #
#   t    clearing      t   #
# t    .........     t  t  #
#      ..  L  ..===path=== >   way out E (gap in the side wall, two torches, lit mat)
#  t   .........  //       #
#    t    t   //    t  t   #
#  t    //   t   t     t   #
#     //  t    t     t  t  #
#    @                     #
###########  ###############   (front kerb)
```

### 3.5 What has to change in code

What assumes bottom to top today, and the change:

| File | Assumes today | Change |
|---|---|---|
| `shared/terrain.ts` | `SPAWN` (14, 22), `EXIT` top middle, roads at the top corners; `free()` keeps the middle column clear; cages, boss, chained chest at the top; ledge in a top corner; four torch spots | Ports from the route; `free()` keeps a buffer round the **spine** (the bent line from the way in to each way out); objective spots placed relative to the far end of the spine; ledges on a side the spine doesn't cross; torches skip a north gap only if there is one |
| `shared/sitekit.ts` | `blocked()` reserves a 2.8-wide column up the middle | Reserve the spine's buffer instead (same distance-to-polyline helper `sitewild.ts` already has as `off`) |
| `shared/sites.ts` + every plan | Paths drawn from (M, H) to (M, 0); one plan per place | `Ground` gets `spine` and `lane(y)`; plans draw along it; `layOut` takes the node and layout from the route |
| `shared/arena.ts` | `exit: Area`, `roads: Road[]` at y 0 | Add `side` to the exit and each road (optional, so old maps read as N) |
| `client/wayout.ts` | `top(a)` or a house door; gaps painted in the back wall only | A side gap: posts and a lintel drawn on the side strip, a dark opening, torches either side; south gaps in the front kerb |
| `client/exitmark.ts`, `three/exitmat3d.ts` | `out: -1 or 1` (up or down) | `out` as N, E, S, W; the mat turns 90 degrees for E and W |
| `client/world.ts` | Side and front walls are solid 8-pixel strips | Cut the strip where a side or south way is |
| `three/ground.ts` | Back-wall gaps only for `a.y < 1`; side walls one box each | Side walls and kerb built in segments with gaps; posts at each gap |
| `client/scene.ts`, `three/overlay3d.ts` | Road labels under a top gap | Label beside the gap, inside the room |
| `sim/room.ts` | `join` spreads the party along +x from the way in | Spread across the port's axis (along y for E and W) |
| `sim/goal.ts`, `client/wayfind.ts`, `sim/targets.ts` | Already side-agnostic (`wayDir` knows east and west; survivors go home to `map.hero`) | Nothing |
| `client/game.ts` | Leaving is `inArea`, already side-agnostic | Side rooms: walk into a side way in any direction (today a door needs pushing up) |
| `sim/run.ts` | `roads: Record<number, 'high' or 'low'>` | `took`: the road or side way at each room (a short string), from which the route gives the next node |
| `tests/places.test.ts` | Same place, same plan whatever the job | Same **job**, same rooms; the heart the same whatever the job; walkability over every port pair |

**The cheapest path.**
1. Spine first: replace the middle-column rule with the spine in `terrain.ts` and `sitekit.ts`, with the
   spine still bottom to top. Nothing visible changes; the tests still pass. Small.
2. Move the way out along the top (x 7, 14 or 21) and mirror layouts. Plans read `lane(y)` instead of
   `M`. This alone ends the straight run up the middle.
3. Side exits only in **open** nodes first (track, clearing, woodedge, deepwood, glade, strips, carr,
   camp, cave): they scatter round the spine already and work with any ports. Built-up hearts (green,
   street, manor, gallery) stay S to N with mirrored and offset lanes until they get their own sideways
   layouts. Most of a job's turning happens in the approach rooms, which is where it's wanted.
4. Side rooms reuse the house machinery (`client/jobrooms.ts`) instead of new room persistence.

---

## 4. Set pieces and vignettes

A vignette is a little scene put down in a slot of a compatible node: pieces, a few goblins doing
something, and what happens when they see you. "Behaviour" says whether the goblins' part exists.

| Vignette | What you see | Behaviour | Fits |
|---|---|---|---|
| **At the fire** | A band round a wild fire, at rest till they see you | Exists (resting at fires) | any outdoor; gallery, orechamber |
| **At the dead** | A heap of the dead, goblins eating, slow to look up | Exists (`feeding`) | any |
| **The feast** | A butcher at the head of a long fire, the pot on, bones, a band round it | Exists (resting + `pot`, `bones` grim) | warcamp, farmyard, clearing, orechamber |
| **Burning a house** | Goblins with torches round a cottage; it catches as you arrive or when they see you; the hungry inside come out burning | New: a torch-bearer pose; the house's `burning` fate and houses alight already exist | lane, farmyard, green, fordtown, stackyard |
| **Dragging a body** | One or two hauling a body along a `trail` toward their fire; they drop it and turn | New: a walk along a path with a body in tow (`trail` grim exists) | track, lane, woodedge, causeway |
| **Prisoners led off** | A short line of captives roped together with an escort, walking for the far way out. Kill the escort before they reach it | New: survivors walking with escorts; a timer that's the distance | track, crossroads, ford, causeway, gallery |
| **The patrol** | A few walking a loop of the room | New: waypoints | any, more in camps |
| **Asleep** | Goblins curled in the hay or by a cold fire | Exists (`sleepers`) | stackyard, farmyard, orechamber, glade |
| **Looting a cart** | A wrecked cart, crates broken open, goblins at it | Exists (resting at a spot) + `cart`, `debris` | track, crossroads, bridge, ford |
| **Archers on the heights** | Bows up on raised ground | Exists (ledges) | hollow way, woodedge slope, stepped gallery, wallwalk |
| **Building an engine** | A half-built ram or throwing engine; goblins at it | New block (engine) and a "working" pose; the **wreck** side task | warcamp, crossroads, minehead |
| **Wayside shrine** | A small shrine, fouled by the hungry, a candle stub | Piece exists (`shrine`) | track, crossroads, lane, churchyard |
| **Wrecked cart** | Overturned, burned or not, barrels of oil (a fire trap) | Pieces exist | track, crossroads, bridge, ford, minehead |
| **Hanging tree** | A big tree with the hungry's stock hung by the ankles from it (the larder rule), crows | New tree piece; `hung` grim used outdoors; `crows` exist | woodedge, glade, deepwood, track |
| **The well** | A well with its winch; a cache on the rope (loot), or goblins using it | Piece exists (`well`) | green, lane, farmyard, fordtown, hallgrounds |
| **Broken bridge** | The deck gone, its boards in the water, wade downstream | Marks exist (Brokenbridge's) | bridge, ford, stream |
| **Fallen tree** | A trunk across the path, the way bends round it | New piece (log) | track, woodedge, deepwood, coppice |
| **Webbed** | Webs hung with what was caught, a nest | Exists (spiders, nests) | deepwood, cave, flooded, orechamber, carr |
| **The column's dead** | Soldiers' bodies where they fell, picked over | Exists (`soldier` corpses) | track, woodedge, crossroads |

Limits from the bible that every vignette keeps: no children's remains, ever; a cry from a building is
always a real captive; the hungry eat raw where they kill and cook what they carry home; bells are the
town's; goblins are never misunderstood. Lines any vignette speaks go through the lore keeper and the
line editor.

---

## 5. Seeds

Everything is a pure function of the job and the roads taken, so every screen agrees and a bug can be
replayed. No `Math.random` for anything placed; a vignette's idle loop may use its own cosmetic stream.

- **The route** (which node, layout, ports, landmark and set piece in each room) is built once from
  `new Rng(job.seed * 7919 + 101)`, its own stream, so the board, the hour, the back of the pack and
  spiders keep their streams. A fork makes the route a small tree; both branches are rolled up front.
- **The heart** is rolled from the place's own seed (today's `placeSeed`), so it's the same every visit.
- **A room** is planned from `roomSeed = hash(job.seed, index, took)`, where `took` is the roads and
  side ways chosen so far ("", "h", "hs1"...). The leader's run already carries `roads` to friends; the
  route needs nothing more sent.
- **Old jobs**: a `layout: 2` on new jobs; a saved run without it plans its rooms the old way.
- **Big maps**: the same grammar laid on the chunk grid. A node takes a 2 by 2 block of 12-tile chunks
  (24 by 24, near a room); the 96 by 72 test map is 4 by 3 nodes. The route walks the grid (turns are
  grid turns, branches are side cells, loops are grid cycles), fillers fill the cells it skips, and a
  port's place along a shared edge comes from `hash(seed, edge)` so both neighbours agree and the seam
  is open. Today's chunk kinds become small nodes or vignettes: `open` and `grove` are filler, `farm`
  a small farmyard, `camp` the warcamp or At the fire, `ridge` a gate (rock), `ruin` a ruinlane. The
  map goes as its seed (DECISIONS 2026-11-03 already asks for that).
- **One plan function per node layout**, `plan(rng, region, ports)`: in a run it's laid into a walled
  28 by 24 room; on the big map into a 24 by 24 cell whose walls are its neighbours.

---

## 6. Build plan

Each slice is playable on its own. Effort: S is a session, M two, L three or more.

**Slice 1: sub-layouts and no repeats, still bottom to top.** *Done when* Kyle plays a long job at
Barrowby and no two rooms share a layout or a landmark, the way out sits left, middle or right, the
last room is the green with its well and shrine, and the next day's Barrowby job has different
approach rooms. Files: `shared/nodes.ts` (new, the vocabulary for today's nodes plus `track`,
`crossroads`, `lane`, `clearing`), `shared/route.ts` (new: templates, rules 1 to 4 and 7), `shared/sites.ts`
(node and layout from the route, `lane(y)`), `shared/sitekit.ts` and `shared/terrain.ts` (the spine;
the objective at the far end), the plan files split into layouts (`sitevillage.ts`, `sitetown.ts`,
`sitewild.ts`, `sitecamp.ts`, with new `sitefarm.ts`, `siteroad.ts` to stay under 200 lines),
`tests/places.test.ts` (the rule change), `tests/route.test.ts` (new). A DECISIONS entry that reverses
"the same every time" for all but the heart. Effort: M.

**Slice 1b: vignettes from what exists.** *Done when* every room has one set piece and Kyle meets at
the fire, at the dead, the feast, asleep, looting a cart, the wrecked cart and the broken bridge across
a long job without a repeat. Files: `shared/vignettes.ts` (new), `shared/terrain.ts`. Effort: S.

**Slice 2: side exits and turning routes.** *Done when* on a medium job Kyle comes in at the bottom,
leaves by the right-hand side through an opening with torches and a lit mat, starts the next room at its
left edge, and the gold arrow and WAY ON: EAST agree, in FLAT and 2.5D, on phone and laptop. Files:
`shared/arena.ts`, `shared/terrain.ts`, `shared/route.ts` (rule 5), the open nodes' plans,
`client/wayout.ts`, `client/exitmark.ts`, `client/three/exitmat3d.ts`, `client/three/ground.ts`,
`client/world.ts`, `client/scene.ts`, `client/three/overlay3d.ts`, `sim/room.ts`; walkability over every
port pair in `tests/places.test.ts`; a side-exit shot in `scripts/look.cjs`. Effort: M.

**Slice 3: branches, loops and dead ends.** *Done when* Kyle finds a side way in a hedge, goes through
to a dead-end glade with a chest and a captive, brings them back out to the street; takes a fork whose
two roads are different places and comes into the next room from the side; and walks a side room that
comes back into the parent room further on. Friends go in and out on their own, as with houses. Files:
`client/jobrooms.ts` (side rooms beside houses), `client/game.ts` (walk into a side way), `shared/sideroom.ts`
(new: dead-end plans), `shared/terrain.ts`, `shared/route.ts` (the route tree), `sim/run.ts` (`took`),
`sim/goal.ts` (side rooms' captives), `client/wayfind.ts`, the co-op save of side rooms. Effort: M to L.

**Slice 4: transition nodes and biome changes.** *Done when* a long job at Hangman's Wood starts in the
fields, crosses a wood edge into the dark of the deep wood, and the light, back wall, music and spiders
change with it; a Copperdeep job goes from the ford to the minehead and in by the adit into the
galleries and a cave. Files: `shared/nodes.ts` (woodedge, deepwood, glade, coppice, causeway, reedbed,
minehead, orechamber, flooded, collapse, cave, churchyard, mill, orchard, stackyard, barrows),
new plan files (`siteedge.ts`, `sitecave.ts`, `sitechurch.ts`), theme, light and torches by node in
`shared/terrain.ts`, sky by node in `shared/timeofday.ts`, spiders by node in `shared/nests.ts`, music by
node, new pieces (headframe, log, hanging tree, headstones, engine, stake fence) in `client/propsdraw.ts`
and `client/three/props3d.ts`, the new behaviours for vignettes (torch-bearers, dragging, prisoners led
off, patrol). Effort: L.

**Slice 5: one vocabulary with big maps.** *Done when* `?bigmap=1` grows from the route on the grid:
the same nodes, a route that turns across it, side cells and a loop, open seams, the same map from the
same seed on every screen. Files: `shared/bigmap.ts` (the route on the grid), `shared/bigchunks.ts`
(becomes the filler nodes and an adapter), `shared/sites.ts` (`layOut` into any region with ports),
`shared/route.ts` (grid walk), `tests/bigmap.test.ts`. Effort: L.

---

## 7. For the lore keeper, and open for Kyle

**New names and lore to check** (none is in the story bible yet):
- **The barrows** in Barrowfields: old grassed burial mounds the fields might be named for. New lore;
  what's in them stays open.
- **Valley churchyards and a roofless chapel**: whose church, and are the bells there gone like
  Wickhold's (the belfry is empty; bells are kept for chapter 5)? Must not be confused with the Old
  Chapel.
- **The hanging tree** as the hungry's larder tree (by the ankles, the larder rule), separate from
  Hangman's Wood's gallows.
- **Siege engines** the hungry build (for the **wreck** side task): new, and leans on chapter 5.
- **The mill**: a working watermill in Barrowfields (the bible has Fennick Ford as "the old mill town").
- **The cave beyond the workings**: generic natural cave; nothing in it hints at what was at the
  Copperdeep first.
- **Under Wickhold nodes** (outfall, culvert, cistern, junction, dig): chapter 2's, tunnels pointed at
  the square.
- No new proper names are needed. If the approach rooms show a name on the banner, they'd use the node
  word ("THE WOOD EDGE", "THE FORD") under the place's name; those words go through the lore keeper and
  the line editor. A placeholder used in thinking, "the Drove Road" for the track out of the north
  gate, is not used anywhere above and would need the lore keeper's yes.

**Open for Kyle:**
1. Keep the heart the same every visit (this doc), or let even the heart vary between its layouts?
2. Light drift on long jobs (dusk into night across the rooms): yes or no?
3. Weather (rain, fog) now or later?
4. Room shape: keep 28 by 24 for sideways rooms, or let a W to E room be wider and shorter (about 34
   by 20)?

## Kyle's answers (2026-11-04)

1. Keep the heart fixed: to talk through (he thinks we agree).
2. Light drift on long jobs: no, keep the light as it is for now.
3. Weather: yes, matched to the job's theme. A job has one weather pattern carried through most of the map (light sprinkles, or quick thunderstorms passing). It may change from room to room, but only as a pattern that makes sense: fog creeps in slowly over rooms, never suddenly thick.
4. Wider rooms for left-to-right legs: yes.
