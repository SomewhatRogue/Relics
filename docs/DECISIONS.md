# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

## 2026-11-04: the Barrowfields tuned: packs and the new sorts, bigger hold rings, less gold (Kyle; Claude Opus 5.5)

Kyle played the expedition on his phone ("really really fun"): "I didn't see too many enemy types, just
big guys and little guys"; "A tonnnn of gold drop, maybe too much"; "It feels like it's hard to hold a
position if you're not the tank ... I want the area you can hold to be larger so you can be agile".

**Measured** (`npx tsx scripts/bigmap/expedtour.ts [days] [party]`, new: a hero who can't be hurt walks
each job, side job, camp and stretch of the map nearest first, then lights and holds the beacon, fighting
what's awake near them with real blows by Intent; walking is ghosted so the tour never sticks; the room
does the rest. "Sorts met": any goblin awake within 10 tiles, by its sort; "specials near": specials awake
within 10 tiles while fighting, each second):

| | minutes | kills | piles | coins on the floor (kills / chests / other) | coins a kill | coins a pile | pay | sorts met (past the small one; fewest) | specials near mean / p90 / max |
|---|---|---|---|---|---|---|---|---|---|
| alone, before (8 runs) | 6.2 | 155 | 103 | 526 (491 / 13 / 22) | 3.2 | 5.1 | 242 | 6.8 (5.1; 5) | 1.3 / 3 / 9 |
| alone, after (8 runs) | 9.6 | 183 | 30 | 308 (290 / 12 / 6) | 1.7 | 10.7 | 242 | 12.1 (9.5; 8) | 1.3 / 2 / 6 |
| four, before (3 runs) | 4.5 | 163 | 108 | 526 (509 / 5 / 11) | 3.1 | 4.9 | 250 | 7 (5.3; 5) | 1.2 / 3 / 8 |
| four, after (3 runs) | 4.3 | 196 | 33 | 319 (309 / 5 / 5) | 1.6 | 9.6 | 250 | 14.3 (11.7; 11) | 0.8 / 2 / 3 |

Before, the sorts met were archer, butcher, heavy, lunger and shield (with a drummer or the named one):
`vary` turned some of every band into lungers, shields and brutes. Gold came 93% from kills (a pile for two
goblins in three), against 242 of pay from the jobs.

- **Packs on the big map** (`shared/expedpacks.ts`, tuning `EXPED_PACKS`): each camp's band at the fire,
  each stretch's set piece and each road patrol is one pack from the templates, laid by the job rooms' own
  `lay` (now exported), on its own seeded stream after the ground is laid. What a band may be comes from its
  ground: the open fields, banks and wood's edge draw wolves and a keeper, a netter's swarm, a swarm, a brute,
  a thief's crowd; the hamlet roof archers, an oil and torch crew, a banner-bearer, a thief; the camps a
  banner-bearer, an oil crew, a butcher, the shield wall, a drum, a hexer, a brute; the north road (where the
  drove road leaves it) the log-carriers; the other roads a swarm, brute, netter, wolves or wall. One of each
  before any twice. A camp keeps its whole band (the ones past the template stay on as small ones) and its
  job's guards join its pack; a named butcher's camp takes no second big one. No blind hunters here. No pack
  is laid within 14 tiles of the way in (so none is left a special without its pack). Specials: 3 a camp, 2 a
  set piece or patrol.
- **Carrion crows** on the dead out in the open and on the dead soldier by the chained chest: a body 75%, one
  flock a stretch, three at most (`map.flocks`, built from the seed on every screen; the flock's state is
  sent near only, as any collection is).
- **Waves and hunting parties are packs** (`sim/expedwave.ts`): a template for the ALARM (`EXPED_PACKS.waves`:
  swarms, brutes and netters at first; wolves and thieves from ALARM 1; banners and oil crews from 2; sappers
  and log-carriers from 3; butchers, the wall and a drum late), its size as before (one more a friend).
  Specials: 1, 1, 2, 2, 2, 3 a wave by ALARM, and none past 3 already awake within 14 tiles of who it's
  coming for or still on their way from an earlier wave (a hold's waves come close together: before this the
  tour saw 12 specials round the shrine at once). Each wave its own pack number (from 1000).
- **A party** (`expedRoom`): `scalePacks` with 0.3 more small ones a pack a player past the first (a job
  takes 0.5; a phone hosts this map), the centrepiece 35% tougher and the template's `more` from three; a
  wave's centrepiece tougher too. Four players start with about 30 more goblins.
- **Hold rings** (`EXPED.holdR`, `extractR`: 3.4 and 4 to 6 tiles; `grace` 1.5 s): one size for drawing and
  judging (`shared/expedrings.ts ringOf`, used by `sim/exped.ts` and `client/expeddraw.ts`; the beacon's hold
  was judged half a tile wider than drawn, now not). The shrine and the beacon's hold go on 1.5 s after the
  last one steps out, then stop; they never start with nobody in the ring (tests: progress at the ring's
  edge, through a step out, stopped after the grace). The beacon stands further down the drove road so all
  its ring is on the map. A hold's waves come for anyone within 2 tiles of the ring's edge. The big rings
  have closer dots, two in three of the unlit shown, so they read at night. On a phone held upright the
  ring is a little wider than the screen.
- **Less gold** (`EXPED_COINS`, used by `dropPickups` on an expedition's room): a small goblin a pile one
  time in five, 6 to 11 (was 85%, 2 to 6); an archer a quarter, 6 to 12; a butcher half the time, 15 to 30;
  a named one as ever; wolves none. About half the coins in under a third of the piles. Chests, a burnt
  house's handful and the jobs' pay are unchanged.
- **Online**: nothing new is sent but a goblin's `pack` and `role` (once, on the first patch) and the crows,
  all near only. `npx tsx scripts/bigmap/expedmeasure.ts 10` (a party of four, now with its extra goblins;
  another agent building on the same box): together, 150: 28.7 KB/s a friend (worst 34.1), biggest 36.6 KB,
  compact save 43 KB; spread, 300: 52.1 (65.5), 43.2 KB, 80 KB in 5 parts. No message over the limit.

Tests: `tests/exped.test.ts` (packs and caps, the new sorts where they belong and none blind, a roof archer
on a roof, five or more kinds of special on every map, crows; a party's extra; waves as packs, sappers only
late, no specials past the near cap; ring sizes, one source, the beacon's ring on the map; the grace; the
coin budget against a job's table and in an expedition room; the beacon test now waits out the grace).
Shots: phone and laptop, `?hero=ROGUE&exped=4` (the shrine's ring, the wolves and keeper, a banner's camp,
an oil crew, the log-carriers, a netter, a thief's crowd, the beacon's ring). No new player-facing lines.
Open: Kyle's play on the ring size (6 could go to 7) and the gold; roof archers only where a pack lands by
a house, so not every run meets one.

## 2026-11-04: encounters as packs, and ten new sorts of the hungry (Kyle; Claude Opus 5.5)

Kyle: "Too much chaos on the screen reads messy. I'd rather have more impactful battles, but splattering
little goblins is also fun", then of the ten new enemies, "I like them all, let's make them".

**Measured first** (`npx tsx scripts/encounters/measure.ts`, 60 days of the board, 1,080 rooms, placement
as planned; "wake group" is goblins within a shout of each other, and of one pack where there are packs):

| party | goblins a room (mean/p90) | biggest wake group (mean/p90/max) | specials a room | kinds of special a room | rooms with 3+ kinds | wake group with 3+ specials |
|---|---|---|---|---|---|---|
| 1, before | 8.0 / 12 | 5.0 / 8 / 13 | 6.1 | 3.5 | 65% | 62% |
| 1, after | 9.2 / 14 | 4.1 / 5 / 13 | 2.1 | 1.7 | 22% | 4% |
| 4, before | 22.6 / 34 | 15.3 / 25 / 39 | 17.0 | 3.8 | 76% | 89% |
| 4, after | 20.6 / 32 | 10.1 / 13 / 29 | 2.6 | 2.1 | 40% | 3% |

Before, every small goblin rolled to be a lunger, shield or brute (about 78% of them deeper in), hexers and
drummers on top, butchers by rule, and a party copied the whole room again, specials and all. After:

- **Packs from templates** (`shared/encounters.ts` the table, `shared/encounter.ts` the rules, layout 3
  only; layout 2 and old jobs plan exactly as before): the set piece's bands become two or three fights a
  room, each one template: at most one centrepiece (a brute, a banner-bearer, a butcher, two shields, the
  log-carriers, an oil thrower, a wolf-keeper, roof archers), at most one kind backing it, and small ones.
  Picked by room (no butcher, banner or logs in a first room; the first fight is a swarm, a brute, a netter's
  swarm, wolves, a thief's crowd or the blind hunters), place (wolves in the open, logs where there are
  fields and lanes, roof archers where a house stands, the blind hunters only down a mine), ruin, and a cap
  on specials a room (2, 3, 3, 4 by room; one more on a deep job or at ruin 3; ledge archers count).
- **One fight at a time**: a pack's shout wakes only its own pack, and a fight in another pack is heard only
  from 2.2 tiles (`sim/packs.ts`). Spiders and an old job's goblins wake as before.
- **A party** meets half again as many small ones a player past the first in each pack, a centrepiece 35%
  tougher a player, and from three players one more special a pack (the template's `more`), never copies
  of the specials (`scalePacks`).
- **Splattering**: a swarm's small ones have 22 health (a blow or two); a small goblin killed by a blow
  slides on along it, the blow holds a beat (0.07 s, more for each more killed by the same swing), and a
  bunch cut down together sprays wider and shakes harder (`SPLAT`, `client/gore.ts bunch`).

**The ten** (numbers `shared/raiders.ts`, `shared/prowlers.ts`; rules one file each in `sim/`; hooked in by
`sim/ownfoes.ts`; drawn in `client/foekits.ts`, `foekits2.ts`, `foedraw.ts`, `beastdraw.ts`,
`telegraph2.ts`, the 2.5D view using the same figures and `three/foes3d.ts`; sounds from the kit,
`client/foesounds.ts`). Each has a telegraph we already use and a counter the player already has.

1. **Netter**: throws at whoever's furthest from a friend; a striped circle where they stood. Caught, held
   4 s; each attack, dodge or guard press takes 0.45 s off, a swing of the stick 0.15 s; a friend's GRAB
   within 1.5 tiles cuts them out at once (CUT FREE on the button). Goblins go for a netted hero first.
2. **Sapper**: digs in from 9 tiles, goes under (nothing reaches it; it's held as a carried goblin is),
   a mound and a trail of dirt, comes up 1.6 tiles behind its quarry in a striped cracking circle. A heavy
   swing over it, a blast, or fire near forces it up stunned (2.2 s).
3. **Oil thrower and torch-bearer**: a pot lobbed where you stand (striped circle) leaves a slick for 22 s;
   on it the stick takes hold at a third (wide turns, sliding on). The torch walks to a slick with someone
   on it and throws: the slick pulses 0.9 s and burns 6 s (12 a second to heroes, sets goblins alight).
   Any fire of ours lights a slick: a fire burst, an oil barrel, a fire ring, a burning goblin walking in.
4. **Banner-bearer**: a hide on a pole hung with what they've taken. Goblins within 5 tiles hit 25% harder
   and 10% sooner and can't be routed; it hangs behind and runs from a blade. Kill it and every goblin within
   7 tiles routs 4.5 s: runs, strikes nothing, takes blows 50% harder.
5. **Wolves and a wolf-keeper**: wolves the hungry keep chained and starved, so they hunt (Kyle asked for
   wolves, dogs or something else: wolves, so no dog is ever killed for a laugh and the Ranger's wolfhound
   stays the only dog). They circle to your side or back at 2.6 tiles and dart in on a short red lane
   (block, parry, dodge). Kill the keeper and they scatter 6 s; any that get 13 tiles from everyone are gone,
   and the rest come back without the circling. Open ground only (fields, farms, forest, river, marsh).
6. **Sneak-thief**: lurks a few seconds, works round behind, grabs (a short wedge: block, parry or step out):
   half your gold (12 to 30) or, carrying under 6, the front potion, and runs for the nearest edge away from
   you. Kill it and it drops what it took; let it reach the edge or 16 tiles off and it's gone with it (the
   job's pot loses the gold).
7. **Roof archer**: up on a house or barn (level 2), never moves, shoots from 9 tiles. No blade reaches
   it; arrows, spells, a thrown barrel do. Set the house alight and it's thrown down into the street, hurt
   and burning.
8. **Log-carriers**: two big goblins with a trunk, one heavy body (170 health, turning 1.1 radians a
   second). From 3 tiles they run a 9-tile striped lane, smash barrels, crates, fences and carts on it,
   knock anyone on it down 1 s, and stun themselves 2.4 s on a wall. After a run they stand 1.8 s and turn
   slowly: hit them then.
9. **Carrion crows**: a flock on the dead (layout 3 rooms in the open, 45% of rooms with the dead). Walk
   within 2.6 tiles (creeping, 1), or fight within 3.5, and they burst up: anyone within 2.2 is lost in them
   1.6 s (drawn on every screen) and every goblin within 10 tiles wakes. They settle again after 30 quiet s.
10. **Blind hunters**: pale, eyeless, down mines only (Copperdeep, the sewers). They hear anyone walking
   (not creeping) within 6.5, a fight within 13, a touch within 1.1; they go to the sound and slash; 3 s of
   quiet and they've lost you.

Tests: `tests/encounters.test.ts` (caps, one fight per pack, where each sort turns up, the first room, the
party, a pack's shout), `tests/foes1.test.ts`, `tests/foes2.test.ts`. Shots: `node scripts/foes-look.cjs`.
Open: every new player-facing word through the lore keeper and line editor (NETTED, TAP TO BREAK FREE, CUT
FREE, POTION STOLEN, N GOLD STOLEN, GOT AWAY); the expedition's camps and waves still roll their goblins
the old way (each camp is its own fight on the big map already); the new sorts don't yet ride in its waves.

## 2026-11-04: terrain nodes slices 2 to 4: ways on by any side, forks that rejoin, side ways, countries that change (Kyle; Claude Opus 5.5)

Kyle: "more nuanced map designs and combining themes", and earlier, jobs "almost always keep going up,
never moving out to the right or left". Built slices 2, 3 and 4 of `docs/terrain-nodes.md` as **layout 3**
(new jobs carry `layout: 3`; a saved `layout: 2` job plans exactly as before, a test holds its hash).

- **Ports** (`shared/ports.ts`): a room is come into and left by any side. The way out is a 0.9-deep strip at
  the edge; leaving by E means the next room is come into by W. A leg straight across from side to side is
  a wider, shorter room, 34 by 20 (Kyle's yes); the rest stay 28 by 24. The spine (`shared/frame3.ts`) runs
  from port to port: a straight leg wanders, a turn curves round its corner, a fork parts mid-room.
- **What follows the way you're going**: the side walls and the 3/4 kerb are cut where a way goes through
  them, posts either side, both views (`client/sidegaps.ts`, `three/ground.ts`); torches and a lit mat with
  the arrow pointing through the wall (`exitmark.ts`, `three/exitmat3d.ts`, the 2.5D stakes turned); fork
  labels beside a side gap; WAY ON: WEST from the room's own exit (unchanged `wayDir`); the party spreads
  down a side way in (`sim/room.ts join`); goblins and the job's spots keep off every way, not just the top
  one; ledges anywhere beside the track. The camera already follows the hero in any size of room.
- **Built-up rooms stay bottom to top** (lane, yard, strips, the village's end, the camp in a village):
  the doc's rule. Open rooms, transitions and mixed rooms take any ports (`shared/nodeports.ts PORTS`).
  Fords and causeways go straight across; a ford on a side-to-side leg has its river running down the room.
- **The route** (`shared/routeports.ts`, from `job.seed * 7919 + 101`, both roads rolled up front): on every
  path no node twice running, no sub-layout twice, one landmark and one set piece a room never repeated, two
  palette steps every room (now strict: the route rolls again if it can't), no third room running out by the
  same side, and a medium or longer job always turns (a fork always has a way on to a side).
- **Forks choose a path, and the roads meet again** (slice 3): the fork's two ways on are on different
  sides; each road is its own room (different nodes); both lead into the same next room (same node, layout,
  set piece) by different sides: the heart, or on a long job an approach room before it. HIGH and LOW keep
  their fights. `planRoom` takes the roads taken so far (`run.roads`), so the room after knows its way in.
- **Side ways** (slice 3): one or two a job, never at a fork or in the heart, on a side nobody comes or goes
  by (E, W, or down through the kerb). A side way is a block with a door at the edge, so the house
  machinery does the rest (`client/jobrooms.ts`): walk into it its way (`arena.ts pushingInto`), friends go in
  on their own, its goblins stay dead, its captives count as a house's do, you come back out where you went
  in. Its door names the dead end (`shared/sideway.ts`), planned in `shared/sideroom.ts`: a glade with its
  spring, the hungry's pens, old workings, a cave pocket; a chest and one more thing (someone caged, a nest,
  a cache of oil, a fouled shrine). The arrow points back out once the cage is open.
- **Countries in order** (slice 4, `shared/countries.ts`): out of the north gate into the fields (or in at
  the sewer door), through the place's region (the wood for Greyhollow, the rock for Copperdeep), to its own
  country; a long job may take a third (a hamlet by the road, the wood before the fen). Never back out
  into a country you left. Every change of country is a transition room (`JOINS`): the wood's edge or a
  coppice (fields to wood), the causeway or a ford spreading into fen (fields to fen), the carr (wood to fen),
  the ore road (fields to rock), the mine's head or a mine head below a hamlet (rock to under, out by the
  adit), the outfall (fields to under, out by the culvert), the village's end (village to fields). The
  transition is dressed half one, half the other, the change at a line across the way (a hedge and stile, a
  line of willows, a palisade): the choke point the fight turns on.
- **Mixed rooms** (`shared/sitemix.ts`): a farm burned out at the wood's edge, a roofless chapel with its graves
  in the fields, a goblin camp built into a village street, a mine head below a hamlet.
- **Nuance**: banks either side of a hollow way (hedged track, the ore road's cutting), a slope at the wood's
  edge, the spoil shelf, rocky rises; all stone, archers on top, the ramp at the end nearer the track
  (`shared/roomledge.ts`). Cover beside the track where the fight is: hurdles, a broken wall, spoil
  (`shared/portkit.ts cover`). Bog water close on a causeway, pools in the carr and the fen (`shared/wetland.ts`).
- **The weather carries across** (`shared/weather.ts`, layout 3): one pattern a job, each country taking it
  its way (the fen holds its fog, the trees keep off some rain); fog never more than a step thicker or
  thinner than the room before, none underground, creeping back in after.
- **Goblins path the new shapes**: `sim/pathing.ts`'s straight-line check now looks a body's half-width
  either side of the line, so a goblin no longer jams on a wall's corner it would graze (test: from every
  goblin to the way in over a spread of rooms). A last pass moves anything the job put on cut-off ground
  (`shared/roomreach.ts`).
- **Measured** (500 board jobs, 1,300 approach rooms): ways on N 842, E 433, W 425; rooms come into by a side
  406 of 1,300, hearts by a side 183 of 500; wide rooms 165; 400 forks, 366 rejoining by different sides; 542
  side ways; 426 of 500 jobs turn (the 74 that don't are short); countries crossed 1 / 2 / 3: 247 / 181 / 72;
  584 transition rooms, 202 mixed. Planning a room: about 4 ms (layout 2: under 1).
- Not yet: true loops back into an earlier room (big map), a side room with two ways back, the vignettes
  that need new behaviour, new art (headframe, headstones, a punt). Open for the lore keeper and line editor:
  the side way names (THE GLADE, THE PENS, THE OLD WORKINGS, THE CAVE, shown as ENTER ...), and "1 more in
  the houses" now also counting a side room's captive.
## 2026-11-04: the first expedition, the Barrowfields, online (Kyle; Claude Opus 5.5)

Kyle: "the much more robust big map raid sort of mode, similar to Helldivers", after the big map's load
test ("VERY fun"). Built as a posting on the board, THE BARROWFIELDS (one a day, a new map by its seed),
taken alone or with a party through the usual lobby and set-out. Try it: `?hero=WARRIOR&exped=4`.

**Online first** (the load test's limits, DECISIONS 2026-11-03):
- **Near only, each friend their own** (`client/bigsend.ts`, `client/interest.ts`, wired into
  `CoopHost.frame` for any room with `sleepFar`): every hero always; goblins, props, chests, bolts and the
  rest within 20 tiles; buildings within 26, sent by their place in the map's list (`b<i>`) and merged into
  the friend's own seed-built list (`mergeBlocks`); events within 30, but an expedition's (a horn, a job
  done) and a friend down go to everyone. One Encoder per friend, so a goblin leaving the ring is dropped.
- **Quiet clocks**: `cooldown` and `home` aren't sent, `actT` goes as `a0` (when the act began) and the
  friend works it out (`loud`). A goblin dead for good stops its clocks after `STILL` (8 s) in the sim.
- **The map is never sent**: a whole message says `ms: 1` and the friend builds `expedPlan(run.job)`.
- The run, banner, names and house counts go only when they change (the run alone was a third of every
  message). The expedition's view (`expedView`) only when it changes (progress in 5% steps, seconds whole).
- **No message over the limit, ever** (`client/split.ts`, in `RelaySocket.send`): anything over 48,000
  characters goes in parts of 22,000 (each under 64 KiB even fully escaped); the far end joins them.
- **Compact save** (`client/bigsave.ts`): the map as a mark plus the buildings that changed; each goblin and
  prop only as it differs from a fresh one; numbers to two places. Taking over or reloading rebuilds it.
- A den on a big map breeds only with a hero within 24 tiles (else the far dens would fill it).

**Measured** (`npx tsx scripts/bigmap/expedmeasure.ts 20`: a leader and three bot friends, KB a second each
friend receives as CoopHost sends it, in the relay's envelope; save every 2 s):

| party | goblins | tick mean / p95 ms | KB/s a friend (worst) | biggest msg KB | save whole KB | save compact KB (parts) |
|---|---|---|---|---|---|---|
| together | 150 | 2.2 / 6.0 | 23.9 (27.2) | 29.7 | 123.7 | 37.4 (1) |
| together | 300 | 2.2 / 5.7 | 39.1 (47.7) | 45.6 | 204.1 | 60.4 (4) |
| spread | 150 | 2.4 / 6.2 | 28.1 (36.8) | 28.9 | 132 | 44.8 (3) |
| spread | 300 | 2.9 / 5.4 | 42.4 (51.1) | 45.8 | 215.9 | 73.7 (5) |

(The bots can't be hurt, so their `safeT` ticks and is about 8% of a patch; real heroes send less.)
**The real run** (`scripts/exped-online.cjs`, now in `npm run test:online`; Kyle on a laptop, Sam on a
phone, 120 ms of lag, the local relay): Sam received 26.7 KB/s, 14.4 messages a second, biggest 33.8 KB
(the save); Kyle sent 26.4 KB/s. Sam's copy held 6 goblins of Kyle's 151; Kyle's camp's horn showed on
Sam's map across the field. Frames (headless, SwiftShader, both browsers on one 2-core box): Kyle 19 fps
(52 / 83 ms), Sam 23 fps. Alone on the same box, flat: the expedition 32 fps laptop and 26 fps phone at
CPU /4, a medium job 56 and 37; the page's own JS is 0.9 ms of room and 4.3 ms of drawing a frame on the
laptop, the rest is SwiftShader's software GPU (the light pass with up to 32 lights). Read against a real
phone before tuning further. The flat view now skips goblins and round things off screen on a big map.

**The map** (`shared/expedmap.ts` and `expedkit.ts`, `expedland.ts`, `expedcamps.ts`, `expedfill.ts`):
96 by 72, 4 by 3 nodes of 24 (each 2 by 2 of the load test's chunks), from the job's seed alone. A river
across the middle with two fords; a cart road on each bank joined by a road over each ford; the way in by
the cart road from the south or at a ford on the map's side; the way out off the top (the drove road), as
far from the way in as the map allows. Nodes: the way in, the way out, the ruined hamlet (cottages on the
road you can go into and set alight: the job-house interiors and houses alight, `settle` gives them their
fates), three or four camps, the barrows, the wood's edge along the top, fields with hedges below the
river, willows and reeds on its banks; groves anywhere. Each filler node gets one of the routed rooms' set
pieces (`shared/vignettes.ts` read as is: at the fire, at the dead, the feast, asleep, a cart looted or
wrecked, the column's dead). 150 goblins placed (`EXPED.goblins`), none within 14 tiles of the way in,
200 alive at most (`EXPED.cap`), dozing on.

**The structure** (`sim/exped.ts`, `expedpressure.ts`, `expedgoal.ts`, `expedroom.ts`; tuning `EXPED`):
- Two or three jobs of six, by the seed: poison the larder's cookpot (stand at it 7 s), wreck the siege
  engine (a wagon-bed with its arm, `look: 4`, smash or burn it), break the prisoners' cages, burn the dens,
  hold the barrow shrine (75 s in its ring, a wave every 9 s while you do), kill the named butcher. Side
  jobs: a chained cache, and a wayside shrine to pray at (3 s; the party blessed 90 s). Each job done pays
  15% of the posting into the pot, a side job 10% and a piece of treasure more; the pot is halved if you
  fail, as ever.
- Pressure: a level every 150 s (to 5); blows, deaths, buildings down and oil fire make noise where they
  happen; past enough of it, once the level's wait is up, a wave comes in from 25 to 28 tiles off (inside
  the wake ring, at least 18 from every hero, never in water or a wall); a camp whose goblins see you blows
  its horn (everyone in it comes, a wave on its heels, and it's known on the map); three patrols walk the
  roads; a hunting party comes in from the edge toward the last noise every 110 s, sooner as it goes on.
- Extraction: once the jobs are done the beacon opens; stand in its ring 2 s to light it, then hold it 60 s
  (paused while nobody's in it, a wave every 7 s), then the watch comes and the way out opens: everyone up
  walks north together. Everyone down and it fails (the party's rules; alone, three downs).
- The map screen (MAP in the corner, M on a laptop; `client/expedmapui.ts`): the ground, dark where nobody's
  been, the pins, the camps you know of (red once their horn has gone), the way in, the beacon once it's
  open, friends by name. In the world: gold rings where you stand to do a job, filling; the beacon's fire;
  a pale point at the screen's edge toward each friend off screen, with their name (both views).

Tests: `tests/exped.test.ts` (same seed same map; every map pins two or three jobs with their parts and
keeps the way in clear; walkable from the way in to every job, the beacon and the way out; every job kind
completes; pay into the pot; the beacon opens, lights, holds, pauses and lets you out; everyone down fails;
the level and the horn; waves out of sight and never past the cap), `tests/expedsend.test.ts` (near only
is exactly the ring; a goblin leaving it is dropped and its clock comes back from `a0`; buildings merge;
no message over the limit at 300 goblins and the map never goes; split and join; the compact save comes
back the same). Screens: `node scripts/bigmap/expedlook.cjs <dir> [day]` (drop-in, map, a job, a horn, the
beacon; phone and laptop, flat and 2.5D).

Words new here are in `shared/expedjob.ts` (GOAL_WORDS, EXTRACT_WORDS, EXPED_SAYS, MAP_WORDS, the posting),
waiting on the lore keeper and the line editor. Lore to check: the siege engine, the barrows and their
shrine, the beacon and the watch coming out for a party (Orla's watch).

## 2026-11-04: copy pass 3: Kyle's style everywhere, and mechanics shown as labelled rows (Kyle; Claude Opus 5.5)

Kyle: "Take my copy changes as general guidance and suggestions, not specific one-to-one approval flows.
We need to work on, in general, how we write and show things." The model is his style (prose-notes
section 4): short, the effect first, a few words, fragments when clear, no flourish or riddles, explain
once. Full list and his questions: `docs/copy-pass-3.md`; every changed row is marked in the `done`
column of `docs/copy-inventory.csv` (regenerated, same ids, 318 rows touched).

- **Showing.** One helper, `labelRows` (`client/card.ts`), draws every "LABEL  a few words" table in the
  weapon card's style: traits as `NAME: effect` and modifiers as `NAME +10%: effect` (Kyle's "STAMINA ON
  PARRY: parry refills stamina"); hungry gear GIFT / COST in red; potions EFFECT / LASTS / USE (shop and
  belt; `LASTS` now covers the Bitter's 2 s heal); skills at the trainer USE / COOLDOWN / COST (cost until
  learned; the old "TAUGHT AT LEVEL" line is gone); relics USE / CHARGE (the LOUD tag dropped, it's in the
  name); job postings WHERE / ROOMS / PAYS; job results GOLD / XP / SAVED / LOST. `.kitrows` is now one
  grid with the label column as wide as its widest label, so COOLDOWN fits on a phone.
- **Writing.** Every knack, trait, modifier, drill, technique, hungry gear line, potion, skill and relic
  line rewritten effect first. Tutorial instructions say DODGE (they said "roll" to a Ranger, Rogue and
  Mage); the FULL SHOT lesson says what a PERFECT is. Legend, tips, pack, shop, vault, pawn, forge, works,
  job board, results, council choices, the well and the title screen cut to the point.
- **Names.** WIDE LAST SECOND is LATE DASH; the KNOCK modifier is KNOCKBACK (as the knack); POWER at the
  trainer is STRENGTH (Kyle's class card word); the spellblade's "wreathe" is "enchant"; HARD THROW says
  darts, not bolts (the poisoner's hold is a dart). The larder job's title said "Burn" but the job is
  smashing racks: now "Smash the larder at X".
- **Explain once.** Tips that repeated the legend or weapon card are gone (parry timing, hold to charge,
  the crossbow glint, the Cleric's Sanctuary). Tobin's buy-back rule and the works' gear value are each
  said once.
- **Dialogue.** Voices kept; lines a first read would miss are cut or made plain (Odric's "the part it
  burns", Hob's "tallyman", the card sharp's riddle, Bram's "somebody with teeth", Pike's lamps, Vell's
  "the relic says so", the well's "coin kept, not given", the hunt notice's proof). Hew's last words name
  the tally stick, so Odric taking "Hew's tally" lands. Kyle's own class card text is untouched.
- **Consistency checked over every string:** stamina / MAGIC, "the red flashes white" for parry, "the white
  flash" only for a hold, PERFECT, "armor", no shard, sliver, crown, Want or mercy on screen.
- **Not run:** the lore-keeper and line-editor passes (no way to call them here). Ten questions for Kyle are
  at the end of `docs/copy-pass-3.md`.
- Tests: `tests/kitwords.test.ts` follows the spellblade's new HOLD row; `npm test`, `npm run check` and the
  online tests pass. Phone shots of the knack panel, item and hungry cards, the trainer, the relic step, a
  shop card and the church.

## 2026-11-04: Kyle's copy notes: the class card rebuilt, TAP / HOLD / PERFECT, GUARD and DODGE areas, two potions (Kyle; Claude Opus 5.5)

Kyle commented on 50 lines of `docs/copy-inventory.csv` (`docs/kyle-copy-notes.txt`) and passed 55
(`docs/kyle-copy-ok.txt`). His notes win over the lore keeper's earlier choices and the story bible where
they clash; the bible records each change as his call. The inventory has a new `done` column saying what
happened to each line he commented on.

- **The class card** (title screen, `client/title.ts`, `shared/classes.ts`): the name with Kyle's tagline
  under it (`CLASS_TAG`), the looks, his line on how it plays, the ratings (POWER is STRENGTH), the GUARD and
  DODGE areas for the class's first kit, his guard line, the class's own rows (the Cleric's DIVINE SAVIOR,
  "Cannot harm allies"; CENSER; HOUND; SPELLS), and SKILL in his words, with one note under it: "Train skills
  at your trainer. You can only have one active skill at a time." The pitch and the "can't" lines are gone
  from the data. Kyle had rewritten four pitches before the cut; kept here in case he wants them back:
  Warrior "When the sword fails you can always throw them against the wall.", Ranger "Forty paces is a long
  way for them to run with an arrow in them.", Rogue "They're only scary if they see you coming", Mage "The
  cleverest thing in the room, until you get a spear in the gut." The title screen now scrolls from the top
  when a card is taller than the phone (it was centred, which cut the top off).
- **What a weapon does is three rows** (Kyle: "Tap: Short sword / Hold: Draw bow / Perfect: Blinds"). One
  table, `client/kitlines.ts` `KIT`: TAP, HOLD, PERFECT, and ALSO for a bonus (riposte, the spear's charge
  pin, the spark into a wind-up, the blade's catch, RELOAD, the daggers' 2.5x from behind). It feeds the item
  card and the shop list (`card.ts` `weaponHow`, replacing the `HOW` paragraphs), the BUTTONS legend's ATTACK
  row, and the HUD hint line ("TAP: ...  HOLD: ...  PERFECT: ..."; the old NO GUARD / PARRY, NO BLOCK tags are
  gone, the card says it). The weapon rows now show on every weapon card, your own kit's too. Facts from the
  sim: every perfect is the hold let go on the white flash, the crossbow's is the glint. Judgment: the
  daggers' throw and the shortbow have no perfect of their own beyond a full-power release (plus the PERFECT
  SHOT knack and DEADEYE), so they say "Full-power throw" and "Full-power shot".
- **GUARD and DODGE as rated areas** (`client/guardarea.ts`), on the weapon card and the class card, one line
  each with pips. GUARD is LOW, MED or HIGH, from the kit's numbers: HIGH needs a guard arc of 150 degrees or
  more, a guard cost of 1.1 or less and chip of 0.2 or less (sword and shield, mace, censer); MED 120, 1.5 and
  0.3 (spear, flail); LOW anything less (greatsword, the bows, the spellblade). Then the kind: BLOCK AND PARRY,
  PARRY ONLY (Ranger, greatsword), CATCH (spellblade) or NONE. DODGE is ROLL, JUMP, DASH, BLINK or NONE from
  `dodgeOf` / `dodgeName`.
- **Armor** on its card is one thing per line, and heavy armor says stamina, not breath. Kyle said "or magic
  if it's a mage"; the bible has one bar called STAMINA for everyone, so it stays stamina.
- **Only Bitter and Brandy** (Kyle: "just have Bitter (healing) and Brandy"). Gannet sells brandy only, Ivo
  sells no flasks, goblins and chests drop only those two (`POTION_ORDER`; the drop weights for the rest are
  0). Lamp Oil, the frost flask and the smoke flask stay in the code, dormant (`DORMANT_POTIONS`), so nothing
  that could still be in a room breaks. A saved belt holding any of them gets Bitter in their place
  (`client/save.ts`). Oil barrels on jobs and setting houses alight are untouched. Lamp Oil going is to be
  confirmed with Kyle. Tips, the legend and the potion button say "drink", not "drink or throw".
- **Church and coal lines**: Gannet's line is at his bar, not the church (reworded, no "short one"); the
  bread line and the ransom line are cut; Odric's tally line drops the beer and says what the stick is;
  Isolde says what she relit and what it does, and what a fed censer does, plainly. The unused COAL help and
  note lines are gone (the class card says it).
- **Kept from the OK list**: everything, except four skill names inside the old trainer sentence (the Censer
  Chain and Light, the Fire Ring, the Storm Tether), which went with the sentence Kyle replaced.
- **Kyle's style is the model** ("see my writing style and how I'm being to the point, and let's emulate
  that"): a few words, the effect first, fragments fine when clear. Now a subsection of
  `docs/lore/prose-notes.md` section 4, quoting his lines. The new lines here were cut to match (Odric,
  Isolde, the armor rows, the legend's HEALTH line); dialogue keeps its voice but says the thing first.
- **Not run**: the lore-keeper and line-editor passes (this pass had no way to call them). Kyle's exact text
  was used where he gave it; the few lines written here (Odric, Isolde, Gannet, the TAP / HOLD / PERFECT
  words) are for them to look at.
- Tests: `tests/kitwords.test.ts` (every weapon has its three rows; the guard ratings and kinds from the
  numbers; each class's dodge; no pitch or can't; drops are only Bitter and Brandy; an old belt's oil and
  smoke come back as Bitter).

## 2026-11-04: class fixes after the new UI: no Warrior step, a crossbow RELOAD, a legend, fat fingers (Kyle; Claude Opus 5.5)

Kyle played the pixel UI ("generally much cleaner") and sent nine notes.

- **The Warrior has no step and no dodge** ("idk why it would say that. The grab should be there").
  `STEP`, `CLASS_STEP`, the `step` act, event, pose, dust, sound and icon are gone; `dodgeOf` now lives in
  `shared/weapons.ts` and is just "a dodging class's own dodge, or nothing". A Warrior's or Healer's dodge
  press does nothing (fight.test.ts). The wood's path lesson for a Warrior is back to walking out of the
  striped blow with no button (as the Healer's always was), and it is now called WALK OUT, not STEP OUT,
  so nothing says "step". On the cluster, a class with no dodge has the context slot in the dodge's
  place (`body[data-dodge='false']`); a Warrior's always shows GRAB, dimmed till there's something to
  take hold of. A Healer's shows only when there's something (to help up, burn or grab), in the same place.
- **NOTHING TO GRAB.** A GRAB press that lapses unused while you're free (nothing to take hold of, throw,
  help up or burn) makes the room say `nograb` to that hero, at most once a second (`toldAt`, shared with
  the other "can't do that" notes). Only that hero's client shows it, over them, with a soft dull knock
  (`client/owncues.ts`).
- **The crossbow's reload is its own button** ("if you try holding down attack without it reloaded it
  asks you to reload"). A new intent field, `reload` held and `reloadSeq` counted (optional, so an older
  guest's intent still reads; works online through the same intent). `sim/crossbow.ts`: RELOAD held while
  empty and standing still winds, in pieces as before (let go or push the stick and the piece ends with
  the wind kept); an unbroken full reload from nothing glints, as before; wound, you're free at once.
  ATTACK held on an empty crossbow winds nothing: the press is spent and the room says `reloadcue` (once
  a second) so the RELOAD button pulses gold and RELOAD is said over you, with a dry click. A tap of
  ATTACK is still the short sword. Phone: a round RELOAD button (gilt while empty, the dark sweep showing
  what's still to wind), only with a crossbow. Laptop: **C** (free: E, R, G, Q, F, J, K, I and Tab are
  taken), on the prompt line while empty, in the kit line, a tip and the weapon card.
- **BUTTONS** in the gear's box opens a framed panel of this hero's buttons, each drawn by the cluster's
  own code (`btnart.ts` with `icons.ts`, `skillicons.ts`, the item and relic icons), its name, a plain
  line, and on a laptop its key: attack, the guard (block, parry or catch), the dodge, RELOAD, the skill,
  the relic, the health orb, and every context word (GRAB, HELP UP, BURN, OPEN, TALK, ENTER, USE).
  `client/legend.ts`.
- **The wood flashes what it gives you.** The first time a lesson gives a move, its button pulses gold
  for 4 s with its name over it (`client/unlockflash.ts`); a laptop says the move and its key over you.
- **Fat fingers.** Every cluster button's hit area is now round (`border-radius` on the invisible button,
  so the art stays square-pixelled), at least 52px (ATTACK 92), and at least 10px from any other on a
  390x844 phone, measured by `scripts/ui-look.cjs`. Respaced round ATTACK; the cluster still stays under
  about 260px. The lesson pointer and the new pulses draw their gold square on a child, since the round
  hit area would round an outline.
- **Hearts under the health bar** ("It's NOT clear what the 3 hearts mean"). The get-ups left (alone, a
  heart each; in a party, your one get-up) moved from the tracker into the unit frame, just under the HP
  bar, as small heart icons; a tap or a hover says "Times you can get back up this job".
- **An objective done flashes gold** (`client/objflash.ts`). When a wood lesson is passed or a job's way
  on opens, the tracker holds the objective it had, counted out ("3 / 3", "(1 left)" dropped), flashes it,
  turns it gold with a shine sweeping across, keeps it 1.8 s, then the next one shows. A small rising chime.
- **Sounds** (`client/sfxtown.ts`, procedural from the kit's `tone` and `burst`): coins whenever gold
  changes hands off a job (`client/purse.ts` listens to the purse, so every stall, the pawn stall, the
  vault, the church's recharge and the job's pay are all heard); a hammer on the anvil when Halvard
  makes, ups or melts a piece (his own buttons in `stores.ts`); the chime; the dull knock; the empty click.

New or changed player-facing lines, for the lore keeper and the line editor: the lesson name WALK OUT and
its freeze NOW: WALK OUT, the goal MOVE BEFORE IT LANDS; NOTHING TO GRAB; RELOAD; C  RELOAD; the crossbow's
kit and card lines and the laptop tip; "Times you can get back up this job"; the unlock labels; every
BUTTONS line (`legend.ts`).

Tests: `tests/warrior.test.ts` (no dodge on any Warrior kit; NOTHING TO GRAB once a second, and not when
the press took hold), `tests/fight.test.ts` (a Warrior or a Healer presses dodge and nothing happens),
`tests/rangerkit.test.ts` (ATTACK held empty winds nothing and cues RELOAD, a tap is still the sword;
RELOAD winds in pieces and keeps the wind; the stick ends a piece; RELOAD on a loaded crossbow does
nothing; a full reload in one go glints). 619 pass; `npm run test:online` passes.

## 2026-11-04: every perfect on your own timing, and a stun cap per hero (Kyle; Claude Opus 5.5)

Kyle, after playing: "it's hard to time a perfect against an enemy attack or an ally about to get hit",
and he wants "a cap on how often each can be stunned per attacker". So every kit's perfect is now its
own hold let go on the white flash (the Cleric's already was), and whatever was timed against a goblin's
blow stays only as a bonus, with its own callout and no PERFECT.

- **One rule, one place.** `sim/hero.ts` now makes any held attack let go inside the flash window a
  perfect (every kit's hold has one), and that release is the only place PERFECT is said, so every
  weapon shows it the same way. The crossbow keeps its glint, set just after. The four bonus events
  (riposte, the spear's catch, a spark into a wind-up, the blade's catch) no longer say PERFECT; they keep
  RIPOSTE, PINNED, INTERRUPTED and CAUGHT.
- **Sword and shield** (`SHIELD_BASH`): on the flash the bash takes every goblin in a 140 degree arc in front
  (`flashBash`, no one-goblin cap) and stuns each 1 s (a butcher half). Held past it, the goblin in front
  only, 0.4 to 0.7 s by charge (was 0.6 to 1.2, which outdid the perfect). Riposte unchanged, a bonus.
- **Spear** (`PIN`): the lunge on the flash pins whatever it runs through (up to three) 1 s, anything but a
  nest. A goblin caught charging or lunging is still pinned, now 1.6 s, as a bonus.
- **Wand**: the burst on the flash breaks off whatever a goblin it hits is doing (`Bolt.breaks`), striped
  blows and charges too, a 0.6 s stagger. A spark landing mid wind-up still does it, as a bonus.
- **Spellblade**: the wreathe on the flash costs nothing and leaves the blade full (so the next is free
  too), with the blade-full ring. The catch on block stays, as a bonus.
- **Checked, already flash-based**: rapier, poisoner (Rogue), greatsword (Warrior), longbow, shortbow
  (Ranger), staff (Mage), every Cleric kit. The crossbow's is the glint, as before. Daggers' thrown knife
  was already a drawn shot.
- **The stun cap** (`shared/stuncap.ts` STUN_CAP, `sim/stuns.ts`): one hero can take the same goblin's turn
  once every 6 s. Inside that the blow lands its damage, but the goblin isn't stopped and says SHRUGS IT
  OFF (grey, quiet, once a second at most). Another hero can stop it at once, so a party chains stuns.
  Every site goes through `stun()` or `mayStun()` with the attacker's id. **In:** daze (shield bash,
  Shadowstep, the poisoner's retch, the flail's flash), the shockwave, both spear pins, the skewer's
  stagger, the wand's interrupt, smites and relic bombs, a stunning bolt, the longbow's blind, the snare
  and the net and the hound's pin (small goblins; a big one only slowed is not capped), the javelin's
  wall pin (shrugged, it drops off), the hook's yank, the slam, the ambush reel, the ward's reflect, the
  shield charge, the stamp, the censer chain and lantern light, the Vanish cough, the war cry's scare,
  the bell, the knuckle, steam (credited to who set it off) and a fall off a ledge (to who knocked it).
  **Out**, by judgment: the plain hit flinch any blow gives a small goblin (0.3 s, and the big weapons'
  wind-up break), body blows, the hound's nip, the volley's 0.2 s ticks, carrying and throwing, a freeze
  (built over two hits, maybe by two heroes), and a parry's or a slip's stun: those answer the goblin's
  own blow, so a goblin that stops swinging is never held by them. The retch keeps its own 10 s cap too.
- Tests: `tests/warrior.test.ts`, `tests/magekit.test.ts` (each new perfect on the flash, each old one a
  bonus without PERFECT, held past the flash does neither), `tests/stuncap.test.ts` (shrugged inside 6 s,
  another hero at once, the same hero after; in the room, a second flash bash still hurts but doesn't
  stun, and a friend's does).
- Words for the lore keeper and the line editor: SHRUGS IT OFF; the sword, spear, wand and spellblade
  cards; their four KIT hints.

## 2026-11-04: the Cleric's weapons rework: mercy, the holy shield, the smite's light, coals, the spun flail (Kyle; Claude Opus 5.5)

The last class through Kyle's weapons rework, which is now complete. The Cleric guards and never dodges
(CLASS_DODGES unchanged). Numbers in `shared/cleric.ts` and the kits (`shared/weapons.ts`, `kits.ts`),
the rules in `sim/mercy.ts`, `sim/holy.ts`, `sim/censer.ts` and `sim/flail.ts`, all judged in the room
and kept on the heroes and the room's coal list, so guests get every bit of it.

- **Mercy, the class perk** (Kyle: "like rogue backstab"). Nothing credited to a Cleric hurts, knocks
  back or sets alight another hero or anyone freed. Gated by the id the harm is credited to
  (`merciful(heroes, by)`): swings on friends (`sweepAllies`) and the freed (`sweepSurvivors`); shots,
  which now pass by friends and the freed; blasts on both; goblins and props a Cleric flung into the
  freed; a Cleric's burning goblins spreading fire to the freed; javelins; the smite already spared
  friends. Censer coals only ever touch goblins. Relics already spared everyone. On the class card
  (title screen, under the ratings) as MERCY. Not gated: a house set alight burns whoever is inside,
  whoever lit it (it's the house, not the Cleric).
- **Every Cleric perfect is your own timing** (Kyle changed it mid-build: timed against a blow or an ally
  being hit was too hard): let a held attack go on the white flash, as with the bows and the rapier, and
  it shields friends. **The holy shield** (`HOLY_SHIELD`): soaks 20 damage, lasts 5 s, the Cleric's own
  included; a fresh one tops an old one up and never stacks. A blow it soaks whole doesn't stagger. Drawn
  on the hero as a gold shell of light with a halo (`client/holyshield.ts`, so both views), and it rings
  as it takes a blow and breaks. The white of a Cleric's charge now goes when the window does.
- **Mace and censer.** Quick: heavy blows kept, the third heals everyone near (8), but the reach is
  short now (1.2, 1.2, 1.35; the sword's is 1.45): the weakness. Hold (kept, Kyle asked after it): the
  smite on the goblin you face (range 6, stuns 1.2 s, 24 to 70), and its light mends every friend in the
  burst 10 (as every heal, grown by the censer's coals). On the flash: 1.5x, and every friend in the light
  and the Cleric are shielded, with a pillar of light where it falls.
- **Sword and censer.** The third blow (the censer's arc) drops three coals along the arc at 0.8 of its
  reach; each burns 6 s and sets alight a goblin standing in it (0.5 tiles); six a Cleric at most, the
  oldest goes out. They live in the room's coal list beside the butchers' slivers (drawn, lit and sent the
  same way), carrying their owner, and no censer feeds on them. Swinging the censer (the arc or the
  whirl) through your own coals, at least 0.4 s old, bursts them: friends within 1.8 of one mend 6, once
  a swing. Hold: the whirl all round, setting alight everything it hits (kept). On the flash: every coal
  of yours within 5 tiles flares (14 and alight, 1.3 round it) and friends near you (3) are shielded.
  Weakness, clumsy in tight spaces: a wall or pillar within the swing snags the chain (SNAGGED): half
  damage, no coals, no burst, a 0.18 s jar.
- **Flail.** Quick: the two slow sweeps (16, 20; the second heals 9) shove a goblin back a little (knock
  5.5, 6.5, so neither counts as heavy), and `overShield` is gone: a shield-bearer's board takes the
  blow as it takes any, and stops the shove. Hold, rooted (no walking at all once the spin begins): the
  flail spun overhead; let go for a long sweep (reach 2.6 against 1.85, arc 240, 22 to 54) that doesn't
  carry you. On the flash: what it hits is stunned 1 s (a butcher 0.5 s; a goblin mid striped blow or
  charge can't be dazed) and friends near you are shielded. Still a breaker: a strong spun blow (70%
  charge) knocks a goblin out of a heavy wind-up; the old held smite never could, being a shot.
- **Seen and heard** (`client/fxcleric.ts`, sounds from the kit): PERFECT as ever, plus the smite's pillar
  of light, coals bursting gold or flaring red-gold, steel sparks on a snag, a ring of stars on the
  flail's stun. Shield: the ward's sounds; snag: a wall knock and a block.
- Tests: `tests/cleric.test.ts` (no friendly fire on every path, the mace's reach, heals and smite, the
  shield soaking and wearing off, the coals, the whirl, the burst, the flare, the snag, the flail's
  rooted spin and reach, the shove and the board, the stun and the breaker); `tests/kits.test.ts` updated
  for the flail.
- Words for the lore keeper and the line editor: the class card's MERCY line, the three weapon cards,
  the three KIT hints, and SNAGGED.
## 2026-11-04: terrain nodes slice 1 and 1b: approach rooms that change, a heart that stays, the broken bridge, goblins that path, weather (Kyle; Claude Opus 5.5)

Kyle: rooms of a job felt like "the same map each time ... 3 maps in 1 quest where it was the SAME map
with a river through the middle". Built slices 1 and 1b of `docs/terrain-nodes.md` with his answers.

- **Reverses 2026-11-01's "the same place is the same every time"** for every room but the last. A job
  now has a route (`shared/route.ts`, from `new Rng(seed * 7919 + 101)`): the **approach** rooms, then the
  **heart** (the place's own room). Approach rooms are new spine-aware nodes (`shared/nodes.ts`): track,
  crossroads, lane, clearing, ford, strips, yard, wood path, each with two or three sub-layouts, dressed
  for the country they're in (fields, wood, fen, rock, under: `shared/siteskin.ts`).
- **The heart** (Kyle: "the theme as well as the central room"): its plan, landmarks and theme come from
  the place's own seed, so the green still has its well and shrine where they always are. It has three
  sub-layouts (a second `dress` stream moves cottages, carts, hay, shacks, reeds), its set piece moves
  job to job, and you come into it from wherever the room before let out (left, middle or right along
  the bottom, a short bend over to its lane). Landmarks are guarded: the job's cages, dens, fires and
  ledges go round them (a test holds them still over objectives, roads and seeds).
- **Rules** (`tests/route.test.ts` over a thousand-odd jobs): no node twice running and no sub-layout
  twice in a job; one landmark a room, never repeated, never the place's signature (Barrowby's well and
  shrine, Hangman's gallows, Hesketh's hall front and so on are the heart's alone); two of floor, back
  wall, ground and light change every room; one set piece a room, never repeated; the way out moves
  along the top (x 7, 14 or 21), never where the last room's was, and the next room starts below it.
- **Set pieces** from behaviour that exists (`shared/vignettes.ts`): at the fire, at the dead, the
  feast (a long fire, the pot, the bones), asleep round a cold fire, looting a cart, the wrecked cart and
  its oil, the column's dead along the road, and the broken bridge (their fire on the far bank).
- **The river room** (Kyle: "make it clear the bridge in the centre is destroyed and the only crossable
  path is through the shallows"): `shared/river.ts`. The bridge's two ends stand out over the water
  (walkable, so you can go and look at the gap), its middle is deep water, snapped boards, posts, a rope
  hanging off the far end, a beam in the river, boards caught downstream, drawn flat
  (`client/bridgepaint.ts`) and stood up in 2.5D (`client/three/bridge3d.ts`). One ford, the only way
  over: paler shallows, stepping stones in a line, white water at its lips, a worn track down to it
  (`client/waterpaint.ts`; water is now painted over the ground's paths so a path stops at the bank).
  Brokenbridge's own heart gets the same bridge and one ford. Judgment call: "up top" read as the ford off
  to one side of the bridge (left or right by the seed), since the river runs across the room.
- **Pathing** (Kyle: "enemies got stuck with the water"): `sim/pathing.ts`. A goblin with a clear line
  walks straight, as before; a blocked one follows a flow field (Dijkstra on a half-tile grid of the room:
  solids, deep water and ledge faces blocked, wading costs 1.8 a step), string-pulled to the farthest
  point it can walk to straight. A field is a pure function of the room and the goal's cell, kept for a
  dozen cells, so it's deterministic and costs one small search when a hero steps into a new cell. All
  rooms, old jobs too. Tuning `PATH` in `shared/tuning.ts`.
- **Weather** (Kyle's answer 3; no light drift, per answer 2): `shared/weather.ts`. One pattern a job from
  its seed and country: drizzle, a storm that builds, breaks over one room with lightning and passes, fog
  that creeps in by no more than 0.18 a room, or clear; none underground. Paint only (on the theme),
  drawn with the mist in both views (`client/weather.ts`).
- **Seeds and old saves**: new jobs carry `layout: 2`; a room is planned from `roomSeed(job, index,
  took)`. A saved job without it plans exactly as before: a test hashes 100-odd old rooms against the
  value taken before this change. For routed rooms only, the back of the pack is rolled after spiders so a
  room never opens with too few blades (spiders thinning the band could break that; old rooms kept as
  they were).
- **Measured** (the doc's script, Jaccard of solid tiles): the same room on another visit 0.87 to 0.98,
  now 0.03 to 0.05; the next room of a job 0.00 to 0.82 (0.46 average), now 0.03 to 0.05; the heart on
  another visit 0.90, now 0.63 (landmarks kept, the rest moves). Ways out: 540 of 690 at the top middle,
  now 149 left, 248 middle, 143 right, 150 forks. Barrowby's well in 96% of its rooms, now 20% (the heart).
- Not yet (slice 2 on): side exits and turning routes, wider rooms for left-to-right legs (Kyle's yes),
  side rooms, transition nodes, the vignettes that need new behaviour (torch-bearers, dragging,
  prisoners led off, the patrol). No new player-facing lines were written.

## 2026-11-04: the Mage's weapons rework: magic costs, the wand on the move, the staff's walls, the spellblade (Kyle; Claude Opus 5.5)

The fourth class through Kyle's weapons rework. The Mage has no guard and blinks rather than rolls; its
big spells now cost magic (the stamina bar). Numbers in `shared/mage.ts` and `shared/weapons.ts`, the
rules in `sim/spells.ts`, `sim/staffwall.ts` and `sim/spellblade.ts`, all judged in the room.

- **Magic** (`SPELL`): the wand's held burst 20, the staff's wall 30, the spellblade's wreathing 35 (less
  the blade's charge: a full blade wreathes for nothing), the blink as before (40 x 1.5 = 60). Quick
  attacks are free. A hold you can't pay for (short of it, or winded) fizzles the moment it would begin:
  nothing is spent, NOT ENOUGH MAGIC in grey smoke and a dull knock. Paid at the release: the bar dips and
  "-30" rises off the hero in violet. The bar carries a violet mark at the held spell's cost for a Mage
  kit, red while you're short of it (`client/main.ts`, `style.css`). Judgment call: the refusal is at the
  start of the hold (a clear "no" at once), checked again at the release.
- **Wand** (Kyle loves it): unchanged numbers (spark 8, burst 10 to 24, 0.6 s), but the quick spark is
  cast walking at 0.9 of your pace (`castWalk`), turning to the aim while it comes up. Its perfect, new: a
  spark (or burst) that lands on a goblin mid wind-up breaks the blow off and staggers it 0.6 s (a butcher
  0.3 s), any blow, striped ones too, PERFECT and INTERRUPTED with a violet star. The white-flash release
  on the held burst is kept as it was.
- **Staff**, reworked. Quick: a slow close slash in your element (15, reach 1.9, arc 150, 0.3 s wind-up,
  0.42 s recover): fire sets alight, frost chills, storm jumps on to one more. Hold (1 s draw), rooted (no
  walking at all while it gathers, nor through the cast): a wall 1.7 tiles ahead across where you face,
  2.4 to 3.6 tiles long by the hold, 0.5 deep, 5 s. Fire: what's in it scorched 5 and set burning every
  0.5 s. Frost: chills (slows) what touches it, and its face is solid to anything no heavier than a scrapper
  (a butcher walks through, chilled). Storm: shocks what's in it for 9 every 0.5 s, a flinch. Perfect (let
  go on the white flash): the big wall, 5.6 long, 0.8 deep, 7 s, taller, with a ring at each end. Walls
  live in the room's zones beside the fire ring (so guests get them), drawn in both views (`client/walldraw.ts`).
- **Spellblade** replaces the lance rod (new id `spellblade`; a saved rod anywhere becomes one, its quality
  and level kept: `shared/oldkits.ts`). Name SPELLBLADE pending the lore keeper. Quick: three plain cuts
  (10, 10, 16); each hit that lands adds 0.15 charge, the edge glowing violet up its length, white when
  full. Hold (0.5 s): pay to wreathe the blade in your element; the release is a cut of its own (14 to 22,
  arc 150) and the first of four wreathed swings (6 s at most): fire burns, frost slows, storm jumps to the
  nearest other goblin within 3 for 60%. The last throws a wave 2.2 tiles ahead across 100 degrees, 14 and
  a shove, in the element. Perfect: block pressed within 0.22 s of a blow landing catches it on the blade:
  nothing taken, no stun on the goblin, the blade full (CAUGHT). Weakness: no range, it eats magic, and a
  Mage with no guard stands in among them. On a phone the block button shows CATCH for it.
- **The Jealous Rod** (hungry) is a wand now: its gift rides a charged spell and the spellblade has none.
  Old saves holding it keep it as a wand. Its name is unchanged (lore keeper).
- **Seen** (`client/fxmage.ts`, one overlay, so both views; `client/blademark.ts` over the hero in both):
  the costs, the fizzle, INTERRUPTED, a slash's arc of its element, a wall going up along its length, the
  blade wreathed (the edge burning in the element, a pip a swing left), the charge ring, CAUGHT, the wave.
  The spellblade has its own look flat and 3D, its icon, and its swing and block sounds (a sword's).
- **Sounds** from the kit: magic spent and a full blade the channel's hum, a fizzle the wall knock, an
  interrupt the perfect chime and a shock, a catch the parry and the chime, a slash, wreathing or wave the
  element's (ignite, chill, shock), a wall going up its element's (flare, freeze, shock), the big one a rumble.
- **Online**: the charge, the wreathing (`bladeCharge`, `wreathe`, `wreatheUntil`, `wreatheEl`) live on the
  hero and the walls in the zones, so guests get them in the snapshot.
- New lines for the lore keeper and line editor: NOT ENOUGH MAGIC, INTERRUPTED, CAUGHT, CATCH (the
  button), SPELLBLADE, the three card lines (`client/card.ts`), the three kit lines and the tip line
  (`client/main.ts`). The class blurb (`shared/classes.ts`) still only names the wand, as it did.

Tests: `tests/magekit.test.ts` (the wand cast walking at near full pace, its interrupt; the burst's cost
and a fizzle that spends nothing; the staff's slash arc in front, not behind or far, in fire; the wall
raised ahead and the hero rooted; the big wall on the flash; fire burns and storm shocks in a wall, frost
holds a scrapper back while a butcher walks through chilled; the spellblade's charge per hit, the
wreathing's cost, its fire, the wave off the last swing, frost slowing and storm jumping, a full blade
free, the catch; the rod save migration and the Jealous Rod to a wand). The old staff-orb and rod-lance
tests went with those spells; `pacing.test.ts` rolls the new kit.
## 2026-11-04: a friend's pack, the wood walled in with scenes past it, and Hew's death made quick (Kyle; Claude Opus 5.5)

- **A friend's pack crashed.** Kyle: "I wasn't able to open inventory; the game would crash when I was
  not hosting." The leader's patches (`client/snap.ts`) left `found` (the relics a hero owns) off every
  hero, so on a friend's screen `hero.found` was undefined and the pack threw reading it the moment it
  drew its relic shelf (`TypeError ... reading 'filter'`), every frame, taking the HUD with it. `found`
  now goes in the patches: the friend's pack lists the same relics, in the same order, that the leader's
  room carries by index, and a charge spent or a relic won on a job now reaches the friend's save
  (keepkit.ts already read `h.found`). The pack also reads any list a patch hasn't brought yet as empty.
  Stress scenario 27 (`scripts/stress/pack.cjs`): the pack in town, then as a guest on a job: a ring on,
  armor swapped, a piece dropped, the belt reordered, two relics carried, all holding on the leader's
  room, the friend's screen and the friend's save; then inside a house (a ring off), and the leader's
  pack in town and indoors. No page errors.
- **The wood is walled in.** Kyle: "too easy to go through trees and get lost off the path." The old
  tree lines followed each clearing's edge and left gaps where two edges met; a flood fill walked out
  into 2300 half-tiles of open wood. Now `shared/woodedge.ts` puts a tree on every tile outside the
  clearings and the ways between that touches one (r 0.6, a tile apart: no gap a body fits through,
  corner to corner included), a second row behind, and the wood thinning out to the map's edge.
  `tests/woodedge.test.ts` flood-fills it: nothing reachable outside the clearings and gates, every
  clearing and the road still reachable, every scene over 2.4 tiles from anywhere you can stand. A worn
  earth path runs gate to gate (`WOOD_PATH`). 596 trees (was about 330).
- **Scenes past the trees** (Kyle: "background goblins fighting or killing things that you can't
  reach"): `shared/woodscenes.ts` says where; `client/vignettes.ts`, `vigshots.ts`, `vigkit.ts` and
  `beasts.ts` play and draw them. Two goblins at each other with knives over a dead ox from the baggage
  train while a third eats (north of the field); two dragging one of the dead off by the arms into the
  trees, a blood trail behind (north of the field); their fire with a carcass turning on the spit, the
  boots they took off the dead in a heap, one asleep (by Hew's clearing); a deer run down and speared
  (south of the stream); the last soldier of the column on his feet with three round him: he cuts one
  down, is stabbed in the side and from behind, kneels, falls, and they're at him (south of the stream).
  The squabble and the fire loop; the rest play once when you first come near and stay as they ended.
  Paint only: never in the room, so nothing can hit, shoot, pin or be hurt by them; drawn by the same
  code as the real goblins, in both views, on the room's clock (held when the world is held). The edge
  in front of each is brambles and rocks you can see over; the wood round each is left open.
- **Hew's death** (Kyle: "have the big monster grab Hew and he starts screaming and dies... his head
  exploded and is thrown against a wall and slides down it, then the monster bellows and attacks you").
  `sim/woodcut.ts` (out of `sim/wood.ts`): grabbed; his last shout (kept: "Get the count to Odric",
  which the tally stick hangs on); a scream; the last cut off; the head burst (the bite's gore, kept);
  thrown into his hut's front wall and down it, a smear left on the wall (`Npc.smear`); the Stoker
  bellows, no words, and comes at once (cooldown 0.4). The Stoker's line is gone from the game. Grab to
  attack is under five seconds.
- **The road out is short** (Kyle: "don't make them walk a huge way away to get to the town"):
  `ROAD_OUT` is now just west of the hut's gate (x 37 to 40), not the far end of the road.
- New player-facing line for the lore keeper and line editor: Hew's scream `LINES.screams[0]`.
## 2026-11-04: the UI redo, steps 1 to 3: one material on the pixel grid, a touch cluster, a unit frame (Kyle; Claude Opus 5.5)

Kyle: the UI reads as "AI slop"; emulate Diablo and Path of Exile, mobile first. Built the first three
steps of `docs/ui-research.md` as one slice. Drawing only: nothing in `src/sim/` or `src/shared/` changed.

- **Two bundled pixel faces, no system monospace.** Display: Jacquard 12 (a pixel blackletter) for panel
  titles, place names and name plates, in title case (a blackletter in capitals can't be read; panel
  titles are title-cased in `panels.ts`, and the three places that matched a title's text now match it
  without regard to case). Body: Tiny5, chosen over Pixelify Sans after looking at both: Pixelify's 5
  reads as S and its C as O at UI sizes, Tiny5's don't. Tiny5 is 8 pixels to the em, so it is used only
  at sizes that land on whole device pixels: 8px, 16px, and a text size of 12px (2x screens) or
  13.33px (3x phones), as tokens (`--fs-s`, `--fs-text`, `--fs`); every older size was mapped onto them.
  No faked bold (`font-synthesis: none`). Both OFL 1.1, copied from npm's `@fontsource` packages into
  `src/client/fonts/` with their licences; credits in `docs/CREDITS.md`. Alagard isn't on npm.
- **Colour tokens** on `:root` (`ui.css`): stone greys, bone, parchment and ink, the way-on gold, blood,
  the goblin green, up and down. The purple-black neutrals and pastel accents across every stylesheet
  were mapped onto the stone ladder (light blue info text to a cool steel grey, mint to the up green,
  salmon to a muted red).
- **Frames drawn in code** (`frames.ts`): stone, iron, gilt, parchment, plus pressed iron and gilt, a sunk
  socket and a dull one, each a tiny 9-slice set on `:root` and shown with `border-image` at `--px` (2 CSS
  pixels, a world pixel on a phone). No radii, no blurred glows anywhere in the UI.
- **One button** (`ui.css`): iron; pressed, it sinks a pixel and its bevel turns over; gilt for the
  primary; dull stone when it can't be used. The eight redefinitions lost their own fills, borders and
  radii; a toggle that is on shows pushed in, not gold, so gold stays rare.
- **The touch cluster** (`cluster.ts`, drawn by `btnart.ts`, placed by `cluster.css`): ATTACK bottom right
  with the held weapon's icon and stamina as ten pips round its top left; a ring of about 100px (the dodge
  low left as a diamond, the guard as a heater shield or, for a parry, a buckler, the skill and the relic
  round); an outer ring for the flask as the health orb (red liquid to your health, green when poisoned,
  pulsing below 30%, the next potion in front, the count on it) and the one gilt context slot (GRAB,
  THROW, HELP UP, BURN, OPEN, with its word under it). Cooldowns are a dark sweep in 16 steps with the
  seconds in the pixel face, and a one-frame white rim when ready. Every class skill has an icon
  (`skillicons.ts`); found relics keep theirs. The input wiring is untouched: the same buttons, classes
  and presses. The stick is a stone ring with an iron knob and a notch where walking turns to creeping;
  its resting ghost goes after three moves.
- **Never over the hero.** The cluster stays below about 300px. On an upright screen both cameras may now
  run past a room's foot, and a room shorter than the screen follows the hero instead of sitting centred
  (`scene.ts`, `three/camera3d.ts`), so your own hero is framed above the buttons. Other heroes can still
  walk under them.
- **The top HUD** (`unitframe.ts`, `hud.css`): your hero's own sprite as the face in an iron socket, the
  level on its corner, a health bar 10 CSS pixels tall with a pale trail that holds the lost chunk for
  0.4 s, a laptop's stamina bar under it, and status marks (poisoned, blessed, warded, mending, brandy,
  smoke, tempo, the church's light). The weapon and kit lines left the always-on HUD: a tap on the face
  shows them; a laptop keeps its skill, relic and belt lines (it has no cluster yet). The corner is CHAT,
  PACK and the gear as icons in one iron group; LEAVE moved into the gear's box on a job, away from the
  pack (it was being clipped). The tracker is one framed box: the place in blackletter with a diamond a
  room (the one you're in gilt), the objective, a coin with the gold, drawn hearts. A low-health edge of
  hard red bands steps in and out.
- Also, since they were in the way: the job board's jobs are parchment notices; the pack's empty places
  are sunk sockets, not dashed boxes; the wood's words and lesson cards are in stone with a gilt button.
- `node scripts/ui-look.cjs [url] [out] [only]` shoots town, a hurt fight with a skill cooling, each
  class, the pack, the board, a talk, the start screen and the gear box, phone and laptop, flat and 2.5D.

## 2026-11-03: the Ranger's weapons rework: the longbow blinds, the crossbow winds and glints (Kyle; Claude Opus 5.5)

The third class through Kyle's weapons rework. The Ranger has the best dodge (the jump back and its
snare, unchanged) and the weakest guard (a parry, never a held block). Every bow is the short sword on a
tap (8 then 10, the `RANGER_BLADE` it already had) and the bow on a hold. Numbers in `shared/ranger.ts`
and `shared/weapons.ts`, the rules in `sim/crossbow.ts` and `sim/rangershots.ts`, all judged in the room.

- **Longbow**: quick, the short sword. Held, the draw: 18 growing to 55 over 1.4 s (the draw it had), the
  arrow piercing a line; walking while drawing stays slow (0.3 of your pace). Perfect: let go on the
  white flash (the same window and flash as before) and the arrow is a sure crit (55 x 1.5 = 83) and
  BLINDS each goblin it strikes for 2 s (a butcher 1 s). A blinded goblin drops whatever blow it had
  going, can't pick out a hero at all, and gropes about at under half its pace, turning every 0.7 s
  (headings from its id and the room's clock, no randomness). Judgment call: a goblin blinded mid charge
  stops too, since it can't see the line it showed you.
- **Shortbow**: unchanged (Kyle loves it). Its perfect (the white flash) already existed but showed only
  PERFECT at the bow; now the arrow strikes with a clean white spark too, so the hit reads. No numbers changed.
- **Crossbow**, reworked. A tap is the short sword. The hold is one state machine (`sim/crossbow.ts`):
  - a bolt on it: the hold raises it to aim (0.3 s to the raised sound), and letting go looses it: 60,
    through three goblins, each shoved hard (12), then a 0.35 s recover. It is empty after.
  - empty: the hold winds instead. You stand to it; 1 s of winding is a full reload. Letting go or pushing
    the stick ends the piece and keeps what's wound, so you can move between pieces. Letting go after a
    wind never looses (a fresh hold aims), so a reload can't fire by accident. A dodge out of it keeps the wind too.
  - glint: a reload wound from nothing to full without letting go or moving glints. The glinted bolt is
    the perfect one: PERFECT, 1.5x damage (90), 1.6x the shove, and it runs through the whole line.
    The glint, not the white flash, is the crossbow's perfect, so its aim shows no white.
  - Phone: hold ATTACK to aim, let go to fire; when it's empty, hold ATTACK and keep your thumb off the
    stick until the star shows. Laptop: the same on the left button; WASD ends a piece of winding.
  - The old crossbow fired on the press with a 1.15 s recover as its reload; that recover is now the wind.
- **Seen** (`client/fxranger.ts`, one overlay, so both views): BLINDED in white with a flash, ring and
  burst; on a blinded goblin a flickering white glare over its eyes and sparks circling its head
  (`client/status.ts`). A shortbow's clean hit: a small white ring and spark. A glinted bolt: a straight
  bright line from where it was loosed to each goblin it ran through, a flash on each. On the hero
  (`client/xbowmark.ts`, flat figures and box figures): over an empty crossbow a grey hollow bolt in a
  ring that fills as it winds (gold while the wind is still clean); a breathing star of light at the hand
  when the bolt glints. The crossbow in hand shows a bolt on it only when it's loaded.
- **Sounds** from the kit: BLINDED the perfect chime and the flare, the clean hit the perfect chime, the
  wind the hook's latch, loaded the latch and a block, the glint the latch and the chime, the glinted bolt's
  line the javelin's stick.
- **Online**: the load (`xbowEmpty`, `xbowWind`, `winding`, `xbowClean`, `xbowGlint`) lives on the hero
  and `blindUntil` on the goblin, so guests get them in the snapshot.
- New lines for the lore keeper and line editor: BLINDED, the longbow and crossbow card lines
  (`client/card.ts`) and their kit lines (`client/main.ts`).

Tests: `tests/rangerkit.test.ts` (the longbow's sword against its draw, damage growing with the hold, the
perfect crit and blind, a blinded goblin never starting a blow until it sees again, a blow stopped mid
swing, a butcher's shorter blind; the shortbow's numbers unchanged and its perfect not blinding; the
crossbow's sword tap, the loaded shot through three and no more with a shove, winding in pieces that
keep and walking between them, no glint from pieces, the stick ending a piece, the glint on an unbroken
reload with the 1.5x bolt through the whole line and the harder shove).

## 2026-11-03: the Warrior's weapons rework: the step, the shield bash and riposte, the shockwave, the pin (Kyle; Claude Opus 5.5)

The second class through Kyle's weapons rework. The Warrior is the tank, and each weapon trades damage
against shielding. Numbers in `shared/warrior.ts` and `shared/weapons.ts`, the rules in `sim/warrior.ts`,
all judged in the room.

- **No roll: a step.** The dodge button is now a short shoulder step for the Warrior (`STEP`): 1.2 tiles
  (the roll is 2.4) in 0.16 s (the roll 0.32), 12 breath, again after 0.55 s. It has no protection at all
  (its own act, `step`, which nothing treats as a roll), and it never counts as a last-second slip; a
  striped blow is still stepped out of on your feet. With no push it steps back from where you face; you keep facing.
  The button shows STEP on a phone (`dodgeName`, `dodgeOf`). The kits keep their old rolls in `dodge`,
  since `CLASS_DODGES.WARRIOR` stays false (no TEMPO trait, no DODGE gear mod, no dodge rows on the card)
  and the fight tests that lend the sword a roll still lend it. The tutorial's STEP OUT lesson now shows the
  STEP button from the path on (it used to hide the dodge for a Warrior for good). No Warrior knack touched
  the roll's distance, so none changed. The Healer still has no dodge.
- **Sword and shield**: quick, the three-cut chain (12, 12, 22), the best guard (unchanged). Held, a shield
  bash: reach 1.35, one goblin, 6 to 12 damage, and it stuns it 0.6 s to 1.2 s at full charge (a butcher
  half as long); it doesn't stop a striped blow or a charge. Perfect: a counter started within 0.5 s of the
  parry is a RIPOSTE, twice the counter (12 x 2.5 x 2 = 60 off the first cut); the plain counter (x2.5
  within 1.6 s) is still there after it. Seen: PERFECT, RIPOSTE in gold, a gold ring and flash.
- **Greatsword**: quick, two wide slow sweeps (arcs 210 and 240, up from 160 and 170). Held, the overhead
  (arc 110, reach 2.4, 38 to 75), still the `breaker`. Perfect: let go on the white flash (the rapier's
  window) and a shockwave lands 1.4 tiles ahead: every goblin within 2.6 takes 12, is shoved and knocked
  flat for 1.2 s (a butcher 0.6 s), losing its wind-up, striped or not; only a charge carries on. Trade-off:
  no held block at all (`parryOnly`); a tap of block is still a parry in its narrow 0.2 s window, and
  holding block says so as the Ranger's does.
- **Spear**: quick, long thrusts (reach 2.5, up from 2.3) with a bigger push (4, 4, 5, then 9). Held, the
  lunge runs through up to three goblins (`hits: 3`), 22 to 42. Perfect: any spear hit on a goblin that is
  charging, pouncing or mid lunger stab stops it dead and pins it for 1 s. Weakness: a quick thrust on a
  goblin inside half its reach does half (the shaft); judgment call, the held lunge is exempt, since the
  lunge carries you in among them and the point is the whole idea of it.
- Sounds from the kit: a step the footfall, the bash the block and body thump, a riposte the parry and the
  backstab sting, the shockwave the slam and rumble, a pin the javelin's stick. Effects in
  `client/fxwarrior.ts` (one overlay, so both views).
- New lines for the lore keeper and line editor: RIPOSTE, PINNED, the STEP button, the three card lines
  (`client/card.ts`) and the three kit lines (`client/main.ts`).

Tests: `tests/warrior.test.ts` (the step's distance and no protection, the bash stun, the riposte doubling
and the late plain counter, the greatsword's held block giving no guard and its parry still working, the
shockwave on a perfect release and none held too long, the spear's three-goblin lunge, the charge pin, the
shaft penalty). `fight.test.ts`: the counter test uses the greatsword (a sword's quick counter is now a
riposte), the charged-heavy test uses the greatsword held past its flash, and "no dodge" is now the
Healer's alone.

## 2026-11-03: the Rogue's weapons rework: Shadowstep stuns, the rapier skewers, the poisoner's kit (Kyle; Claude Opus 5.5)

The first class through Kyle's weapons rework (PLAN "Open: weapons rework"): every weapon a quick attack,
a held attack, a perfect-timed hit that reads, and a trade-off. All of it is decided in the room (seeded,
no `Math.random`), so a guest's goblins bleed and retch exactly as the leader's do.

- **Shadowstep stuns** the goblin you land behind for 1 s (`SHADOWSTEP.stun`, `sim/relics.ts`), for free
  stabs. Judgment call: not a goblin mid striped (unblockable) blow or mid charge, not a nest, not a
  dummy; those carry on (`dazeable` in `sim/venom.ts`, shared by the retch).
- **Daggers**: unchanged; the held attack is still the thrown dagger (tested).
- **Rapier**: the held lunge now has the white flash a bow has (`Swing.skewer`, `sim/hero.ts`). Loosed on
  it, each goblin the lunge runs through is skewered (`SKEWER` in `shared/venom.ts`): a 0.7 s stagger and a
  bleed of 3 every 0.5 s for 3 s (18). There was no bleed or DoT on goblins but the burn, so the bleed is
  new and lives with the poison in `sim/venom.ts`. Seen: a white flash at the tip, a spray of blood,
  SKEWERED, red drips on the goblin, red tick numbers.
- **The poisoner's kit** replaces the hand crossbow (new id `poisoner`; old saves holding a `handbow`
  anywhere, the hand, pack, vault or buyback, are renamed on load: `shared/oldkits.ts`, `client/save.ts`).
  - Quick: a short sword, 7, 7, 10, arc 130 to 150 (daggers 100), catching two goblins a blow (three on the
    last), slower than the daggers (0.35 s a cut against 0.23). Full damage head on (no `front`), backstab x2.
  - Hold (0.6 s draw): the blowgun, a dart to 9 tiles for 4 to 8 that puts on a poison stack: 2 a stack every
    0.5 s for 4 s after the last dart, up to 3 stacks (16 a stack, 48 at three).
  - Perfect release: the goblin retches first, held fast (stunned, so blows land x1.5) for 1 s while the poison
    ticks, and that dose ticks double (`VENOM.hard`).
  - Resistance (`VENOM_TAKES`): butchers, named butchers and the Stoker take half (and retch half as long);
    spiders, the brood mother and nests take none. Both show the existing RESIST.
  - Weakness: the dart barely scratches, the poison is slow, and it is useless on spiders and nests.
  - Poison is drawn sickly green in both views (`client/status.ts` drips, a green light in `scene.ts` and
    `three/roomlights.ts`); the dart, the blowgun and the short sword have their own looks flat and 3D; the
    icon, card, hint line, loot lists and trait pools all know it. Sounds reuse the spider kit: the dart a
    hiss, a skewer the wet bite, a retch the spit and splat.
- Name suggested: SHORTSWORD AND DARTS (needs the lore keeper and line editor, with SKEWERED and RETCHING,
  the card lines and the hint line). The story bible still says "hand crossbows" (line 210) for the lore keeper.

Tests: `tests/rogue-kit.test.ts` (the stun and its striped-blow exception, the skewer bleed and no skewer
when held too long, poison ticks, stacking, the retch and harder ticks, butcher half, spider and nest
immune, the handbow save migration); `poisoner.test.ts` and `kits.test.ts` moved to the new kit.

## 2026-11-03: one big map, measured before it's designed (Kyle; Claude Opus 5.5)

Kyle wants raids on one big, mostly open map, 8 to 12 times a room, with a few buildings and camps; the
fear is lag on whoever hosts (a phone, maybe) and on the relay. Built a test map and measured. Nothing
here is a real job yet; it lives behind `?hero=WARRIOR&bigmap=1` and `scripts/bigmap/`.

**What was built** (test only unless said):
- `shared/bigmap.ts` + `shared/bigchunks.ts`: one seed gives a 96 by 72 map (8 by 6 chunks of 12; a room
  is 28 by 24, so about 10x) of open ground, groves, farms, camps with wild fires, ridges and ruins,
  every solid thing 1.5 tiles off its chunk's edge so the seams are always open, and `n` goblins
  weighted to camps. `sim/bigroom.ts` builds the room; `sim/bots.ts` drives heroes by Intent only.
- **Dozing** (`sim/sleep.ts`, `SLEEP` in tuning, `Enemy.dozing`, `ArenaRoom` option `sleep`): a goblin
  farther than 24 tiles from every hero is not stepped at all (holds where it stands); it wakes inside
  24 and dozes again past 30. The room runs the tick on the awake list and merges the dozers back in
  their order, so bolts, pushes, targeting, drums and elements are all near-only for free. Off unless
  a room asks (no room of today's size could use it: 24 tiles is past any corner of it).
- **Near-only costs in the sim, carried over now** (on only when many bodies or a big map, so today's
  rooms run the old loops): pushing bodies apart checks near pairs only past 80 bodies
  (`sim/pairgrid.ts`, same pairs in the same order); `collide` looks only at the round things, braziers
  and blocks bucketed near it on maps over 3000 square tiles (`shared/mapgrid.ts`, same pushes, tested);
  a resting goblin listens only to the goblins that are fighting, just hit or dead (`noisy` in
  `sim/enemies.ts`, once a tick in a crowd). Before these, 600 goblins cost about 30 ms a tick in Node.
- **Relay fix, carried over now** (`api/room.ts`): a message over the socket's 64 KiB `maxPayload` made
  `ws` emit 'error' on a socket nobody listened to, which threw and took the whole Vercel instance down
  with every room on it (reproduced locally). It now logs and only that socket closes (1009).
- `client/interest.ts` (prototype, not wired in): `stateFor` (each friend: all heroes and buildings,
  everything else within 20 tiles), `eventsFor`, and `quiet` (a goblin's `cooldown` isn't drawn so isn't
  sent; `actT` goes as `a0`, when the act began, which only changes with the act).

**Node, the room's tick** (`npx tsx scripts/bigmap/measure.ts 30`; CPU ms a tick, 30 s of play at
30 Hz, four bots that can't be hurt and swing at what comes close; "spread": one in each quarter;
"together": roaming one quarter as a party; this 2-core box is shared with other agents, so wall time
was noisy and CPU time is what's shown):

| bots | goblins | dozing | tick mean ms | p95 | awake (mean) |
|---|---|---|---|---|---|
| today's village street | 5 | n/a | 0.37 | 1.55 | |
| spread | 100 | off / on | 0.68 / 0.48 | 2.54 / 0.71 | 74 / 67 |
| spread | 300 | off / on | 1.75 / 1.34 | 2.88 / 1.93 | 248 / 226 |
| spread | 600 | off / on | 4.01 / 4.63 | 6.3 / 6.8 | 529 / 503 |
| together | 100 | off / on | 0.50 / 0.31 | 0.64 / 0.42 | 91 / 35 |
| together | 300 | off / on | 2.32 / 1.02 | 4.88 / 1.76 | 277 / 118 |
| together | 600 | off / on | 6.46 / 2.38 | 11.81 / 4.19 | 556 / 222 |

Four heroes spread to the quarters keep almost the whole 96 by 72 awake (four 24-tile rings cover it),
so dozing only pays when the party is together or the map is bigger than four rings. What's left of a
tick is mostly resting goblins looking about (`notice`) and pushing.

**Browser, the leader's frames** (`node scripts/bigmap/browser.cjs perf`, preview on 4220; four heroes
spread, the leader's own walked by a bot; dozing on; headless Chromium with SwiftShader, so the GPU is
software on the same 2 cores: 2.5D numbers are far below a real GPU, read them against today's row):

| goblins | view | device | fps | frame mean / p95 ms | room ms a frame | draw ms a frame (JS) |
|---|---|---|---|---|---|---|
| today's job (5) | flat | laptop | 42.5 | 23.5 / 33.4 | | |
| today's job (5) | flat | phone (CPU /4) | 24.3 | 41.1 / 50.1 | | |
| today's job (5) | 2.5D | laptop | 7.9 | 127 / 150 | | |
| today's job (5) | 2.5D | phone (CPU /4) | 5.7 | 174 / 217 | | |
| 100 | flat | laptop | 52.3 | 19.1 / 33.4 | 0.47 | 3.95 |
| 100 | flat | phone (CPU /4) | 24.2 | 41.3 / 66.7 | 3.1 | 15.1 |
| 100 | 2.5D | laptop | 5.3 | 190 / 233 | 2.3 | 17.3 |
| 100 | 2.5D | phone (CPU /4) | 3.0 | 335 / 517 | 11.6 | 78.7 |
| 300 | flat | laptop | 57.3 | 17.5 / 16.8 | 0.77 | 5.3 |
| 300 | flat | phone (CPU /4) | 17.1 | 58.4 / 83.4 | 10.3 | 25.8 |
| 300 | 2.5D | laptop | 6.5 | 155 / 183 | 5.1 | 21.0 |
| 300 | 2.5D | phone (CPU /4) | 3.5 | 290 / 383 | 19.5 | 94.2 |
| 600 | flat | laptop | 43.4 | 23.1 / 33.4 | 2.4 | 8.9 |
| 600 | flat | phone (CPU /4) | 8.7 | 115 / 150 | 40.3 | 43.5 |
| 600 | 2.5D | laptop | 4.8 | 210 / 317 | 10.5 | 27.4 |
| 600 | 2.5D | phone (CPU /4) | 1.4 | 733 / 883 | 63.7 | 143.4 |

A big map with 100 goblins costs a phone host what today's room does. At 300 (about 230 awake) the
phone's frame is 1.4x today's in flat and the room alone is 10 ms of a 16.7 ms frame; at 600 it's 2.8x
and unplayable. Drawing grows with goblins too: neither view skips what's off screen, and the flat
lighting pass takes the first 32 lights in the list wherever they are (a big map with many camp fires
would lose the ones on screen).

**What the leader sends** (same Node script; patches every 0.05 s, a full one every 4 s, as
`CoopHost.frame` does, each in `RelaySocket.send`'s envelope; KB a second each friend receives; the
relay's ceiling for one message is 64 KiB):

| bots | goblins | whole room, today (KB/s) | biggest msg KB | near only (KB/s, worst friend) | biggest KB | near + quiet clocks (KB/s) | biggest KB | save every 2 s KB |
|---|---|---|---|---|---|---|---|---|
| today's street | 5 | 19.3 | 23.2 | 17 (17) | 14.5 | 13.7 | 14.4 | 24.8 |
| spread | 100 | 123.5 | **82.3** | 33.8 (38.4) | 25.2 | 22.6 | 24.7 | **94.2** |
| spread | 300 | 335.8 | **187** | 72.4 (82.3) | 45.3 | 41.5 | 43.8 | **217** |
| spread | 600 | 662.2 | **342** | 122.2 (146.1) | **71.5** | 65.2 | **68.7** | **396** |
| together | 100 | 76.1 | **80.8** | 38.7 (40.7) | 26.5 | 26.7 | 25.9 | **89.6** |
| together | 300 | 193.4 | **186** | 88.2 (98.8) | 58.3 | 51.0 | 56.5 | **207** |
| together | 600 | 355.1 | **342** | 163.2 (176.2) | **101** | 89.5 | **97.6** | **383** |

(Bold: over the 64 KiB ceiling.) How it travels: the leader sends one message to '*' when everyone's in
one room, so the leader uploads it once and the relay fans it out; per-friend sends mean one upload per
friend. Each message is a Redis PUBLISH only when the party is split over Vercel instances (else kept
local): 20 a second per room either way, whatever their size. Anything over 64 KiB closes the leader's
socket (and, before today's fix, crashed the instance); 64,000 to 65,536 characters are dropped silently
(`MAX_MSG`). Today's whole-room full snapshot carries the whole map (14.8 KB here) every 4 s, and the
handing-on save (the whole room as JSON, about 0.8 KB a goblin) goes every 2 s: at 100 goblins both are
already over the ceiling. What fills a patch: in a 300-goblin patch, `cooldown` 28% and `actT` 20%
(clocks ticking every tick), x and y 7% each; dead goblins keep ticking both forever.

**Recommendation.**
- **Map size**: 96 by 72 (about 10 rooms) is fine. The map itself costs nothing much now (15 KB, and
  collision only looks near); goblins awake near the party are the cost.
- **Goblins**: on a **phone host**, about **150 to 200** on the whole map, placed so no more than about
  60 to 80 are ever within 24 tiles of the party (camps spread out, not one horde), dozing on. On a
  **laptop host**, **300 to 400**; 600 runs (4 to 6 ms a tick) but the sends don't fit. If the leader may
  be a phone, design to the phone numbers.
- **Interest-limited sending is needed**, not optional: the whole-room full snapshot breaks the relay's
  ceiling at 100 goblins. With it plus quiet clocks a friend gets about 23 to 50 KB/s and the biggest
  message stays under 64 KiB up to about 300 goblins. Also needed before a big map ships: the map goes
  as its seed (built on the friend's side), not in every full; the save goes compact (or in parts, or
  only what's near), since it's over the ceiling at 100 goblins.
- **Wake radius 24 tiles, doze at 30** (two screens of a hero; any goblin's sight is 6.5 and an arrow's
  reach 8). Smaller saves little and risks goblins freezing in sight on a laptop's wide screen.

**Carries over** (already on this branch): dozing (`sim/sleep.ts`), near pairs and the map lookup,
`noisy`, the relay's error listener, the seeded chunk generator as a starting point (the real one wants
roads, a goal and doors), and the bots for future load tests. **Still to do for the real build**:
wire `stateFor`/`quiet` into `CoopHost.frame` (an Encoder per friend, the guest's Decoder works out
`actT` from `a0`), map by seed, a compact save, skip off-screen goblins and props in both views, cull
lights to the screen before the 32-light cap, and stop dead goblins' clocks.

Screenshots: `node scripts/bigmap/browser.cjs shots <dir>` (phone and laptop, flat and 2.5D, close by
a hero; an overview of the whole field with the party spread, and one with a hero alone at the way in,
awake goblins green and dozing grey). Tests: `tests/bigmap.test.ts` (same seed same map, every goblin
reachable, the map lookup pushes the same as checking everything, near pairs the same as all pairs,
dozers hold still and wake when a hero comes near, the room keeps its order).

## 2026-11-03: nests come back slower, and burn out up close (Kyle; Claude Opus 5.5)

Kyle: "I love them but they respawn too quickly so it's hard to kill their nest. Nests should have less
HP too; it's hard for a Rogue. Or maybe it has the same HP from range, but if you run up to it you can
light it on fire and it burns out." Done both ways: the waves give you a window, and in that window any
class can run in and torch it. Numbers in `shared/spiders.ts` (NEST), rule in `sim/torch.ts`.

- **Waves** (`sim/spiders.ts`). Before: first wave 1.2 s after it wakes, then every 8 s, cap 7 alive.
  After: first wave 2 s after it wakes, then every 12 s solo, 1 s quicker for each player past the
  first, never under 9 s (`nestGap`); cap 6 alive (still +2 for each extra spider a wave in a party).
  New: when the last spider of its waves dies, the next waits at least 5 s more (`NEST.rest`), so
  killing a wave buys a real run at the nest. Wave size unchanged: 3, +1 a player past the first. The
  gap counts the players in the room now, so it follows someone leaving.
- **Burn it out** (`sim/torch.ts`). GRAB within 1.6 tiles of a nest's middle (it comes after HELP UP,
  before grabbing a goblin or lifting a prop): you crouch, and after 1.2 s of standing still and idle it
  catches. A hit (you stagger), a swing, a dodge, a step or going down stops it and the next try starts
  from nothing, the same rule as getting a friend up. One lighter at a time; a second press while a
  friend is at it does nothing. Alight it burns 3.5 s, its health running down to nothing, then dies as
  'burn' (ash), credited to whoever lit it, and counts like any nest for the room's goal. While alight
  it hatches nothing (a wave swelling in it never comes), nothing puts it out, and its fire spreads to
  spiders on it by the room's ordinary touch rule (the nest's burn tick is off: it burns on its own
  clock). From range nothing changed: fire still 3x, and a fire hit still burns it fast.
- **HP and blades.** 80 to 55. Blades kept at 0.6. The real trouble for a Rogue was the daggers' head-on
  halving (`front: 0.5`) on top of 0.6: 2 a stab. A nest is a mound of web with no front or back, so
  blades now land on it plain (no halving, no backstab; `sim/combat.ts`). Daggers: 4, 4, 5, 8 a chain,
  about 3 chains to kill it, where it was about 8.
- **Drawn from the same state, both views** (`client/nestfire.ts`, called from `client/spiders.ts`, which
  2.5D's cards draw too): a gold ring filling round the nest while it's lit (like the ring for helping
  a friend up), sparks at its foot and a small warm glow; alight, tongues of fire over a mound that chars
  and sinks, a bigger warmer light (70 not 44; 2.5D adds its fire too); after, a grey heap of ash with
  embers going out over 6 s. The lighter crouches (`hero.stoop`, set by the room). The hatch is the
  'oilfire' whoosh with a flash; no new pop (the spiders' own BURNING says enough).
- **Online.** GRAB is the existing grab press, decided by the room; the nest's `lighter`, `lightT`,
  `ashAt` and the hero's `stoop` are plain fields in the patches, so a guest sees all of it.
- **Words**: BURN (the button), G  BURN (the laptop prompt). For the lore keeper and line editor.
- Tests: `tests/torch.test.ts`. Screenshots: `node scripts/nests.cjs [url] [outdir]`.

## 2026-11-03: the lamps keep the hour; 2.5D's night back to FLAT's (Kyle; Claude Opus 5.5)

Kyle: "Town looks a little too bright now, but maybe it's daytime. If there is day and night, we should
turn off fires at night except for the wild burning ones." Read as: the fires people tend are out by
day and lit at dusk and through the night; the wild ones burn whatever the hour.

- **One rule, both views** (`shared/lamps.ts`, `lampAt(theme, x, y)`). Lamps: wall torches, braziers,
  lamp posts (the square's, the lane's, Perrin's garden), a hall's door lamp, lamplit windows (the halls,
  the church, the tavern, a job's cottage with its fire going), the torches either side of an open way
  out, and the heroes' carried lanterns (already off by day). Wild, never put out: a house or wagon on
  fire, embers and smoulder, a goblin camp's fire (job braziers and cottage camps, `wild` on the map),
  the Tulls' brazier inside the gate (they live round it), cookfires, spell and skill fire, a burning
  goblin. Also always lit: the Last Lantern (it never goes out), the forge's fire (worked all day),
  anything indoors, the yard, Hew's wood, underground (lamps are lit whenever anyone's there).
- **When.** In Wickhold by the shared clock: the first lamp is lit at phase 0.71 (daylight about 0.65,
  as dusk starts) and the first put out at 0.285 (about 0.6 after dawn). The lamplighter goes round:
  each lamp has its own place in the round from where it stands, so they come on one by one over 0.012
  of the day (about half a minute) and go out the same way, each flame catching over a few seconds. The
  day only runs forward and a lamp lights at a darker point than it's put out, so nothing flickers (a
  test walks the whole day and counts one lighting and one putting out per lamp). On a job by its hour:
  out in broad day, lit at dawn (not yet put out), dusk and night.
- **Out means out.** A cold brazier is grey ash, a torch a charred head, a post an empty lamp, a door
  lamp and windows dark glass, and none of them give any light, so by day the sun does it all. The
  fires that stay lit count for less under the sun, as on a day job (the town's `torch` now runs from
  1 at night to 0.35 at noon), so the Last Lantern no longer throws a warm pool across the square at noon.
- **2.5D's night** (`three/lights3d.ts`). The moon's blue-silver key was about twice FLAT's moon pool
  across the whole square (FLAT's is a pool over the middle at the theme's strength), which made the
  square cooler and greyer than FLAT. Now `MOON` 0.6 (was 1.3), and the point lights a little stronger
  and further (`POINT` 3.1, was 2.6; `REACH` 1.15), so the lamps carry the night in warm pools.
- **Numbers** (luma, saturation, warmth as mean R minus B; the square at 31,21 where the last entry
  measured, phone): midnight FLAT 63 / 0.32 / 14, 2.5D before 65 / 0.27 / 7, after 60 / 0.31 / 16; on a
  laptop FLAT 60 / 0.31 / 14, 2.5D before 64 / 0.29 / 12, after 59 / 0.33 / 20. A job street at night
  (burning house, goblin fire): FLAT 40, 2.5D before 42, after 41, saturation 0.45 / 0.39 / 0.45. Noon,
  lamps out: FLAT 92 to 76, 2.5D 98 to 86 (still clearly day, a little brighter than FLAT). Dusk (0.74,
  every lamp lit): FLAT 69, 2.5D 70, the warmest of the three.
- **Testing the hour** (`client/townclock.ts`): `?day=0.5` in the address (0 midnight, 0.25 dawn, 0.5
  noon, 0.75 dusk) or `window.__setDay(0.75)`, `__setDay(null)` to give the clock back.

## 2026-11-02: 2.5D figures are FLAT's pixel figures standing in the 3D world (Kyle; Claude Opus 5.5)

Kyle: "In 2.5D the mage looks blocky, so does the big orc. Also when the spearmen are attacking they
sort of project and then hold too long at the end instead of more of a stab ... I really like how the
terrain and land look in 2.5D but the enemies I'm not loving." Decided: the HD-2D way. Keep the 3D
world, draw the characters as the game's own sprites. On the first shot Kyle said "Yes. Love. Do it."

- **One source for how a figure looks.** Every figure in 2.5D is drawn by the flat view's own code
  (`drawHero`, `drawEnemy`, `drawHeld`, `drawStatus`, `drawHound`, `drawSurvivor`, `drawNpc`), so each
  class and look, held kit, pose, wind-up and payoff, hit flash, frozen and burning, death, and the
  goblins' glowing eyes match FLAT exactly and can't drift. Who gets a card is `three/cards3d.ts`.
- **How** (`three/figs3d.ts`). Each frame every figure in sight is drawn into its own 96x96 cell of one
  atlas (a `lit` canvas and a `glow` canvas, ten cells a row, more rows as needed) and shown on a card
  at its feet. The card is folded at the feet: upright above them, lying on the floor below them (a
  blade swung toward you, a ring at the feet, a name under someone stays on the ground, never sunk into
  it). It is sized so one sprite pixel is one pixel of the low-res view (a whole multiple when the view
  is coarser) and snapped to whole pixels, sampled nearest, so it stays crisp under the post pass. At
  HIGH a figure stands as tall against the floor as in FLAT (the view's pixels per tile times cos 36
  degrees is about 17 against FLAT's 16).
- **Lit by the world** (`three/figmat.ts`). The lit layer is a Lambert surface (the same banded light
  and dither as everything else) with a normal facing the camera and a little up, so torches, braziers,
  the moon and spells light it, and the moon's shadow falls on it. The glow layer goes on top unlit and
  blooms (eyes, sparks, flashes, words). Part-covered pixels keep to an ordered dither, never a blend;
  a faint one (a lunge's afterimage) is drawn dimmer. A soft dithered pool on the floor is the shadow
  (FLAT's own shadow is skipped on a card: `draw.ts` `BARE`).
- **Depth and outlines.** Cards sort and hide against walls, roofs and trees by depth like anything
  else; heroes still show as the violet silhouette behind walls, now cut to the sprite's shape. Cards
  are kept out of the outline pass (alpha just under 1): the sprites carry FLAT's one-pixel outline, so
  no double outline.
- **What the cards now carry** (and the overlay no longer draws twice): a goblin's health ring and
  what's on it, the butcher's "!", a downed hero's count, an NPC's mark and name when you're near, a
  swing's smear. Friends' names stay over their heads (the overlay, lower to match the figures).
- **The spearman.** FLAT's lunger already stabs quickly (out for 0.18 s, back over 0.25 s, then
  standing), but its spear was drawn from the feet and never moved, so the lunge read as a body sliding
  with a stick. Now the lunger's spear and the brute's club are in the weapon hand and go with the pose
  (`foes.ts` `kit`): the spear drives out on the stab and comes back with the recover. The lunger no
  longer carries a knife as well. Drawing only; the sim's timings are unchanged.
- **Kept.** The box figures (`heroes3d.ts`, `goblins3d.ts`, `foepose3d.ts`, `folk3d.ts`, `npcs3d.ts`
  and the rest) are untouched behind `?figs=3d`, for when Blender models replace the sprites. Props,
  buildings, chests, bolts, telegraphs and effects stay 3D; the yard's cage still holds a box figure.
- **Cost.** Drawing the cells is under 1 ms for ten figures and about 2.5 ms for the wood's thirteen
  (software GL in headless Chrome, so slower than a phone). Draw calls about halve (82 to 36 in the
  square). Alternating runs of box figures and cards in the square, headless, showed no measurable
  difference in frame time (medians about 48 against 41 ms draw); the 390 ms frame in the first shot
  was load from a parallel run, not the cards. In town on a laptop page, three alternating runs each:
  2.3 to 3.3 frames a second with box figures, 3.0 to 4.0 with cards (software GL on a loaded two-core
  box). Both atlas textures go up every frame something was drawn (960 by 192 pixels each for up to
  twenty figures). Not done: redrawing only the cells whose pose changed (the flat code draws from the
  wall clock too, so there's no cheap test for "unchanged"); worth it only if a phone shows the upload.
- **Online with 2.5D on** (`LOOK=3d`): the party run passes; the chat run's "Kyle hears Sam's world
  line" and the town run's "Sam walked" fail the same way with the box figures (`LOOK='3d&figs=3d'`),
  so they come from 2.5D at three frames a second in software GL, not from the cards; FLAT passes.


## 2026-11-02: 2.5D as bright as FLAT, closer in on phones, trees that aren't voxels (Kyle; Claude Opus 5.5)

Kyle and his friends played both views: "We like the 2.5D, but flat has cleaner, brighter colours. It's
too dark in 2.5D." Then Kyle in the wood on his phone: "It looked like Minecraft from super far back."

- **Measured, not eyed.** `scripts/bright-look.cjs` holds the room still and shoots FLAT then 2.5D at
  the same moment (Wickhold night and day, a job street at night, a den, the butcher's telegraph, and
  the wood: waking, Hew's first card, a drill freeze-frame, the cutscene, the Stoker), phone and laptop;
  `scripts/bright-stats.py` gives mean luma and saturation of the play area and of a box round the hero.
  Before: the square at night and the dens 14 to 30% darker than FLAT, saturation 0.27 against 0.46 in a den, the hero
  about 60% of FLAT's brightness at night (88 against 150 in the square).
- **What made it dark.** The 3D ambient was 1.35 times the theme's where FLAT's pass uses 1.55 with a
  floor (light.ts: nothing goes below 0.19); upright faces (walls, every figure) took the moon or a
  torch only by the cosine of a light slanting down, so people stood darker than the floor they were on;
  indoors (no moon) a blue moonlight was still forced on at 0.35, greying the warm rooms; outlines were
  near black (22% of the colour) on 1-pixel figures. Banding was not the cause: it already bands the
  light's level, not each channel.
- **What changed** (`three/lights3d.ts`, `three/post.ts`). The theme's ambient at FLAT's 1.55, split
  into a fill (75%) and a key from the sky in the ambient's own colour (45%), so a lit floor lands on
  its flat colour and faces still model; the moon adds its blue-silver to the key at night only (none
  indoors); wrapped light (a face turned away still takes 40%), so figures read like FLAT's sprites; the
  same light floor as FLAT; point lights a little stronger (2.6) so torch and brazier pools match FLAT's
  falloff; outlines a darker shade of the thing's own colour (42%, saturation kept) instead of black.
- **After** (luma, flat / old / new): square at night 63 / 50 / 65, a den 33 / 23 / 30 (saturation
  0.46 / 0.27 / 0.39), a job street 29 / 30 / 37, the square by day 92 / 106 / 98. The hero at night
  120 (was 88), never darker than in FLAT on a job. Night is still night: the square is blue-silver
  away from the braziers, the pools warm.
- **Closer in on phones.** The 2.5D view showed 85% of FLAT's width, but tilted it took in 38 rows to
  FLAT's 26 on an upright phone, so everything looked far off. Now it shows as much floor (tiles across
  times down) as FLAT does, and on an upright screen 80% of it (`ZOOM` in view3d.ts): about 8.4 tiles
  across and 31 deep on a phone, 17.5 by 19 on a laptop. The angle stays 36 degrees (the job rooms that
  looked right).
- **Trees** (`three/rounds3d.ts`, `three/boxes.ts`): a pine is three six-sided cones and a leafy tree
  three rounded lumps, in FLAT's own greens (sprites.ts), not stacked boxes; a wood's wall of trees is
  lumps too. Burning wagons burn on top of their bed (the flames were inside the box) and have side
  boards; the cordwood is a stack of logs between posts, not a brown box.
- **The trainer skills in 2.5D** (`three/skills3d.ts`): the rings a Shield Stamp, Fire Ring or Censer
  Light fill while winding up, the Volley's marked spot and its arrows falling, the fire ring burning,
  the Storm Tether's lightning and the Censer Chain's links, from the same room data skillsdraw.ts
  uses, with their light. (Vanish smoke, the knives and the hound were already drawn.)
- **BRIGHT - / +** under QUALITY while 2.5D is on: a gamma in the post pass, -2 to +3, remembered
  (`?b=` wins). For dim phone screens.
- Headless (software GL) frame times are the same as before within noise; triangle counts unchanged
  (the cones and lumps are no more faces than the boxes they replace).

## 2026-11-02: what you pick up on a job is yours, whatever happens to your page (Kyle; Claude Opus 5.5)

Kyle: "What if someone drops and rejoins multiplayer but picked up gold or an item? I want to make sure
they have it when they reload." Then: "Shouldn't be my device, should be whoever started the job."

- **The leader keeps what the job owes.** The room decides, so whoever runs the job (CoopHost, and
  whoever takes it on) writes each member's share to the server (`api/owed.ts`, `api/_owed.ts`: one
  Redis hash per hero, `relic:owed:<heroId>`, a field per job's room code, a week's keeping). Written
  when the pot changed, at most every 4 s, for everyone still with the job (heard in the last 5 s);
  someone gone keeps the share they had when they went. At the end, everyone still with it is written
  the outcome too (`end: won | beaten`), so a page that was hidden at the end is paid as won.
- **Claimed once, on load** (`Game.settle`, from main.ts once a hero is in town and has no job to get
  back into, or when a job turns out to be gone). The pay goes into the save in the same store as the
  job's mark in `profile.paid` (the last 12 jobs), then the server's record is dropped. A record for a
  job already paid is only dropped. So a reload mid-payout, a late write from the leader or a lost
  drop can never pay twice.
- **Each device's own tally** (`client/jobbank.ts`) is only a fallback: paid when the server can't be
  reached, or for a job alone (never on the server). Never both: whichever pays marks the job paid.
- **What each pays.** Won: the pot, the job's pay, the treasure. Driven back (beaten): half the pot.
  Alone, leaving or being cut off loses the job: half, as driven back (so closing the tab never beats
  LEAVE). With a party, going early, by LEAVE or cut off (a crash, a closed tab, the leader gone and
  nobody to take it on), keeps the pot as it was while you were with them, in full, and the experience
  earned, but not the job's pay. LEAVE with a party was half before; it's now the same as a drop. The
  Ransom Coat only bites when it's half. New title for going early: HOME EARLY.
- **A leader back after a reload** leads again from the job as it kept it, but the room waits up to 10 s
  for a friend to answer; nobody does (they finished it, or left), and the job is given up and settled
  from the record, rather than the old leader replaying a stale job alone.
- **Kit is saved the moment the room changes it** (`client/keepkit.ts`), for a friend now too: a weapon
  swapped from the pack, the relic carried, the Mage's element (a friend's weapon swap was lost on
  reload before). **And never rolled back:** a room restored from a whole-job save (a reload, a
  takeover) is dressed from each player's own save (their profile is the newer word on their kit; a
  friend's on their first hello), and a piece already in someone's save isn't left on the floor too.
  The pack's size rule on pickup is the room's (`sim/loot.ts`), unchanged.
- **Stress** (`scripts/stress/keep.cjs`): 22 a friend picks up and reloads, paid what the leader is;
  23 a friend closes the tab, the job ends, he comes back: the ring, the pot as it was, the experience,
  paid once (his device tally wiped first, so it's the leader's record); 24 the leader crashes, a friend
  finishes, the old leader comes back: the ring and his share (device tally wiped too); 25 a friend
  swaps weapon and reloads: still holding it. Scenarios 1, 2, 3 and 20 now expect HOME EARLY.
- **Unsure:** no accounts, as for the world: anyone knowing a hero id could write it gold (capped at 5000
  a job). A friend coming back to a job that ended still waits the 35 s a lost leader takes before
  being paid. A record the leader never got to write (it crashed in its first seconds) pays nothing.

## 2026-11-02: host a job, wander town, set out when ready (Kyle; Claude Opus 5.5)

Kyle: "I would like to be able to host a job and then wander around town, same with others, and start
whenever we're ready, with a little UI notification of who else signed up for the job."

- **GATHER A PARTY posts and lets you go.** The board closes; you walk anywhere in Wickhold (halls,
  shops, the vault) while the party's up. The board still lists parties (`client/partyboard.ts`).
- **A party card on the HUD** (`client/partycard.ts`, `partyhud.css`) in town while you lead or are in
  one, indoors too: the job's kind and name, pips in class colours for who's in plus empty ones for free
  slots, 2/4; opened out, the names (class colours from the weapon each carries in town), the leader
  marked LEADS, and SET OUT (greyed with NEEDS 3 TO SET OUT for a story job short of people) and CANCEL
  for the leader, LEAVE for the rest. A phone shows the one line under the HUD and opens on a tap; a
  laptop shows it all. With a panel up on a phone it drops to the bottom as one line, so the panel reads.
- **Toasts** (`client/partytoast.ts`) under the card: KYLE is gathering for ... (with JOIN on it, and a tap
  elsewhere opens the parties gathering from anywhere), SAM joined your party, SAM left, You're in KYLE's
  party, and why one's gone. One per happening, a soft two-note chime, gone in 4.5 s, three at most.
- **Setting out has a beat** (`client/setout.ts`): the leader's SET OUT closes any panel and the pack, says
  SETTING OUT and where for 1.4 s, then goes. The party is told at the start of the beat (and comes down,
  so nobody joins late), so every member's beat runs alongside the leader's, wherever they are, and they
  arrive about as the leader does (stress scene 14 caught the members a whole beat behind at first).
- **Online, small and steady** (`shared/lobby.ts` pure and tested, `client/parties.ts`): the offer the town
  carries is a tag of the job (id, title, kind, place, size) instead of the whole posting, under 220
  bytes; the whole job goes once, with the set-out word. The party's grace is 20 s (PARTY_GRACE, longer
  than the town's 12 s so a reload through the start screen fits): a member quiet past it is let go, and
  a leader quiet past it ends the party for everyone. Both sides keep their party in localStorage for
  the grace (`client/partykeep.ts`), so a reload on either side comes back to it. A member not yet listed
  asks again every 3 s, so one lost word never strands anyone. Leaving Wickhold (the yard, a job alone)
  takes your party down or leaves the one you're in, said before the town's socket closes.
- **Tests.** `tests/lobby.test.ts`; `scripts/lobby-online.cjs` (in `npm run test:online`): host posts and
  walks into the forge, a friend on a phone joins from the toast, the host's card shows him, the friend
  walks into the counting house and opens the vault, the host sets out from his card, both arrive; a
  member reloads and stays in, then leaves and the host is told; the host reloads with the party intact,
  then cancels; the host goes to the yard; the host's page dies and the party breaks up after the grace.
  The other online scripts and the stress kit now set out from the card.
- Open: every new word (`client/partywords.ts`) through the lore keeper and the line editor.

## 2026-11-02: the 2.5D view everywhere, a quality switch, the hand crossbow (Kyle; Claude Opus 5.5)

Kyle played 2.5D on jobs ("It seemed to run really well") and asked: "No 2.5D in the main hub area?",
"Let's get townsfolk, hanged bodies etc. That stuff is amazing", "Let's do higher quality, but let
someone change the quality themselves", and "I got the hand crossbow as the Rogue and it went OVER my
twin daggers instead of replacing them, which felt weird, and didn't seem to change anything."

- **Everywhere, still a second drawer.** VIEW: 2.5D now draws whatever room the game is in: Wickhold and
  its halls, the training yard, the wood, jobs. No sim, relay or coop change. The "2.5D shows on jobs for
  now" line is gone. What the flat view draws beside the room is drawn too: the map's people
  (`three/npcs3d.ts` in the colours of npcs.ts's looks, `three/work3d.ts` for what they're at: guards'
  spears on their rounds, the gravedigger carrying the dead and digging, the whetstone, the well, the
  column's dead in what they bled, Hew after the bite), other players in town (`three/people3d.ts`, drawn
  only), a Mage's blink image (a dithered violet copy, flickering), and the yard's cage.
- **Words and marks** go on the flat layer as in FLAT (`three/tags3d.ts`): gold marks over anyone to
  talk to, their name when close, other players' names, buildings' names on their fronts. Speech
  bubbles take a height (`tileScreen(x, y, up)`), so they stand over a 3D head as over a sprite.
- **The rest of the flat view's extras** (`three/extras3d.ts`), each from the room or the flat code
  itself so it matches: swing trails from held.ts's own pose (the arc that's judged), status icons
  (status.ts), the hook's line (relicsdraw.ts), drummers' reach and beat, edge marks for the freed,
  the relic held up in the wood, dawn's mist anchored to the ground, crows, the dog, moths and smoke.
- **Grim, within the bible** (`three/grim3d.ts`, "Dens and big houses"): the larder's hung by the
  ankles from a rafter hook, opened, turning and dripping; the cook-pot on its fire with an arm or a
  leg over the rim, steam rising. Grown people only; the rest of the gore is the floor's own painting.
  The gallows and hurdles are `three/siege3d.ts` (a noose, a crow on the beam).
- **Each hall as itself** (`three/halls3d.ts`, after exterior.ts): the tower's bent slate cone and slits
  lit odd colours, the barracks' shields and banner, the lodge's antlers and pelts, the church's belfry
  and round window, the Rat's casks and lamp, the forge's chimney stack, the town hall's notices, the
  infirmary's herbs, the counting house's fallen-in end.
- **Rough edges.** Thatch is laid in courses with a darker cut edge and loose straw, so it reads as rows
  catching the light. Walls have mortar behind the stones and roofs an underlay, so seams show as lines
  rather than holes (at HIGH they had shown as black flecks). The lunger coils back over its wind-up and
  throws itself along the red, and lunges and charges carry chevrons running the way they come. The
  Stoker's cutscene moves the 2.5D camera as it does the flat one.
- **Every kit its own in hand** (`three/kits3d.ts`): sword and shield, greatsword, spear; longbow,
  shortbow, crossbow; twin daggers, the rapier, the hand crossbow with a knife; wand, the staff's crook,
  the banded rod; mace, sword and censer, flail (the censer at every Cleric's belt). A new figure is
  built when the kit changes, so one replaces the other.
- **The hand crossbow.** The room was right: equipping it from the pack makes the hero's weapon the hand
  crossbow, the tap is the knife, the hold is a bolt that dazes (`tests/handbow.test.ts` goes through
  the pack the way PACK does). What was wrong was the drawing: 2.5D gave every Rogue twin daggers
  whatever the kit, and FLAT drew the knife (which looks like a dagger) with the crossbow hanging beside
  it. FLAT now holds the crossbow in hand, the knife sheathed at the belt, out only for a stab.
- **Quality.** HIGH to start on every device. QUALITY: LOW / MID / HIGH sits under VIEW in the gear box
  while 2.5D is on, changes live (the light pool and the moon's shadow are rebuilt, the canvas resized)
  and is remembered; `?q=` still wins. `?perf=1` keeps the readout.
- **Measured headless (software GL, SwiftShader; a real GPU is far quicker).** Wickhold at night, frame
  ms: phone 390x844@3 low 47, mid 138, high 185 (draw 15, 33, 36); laptop 1280x800@2 low 45, mid 135,
  high 184. At HIGH: a hall inside 91, a den 103, the wood 143 (phone), a job street 158. Draw calls 90
  to 170 in town, about 560 in the wood (each of the column's dead is its own figure).
- **Online in 2.5D.** Town presence and chat pass with 2.5D on (scripts take `LOOK=3d`). The party
  run's "Sam's walk is smooth" step fails at HIGH under SwiftShader only (frames near 300 ms, five looks
  in 1.2 s), and passes at LOW and in FLAT; worth watching on Kyle's phone.
- New words (for the lore keeper and line editor): QUALITY: LOW, QUALITY: MID, QUALITY: HIGH.

## 2026-11-02: the 2.5D view (low-res 3D) on jobs, and options under a gear (Kyle; Claude Opus 5.5)

Kyle saw the 2.5D look test (low-res 3D that reads as pixel art) and wants that style. Step 1: a second
renderer for the same room, opt-in, on jobs only. Then: "can we have a button someone can get to from
options to toggle between?", the ? panel had "WAY too much info", and he calls the views FLAT and 2.5D.

- **Same room, second drawer.** `client/three/` (about 30 small files) draws the `ArenaRoom` the pixel
  scene draws, nothing else: no sim change, no relay or coop change. Telegraphs are shaped from the
  enemy's `attack` (circle, sector by `arc`, lane, an arrow's line), so the red you see is the one
  judged; the white edge is the same parry window the 2D scene uses (`parryWindow + lenience`).
  Positions ease between ticks with `room.prev` and `alpha`, as scene.ts does. Online guests draw the
  room they're sent; buildings are keyed by their place in the list, since a guest's blocks are new
  objects on every update.
- **The look** (copied from the look test, three.js r128 there, 0.160.0 bundled here, never a CDN):
  painted at a low resolution and scaled by a whole number with CSS `pixelated`; Lambert light banded
  into five steps with a 4x4 Bayer dither (the 2D pass's bands) and point lights falling off as the 2D
  pass's do (`post.ts` patches three's attenuation); a post pass outlines silhouettes one pixel dark from
  depth and lets glowing things (alpha below 1) bleed; 36 degree orthographic three-quarter camera
  following the hero, snapped to the pixel grid. Colours are hex as painted (colour management off).
- **What's reused rather than redrawn.** The floor and the back wall's face are the 2D painting itself
  (`paintMap`), laid on the ground and the wall, so floors, soil, marks, water and the way out match;
  blood decals are painted into that floor as they're spilled. The effects are Fx's own (sparks,
  rings, lightning, gore, words), each re-projected from where the room put it onto a low-res overlay
  canvas with the 3x5 pixel font, so every event the 2D view shows has a 3D place without new code.
- **Seeing your hero.** Heroes draw last, on their own layer: first as a dithered pale silhouette
  where something nearer hides them, then as themselves, so only hidden parts stay a silhouette. Behind
  a building its roof comes off and its walls drop low.
- **Lazy and live.** three.js and the view are a separate chunk loaded the first time 2.5D is wanted
  (the flat game's bundle grows about 2 KB). Switching is live mid-fight: only which canvas shows
  changes. `?look=3d` (or `2.5d`) starts in 2.5D; the switch is remembered in localStorage. Town and the
  wood stay flat for now, even with 2.5D on.
- **Quality knob** (`three/look.ts`): `?q=low|mid|high`, mid on touch devices, high otherwise. Pixel
  count (40k, 62k, 90k), point lights at once (4, 8, 12, a fixed pool so shaders never rebuild), the
  moon's shadow map (none, 1024, 2048). `?perf=1` shows draw ms, frame ms, size, draw calls.
- **Measured headless (software GL, SwiftShader; real GPUs will be far quicker).** Phone 390x844@3:
  flat 31 ms a frame; 2.5D low 36, mid 106, high 131. Laptop 1280x800@2: flat 17; 2.5D low 37, mid 87,
  high 132. The JavaScript side of a 2.5D frame is 3 to 5 ms; the rest is SwiftShader rasterising
  (shadows and lights dominate). The look test ran at 4.2 ms on Kyle's laptop; phones unknown, so the
  phone default is mid and low is there if it stutters.
- **Options under a gear.** The ? button and its long help panel are gone (removed cleanly; nothing
  read them). A pixel gear (inline SVG) in the corner row opens a small box: VIEW: FLAT / 2.5D, HEROES,
  SOUND, MUSIC, TIPS (moved out of the corner row, same ids and handlers). A tap outside closes it.
  Mouse aim in 2.5D divides the vertical by the floor's foreshortening (`heroScreen` gives a fourth
  number; the flat scene's is unchanged).
- New words (for the lore keeper and line editor): VIEW: FLAT, VIEW: 2.5D, "2.5D shows on jobs for
  now", SOUND, MUSIC.

## 2026-11-02: knacks per class, a free reset, a pick you can't miss (Kyle; Claude Opus 5.5)

Kyle: "Knacks is also sort of hard to see / tell that it's there. It's hard to know that I have a
choice currently." "We should let people reset their knacks whenever, for free." "Knacks should be
different per class. Movement speed, dodge distance, throwing dagger damage, or the window for a
'perfect' attack, etc."

- **Each class its own four chains of three** (`shared/chains.ts`, `shared/perks.ts`); the shared BODY
  and BREATH rows are gone (no one row fit every class). Ids carry the class's letter (w_, r_, g_, m_,
  h_). Warrior: GUARD (parry +0.04 s, block -25% breath, counter +25%), PLATE (+20 health, 8% less
  hurt, +6% speed), HEAVY BLOW (charge 15% faster, full charge +15%, knock +25%), SKILL (skill and
  relic 20% sooner, shield charge and war cry +20% further, +40% longer). Ranger: BOW (draw 15% faster,
  a shot loosed on the white flash +20%, the flash +0.15 s), JUMP (20% sooner, 20% further, +6%
  speed), SNARE (25% sooner, holds 25% longer, three down), HOUND (25% sooner, bite 7 to 9, one more
  bite). Rogue: DASH (20% less breath, 15% further, the last-moment window +0.08 s), BACKSTAB (behind
  from further round, backstab +15%, ambush +25%), KNIVES (6% quicker, held blow +20% at full: the
  thrown dagger, lunge or bolt, held 15% sooner), SHADOW (+6% speed, shadowstep and relic 20% sooner,
  seen creeping 20% later). Mage: BLINK (20% sooner, 20% further, image +1.5 s), CHANNEL (primed
  1.5x to 1.75x, 15 breath back a turn, two primed spells), SPELLS (charge 12% faster, bursts 20%
  wider, +6% damage), BREATH (breath back 25% faster, blink 20% less breath, casts 6% quicker).
  Healer: GUARD (parry +0.04 s, block -25% breath, counter window +0.6 s), MERCY (heals +12%, heal
  reach +20%, the blow before the healing blow heals for half), SMITE (charge 12% faster, smite stun
  +0.4 s, full charge +15%), SANCTUARY (sanctuary and relic 20% sooner, blessing +25%, blessed ground
  and ward +1.5 s). Modest by test: no whole tree moves a share past a third.
- **One source.** Every knack number is read through `sim/knacks.ts` (parry window, counter window,
  release window, dodge reach and breath, last-moment window, behind angle, creeping sight, snare,
  hound, shield charge, war cry, blessing, ward, heal reach and size, burst, smite stun) or the gear
  stats (`sim/gearstats.ts`, which now caches the knack sum). The telegraph's white parry flash
  (`client/scene.ts`) now uses the same `parryWindow` the room judges (it left out gear's PARRY
  before), and a bow's white at full draw (`client/actors.ts`) shows exactly the clean-release window.
  `tests/knackfx.test.ts` runs each of the 60 steps through what the room does and checks it moves.
- **Reset, free, any time out of a fight**: RESET on the knacks screen (with a confirm), wherever it
  was opened from, while in town (`Game.knacksOpen`: mode town; the job's end is shown in town). Every
  knack comes back as a pick. Because of that, picks are taken on the knacks screen itself too, not
  only at the trainer (the trainer's pick rows stay). On a job the screen is a look only and says to
  take it back in Wickhold.
- **A pick you can't miss.** A pulsing gold dot with the count on PACK (any element with
  `data-picks`, set by `client/knackcues.ts`, so it moves with the button) and on KNACKS in the pack;
  "A knack to pick." and a PICK A KNACK button at the job's end; LEVEL N: A KNACK TO PICK once at the
  hero's feet back in town (under them, so the town banner can't cover it); the town banner says
  (A KNACK TO PICK). With picks waiting, the knacks screen opens with the two offers at the top, in
  full, each with TAKE.
- **Old heroes** (`fitPerks`): each old knack lands on the class step that moves the same number
  (a Warrior's guard, ironhide, counter, tough, scarred, fleet, heft, heavy hands, relic-wise; a
  Ranger's steady hand, footwork, fleet; a Rogue's shadowed, quick hands, fleet, relic-wise; a Mage's
  focus or footwork, deep charge, potent, endurance; a Healer's guard, ironhide, devotion, mender,
  relic-wise); anything else, or a second old knack on one step, comes back as a pick; and taken plus
  waiting is never less than the levels gained.
- **New words for the lore keeper and line editor**: every chain and knack name and line in
  `shared/perks.ts` and `shared/chains.ts`; the screen's words in `client/treewords.ts`.

## 2026-11-02: chat, world and near in town, the party on a job (Kyle; Claude Opus 5.5)

Kyle: "in-game chat, local and world (world logs down below for when you're in the world area, local
is just near you), but it needs to work on mobile and desktop."

- **Where it's heard.** WORLD: everyone in Wickhold, in the log. NEAR: only those within 8 tiles in
  the same place (`NEAR` in `client/chat.ts`), as a bubble over the speaker and in the log tagged
  NEAR. On a job with friends: the party, bubbles and log, tagged PARTY. Alone on a job, in the wood
  or the yard, and offline (the one-file build): no chat, and no CHAT button.
- **Carried on what's open.** Town lines ride the town's peer room (WICKHOLD1, `townfolk.ts`; its
  `onWord` is wrapped, so parties still get their words). Every listener decides for itself whether a
  NEAR line is close enough, from where the town says the speaker stands. The party talks in a peer
  room of its own, the job's room code plus CH (`partyRoom`, `client/chatnet.ts`), so coop.ts and the
  job's socket are untouched. Payloads are `{k:'chat', c, n, t}` or a quick line as its number `q`;
  well under the relay's 64 KB MAX_MSG. The relay is unchanged.
- **Safety** (`shared/chatrules.ts`, `shared/chatfilter.ts`): 120 characters of plain text, control,
  zero-width and direction characters stripped; one line per 1.5 s and five per 15 s, held by the
  sender (it says "Slow down a moment.") and dropped by listeners past a slightly looser pace (lines
  bunch in transit); a short filter that stars slurs and the very worst words in their common
  spellings, and leaves Wickhold's own swearing alone (voice.md); MUTE by tapping a name in the log,
  per device, by player id (`relic.mute`). Everything heard is cleaned again on arrival and only ever
  set as textContent.
- **Laptop.** Enter opens a box at the bottom left over the log; Enter says it, Esc shuts, Tab
  switches WORLD and NEAR, 1 to 8 in an empty box say a quick line. The log shows its last six lines,
  fading after 14 s, and all of it while the box is open. CHAT in the corner does the same.
- **Phone.** CHAT sits just under the corner row. In town it opens a panel at the top: the box first
  (so the keyboard doesn't cover it), the quick lines, then the log. Shut, the town shows the last two
  lines faint under the banner; tap them to open the panel. On a job it opens a strip of the eight
  quick lines and TYPE, at the top, away from the thumbs. A dot on CHAT says something new was said.
- The hero stands still while the box or panel is open (`chat.typing` joins the `still` intent in
  main.ts); the world goes on. The quick strip doesn't stop you.
- **Bubbles** (`client/bubbles.ts`) are page elements just after the canvas, so the HUD, banner and
  buttons stay over them, and each one moves aside or under the speaker's feet rather than sit under
  the banner, the HUD or a button.
- LEAVE in the corner now sizes to its word (it spilled into SND on phones and laptops).
- Tests: `tests/chat.test.ts` (filter, pace, cleaning, escaping, the wire). `scripts/chat-online.cjs`
  (two browsers, port 8795): world line heard; typing w, a, s, d never moves the hero; NEAR not heard
  from 14 tiles and heard as a bubble from 2.5; the phone's panel sends; mute holds; on a job the
  phone's quick line and the laptop's number key and typed line reach the other, as bubbles.
- New words, for the lore keeper and line editor: CHAT, WORLD, NEAR, PARTY, SAY, TYPE, X; "Say
  something"; "Slow down a moment."; "... is muted on this device. Tap the name to hear them again.";
  "... can be heard again."; quick lines Help me up! Follow me. Wait. Ready. Thanks. Over here!
  Going in. Behind you!
- Not yet: a typed line isn't spoken aloud or blipped; no chat history across reloads; the filter
  doesn't catch letters spaced out with spaces.

## 2026-11-02: the pack as a paper doll, the vault, Tobin's stall, the forge reworked (Claude Opus 5.5)

Kyle: "redesign how you can access your pack", "spend money to make your pack bigger in town", "clear
what items are on what body part", "easily see and compare items, sort of Castle of the Winds or
Diablo", "a somewhat ruined bank in town", "the forge is for upgrading existing weapons or melting
things down", augments "unavailable or blocked out", "a generic merchant who you can sell things to
and buy things back from for a limited time".

- **The PACK** (`client/pack.ts`, `cells.ts`, `itemicons.ts`): your hero's sprite with a square on
  each part: RELIC and SKILL over HAND and BODY, two RINGs, the three-potion BELT under; the pack
  beside it, one piece a square, its tier's colour on the border, a small pixel picture for what it
  is (blade, bow, staff, mail, ring) drawn in code. Tap a piece (or point at it with a mouse) and its
  card sits beside the card of what you wear in that slot, then every number the room uses, now and
  with it, and the change in green or red. WEAR / DROP (on a job; in town nothing drops, the card
  says where to sell or store it). The SKILL square is shown, not changed. Dragging still works.
  With the pack open the hero stands still (the world doesn't); gear changes still go through as
  intents. Relics found but not carried: CARRY buttons on the RELIC square's card.
- **Pack size** (`shared/bags.ts`): 8 to start, then 12, 16, 20, 24 for 100, 250, 500, 900 gold,
  sold by Tobin. The room checks the hero's own `bagSize`: a full pack can't take loot or a piece
  taken off, and the loot card says "Your pack is full. Drop something to make room." Treasure at a
  job's end that won't fit still sells for 20 as before.
- **The vault** (Keeper Edda, the counting house, west of the square above the infirmary): roof
  fallen in at one end since the siege, the vault under the floor. 16 shelves, then 24, 32, 40 for
  150, 400, 800 gold. Per hero, in the save (and so in the recovery code's copy). Hungry gear can't
  go in (it can't be dropped either).
- **Tobin the pawnbroker** (the far stall on Market Row, always there; Dessa's stall still waits on the
  council): buys any packed piece for `sellValue` (hungry gear never), and holds it for you to buy
  back at what he paid until you come home from your next job (`runs` moves on), the newest eight.
  Halvard no longer buys gear.
- **The forge**: Halvard's anvil is a panel of your worn and packed gear; tap one for UPGRADE (the
  existing `UPGRADE` gold and steel, tier caps) or MELT DOWN (packed only, `STEEL` by tier). His rack
  of Fine gear stays behind a button. Hungry gear: neither. Ivo isn't setting elements for now (one
  greyed button a relic, a line from him); what's already set keeps working; carrying a relic,
  rerolls and frost flasks stay.
- **Old saves** (`fitStores` in `client/save.ts`): an 8-cell pack (what it always held), an empty
  vault, nothing pawned. More than 8 pieces would size the pack up to fit, as far as 24, and the rest
  goes in the vault, however full. Nothing is deleted.
- New words are all in `client/storewords.ts` for the lore keeper and line editor; Edda, Tobin and the
  counting house are new and want lore review.

## 2026-11-02: going indoors on your own (Kyle; Claude Opus 5.5)

Kyle, after a job with friends: going into a house dragged everyone in with you. Now each player is
in whichever room they walked into, the street or a house off it, and goes in and out on their own.

- **Who's where** (`src/client/jobrooms.ts`): on a job the leader's game keeps the street (the job's
  room) and every house anyone's been in. Each hero lives in exactly one of them and is carried
  through a door as it is (health, potions, cooldowns, its clock moved on by `rebase`); a goblin or
  crate held overhead is put down first. The leader's own going in and out is the same move, so the
  old kept-aside outside hero is gone on a job (town buildings still work the old way).
- **Every occupied room runs.** Each tick the leader's game runs the street (always: fires burn,
  dens breed) and every house with a player in it, then its own. Kills in any of them pay. Friends'
  intents go to the room they're in. Friendly fire, HELP UP and the arrival grace need no change:
  each room only has the heroes in it. The grace on a fresh house goes to whoever goes in first.
- **Friends' doors are the leader's to decide**, the way all of the fight is: a friend walking up
  into a door goes in, out the bottom of a house comes out (`Game.friendDoors`, `doorPushed` uses
  the leader's own reach). Phones walk up into doors on a job, as the leader does (there's no ENTER
  button out on a job), so no new intent was needed.
- **Followers:** the goblins after whoever went through follow them, as before. "Big ones can't"
  is now a rule, not luck: only plain goblins (not brutes) and spiders fit through a door
  (`followers.ts small`). Before, an unnamed butcher close behind you could have come in.
- **Ambush:** it was never about the whole party; it comes when someone freed is brought out of a
  door (sim/survivors.ts, the room's door Rng). It still does, per door and per player: whoever
  walks out brings the freed within reach of them, and the street's next tick may bring goblins.
- **The way on** (`together`) waits for everyone: a player indoors on their feet (not gone quiet,
  not down) holds the party. A friend down in a house is carried along, as one down in the street is.
- **Bandwidth** (`coop.ts`): friends are grouped by the room they're in; each room has its own
  encoder and its own "last whole copy", and each group is sent only its room (to `*` when everyone's
  in one room, else to each id). A friend going through a door has a different room number
  (`Game.keyOf`) and gets the whole of the new one. Events are kept per room.
- **Over the door:** the street's patch carries `dm`, who's in each house (name and class). Anyone
  outside sees each name just above that door in the class's colour, under the quest mark's diamond
  (`doormarks.ts`), the leader too (drawn from `Game.doorMarks`). Indoors, nothing extra.
- **Handing the job on:** the whole-job save is now the street plus every house anyone has been in
  (`houses: [blockIndex, saveRoom][]`), not the leader's current room (which, if the leader was
  indoors, used to hand on the house as if it were the street). A friend who takes over stays where
  their hero was, indoors or out; the old leader's hero is let go from whichever room it's in. I
  chose every visited house rather than only occupied ones so dead goblins stay dead after a
  takeover; houses are small.
- **Tests:** `tests/split.test.ts` (7). Stress scenarios 15 to 21 (`scripts/stress/split.cjs`): a
  friend in alone (the leader sees the name over that door, the goblins in there hurt the friend on
  both screens), the leader in alone (the friend keeps walking about outside), leader and friend in
  two houses with a third outside seeing both names, a small goblin follows and a butcher doesn't, a
  friend frees someone and brings them out (counted on both screens), the leader leaves while a
  friend is indoors (the friend takes over, still inside, walks out and finishes), and the way on
  waits for the friend indoors. They set out on a village street through a test hook
  (`window.__villageJob`). The stress, town-online and party-online scripts take a port from
  `STRESS_PORT` / `ONLINE_PORT` so parallel worktrees don't collide.

## 2026-11-02: the friend who froze when a Florida friend led (Claude Opus 5.5)

Kyle played with two friends in Florida. When he led, every job worked; when a Florida friend led,
Kyle loaded in and froze (LEAVE still worked), his hero stood still on the leader's screen, and the
other two played on. Twice. The relay logs and the meter lines say why:

- **Two instances had the same name.** The relay named each instance with `Math.random()`, and
  Vercel starts instances from a snapshot whose Math.random runs the same numbers: the meter line
  (one per instance every 5 minutes) for "evqgzyea" came at 20:45:03 and again at 20:45:49, two
  instances with one name (n0eunt05 too). The "sfo1"/"iad1" in the logs is where a request came in,
  not a separate machine. Kyle's socket landed on one "evqgzyea", the leader's and the other
  friend's on the other; each took the other's messages for its own echo and dropped them. Kyle
  never heard "hosted" or a single patch; the leader never heard Kyle (the still hero was his town
  figure, brought along when the job started). When Kyle led, the instances happened to differ.
  Joining before the leader's claim wasn't the cause: the stress scenario passes that way once the
  names differ.
- **Fix:** each instance is named by Redis `INCR rl:inst` (a crypto suffix on top; crypto and the
  clock if Redis is down), and a connection's nonce is the instance's name and a count, so nothing
  hangs on Math.random (`api/_relay.ts`).
- **The count that kept messages home is gone as a judge.** Publishing only while another instance
  listened leaned on PUBLISH's count; a count that left someone out would keep messages from a friend
  who only listens (only a probe every 2 s got through). Now instances say so themselves
  (`api/_presence.ts`): `here` on a room's channel when one gets its first player there (sending
  everything for half a second meanwhile), an answer to any newcomer, `here` again after 15 s of
  saying nothing else, and `away` when its last player goes. Messages go out while another instance
  was heard in the last 40 s. A count above one can still open a room, never close it. On one
  instance that's one `here` per room every 15 s, fewer commands than the old probe every 2 s.
- **Also:** the relay listens to a socket from its first moment (what a player said while it was
  still being set up was dropped); a room's set is only taken down if it's still that room's set;
  a friend who hasn't heard the leader in 5 s reconnects (`coop.ts`, REJOIN), so a socket stuck on a
  deaf instance gets another go before anyone takes the job on. Backends moved to `api/_backends.ts`.
- **Tests:** `tests/relaybus.test.ts` (instances with the same Math.random, a friend in before the
  claim; a count that leaves out the other instance; a lone room publishes nothing). Both fail on
  the old relay. Stress scenario 14 (`scripts/stress/order.cjs`): a friend's socket there before the
  leader's claim, on the other instance, a third player with the leader. `scripts/online-server.ts`
  now makes its two relays with the same seeded Math.random, as Vercel does, and takes `inst` and
  `hold` on a socket's URL (pick the instance, hold the connection back); scenario 14 froze exactly
  as Kyle did (`info nohost`, never `hosted`) before the fix.

## 2026-11-02: quest marks, so you can see what the job is (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: on a mission it wasn't clear what the objective was, or which things
were objectives; smashing a larder was fun but nobody knew what a larder was. Now every thing the
room's goal is about has a small gold diamond bobbing over it, on the glow layer so it reads in the dark,
with a little gold light under it.

- **One list.** `src/sim/targets.ts` `targets(run, room, houses)` is the room's objective things right
  now: cages out here; the door of any house with someone caged or freed inside; where the freed are
  brought out (the way in, or a house's door from inside); a middle room's spider nests; and in the
  last room, by the job, the larder's racks, the dens, or the named butcher (hunts, the story, a deep
  dive). Chests and plain goblins never. The goal text counts racks, dens and the boss with the same
  helpers (`racksLeft`, `densLeft`, `bossOf`), so a mark never points at something that doesn't count.
- **The mark** (`src/client/questmarks.ts`): gold like the way on (`#ffd860`, dark edge), never the red
  of a telegraph; it goes the moment its thing is done. When none is on screen at all, a gold point
  at the screen's edge toward the nearest, sharing `edgeMark` with the marks for the freed left
  behind (`wayout.ts`). The cage's old yellow "!" is gone: the quest mark replaces it.
- **The banner says what it is**, in a few plain words: "Smash their food store, the larder (3 racks
  left)", "Burn out their huts, the dens (3 left)". New player-facing words: `LARDER_IS` and `DENS_ARE`
  in `sim/goal.ts`, waiting on the lore keeper and line editor.
- **Friends see the same marks.** A friend's game builds the list from what the leader already sends
  (the room, the run, the houses by door); nothing new on the wire.

## 2026-11-02: the party stress test, and what it broke (Kyle; Claude Opus 5.5)

Kyle played online with a friend and things came apart when he died: the relay logs show his page
stopped (hidden while he lay there), the friend asked to take the job on, the relay refused because
his page still pinged, and they ended up in two different jobs. `npm run test:stress`
(`scripts/stress-online.cjs`, helpers in `scripts/stress/`) now plays it out in real browsers against
the local relay (two instances, 120 ms of lag), fresh players each time: a friend leaving, the leader
leaving (with one friend and with two), the leader's page hidden 30 s, suspended outright, closed and
reloaded, a friend reloading and a friend gone over a minute, every way of falling in a party, and
leaving alone. A hidden page runs its timers once a second (as Chrome does); a suspended one runs
nothing till it thaws (timers, frames and the socket's news held, then all at once). It prints a JSON
report and fails on any failed step or page error. What it found, and the fixes:

- **A frozen leader came back to a second job.** A phone that suspends the leader's page outright: the
  friend takes the job on (right), but the leader's page, thawed, kept running its own copy. The relay
  had told it someone else hosts; only a page that had itself taken a job on listened. Now every
  leader does (`Game.stepDown`): told a friend leads, it closes its room and follows them.
- **A leader's reload left the friend stuck.** The reloaded page came back as a follower of nobody
  (its session says "I lead"), while the relay, seeing the same player, gave it the room; the friend's
  takeover was refused, it followed a leader running nothing, and the job was lost 35 s later. Now
  the leader keeps the whole-job save in the browser too (`session.ts keepJob`, every 2 s with the
  one sent to friends), and a reload leads again from it (`Game.resume`, `leadFrom`); if a friend
  already took over, the relay says so and it follows them.
- **Following a new leader read their changes without their room.** With three, the friend second in
  line could hear the new leader's patches before hearing they lead, then apply changes to an empty
  copy (one goblin of nineteen, then a crash). A follower now waits for a whole room after changing
  leader, and a new leader gets their own time before anyone thinks them gone too.
- **A leader who left stood in the way.** Taking a job on from a leader who pressed LEAVE kept their
  hero standing where it was for a minute, and the way on takes the whole party. Now their hero goes
  (`CoopGuest.left`). And a friend not heard from in 5 s (a closed tab, a locked phone) no longer
  holds up the way on (`CoopHost.away`); their hero still comes along to the next room, in case
  they're back.
- **A friend away over a minute came back to nothing.** The leader lets their hero go after a minute;
  back, the friend's page had no hero to draw and stopped with an error every frame. Now it keeps
  drawing its hero where it was and says hello every 2 s till the leader brings it back.

Fine as they were: a friend's LEAVE, the hidden leader's room running on (nobody takes over), the
closed tab taken on, a friend's reload, getting each other up (G, and HELP UP on a phone), getting
yourself up once, out, the way on without the down and out, everyone out, and LEAVE alone (half the
gold). No new player-facing words.

## 2026-11-01: three kits for every class, and the belt turns on a long press (Kyle; Opus 5.5)

Kyle: other weapon types for all the classes (fun without needing many upgrades), and a long press on
the potion button to switch between them. The Rogue and the Cleric had one kit each; now three, with
the class rules kept (a Rogue dashes and never blocks; a Cleric guards, never dodges, heals on a blow,
and carries the censer's coal whatever is in hand). Numbers in `shared/kits.ts`.

- **Rapier** (Rogue): three thrusts at 1.85 to 2 tiles (9, 9, 13), each finding one goblin; 0.8 head
  on and 1.8 from behind (daggers 0.5 and 2.5), so it's the honest one. Held (0.7 s): a 2.6 tile
  lunge, 16 to 36, through at most two in a line (`Swing.hits`). Dash a little shorter (3.8).
- **Hand crossbow** (Rogue): a knife (two stabs and a slash, 8, 8, 12; 0.55 head on, 2.2 behind). Held
  (0.45 s, walk at 0.8 while aiming): a light bolt, 12 to 22, that dazes a small goblin 0.6 s (never a
  butcher), so the knife goes in at full. Keeps the long dash.
- **Sword and censer** (Cleric): two cuts (11, 11), then the censer comes round in a 170 degree arc,
  heals the party 8 and sets goblins burning (`Swing.burn`). The best Cleric guard (12% through, 0.34 s
  parry, 165 degrees). Held (1.1 s): the censer whirled all round, 16 to 36, burning, healing 8 again.
- **Flail** (Cleric): two slow sweeps (200 and 220 degrees, 16 and 20) that come over a shield-bearer's
  board (`overShield`); the second heals 9. Held (1 s): brought down overhead and a smite cracks out
  up to 1.7 tiles ahead, 1.7 wide, 26 to 60, stuns a second. Kills burst, like the mace (`blunt`).
- **Getting them**: as before. `CLASS_KITS` feeds treasure and drops (`rollGear`), Halvard's and
  Dessa's stalls list every kit of your class, traits fit (`traitsFor`). The first kit stays the
  plain one in hand. To switch: the pack, as before, and tapping the hand now shows SWAP TO for each
  kit of your class you carry.
- **The belt turns** (`client/potionpress.ts`, `sim/pack.ts turnBelt`): a tap of the potion button
  (or Q) drinks as before, now on release; held 0.4 s it turns the belt instead (the next kind comes to
  the front, its name pops up, nothing drunk) and keeps turning every 0.45 s while held. Laptop: hold Q.
  It goes to the room as its own press counter (`Intent.beltSeq`, optional so an older guest still
  reads), so two turns in one tick both count and a guest's work the same.
- **Drawn** in `client/heldkits.ts`: a thin rapier with a gilt hilt; the knife in hand and the hand
  crossbow at the off hand, up to the eye on a hold; the sword with the censer at the off hand, the
  censer on its chain throwing coals when it's swung or whirled; the flail's head hanging at rest,
  spinning overhead with light gathering on a hold. Each has its own swing and hit sounds.

## 2026-11-01: the back of the pack: hexers and drummers, and a tougher mix for a bigger party (Kyle; Opus 5.5)

Kyle: enemies harder with more people, and variety (small ones, spears, big ones, ranged, casters,
buffers). Two new small goblins, each with one counter; numbers in `shared/backline.ts`.

- **The hexer** (`sim/backline.ts`): staff with a skull fetish, bone horns. Keeps 4 to 7 tiles off
  (runs when you close, comes in when you're far) and calls the ground up under you: a red circle with
  a striped edge (nothing blocks it) put down where you stood, 1.15 tiles across the radius, that
  bursts after 1.25 s for 16. The circle is the one judged (`attackCovers`), and it stays put. Counter:
  step out or roll; any blow on the hexer breaks the spell (it flinches like any small goblin); 20
  health. Goblins standing in the burst take 0.8 of it. A roll through it doesn't stagger the hexer
  (it's far off). The fetish glows green and lights the hexer through the wind-up; the staff rises.
- **The drummer**: a drum slung at the hip, a bone stick. Hangs about two tiles behind its pack and,
  while it stands and beats, every other goblin on its level within 4.5 tiles is roused: wind-ups at
  0.8 of the time, 1.2 times the pace, 1.2 times the damage (locked into the attack when the wind-up
  starts, so the telegraph never lies). It runs from anyone within 3.5 tiles and the drum stops while
  it runs; it pokes with the stick if cornered; 24 health. Dead, stunned, frozen or netted, the drum
  stops on the next tick (`rouse`, once a tick before anyone moves). You see a faint ring at its reach,
  a ripple out to it on every beat (0.5 s) and a pulse under every roused goblin; you hear the beat,
  louder the closer you are. Counter: kill it first, or rush it so it runs.
- **In jobs** (`shared/roster.ts`, on its own seeded stream so room layouts are unchanged): each small
  goblin with a blade rolls 2% + 4% a room in + 1.5% a point of ruin (+2.5% long job, +2.5% deep) to
  be one. At most 1 in a first room, 2 in the next two, 3 after; always two blades left, and a drummer
  only with three to drum for. Over 200 days of boards: a first room has one about one time in six on
  an easy short job, about half the time on the worst long ones; nearly every fourth or fifth room of
  a long job has one, often two or three. The wood is untouched.
- **A bigger party** (`toughen`, from `scaleFoes`): the count scaling stays. A pair gets no more
  hexers or drummers than the room had (copies of them come plain). Three or more: each plain extra
  goblin has 15% a player past two to come tougher (lunger 3, shield 2, brute 2, hexer 1, drummer 1 by
  weight), with at most one more of the back of the pack than the room had. Run rooms and door
  ambushes are seeded, so a party sees the same goblins.
- **Cost**: the circle telegraphs (slam too) are now drawn in row runs instead of pixel by pixel. A
  yard fight with two hexers and a drummer runs about half a millisecond a frame over the same fight
  with plain goblins on the phone profile (4.0 to 4.6 against 3.6 to 4.0 ms, noisy).
- No new player-facing lines; the kinds are never named on screen.

## 2026-11-01: the sprites posed in parts, and a charge that reads through the weapon (Claude Opus 5.5)

Kyle on the 2x figures: doughy and soft, and the idle bob jumped. He picked the middle way: the same 1x
sprites, posed part by part. And on holding attack: it stretched the character instead of focusing on
the weapon; a charge should draw in, a release knock back a little, and neither touch the face.

- **Cut, not redrawn** (`client/joints.ts`): each sprite's own canvas (same pixels, same one-pixel
  outline and shading) is split by region into the off arm, the legs (left and right), the body, the
  head and the weapon arm. Every pixel goes to one part, so a body at rest is exactly today's sprite
  (a test holds it); a body with nothing moved is still drawn whole, in one call.
- **Posed a whole pixel at a time** (`client/figure.ts`): lean moves the head and the body half as
  much; a crouch lowers the body onto the legs (rising, the legs grow a pixel at most); the weapon arm
  reaches along the blow (`reach`) and lifts (`raise`); the whole shifts for a lunge or a recoil;
  afterimages and flashes as before, flashes part by part. Weapons are drawn at the weapon hand.
- **Heroes, charge and release** (`client/heropose.ts`, `held.ts`): no lean, crouch or stretch while
  winding up or charging, so the head never moves. The weapon arm draws back and the weapon comes up;
  a blade at full shivers in the hand; the charge's motes gather at the hand. Casters: light draws in
  to the wand, staff or rod tip, faster and whiter as it fills, and the tapped spell's half-second cast
  raises the casting arm the same way. Release: the arm snaps through and the body is knocked back one
  or two pixels against the blow or shot; the sword's edge and the shield flash; casters flash at the
  tip. The Rogue's thrown dagger is drawn back over the shoulder and the arm snaps forward on the throw.
- **Goblins and the butcher** (`client/foepose.ts`): lunges reach with the arm instead of stretching;
  the butcher's cleaver goes up as it comes back for the cleave and over his head for the slam; the
  brute lifts its club.
- **No idle breathing.** Standing still is still; walking keeps its one-pixel bob.
- **Cost**: within noise of main (yard fight, three runs each: phone 5.1 against 4.9 ms a frame,
  laptop 4.2 against 4.2; town about the same).

## 2026-11-01: anticipation and payoff in the bodies (Claude Opus 5.5)

Kyle loved the world effects on big blows (the charged magic burst, the butcher's slam) and asked for
the same in the bodies: poses before a blow, a payoff when it lands, better reactions to hits. Drawing
only; the room is untouched and every pose is read from state it already has (act, actT, the swing's
windup/active/recover, the charge, hitstop, the knockback slide, hitAt).

- **Pose data, not pictures** (`client/motion.ts`): every number in one table, by phase (windup,
  charge, release, contact, recover, hit, stagger, land, stun, tumble). A pose is lean (the top of the
  body, in pixels), crouch (negative rises tall), stretch along a direction, a whole-body shift, a
  lift off the ground, a flash and its tint, and an afterimage. Today one sprite is bent by it
  (`draw.ts` `blitPose`: whole-pixel stretch with the feet fixed, the top third shifted by the lean and
  the middle by half); the jointed 2x sprites coming next can read the same pose per part.
- **Heroes** (`client/heropose.ts`): pulled back and dipped in a wind-up (a quick one gets its share);
  crouching deeper and leaning back as a heavy charges, a shiver at full; the release snaps out (a
  step in, stretched along the blow, an afterimage where the body was) and holds through the hitstop,
  where the swing's trail turns white across the whole arc the room judges; shots kick back instead
  (the staff's orb hardest). Hit: white through the hitstop, then a fading red, snapped along the
  push. Heavy armor that doesn't stagger still flashes and flinches (a drop in health says it landed).
  A squash on landing a roll, jump, dash or slam.
- **Goblins and the butcher** (`client/foepose.ts`): wind-ups rear back and coil, scaled to how long
  they are; the lunger coils low and shivers; the butcher rises tall hauling the cleaver back then
  coils before the chop, crouches before his leap, stretches in the air, lands flattened and rises
  again; the Stoker coils and paws before his run. Hit: a white flash and a snap back along the push;
  small goblins hit hard go head over heels once with a hop; the butcher staggers back on his heels;
  the stunned sway.
- **The view** jolts along a blow that hits you and nudges along your heavy as it connects
  (`camKick`, added to the shake in `scene.ts`).
- **Dust** (`client/dust.ts`): puffs at the feet when a roll ends, a heavy steps out of its charge, a
  body turns sharply at speed, a slide from a blow stops, the butcher pushes off, the Stoker sets off.
- **A fix found on the way:** goblins' hit flash, their health ring after a hit, the dummies' wobble
  and the parry glint compared the wall clock to room time, so they almost never showed. Drawing now
  has the room's time (`Ctx.t`) for anything the room stamped.
## 2026-11-01: the music, played on recorded instruments (Opus 5.5)

Kyle: "the music can be more high def and interesting ... almost biblical or epic, with more gentle
themes for dark woods or town." He chose real recorded instruments, a small bundled set, free licence,
and new pieces for each place.

- **The instruments** (`public/music/`, 86 mono MP3s, 2.2 MB, credits in `public/music/CREDITS.txt`):
  VSCO 2 Community Edition (CC0) for the string sections soft and strong, solo double bass, pizzicato,
  short bowed cellos, horn, tuba, harp, flute, timpani, bass drum, glockenspiel and gong; the
  Versilian Community Sample Library (CC0) for the pipe organ, tubular bells and frame drums; and the
  FluidR3 soundfont's Choir Aahs and Voice Oohs (Frank Wen, CC BY 3.0, via midi-js-soundfonts) for
  the choir, the one set that asks for credit. A few notes per instrument (every 5 to 7 semitones,
  pitch-shifted between); held sounds loop. `scripts/make-samples.py` remakes them all from the three
  libraries: trimmed, levelled to one loudness, swells evened out, loops crossfaded where the wave
  matches, a tail past each loop so a browser's MP3 delay can't click; `src/client/samplemap.ts` is
  its output. MP3 because every browser decodes it (Safari and Playwright's Chromium included).
- **Playing them** (`sampler.ts`, `orchestra.ts`): fetched from our own site once sound is unlocked,
  four at a time, the most used first; nearest note, playbackRate, attack and release. An instrument
  plays recorded only when all its notes have loaded; until then (or if any fail) the old synthesized
  instrument stands in, so the music never goes silent. Strings switch to the strong recording at
  velocity 0.75 and up.
- **The pieces** (`score.ts`, `scores-home.ts`, `scores-wild.ts`, `scores-boss.ts`, played by
  `track.ts`): all 30 rewritten, keeping their names (the bard lists them). Each has a written
  8-bar theme over chords that mostly hold two bars, and parts with roles (bass, chord voiced to move
  smoothly, a picked pattern, the theme, an answer or a made-up line, drums, bells). A form of
  sections (opening, theme, theme in other voices, answer, quiet) loops with seeded chance: sections
  swap, long notes get a turn, timing breathes. Town warm (harp, strings, flute), houses small (harp,
  pizzicato, flute), church organ and voices, yard horn and frame drum, villages and farms sad, fields
  and woods a low string drone and one lonely voice, mines tuba, voices and dripping glockenspiel;
  bosses choir, horn and tuba, timpani and driving cellos.
- **The fight layer** is timpani on the strong beats, a bass drum on the one and cellos driving
  eighths on the chord; it comes in lower (0.35) over pieces that have their own timpani. The boss
  sting is a bass drum, timpani, gong, low horn and tuba. A gentle compressor (with its makeup gain
  taken back off) keeps a boss from clipping; overall loudness matches the old music, a boss about
  4 dB above town.
- **The one-file build** carries the recordings inside the page (`samplesrc.solo.ts` swapped in by
  `vite.solo.config.ts`; the page is 3.3 MB of the 16 MB cap), so it sounds the same with no server.
- **Listening**: `node scripts/listen.cjs <dir>` renders a few pieces offline in Chromium to MP3 and
  prints their loudness (`window.__renderMusic`, loaded only when called).

## 2026-11-01: recovery codes (Claude Opus 5.5)

Kyle: friends he sends the link to (no accounts, no login) should be able to get their heroes back on
another device with a short code they can remember.

- **The code** (`shared/recovery.ts`): two words and a number, KILN FERN 47. The first word from 128
  made things and places, the second from 128 things that grow, live or blow through the valley; the
  number 10 to 99 (about 1.5 million codes). Every word is two letters or more from every other (a test
  holds it), so a one-letter slip is read as the word meant and is never someone else's code. Typed in
  any case, with spaces, dashes or nothing between.
- **The keeper** (`api/save.ts`, `api/_save.ts`): one Redis hash per code, `relic:save:<code>` (save,
  token, time), one Lua command per make, pull or push, a year's keeping refreshed on each. Making
  takes an unused code (only if it doesn't exist) and gives back a random token; pushing needs the
  token, and is refused (409) if another device pushed since the copy this one last saw, so a page left
  open elsewhere can't write over newer play. Pulling gives the token too, so the new device can push.
  Over 256 KB is refused. A code gone missing (a year unused, or the store emptied) is made again by
  the next device that pushes it. No rate limit yet.
- **This browser** (`client/recovery.ts`): the code, token, last-seen server time and an unsent flag in
  localStorage. Every `store()` now stamps `savedAt` (it only goes forward) and tells recovery, which
  pushes 20 s after the last change (at most 2 minutes after the first) and at once on pagehide or
  hidden (keepalive). On start it pulls: if another device pushed since, that copy replaces this one,
  but only while the start screen is up; if both changed, the newer `savedAt` wins.
- **The way in** (`client/recoveryui.ts`): RECOVERY CODE on the start screen (heroes and class pick).
  It shows your code (made the first time, once you have a hero) and USE A CODE, which says how many
  heroes the code holds, by name, and asks before they replace this device's. Lines in `copy.ts`
  (RECOVER), waiting on the lore keeper and line editor.
- **Where it's on:** everywhere but the one-file build, which has no server: `vite.solo.config.ts`
  defines `VITE_SOLO` and the panel compiles out. Not tied to `VITE_ONLINE`, so recovery doesn't depend
  on co-op being switched on.

## 2026-11-01: the wood, slower and clearer (Claude Opus 5.5)

Kyle, after playing: goblins didn't always come at you; Hew's words were hard to read under threat. He
asked for a pause with praise when you do it right, the control shown for your device, slower and more
readable blows (even a freeze on the flash), and an opening where you lie still while the screen fades in
and Hew walks over, checks you and pulls you up.

- **The opening** (`WAKE` in `sim/wood.ts`): you lie still (no input) as the screen fades up over 2.5 s;
  Hew walks over slowly, says three lines, hauls you up at 11 s. Then a MOVE card; walking a few steps
  starts the first lesson.
- **Holds** (`WoodState.hold`, applied by `Game.holding`): the world stops for a lesson card (Hew's
  line, the move, its control for this device, what it's for; GOT IT, Enter or any action key), for a
  freeze-frame on the first two blows of each lesson just before they land ("NOW: ROLL OUT", "IT FLASHES
  WHITE: NOW", the key; it waits for that move, which then goes through as the world restarts), and for
  about a second of praise when you get it right (first three per lesson). On a phone the button to
  press pulses.
- **Pacing:** every goblin in the wood but the Stoker is drilled: wind-ups half again as long, and only
  the nearest one comes at you (the rest hang back); the one coming is kept coming.
- Laptops: a parry needs you facing the blow, so aim at the goblin with the mouse (phones turn you).

## 2026-11-01: the prologue, the wood in Greyhollow (Claude Opus 5.5)

Kyle: a tutorial before town; woken and saved by an old man after a battle, taught attack, then dodge,
then block, then parry in different areas with different goblins; he's killed in a cutscene by a mini
boss you then kill for your first relic. Plan: the Claude Doc "Relic: The Prologue"; story and lines
from the lore keeper (Hew, the Greyhollow column, the Stoker, the tally stick).

- **The wood** (`shared/wood.ts`): one hand-laid 64 by 40 map, five areas walled by trees, joined by
  ways a fallen log closes until the lesson before it is done; then the road west to Wickhold.
- **The running order** (`sim/wood.ts`, stepped after the room by the game): each area's goblins come
  out when you walk in, its count (dodges, blocks, parries) and its goblins gate the way on, Hew walks
  ahead and says his line, falls are picked up (Hew hauls you up; at the Stoker the fight restarts),
  goblins killed before the lesson took come again.
- **Locked moves:** the game passes only what's been taught (attack; then roll; then block; then
  everything but the skill; the skill at the hut). Phone buttons appear as they're taught.
- **New goblins** (`VARIANTS` in tuning.ts): looters (weak, slow, look up only when you're close),
  lungers (a striped stab from three tiles), the heavy (a blow that breaks any guard: parry it) and
  the Stoker (rake sweep, kiln drop, and the draw: a striped line; caught, you're hauled to its feet).
- **The cutscene:** about ten seconds, bars, input off, the camera eased between you and it; Hew is
  hooked, dragged, gives you the stick and dies behind the cordwood. Skippable once seen.
- **Leaving:** the javelin (first relic; deep jobs now give the hook first), Hew's tally stick for Odric,
  and for a Healer a cold censer (no heals given) until Mother Isolde relights it. Orla greets you at
  the gate. Heroes made before today skip it; a second hero can BEGIN IN WICKHOLD; WOOD on the start
  screen replays it with no rewards. Test links (`?hero=`) skip it unless `&wood=1`.

## 2026-11-01: loot slice 6, hungry gear and the Want (Claude Opus 5.5)

- **Ten hungry pieces** (`shared/hungry.ts`, wired in `sim/hungry.ts`), names and costs from the lore
  keeper: Skarn's Cleaver, the Larder Pike, Spendthrift, Mother Rust's Needles, the Jealous Rod, the
  Keeping Mace, the Butcher's Apron, the Ransom Coat, Someone's Wedding Ring, the Tooth Ring. Each has
  three very large modifiers, a gift and a cost, both shown on the card (green and red). Named butchers
  favour their own piece (Skarn, Mother Rust); no other source drops those two.
- **Where they come from:** 5% of a named butcher's drops and 3% of chest rolls (before danger shifts).
- **Rules:** can't be dropped, melted, traded or upgraded; Someone's Wedding Ring can't come off; all of
  it can only be left on the church step (Odric: "Leave it on the step. I'll see to it.").
- **Gold in a fight:** heroes carry a purse (home gold plus the job's) so Spendthrift and the Ransom
  Coat can spend it; spending takes from the job's gold first.
- **The Want** (`Profile.want`, hidden): +5 per hungry piece worn at a job's end (+15 for the Wedding
  Ring), +0.2 a kill made in hungry gear; -0.1 per gold given at the Lantern, -30 per piece given up.
  It shows sideways: from 15 the hero's eyes glint red in the dark, brighter as it grows; from 30 Agne
  remarks and Gannet pours short. Nobody turns yet; the threshold and turning are for Kyle to decide.

## 2026-11-01: loot slice 5, upgrades (Claude Opus 5.5)

- **Halvard's anvil** (THE ANVIL in his panel): melt packed gear for steel (white 1, green 3, blue 8,
  purple 20; never hungry) and raise a piece a level for gold and steel (+1 30 and 2, +2 60 and 5, +3
  120 and 10, +4 200 and 20, +5 320 and 35), capped by tier (white +2 to purple +5). A level grows its
  modifiers by a sixth and adds 3% weapon damage, 1% less taken on armor, or 2 health on a ring.
- **Ivo** rerolls one modifier on a worn green, blue or purple piece for 40 gold, into another the
  slot can roll, at the same tier.
- Upgrading replaces the piece wherever it is (profile and hero), so the stats cache stays true.

## 2026-11-01: loot slice 3, chests (Claude Opus 5.5)

- **Chests** (`sim/chests.ts`, placed by `planRoom`): 40% of rooms have one, the last room always, and a
  deep job's last room adds a chained chest by the named butcher that opens only once it's dead.
- **Opening:** USE beside it (F on a laptop; a small OPEN button on a phone, out of the way of the fight
  buttons). It takes 1.2 s; walk off, get hurt or go down and it shuts again. Every player in the room
  is rolled for at the start, so the seam light is the true colour of the opener's best piece. Hungry
  light pulses, a heartbeat plays, and goblins within 6 tiles notice.
- **What's inside:** one or two pieces per player (two in a chained chest, one tier up), weapons,
  armor or rings by chest odds, shifted a tier up in places of ruin 3 and on deep jobs; sometimes gold
  and a potion for anyone. Each player's pieces are theirs alone: only they see them, only they can
  take them (`Drop.owner`).

## 2026-11-01: loot slices 2 and 4, tiers, modifiers, armor, rings, the item card (Claude Opus 5.5)

- **Item** (`shared/loot.ts`) gains slot (weapon, armor, ring), tier (plain, fine, forged, tolmouth,
  hungry), modifiers and a level. `shared/gear.ts` has the tiers, the 14 modifiers with their bands,
  rolling by tier, tier odds by source, caps, armor weights and `gearStats`, the one sum the room and
  the card both read (`sim/gearstats.ts` caches it per hero).
- **Where modifiers act:** swing damage, wind-up and recovery, reach and knock (`currentSwing`); time to
  full charge; parry window; chip and breath through a block; damage taken; walking speed; dodge
  cooldown, distance and cost; skill and relic recharge; breath recovery; healing given; health.
  BREATH speeds recovery only (maximum breath stays 100, which half the game assumes).
- **Armor:** light (as before), medium (5% slower, 12% less taken), heavy (12% slower, 25% less taken,
  a 25% shorter dodge costing 30% more breath, no stagger from small goblins). Warriors start in
  plain plate, Healers in a mail shirt, the rest in leathers. Two rings; a third pushes out the older.
- **Drops:** goblins drop by tier (small: white or green; butchers green up, sometimes armor or a ring;
  named blue up). Weapons are any type of the nearest player's class. Halvard sells Fine weapons and
  armor; Dessa Forged weapons and rings (her line no longer says Tolmouth).
- **The card** (`client/card.ts`): tier chip, name, how a different weapon type fights, modifiers and
  traits in words, then every number that would change against what you wear, better or worse. The
  pack shows worn gear, spares with their comparisons, and AS YOU STAND, the hero sheet.
- Old saves: weapons with a trait become Tolmouth; heroes get their class's plain armor.

## 2026-11-01: loot slice 1, gold and potions (Claude Opus 5.5)

Kyle said continue on the loot plan. Defaults taken for the open questions (Kyle can overrule): the old
"no stat sheets" rule goes; any class wears any armor; the Want is built hidden and nobody turns yet;
Dessa keeps her line until the Tolmouth tier lands; a lost job keeps half its gold.

- **Gold on the floor** (`sim/pickups.ts`, `COINS` in `shared/potions.ts`): job goblins drop coins
  (small 70%, 2 to 6; archers 3 to 8; butchers always 15 to 30; named 60 to 100). Walking over it
  splits it evenly across the party, the picker keeping the odd coin. Gold no longer comes straight
  from kills; experience still does. Training-yard goblins drop nothing.
- **Potions** (`sim/flasks.ts`): a belt of three, Q or the POTION button uses the front one, a press in
  the 0.8 s cooldown waits. Sister's Bitter (40 health over 2 s), Wall Brandy (full breath, faster
  for 6 s), Lamp Oil (thrown, fire burst), Frost Flask (thrown, frost burst), Smoke (thrown; goblins
  can't see anyone in it unless within 1.2 tiles). Flasks fly where you aim, or to the nearest goblin
  in range on a phone. Goblins drop them (8% to 35%, named always); Agne sells Bitter, Gannet Brandy and
  Oil, Moll Smoke, Ivo Frost. New heroes start with one Bitter. The pack reorders and pours out.

## 2026-11-01: weapons rarer now; the loot and gear plan (Claude Opus 5.5)

Kyle: weapon drops too high; gold (shared in a party), potions, chests that open with a pause and a
colour by tier; white to purple tiers with modifiers on base stats; armor and rings; upgrades; a way
to see how gear changes attacks and stats; top-tier gear with real drawbacks, "since it's greed".

- **Landed now:** a small goblin drops a weapon 4% of the time (was 35%), a butcher 40% (was always).
- **The plan** is the Claude Doc "Relic: Loot and Gear" (https://claude.ai/artifact/BSET3vmRQ6Dn2BJqr3dVdW):
  tiers Plain (white), Fine (green), Forged (blue), Tolmouth (purple), Hungry (goblin-eye red); weapon
  type = how you attack, modifiers = how well; 13 modifiers with bands by tier; light, medium and heavy
  armor; two rings; a three-potion belt; chests held open 1.2 s with tier light leaking out; Halvard
  levels with gold and steel; ten hungry items with gifts and drawbacks; the Want as a hidden number.
- **Names from the lore keeper:** Tolmouth (pre-war steel nobody makes now), Hungry (the town's word for
  goblins), steel (not "scrap", which clashes with scrappers), Sister's Bitter, Wall Brandy, Lamp Oil.
- **Overrules** the loot code's old "no stat sheets, at most two traits" rule once Kyle agrees (open
  question in the doc). Build order in the doc: gold and potions, weapon tiers and the item card, chests,
  armor and rings, upgrades, hungry gear and the Want.

## 2026-11-01: the Healer's coals (Claude Opus 5.5)

Kyle kept the censer's Lantern coal: "the more they collect the more they heal allies but the more
goblins might seek them out in battle."

- **Coals** (`src/sim/lantern.ts`, `LANTERN` in `shared/magic.ts`): every butcher that dies leaves a
  live coal on the floor for 25 s. A Healer who walks over it feeds the censer, up to 12, kept for
  life (saved on the hero). Nobody else can take one.
- **Each coal:** every heal the Healer gives (Sanctuary's ground, every third mace blow) is 8%
  stronger, nearly double at 12. Goblins judge the Healer 0.35 tiles nearer when picking whom to go
  for (4.2 at 12, so a full censer pulls them past a nearer friend) and notice them 0.25 tiles
  further off.
- **Seen and heard:** the coal on the floor pulses and sheds sparks; the censer's light grows with
  each one; "CENSER FED" and a warm two-note chime on pickup; COALS n / 12 in the pack; a line on
  the Healer's class page; Isolde and Odric each have a line for a Healer.
- **Words from the lore keeper:** "coal", not "ember" (EMBERFORGED is a fire trait already). Code
  says coal too.

## 2026-11-01: the pack, a shorter class pick, one weapon to start (Claude Opus 5.5)

Kyle: start with a weapon type and don't say what the smith has; an inventory for each hero, open any
time without pausing, to equip items and relics; too much text on the class pick (general info first,
tap in for stats); copy through the lore keeper, simpler UI.

- **The pack** (`src/sim/pack.ts`, `src/client/pack.ts`). Each hero has what's in hand, their skill,
  the relic carried, the relics they've won, and up to 8 spare weapons. PACK in the top bar, or I
  (Tab) on a laptop. The world doesn't pause. Changes go to the room as an intent (`gearSeq`,
  `gearOp`, `gearArg`) so a friend's pack works the same online. A change pressed mid-swing waits
  for free hands rather than being lost.
- **One weapon to start.** Every class starts with its first weapon type. Other types of your class
  come as loot (half of drops are the type in hand, half another of your class) or from Halvard, who
  now sells each type into your pack. Taking a drop puts it in the pack; nothing swaps on its own. The
  smith no longer changes kits. The plain starting weapon is always there to go back to.
- **The class pick:** five rows (face, class, one line). Tap one: a one-line pitch, five ratings out
  of five (POWER, GUARD, SPEED, RANGE, SUPPORT, hand-judged from tuning.ts and kept in
  `shared/classes.ts`), weapon, skill, what it can't do, name, begin.
- **Copy** rewritten with the lore keeper (`src/client/copy.ts` and `shared/classes.ts`): "deep job"
  everywhere players see it, never "deep dive"; stamina is "breath"; goblins aren't careless or
  brave, they're patient. Old saves: the weapon in hand stays, other weapons go in the pack.

## 2026-11-01: simpler classes; relics only from deep dives (Claude Opus 5.5)

Kyle: rewrite and simplify what each class has or doesn't; nobody starts with relics, they're found at
the end of deeper dungeon dives.

- **One sheet per class** (`src/shared/classes.ts`, shown on the start screen): weapon, guard, dodge,
  one skill, what only that class does, what it can't do. That file is the source for the copy.
- **One skill each, on the SKILL button (E):** Warrior War Cry, Ranger Hunter's Net, Rogue Shadowstep,
  Mage Lodestone, Healer **Sanctuary** (the blessed ground and the ward in one cast: ground at your
  feet or where you point, and a ward on whoever is most hurt). Two Healer buttons became one, which
  keeps the Healer good alone without a menu.
- **No relics to start.** The javelin and the grappling hook come out of the named butcher at the
  bottom of a **deep dive**: one job on the board each day, five rooms, ruin 3, a hunt, 180 gold. The
  first win gives the javelin, the next the hook; a new one is carried at once. Carry one at a time
  (RELIC button, R); change which at Ivo the relic-wright. Lore fit: the bible already says relics are
  pried out of butchers who ate slivers.
- **The relic wheel is gone** (hold-and-slide, 1 2 3). Two buttons, two keys, nothing to pick
  mid-fight.
- **Elements** fit to the skill or to a found relic; a Mage's spells take the element of what's
  readied. RELIC-WISE now speeds both.
- Old saves: heroes keep their class and level; their relic list starts empty (nothing was "found").

## 2026-11-01: bigger rooms, goblins at rest, archers that run, loot that does what it says (Claude Opus 5.5)

Kyle (after playing as a Mage): each area bigger before moving on; loot that didn't do what it said;
archers he couldn't hit that didn't run when he got close; starting rooms should be more small goblins
that don't all rush you until startled, and bigger ones deeper in.

- **Loot that does what it says.** The bug: a drop rolled for any kit of your class, and taking it
  quietly swapped the kit in your hand (the wand for the staff) for that room only; next room you were
  back on your own kit and the new weapon's trait sat on a kit you weren't using. Now drops and the
  smith's wares are always for the weapon in hand, and taking one never changes your kit (the smith
  does that). The loot card says so for anything else.
- **Shots fly over ledges.** Ledges were walls to anything without a level, including arrows, spells
  and javelins, so a shot from the ground at an archer up top stopped at the ledge's face. Only bodies
  (heroes, goblins, props) are stopped by ledges now.
- **Archers run** when you get close on their own level (up on the ledge too, along it), sidestepping
  as they go so they don't back into a corner, and keep their distance at 4.5 tiles.
- **Rooms are 28 by 24** (were 18 by 16), with more furniture to match. The camera follows.
- **Goblins at rest** (`ALERT`): run goblins start in bands around their fires, milling about. One
  notices you in front of it within 6.5 tiles (2.5 from behind), when a goblin near it is hit or
  killed, or when it's hurt; it cackles, a "!" goes up, and its band (within 5.5) wakes with it. The
  rest of the room keeps resting. Sneaking up from behind is now a real choice (and a Rogue's dream).
- **Who's where:** the first room of a job is only small goblins (5 or more, more where it's worse);
  butchers start in the second room where it's Occupied or worse, and the last room adds another.

## 2026-11-01: automated tests, the shared world and the Roll of the Brave, a living Wickhold (Claude Opus 5.5)

Kyle: automated tests running on this; small groups or individuals impact the world and see a
leaderboard of quests done and people saved; a story individuals shape through action and voting
that changes the world, the quests and the town around them; a town that feels alive (guards on
patrol, more areas, some locked for now, more objects); a trainer for each class somewhere you have
to find; gambling with the rogues at a tavern with a sewer nearby; more to do in the central area;
no fighting in town but movement abilities still work.

- **CI** (`.github/workflows/ci.yml`): every push and pull request runs the type check, every test
  (the relay against a real `redis-server`), the build, and `npm run smoke`: real Chromium on a
  phone-sized and a laptop-sized page makes a hero on the start screen, goes into the forge, takes a
  job and wins its first room, failing on any page error.
- **The shared world** (`api/world.ts`, `api/_world.ts`, `shared/worldsync.ts`, `client/worldlink.ts`).
  Everything a hero does to the world is one contribution (a finished run, a gift, a vote), applied
  in the browser at once and posted to `/api/world`, whose answer is the world you then see. One
  world per code: WICKHOLD is everyone's; a group can play in a world of its own by typing a code at
  the Roll of the Brave. Redis holds each world as one JSON value changed under WATCH (a clash
  retries) plus a sorted set per stat: about a dozen commands per finished run, nothing per tick.
  The server lets through only what a real run or gift could send (capped, never negative, names
  cleaned). Offline (no server yet, or the claude.ai page, which can't reach it) the world is the
  browser's and the Roll shows your own heroes. Shared code now imports with `.js` so the server can
  run it under Node as is.
- **The Roll of the Brave** (a stone in the square): jobs done, people saved, gold given, goblins
  killed, dens burned, the top ten each. Heroes carry their own counts (`Profile.stats`) and an id.
- **The council counts heroes.** Online it decides when four heroes have voted, by majority (a tie
  goes to the choice voted first); you can change your vote until it decides. Alone and offline your
  vote decides.
- **Town works** (`shared/works.ts`), filled by everyone: Man the Walls (400 gold: two more guards on
  patrol), Clear the Old Quarter (600 gold: the rubble in the east lane goes, the Old Quarter opens
  with its barred chapel and Old Merren), Drive Them from Below (six dens burned on jobs, all told:
  the sewer grate opens and sewer jobs go on the board).
- **Wickhold, bigger and alive** (62 by 40): Lantern Square (the job board, the works board, the Roll,
  the well, Rowan the bard, benches, a cart, lamp posts), the church and its graves, the town hall,
  the forge, the mage's tower, the barred keep, the barracks, the hunters' lodge and its archery butts,
  the infirmary, the Drowned Rat, Rescue Row, and the Old Quarter past the rubble. Guards walk rounds
  (`Npc.path`, a pure function of time, so every player sees them in the same place); barrels and
  crates in the streets. Barred doors (the keep, the chapel) and the rubble say what would open them.
- **A trainer per class**, each somewhere of their own: Master Cole in the barracks (Warrior),
  Huntress Maeve at the hunters' lodge (Ranger), Whisper at the back of the Drowned Rat (Rogue),
  Magister Vell in the tower (Mage), Mother Isolde in the church (Healer). Only yours trains you; the
  others tell you where yours is. Each teaches one perk of its class besides the shared ones: Ironhide
  (blocking costs a quarter less), Steady Hand (bows draw a sixth faster), Shadowed (backstabs half as
  hard again), Focus (the blink back a quarter sooner), Devotion (blessed ground wider, the ward
  stronger).
- **The Drowned Rat**: Barkeep Gannet (rumours), Dicer Moll (knucklebones: two dice each, high roll takes
  the pot, ties to the house unless you're a Rogue; seeded per hero), Whisper, a drunk, a card sharp.
  The sewer grate is out the back.
- **In the square**: the works board, the Roll, the well (5 gold: your next job starts blessed), the
  bard (ask for any of the thirty pieces; it plays while you're in the square).
- **No fighting in town**: blows, guard, relics and grabs are held still; rolls, dashes and blinks work
  (the ROLL button shows in town on phones).

## 2026-11-01: music for every place, kits that sound like themselves, goblin voices, a Healer good alone (Claude Opus 5.5)

Kyle: music specific to towns and each kind of area and terrain, a few versions of each; typical
sounds for all weapons, impacts, goblins. Then: the Healer gets an AOE bless that heals allies slowly
and hurts enemies, and a ward that stops damage on self or others and reflects magic and projectiles,
so the Healer is good even solo. Also: tips off unless switched on.

- **Music, made live** (`client/music.ts`, `scores.ts`, `instruments.ts`; no files, nothing to
  download). Ten kinds of place, three pieces each (30 in all): Wickhold, inside a house, the church,
  the yard, villages, farms, fields, forests, mines, and a boss. Each piece is a mode, a chord
  progression and its parts (a drone or organ bass, held strings or organ, a picked lute or harp
  pattern, a flute, bell or horn tune that wanders a little differently every time, frame drums),
  through a shared hall reverb (wetter in mines and the church). Moving between places crossfades;
  the town's piece turns with the day, a run's with its seed and room. Under everything a fight layer
  (low toms and a driving low ostinato) rises with how many goblins are coming for you and falls
  away when they're dead; a named boss brings its own music once it's close or hurt. A note button
  switches the music alone (remembered on the device); SND still silences everything.
- **Every kit sounds like itself** (`client/weaponsfx.ts`). Swing and hit events now carry what made
  them (`src`) and whether it landed on the butcher (`big`). Sword: a ringing slice; greatsword: a long
  low whoosh and a cleave; spear: a thrust and a pierce; daggers: a quick double hiss and a stab; mace:
  a whump and a bone crunch. Bows creak at full draw and twang on release (deeper on the longbow), the
  crossbow thwacks and clicks, wand, staff and rod crackle, hum and zap. Blocks clang on a shield, ring
  on a blade. Wood chops, buildings whoosh alight, crackle while they burn (louder the closer you are)
  and fall in with a rumble; doors creak.
- **Goblin voices** (`client/voices.ts`): a sawtooth through two vowel filters with a rasp. Scrappers
  gibber and cackle as they come (now and then, more with more of them), yelp when cut, shriek when
  they die, hiss before a stab; archers' bows creak as they draw; dens screech when one crawls out.
  The butcher grunts, roars into its cleave and slam, and groans as it falls. Each goblin's pitch comes
  from its id, so a crowd sounds like a crowd.
- **The Healer** (relics now blessed ground, ward, war horn; `sim/relics.ts`, `BLESSING` and `WARD`).
  Blessed ground: a 2.4-tile circle of light at your feet (or where you point on a laptop) for 6 s;
  allies in it mend 3 every half second and are blessed (hit harder, take less) while they stand in
  it; goblins in it take 4 every half second, and the relic's element if one is fitted. Ward: a shell
  on the most hurt ally in reach, yourself included (or the one you point at), for 5 s: it soaks up to
  50 damage of blows, and an archer's arrow bounces straight back for 1.5x its damage and stuns the
  archer. Goblin spells will bounce the same way when there are goblin casters. Solo, the Healer
  stands in her own light behind her own ward. (This settles the open solo-Healer question.)
- Tips are off unless TIPS in the corner is on. On phones the HUD is narrower so the five corner
  buttons fit beside it.

## 2026-11-01: heights and forks (Claude Opus 5.5)

Kyle: multiple heights and paths within missions that make heroes choose how to move together or
attack threats.

- **Two levels to start: the ground and up on a ledge** (`Ledge` in `shared/arena.ts`). A ledge is a
  rock shelf (mines, forests) or a timber wall walk (villages, farms) along the back of a room. From
  the ground its edge is a wall; from on top you can step off it (a drop: you land, no harm). A ramp
  overlaps its edge: inside the ramp you take the level of where you stand, so stairs are just a place
  the wall isn't. All of it is in `collide`, so heroes, goblins and the tests share one rule. Bodies
  carry `z` (0 or 1); a prop has none and stays on the ground.
- **What height changes:** a blade only reaches your own level (up top you're out of reach of the
  ground, and they of you); grabs too. Arrows, bolts, spells, javelins, hooks and nets reach up and
  down. Shots from up on a ledge hit 1.25x (`HEIGHT.shot`). A goblin knocked off a ledge fast (thrown,
  hooked, blasted) takes the fall: 12 damage and a stun; one that steps off just lands.
- **Archers** (`ARCHER`): a scrapper with a bow. It keeps its distance on the ground and holds its
  perch up high, draws on you for a full second with a thin sightline telegraph, and looses: block it,
  parry it (the archer is stunned where it stands), or roll. Goblins with blades go round by the ramp
  to reach you up high; archers don't come down.
- **Forks:** the middle room of a three-room job has two ways out instead of one: THE HIGH ROAD (the
  next room has a ledge with three archers on it and two fewer goblins below) or THE LOW ROAD (one
  more goblin below and someone caged to free, even in the last room). The run remembers the road
  (`Run.roads`), so the same job can play two ways.
- **The way on takes the whole party.** Every exit, and each road at a fork, opens only when every
  player in the room stands in it (`Game.together`); solo that's you. Online this is how the party
  chooses a road together: walk into it as a group. Splitting at a fork (the leader running both
  rooms) is possible with the multi-room host, and saved for later.
- Not yet: more than two levels, ledges out in the middle of a room (they draw against the back wall
  for now), rooftops you climb by ladder, a lever up top that opens a gate below. Recorded in the atlas.

## 2026-11-01: heroes for life, every building enterable, buildings that burn, Come Bye's online lessons (Claude Opus 5.5)

Kyle: pick your class at the start when you first load in, with its own level, and no changing it in
a game; every building enterable with things inside and people to talk to for upgrades; mission
buildings that can be burned out and destroyed, visibly, or entered. Then: this will be online and
offline; Come Bye's team wrote up joining and moving between servers; build towards it early without
paying much.

- **The start screen** (`client/title.ts`): your heroes, up to three, each with a name, a class for
  life, its own level, gold, perks, kit and fitted elements; play one, make one, retire one (asks
  twice). The world (town, chapter, votes) is shared by all of them. Saves are v2 (`relic.save.v2`:
  heroes, current, world); a v1 save's hero comes across as HERO, its class from its weapon.
- **No class, kit or element changes in play.** The CLASS, WEAPON and AUGMENT buttons and the C, Q, T
  keys are gone, and `Game.step` holds those press counters still in every mode. Kits change at the
  smith (within the class); the relic-wright fits fire, frost or storm to a relic for 45 gold (free to
  take out), kept on the hero. HEROES in the corner opens the start screen (not mid-job).
  `?hero=MAGE` skips the start screen for the scripts.
- **Every Wickhold building has a door and people** (`shared/interiors.ts`, `client/npcs.ts`). Walk up
  into the door (or ENTER on a phone); walk out the bottom to stand back at the door. The forge
  (Halvard the smith, Ivo the relic-wright), the church (Father Odric, Marta), the training hall
  (Master Cole, and Squire Pell who takes you to the yard), the infirmary (Sister Agne and up to three
  patients), a new town hall where the council table was (Reeve Hollis and two councillors), the
  granary (Farmer Jos) and every lit house on Rescue Row (a family of two, with rumours that hint at
  places and tactics). Old Wenna and Tam stand in the square; Dessa the trader at the market once the
  traders are in. A gold mark over anyone you can talk to, their name when you're close.
- **Buildings on a job** (`sim/buildings.ts`, tuning `BLAZE` and `WOOD` in `shared/props.ts`).
  Cottages and barns, fences and goblin dens are wood with health. Blows chip them (half damage),
  blasts knock at them; oil fire, fire blasts and burning goblins set them alight; fire burns them
  down in about six seconds, spreads to wood within a tile after 2.5 s, and catches goblins standing
  close. Burned down, a building is ash and stubs you walk over (it stops colliding). Drawn charred
  under half health, with flames, smoke and window glow while burning, embers after; a fire lights
  the street. Town buildings have no health and never burn.
- **Cottages and barns can be entered** on a job: turned over inside, one to four goblins, a cage
  with someone in it on rescue jobs (a third of cottages and half of barns otherwise), a butcher in
  some barns where it's bad. The inside stays as you left it for that room; a burning or burned
  building can't be entered.
- **A new job: Burn out the dens.** The last room holds three dens, each with an oil barrel by it;
  a standing den sends out a scrapper every 9 s (up to six goblins about). The room is done when the
  dens are ash.
- **Online, from Come Bye's write-up** (`docs/ONLINE.md` here, the full one in Comearound): copied
  their newer relay and its tests (publish through Redis only while another instance has players:
  about 100 hours of play a month on the free plan instead of 3; dead hosts can't hold a room; a
  Redis hiccup can't kill an instance). What it changes for us now: the room is plain data the leader
  can save every 2 s; the room outside a building keeps running while you're in (the leader will run
  every room someone is in, so a party can split); seats come back by hero name; the shared world is
  written per run, never per tick.

## 2026-11-01: the town and the loop, terrain, the story mission and the council (Claude Opus 5.5)

Kyle: get to work on the town and the gameplay loops; other terrain types and how maps and
scenarios are made; bigger story missions and decisions the group votes on that change the world
and the town.

- **The game starts in Wickhold** (`shared/town.ts`), built from the shared world's state: Lantern
  Square (the Last Lantern, the job board, the council table), the Church, the Forge, the Training
  Yard, Market Row, the Infirmary, Rescue Row (a lit house per two people brought home), the north
  gate. Walk up to a spot and USE it (E or F on a laptop; a USE button on a phone, where the combat
  buttons hide in town). The training room is now the Training Yard; walk out the bottom to leave.
- **Maps are data** (`shared/arena.ts`): size, blocks (buildings, rock walls, fences: footprints you
  walk behind), round things (pillars, trees, pines, rocks, hay, wells, supports, the Lantern),
  braziers, torches, the way out, and a theme (floor, back wall, ambient light, moonlight). One map
  is in use at a time (the room sets it), so collision never needs it passed around.
- **Run rooms are laid out from the job's seed** (`shared/terrain.ts`): village (cottages, a well),
  farm (barn, fences, hay), fields (standing wheat, hay), forest (trees, pines), mine (rock walls,
  pit props, oil, dark: heroes carry a lantern). Objective first, then buildings, round things,
  furniture, a goblin campfire, goblins in the top half; spawn, exit and the middle lane stay clear.
  Ruin and the room's place set the goblin count; a butcher joins at ruin 2.
- **Jobs** (`shared/jobs.ts`): three a day from seven places across four regions. Objectives:
  rescue (break the cages), hunt (a named butcher), larder (smash the racks). Twist: night. Three
  rooms; clear each to open the way out at the top; the last holds the job. Run goblins stay dead.
  Three downs and you're driven back with half the gold and nobody saved.
- **Progress** (`shared/progress.ts`, saved in this browser for now): gold and experience from kills
  (scrapper 4 and 10, butcher 30 and 60, a named one 80 and 150), 25 experience per person freed, 50
  and the job's pay for finishing. Levels at 100, 300, 600... (cap 10 in chapter 1); each level is a
  pick of one of two perks at the trainer (tough, endurance, relic sworn, footwork, guard, second
  wind). The smith sells a fine weapon (60), the trader a forged one (160, once the market opens).
  Gold given at the church feeds the Lantern (the Want comes later).
- **Chapter 1** (`shared/story.ts`): bring 6 people home and finish the story mission, Barrowby's
  Bell (four rooms at night, the Gnawer in the church, three cages). Then the council table opens:
  farm the north fields (jobs pay 25% more, a granary goes up) or take in the refugees (four more on
  Rescue Row, the trader opens). A council needs 4; in this solo demo you can decide alone. The vote
  is recorded with its voters and day; chapter 2 is written at the review.

## 2026-10-31 (late): props to smash, lift and throw (Claude Opus 5.5)

Kyle: pick up and throw barrels and tables (and broken pieces) if you're a big enough character,
like the knight or a barbarian; the rogue and ranger can't.

- **Props are bodies** (`shared/props.ts`, `sim/props.ts`): barrels (2.5), an oil barrel, crates (3)
  and a table (4) stand in the training room. Blows, shots, blasts, wall slams and flying goblins
  push and break them; they break into staves and planks (lighter pieces that fade after 25 s).
  Big ones come back after 20 s in the training room. Shots stop on them.
- **Only strong classes lift** (`STRONG`: the Warrior now; a Barbarian when the Warrior forks into
  Knight or Barbarian). GRAB takes a goblin first if one is earned, else the nearest prop. Overhead
  you walk at 70% (56% for a crate or table); ATTACK slams it down (28 to goblins within 1.3 tiles,
  it breaks); GRAB throws it at 14 tiles a second. A thrown prop hits like its weight (0.8 per tile
  a second times weight, up to 45) and breaks on any goblin it hits at speed.
- **The oil barrel** bursts into flame when broken: everything within 1.8 tiles burns.
- **Goblin grabs stay for every class** (they're earned by skill, not strength); lifting furniture is
  the strong classes' extra.

## 2026-10-31 (after midnight): grab, slam, throw, and deaths by the blow (Claude Opus 5.5)

Kyle: more dynamic hits and deaths: slam a goblin into the ground and pound its head off so it
bursts, or chop it off; pick a unit up and throw it at another.

- **Grab is earned** (`sim/grab.ts`): only a small goblin (weight 1 or less) you've stunned, netted,
  frozen, staggered or got behind, within 1.3 tiles. G on a laptop; on a phone a GRAB button shows up
  only when there's something to grab. Overhead you walk at 60%; ATTACK (now SLAM) drives it into the
  ground (30, crater, stunned 1.5 s, a kill pounds its head in); GRAB again (THROW) hurls it 16 tiles a
  second, airborne 0.35 s. It wriggles free after 3 s; being hit or rolling drops it.
- **Bodies hit bodies** (`sim/impacts.ts`): anything driving into another goblin at 6 tiles a second
  or more hurts both (1.5 per tile a second, up to 25) and passes momentum on by weight. Thrown,
  blasted, smitten or greatsworded goblins bowl their friends over; the butcher barely moves. Frozen
  ones shatter. Only a body actually closing on the other counts, so a pair never re-hits.
- **Deaths by the killing blow** (`kill(e, ev, how)`): blades take the head (it flies, eyes still
  lit, a fountain from the neck); maces, slams, blasts, smites, wall splats, body hits and any kill
  20 or more past the life left burst the body into pieces; fire leaves a charred body; ice
  shatters; thrusts and arrows drop them. Pieces fly with height and land as stains that stay.
- Headless and charred bodies stay until the respawn; burst and shattered ones leave only the floor.

## 2026-10-31 (midnight): loot that rewards execution (Claude Opus 5.5)

Kyle: weapons with modifiers so each fight drops loot and unlocks things as you progress, without
drowning in stats and meta-gaming; and more skill-based execution throughout.

- **A weapon is its kit plus at most two traits, in words.** Fine: one skill trait. Forged: a skill
  trait plus an element (named for it: EMBERFORGED GREATSWORD). One weapon per kit, so no inventory:
  stand on a drop, read the card, TAKE (F) swaps it in and leaves your old one on the floor.
- **Every trait pays off only on execution** (`shared/loot.ts`): RIPOSTE (counters x1.4 on top),
  TEMPO (dodge through a blow: next hit x2), BULWARK (a parry refills stamina), DEADEYE (a perfect
  release x1.6), CRUSHING (goblins you throw into walls take x3 slam), BRUTAL (held-fast goblins take
  x1.5 more), REAPER (a backstab or counter kill heals 10). Forged elements land only on charged
  hits (70%+), counters, full draws and crossbow bolts, never on taps.
- **Draws have a sweet spot for everyone:** release within 0.25 s of the white flash for a perfect
  shot; hold more than 0.8 s past it and the bow shakes and the shot drops to 75% (no pierce).
- **Drops:** scrappers 35% (20% forged), the butcher always (60% forged), rolled for the nearest
  player's class on a separate seeded stream (`lootRng`), fading after 45 s.
- **Progression stays sideways:** loot changes how a weapon plays, not a number that climbs. Vertical
  power comes from town (new kits, relics and augments unlocked at the smith and relic-wright; levels
  that open ability choices). No gear score.

## 2026-10-31 (late night): class kits by draw time, slower classes, class relics (Claude Opus 5.5)

Kyle after trying slice 2d: no three-shot pattern on the bow; the long pullback is great; different
bows with different draw times and damage; Mage spells the same way (a quick one, a long charge one);
every class too mobile, only the Rogue should be; keep the mage's teleport but trade it off; no blast
flask; the horn only as an ally buff for Warrior and Healer; Healer smites big, keeps the third-hit
heal, targets allies to heal and buff; different relics per class.

- **Ranged and spells are one shot per press** (`combo` of one) and a hold draws or casts; each kit
  has its own `draw` time. Longbow 1.4 s to 55 that pierces the line (only at a full draw);
  shortbow 0.55 s to 22, walk at 70% while drawing; crossbow fires on the press (`noCharge`), 34 that
  hurls light goblins, 1.15 s reload. Wand 0.6 s, staff 1.6 s to a 65 orb that bursts 2.2 wide, rod
  1 s to a piercing lance. Spells take the equipped relic's element; arrows and bolts don't.
- **Mobility:** only the Rogue walks faster than base (1.15); everyone else 0.78 to 0.92, with shorter
  rolls (1.9 to 2.4 tiles) and longer recharges (0.65 to 1 s). The blink keeps its 3.4 tiles but costs
  40 stamina and recharges in 1.6 s.
- **Healer:** third mace blow heals everyone within 3 tiles for 8; the hold (1.2 s) calls a holy smite
  onto the goblin faced (up to 6 tiles; where you point on a laptop): 70, stuns 1.2 s.
- **Relics by class** (`CLASS_RELICS`; racks and the L key are gone): Warrior javelin, hook, war
  horn. Ranger hunter's net (snares small goblins flat, slows big ones), hook. Rogue shadowstep
  (behind the goblin you face), hook. Mage lodestone (lobbed; drags goblins inward 1.8 s, then
  bursts). Healer blessing (heals 20, then 1.3x damage dealt and 0.75x taken for 8 s; most hurt ally
  on a phone, nearest to where you point on a laptop), war horn. Horn: allies within 6 refill
  stamina, regenerate it twice as fast and block at half cost for 6 s.
- **A squire** stands by the swing dummy taking hits, so the Healer has someone to heal and bless.
- Gale horn (as a knockback) and blast flask removed.

## 2026-10-31 (night, last): classes, magic augments, new relics, the world atlas (Claude Opus 5.5)

Kyle: weapon types for the other classes, more relic types and magic augments, a class button for the
demo, and start mapping the town, quests, scenarios and locations (fields, farms, towns, cities,
mines, forests; some places more wrecked than others).

- **Classes for the demo:** C or CLASS cycles Warrior (sword and shield, greatsword), Ranger (longbow,
  spear), Rogue (twin daggers), Mage (focus staff), Healer (mace and censer). Q or WEAPON swaps within
  the class (`CLASS_KITS`). Each class has its own sprite colours and hood.
- **Longbow:** taps loose arrows (stop in the first body, stick in walls); a held draw pierces every
  goblin in a line and knocks them into walls. **Focus staff:** sparks, a burst on the third, a held
  orb that bursts and throws; it casts with the equipped relic's augment (the focus relic from the
  kickoff); its dodge is a blink. **Mace and censer:** every third blow heals heroes within 3 tiles
  for 6, the held blessing hits all round and heals 10 to 30. Shots live in `sim/bolts.ts`.
- **New relics:** the gale horn (a cone that throws goblins by weight) and the blast flask (lobbed to
  where you point, or the goblin you face on a phone; bursts and throws everyone outward). A hero
  carries a rack of three (`LOADOUTS`); L or RELICS takes the next rack until the town's armoury exists.
- **Magic augments** (T or AUGMENT, on the equipped relic; `sim/elements.ts`): fire burns 4 every
  0.5 s for 3 s and spreads by touch; frost chills (half speed and turn), a second frost freezes
  solid for 2.2 s; storm arcs to the 2 nearest goblins within 3.2 tiles and to any goblin with a
  javelin stuck in it within 6 (lightning rods). Together: fire and frost make steam (cancels both,
  10 damage, stuns everything near); storm, a heavy blow, a heavy shot or a wall slam shatters the
  frozen (30); storm on the burning flares (12 and a throw). Bows shoot plain arrows for now.
- **World atlas** (Docs artifact, link in PLAN): Wickhold as the proposed town name, its districts and
  gates, five regions, ruin levels 0 to 4, eleven kinds of place, twelve objectives, ten twists.
  Proposals for Kyle to cut or change.

## 2026-10-31 (night, latest): the relic wheel (Claude Opus 5.5)

Kyle: switching relics on a phone was too slow; hold the relic button and quick-select, with only a
few relics equippable.

- Heroes carry a relic **loadout** of at most 3 (`RELIC_SLOTS`; chosen in town later). Tap RELIC to
  use the equipped one; **hold** it (0.26 s) and the carried relics fan out up and to the left of the
  thumb with their recharge shown; slide onto one and let go to equip it, let go elsewhere to cancel.
  The button shows the equipped relic's name. The fight doesn't pause (it's shared online).
- Laptop: 1, 2, 3 pick a slot directly; R still cycles; E uses. The top RELIC chip is gone.

## 2026-10-31 (night, later): kits guard and dodge differently (Claude Opus 5.5)

Kyle: sword and shield should block easiest and best; greatsword and spear need more timing; classes
should differ in speed, dodge recharge, dodge range and direction. Until classes exist, each weapon
kit carries these (`Weapon` in tuning) and they move to the class later.

| Kit | Parry window | Guard arc | Block cost | Speed | Dodge |
| --- | --- | --- | --- | --- | --- |
| Sword and shield | 0.36 s | 170 deg | 1x | 1.0 | roll 3 tiles, 0.5 s recharge |
| Greatsword | 0.20 s | 110 deg | 1.5x | 0.85 | heavy roll 2.3 tiles, 0.8 s |
| Spear | 0.24 s | 120 deg | 1.3x | 0.95 | backstep 2.4 tiles away from facing, keeps facing, 0.45 s |
| Twin daggers | 0.20 s | 100 deg | 1.8x | 1.15 | dash 3.6 tiles, 0.3 s |

- The telegraph's white parry cue uses the player's own kit window, so it always tells the truth.
- Class mapping to carry over later: Warrior (sword and shield or greatsword), Ranger (spear-like
  backstep, then Rogue's dash), Mage (a blink), Healer (to decide).

## 2026-10-31 (night): corpses ride the javelin, backstabs (Claude Opus 5.5)

Kyle: the javelin should carry the body back even when the throw kills; some classes (a rogue,
maybe a Ranger upgrade) should do more from behind, so they want to roll behind an enemy and attack.

- **Corpses ride the javelin:** a light enemy killed by the throw (or by the pin) is carried to the
  wall and hangs there (`Enemy.corpse`), fading just before it respawns.
- **Backstabs:** any blow from behind does 1.25x (`GUARD.rearMult`); behind means standing where the
  target's facing points away (dot below -0.35). No extra knockback (Kyle's Old Gods flanking rule).
- **Twin daggers** (the rogue's kit, fourth weapon on Q for now): fast 4-hit combo, weak block, 2.5x
  from behind. With daggers in hand each goblin's back shows as a purple arc, bright when you're in it.
- **Enemies turn at their own pace** (butcher 2.4 rad/s, scrapper 7) and only attack once they face
  you, so rolling past the butcher (rolls pass through) leaves his back open for a moment.
- **Design:** Ranger's subclass fork becomes Sharpshooter or Rogue (backstabs), per Kyle.

## 2026-10-31 (late): parry that lands, weapons, heavies, knockback, relics (Claude Opus 5.5)

Kyle after his first play: parrying was hard to pull off and should stun; wants animation with the
telegraphs; collision with enemies and knockback by type; combos per weapon and hold for a heavy; a
rechargeable javelin relic that pins small enemies to walls; grappling hooks; physics impacts on the
world; elemental modifiers later, all as relics.

- **Parry:** window 0.18 s to 0.30 s before the hit; the telegraph turns white for exactly that
  window (the cue is the judged window); a parry **stuns** (butcher 2.2 s, scrapper 1.8 s) with
  "STUNNED", stars and a slump; stunned or pinned enemies take 1.5x; counter window 1.1 to 1.6 s.
- **Weapons** (`WEAPONS` in tuning, Q or the WEAPON chip): sword and shield (3 slashes, best block),
  greatsword (2 wide slow sweeps, big knockback, weak block), spear (4 quick thrusts, long reach).
- **Hold to charge:** a tap swings on release; holding past 0.18 s charges (slower walk, gold glow,
  white ring at full charge at 0.9 s); release for the weapon's heavy, damage and knockback scaling
  with charge. A strong heavy (70%+) flinches the butcher out of his wind-up.
- **Bodies and knockback** (`sim/bodies.ts`): nobody walks through anybody (lighter one gives way;
  rolls pass through); every blow pushes by its knock divided by weight (scrapper 0.6, hero 1,
  butcher 3.5, dummies immovable); a fast slide into a wall or pillar is a wall slam for 6 and a crack.
- **Goblin scrappers** (two): small, quick stab with a short telegraph, flinch on any hit.
- **Animation with every telegraph:** the butcher hauls the cleaver back, trembles, chops with a smear;
  for the slam he leaps, hangs, comes down squashed with a crater, debris and a shockwave. Scrappers pull
  the knife back and lunge. Swing dummy winds its club up.
- **Relics** (E or RELIC, R or the RELIC chip to swap; each recharges): the **relic javelin** carries
  anything weight 1 or lighter to the first wall or pillar and **pins** it there (2.6 s, +12), sticks
  into heavier bodies, stays in the world 9 s; the **grappling hook** yanks light enemies to you
  (arriving stunned) or pulls you to walls, pillars and heavy enemies. Phones auto-aim relics at the
  nearest goblin in the relic's range.
- **Marks on the world:** slam craters, wall cracks and blood stay on the floor and walls.
- **Next for relics (Kyle):** elemental modifiers that play off one another; keep relics data-driven.

## 2026-10-31: slices 1 and 2, the training room (Claude Opus 5.5)

- **Kyle's calls carried in from the kickoff doc:** Relic; three-quarter view; click or tap to
  attack; one button to block (hold) or parry (tap on time); parries open a counter; dodge roll;
  big enemies telegraph on the floor, some unblockable; the lit pixel look from the style mock.
- **No Phaser for now.** The approved look is per-pixel stepped lighting with dither. A small custom
  renderer does it directly: paint the scene flat at low resolution with Canvas 2D, then one WebGL2
  pass lights it and lays the glowing layer on top. About 40 KB of script, nothing to fight. Phaser
  (or Tiled tooling) can come back when maps need it.
- **Timings (first pass, `src/shared/tuning.ts`):** parry window 0.18 s before the hit (re-presses
  within 0.35 s don't reopen it), counter window 1.1 s at 2.5x, roll 3 tiles in 0.32 s untouchable
  from 0.04 to 0.26 s, block chip 15% at 1.4 stamina per point, butcher cleave wind-up 1.0 s, slam
  1.3 s (unblockable, striped edge, "!" over his head). Each hero has a `lenience` for online ping.
- **Phones aim for you:** with no mouse, an attack or a block turns the hero to the nearest enemy
  in reach, so a parry faces the right way.
- **Relay copied from Come Bye** with its keys renamed (`rl:`); its 16 tests pass here. Not wired to
  the client until slice 3.

## 2026-11-01: talk, not lines (Claude Opus 5.5)
Kyle: the writing read like Claude, too direct, every sentence a punchline. Read the books' excerpts and
wrote prose-notes.md (long wandering sentences, hedging, detail before name, jokes last, short lines rare).
Added .claude/agents/line-editor.md as a second pass after the lore keeper. In the wood, dialogue that
can freeze the world waits for a tap (Kyle's ask); a card goes on with a tap anywhere, because the card
covered the stick and the move card never let go on a phone. Captions now stay up a third of a second a word.

## 2026-11-01: lines that speak (Claude Opus 5.5)
Kyle asked for typing with little sounds and emphasis that moves and colours. speech.ts types every
spoken line (wood dialogue, captions, town panels' quoted lines, Orla) a letter at a time with a per-speaker
voice blip, and reads a small markup: *bold*, ~sway~, ^good^ (green-gold), _bad_ (red, trembling). A tap,
click, Enter or action key finishes a line before it goes on. A panel redrawn in the same sitting doesn't
retype. Found while testing: the first frame could step time backwards and skip Hew's waking; the loop now
never steps below zero.

## 2026-11-01: daylight, dodges, and a wood for each class (Claude Opus 5.5)
The wood is in daylight (Theme.day: no moon pool or hero lanterns). A roll out of a blow's reach during its
wind-up now counts as a dodge (judged from where the roll started); a roll through it as it lands staggers
a close attacker for 0.6 of a parry's stun (DODGE.stun; not archers) and shows LAST SECOND. The wood's
lessons are per class (lessonsFor): Warrior and Healer keep block and parry; Rogue learns blows from behind,
Ranger and Mage full draw or charge, and all three the last-second dodge in place of parry, with goblins to
suit. Hew says one line about each class while he looks you over. The light classes can still hold a block
in the game itself; the wood just doesn't teach it (Kyle to decide whether they should lose it).

## 2026-11-01: each class guards its own way (Claude Opus 5.5)
Kyle: Warrior and Healer hold a block and parry; Ranger and Rogue can parry with good timing but never hold
a block; the Mage can neither, and blinks out instead (cooldown 1.6 to 2.6 s, a little further) leaving an
image for 2.5 s that goblins near it go for (DECOY; nearest() hands them a stand-in at the image). The Rogue
is quicker (speed 1.22; dash 4.3 tiles, 0.22 s cooldown, cheaper). CLASS_GUARD in weapons.ts; the class
detail shows a GUARD line; on a phone the block button reads PARRY for Ranger and Rogue and is gone for the Mage.
Later: a Rogue relic that slides behind the goblin instead of a straight dodge (Kyle's idea).

## 2026-11-01: Hew's death staged, the Stoker's charge, the relic found, kills that vary (Claude Opus 5.5)
Kyle: the old ending was weird (Hew teleported, the Stoker spun). The cut is now beat by beat (CUT in
sim/wood.ts): Hew walks round the hut, the ground rumbles, the Stoker rises behind the cordwood, runs him
down, lifts him (Npc.lift), bites (headless pose, blood, shake), throws the body onto its cordwood pile (kept,
not wasted, so "this one I keep" still reads two ways), turns and bellows (big shake, roar). The Stoker gains a
charge: a broad striped lane, unblockable, and no blow flinches it; it stuns itself on a wall or tree. Killing it
stops everything for a relic card (FOUND / RELIC JAVELIN) with the javelin held up in a ring of light and a
rising run of notes; then a gold arrow points to the road. Blade kills now vary: cut down (most light blows),
cut in two at the waist (most heavy blows), and only now and then the head. The Rogue's knives do half head on
(front: 0.5) unless the goblin is held fast. Ranger and Rogue holding block get "CAN'T BLOCK: TAP TO PARRY";
a Mage pressing it gets "NO GUARD: ROLL"; the HUD kit line says so too. In town, a panel stops the world.

## 2026-11-01: the pack by dragging; goblins in each other's way; the Warrior's throw (Claude Opus 5.5)
The pack (I, Tab, PACK) is now slots: WORN (hand, armor, two rings, relic), SPARES (8 and a DROP square),
the relic shelf and the belt. Drag a piece onto its slot to wear it, into the pack to take it off (armor
too: GEAR.unarm), onto DROP to drop it (or pour a potion); tap one for its card and buttons. Pointer events,
so mouse and finger both (packdrag.ts); the rules live in moveOf (tested). Goblins now hurt their own: an
arrow that misses you takes the first goblin in its line (x1.5), and a butcher's sweep, slam or charge
catches small goblins under it (FRIENDLY). The Warrior's field in the wood adds a grab-and-throw beat with
the second pair of looters. Found while testing: a hero who skipped the wood got a black screen in town
(the wood's fade stayed up); fixed, and the fade only ever shows in the wood.

## 2026-11-01: the field the day after; fire (Claude Opus 5.5)
Kyle: more evidence of a battle when you wake, the looters already eating rather than appearing, and fire
that looks like fire. The field now has the column's dead lying where they fell and in heaps (FIELD_DEAD,
drawn as corpses: on their backs or sides, blood under them, now and then an arrow still in them), dead
goblins among them (GOBLIN_DEAD, cut down, in two, beheaded), and the field's looters crouched at the heaps
(Enemy.feeding: they stay put, head down, and don't look up until you come close or the lesson starts).
The three wagons burn for show (Block.smoulder) and are drawn as wagons (plank bed, hoops, spoked wheels,
charred). Fire is redrawn everywhere: tapering tongues white to red, licks tearing loose, embers, a thick
rolling smoke column.

## 2026-11-01: the hook is the first relic; in town only the one you talk to stops (Claude Opus 5.5)
Kyle: the Stoker hauls you in with a hook, so its relic is the grappling hook, not the javelin (the javelin is
the next found). The hook pulls by weight: a small goblin comes to you; anything heavier, or a wall, pulls you
to it (a second dodge for the light classes); a Warrior or Healer can haul in up to a butcher (HOOK.heavyYank),
which arrives angry rather than reeling. The town no longer pauses for a panel (the town is shared online);
instead whoever you're talking to stops their round (Npc.heldAt/lag) and picks it up after.

## 2026-11-01: the Ranger gets its own (Claude Opus 5.5)
Kyle picked the hound and snares. The Ranger taps for a short sword (RANGER_BLADE, two quick cuts) and holds
to draw the bow (all three bows, the crossbow included, now draw on a hold). Its dodge is a jump back
(RANGER_JUMP) that leaves a snare where it stood (SNARE: one every 7 s, two down at most, holds a small
goblin, slows a butcher). A hound runs at its heel (sim/ranger.ts): now and then it goes for what you've
been hitting (or the nearest small goblin), bites a few times and comes back; nothing can hurt it, but a
butcher winding up near it sends it off for 14 s. No hound in the wood. The class pick shows a HOUND line.

## 2026-11-01: the javelin again; the Stoker calls twice; goblins at the dead on jobs (Claude Opus 5.5)
Kyle: back to the javelin as the Stoker's relic (the hook is the next found; its weight rule stays). The
Stoker bellows for help twice, at two thirds and one third of its health (STOKER_CALLS; the second wave is
bigger, with a lunger). Out on jobs, most rooms (60%) have a heap of the dead (one or two bodies, dressed for
the place) with one to three goblins at it, feeding: facing the body, leaning in, tearing a piece back, red
flicking off, wet chewing you can hear within 8 tiles. They see you at half the usual distance while they eat.

## 2026-11-01: a Rogue earns it; dodges cost more; skills on 20 s (Claude Opus 5.5)
Kyle: the Rogue's knives find one goblin a blow (the nearest in reach: Weapon.single), and a head-on blow
doesn't knock anything off balance (only from behind). Every dodge costs half again its stamina for now
(DODGE.cost 1.5; the Rogue's dash 18 before that), so there's something to grow into: perks, gear and levels
will bring it down. Class skills (War Cry, Hunter's Net, Shadowstep, Lodestone, Sanctuary) are on 20 s
cooldowns while heroes are low level; shorter cooldowns and new abilities come with levels later. Relics
(javelin 6 s, hook 4 s) unchanged for now.

## 2026-11-01: relics on 10 s; the Mage channels; sound on a silenced iPhone (Claude Opus 5.5)
Relics recharge in 10 s (javelin, hook). The Mage's class skill is Elemental Channel (CHANNEL; Lodestone stays a
relic): it stands still 2 s (anything that hurts it breaks the channel), then its spells turn to the next element,
fire, frost, storm, round again, kept from room to room (profile.augments.channel). Fire: the tap is a firebolt,
the hold a fireball that bursts and sets them burning. Frost: the tap is three icicles in a fan, the hold a burst
that freezes solid. Storm: every spell jumps to the next goblin. A rod's lance keeps piercing (its element rides
the line, no burst). The HUD kit line shows the element. Kyle heard no sound on his phone: iPhones play web audio
on the ringer channel, so the silent switch mutes it; the first tap now loops a silent clip on a media element,
which moves the page to the media channel.

## 2026-11-01: hosting plan (Opus 5.5)

- `api/room.ts` maxDuration is 300 s, not 800: Vercel Hobby refuses a deploy that asks for more
  than 300, and sockets swap every 4 minutes anyway, so 300 works on Hobby and Pro alike.
- Start on Vercel Hobby plus Upstash Redis on pay as you go with a monthly budget cap (rate limited
  at the cap, never billed past it). Move to Vercel Pro ($20 a month, $20 of usage included) only
  when real players arrive; Hobby is non-commercial and pauses when over its limits.

## 2026-11-01: Ranger playtest fixes (Opus 5.5)

- The hound is with a Ranger from the waking in Greyhollow on (Kyle's call; overrides the bible's
  "joins at the north gate").
- Hew creeps in at the waking: out of the trees west of you, round behind the feeding looters,
  crouched (drawn squashed, slower bob) until he hauls you up. Hew's start moved to the west edge.
- A dodge that clears the blow (a Ranger's jump back, or any roll out of range) staggers the attacker
  when it started within the dodge's i-frame span of the blow landing, same as rolling through.
- Netted, the Stoker can't start a charge or a hook throw, and loses one it was winding up.
- Functions run in sfo1 (San Francisco), next to Kyle and his friends; the Upstash database goes in the
  matching west region so each publish is a short hop.
- Vercel project `relic` created on the SomwhatRogue team, linked to SomewhatRogue/Relics; every push
  to main deploys.
- Relic shares Come Bye's Upstash database for now (upstash-kv-amethyst-compass, sfo1, Free plan,
  which allows one database per account). Relic's keys all start `rl:`, so the two never collide;
  they do share the 500K commands a month. Moving to pay as you go (budget capped) is the step when
  either game gets regular players.

## 2026-11-01: the shared town (Opus 5.5)

- Online shape (Kyle): no join codes. Wickhold is one shared hub; parties form at the board; a job
  is a shared instance run by the party leader's browser; world quests need 3+ in town.
- The town has no host. Each browser runs Wickhold (its people walk on the clock), and each player
  only says where their own hero is, through a peer room on the relay (`want=peer`, room
  WICKHOLD1). Nobody leaving can break the town. `src/client/townfolk.ts`; `src/client/relay.ts`
  is Come Bye's reconnecting socket (heartbeat, visibility check, 4-minute swap).
- At most 4 messages a second while moving, one every 3 s standing; silent 12 s means gone.
- Online is on only in the Vercel build (`VITE_ONLINE=1`) or with `?relay=`; the one-file artifact
  build stays offline. `npm run test:online` runs three real browsers against a local two-instance
  relay (`scripts/online-server.ts`).
- relic-lake.vercel.app is public (Kyle, 2026-11-01): Vercel Authentication now guards preview
  deployments only, so anyone with the link plays without a login.

## 2026-11-01: parties and the shared run (Opus 5.5)

- Parties form over the town's peer room: the one gathering says so with where they stand (`pt`:
  the job and who's in), joiners ask by direct word, SET OUT tells each member the run's room code
  and the job. The job travels with it (each player's world, and so board, can differ).
- The leader's browser runs the job; friends' heroes are dressed from the profile they send.
  Patches of what changed (`snap.ts`) about 12 a second, a full one every 4 s, on a room change and
  for anyone new; average well under 4 KB. Friends swap ids in the text (leader `me` to `@lead`,
  theirs to `me`) so the rest of the game runs unchanged on their copy.
- The run's gold is shared: every pickup counts for the party, and everyone is paid the run.
- Labels checked by the lore keeper (plain board words: GATHER A PARTY, SET OUT, TAKE IT DOWN).
- `npm run test:online` now also runs scripts/party-online.cjs: gather, join, set out, same goblins,
  walking seen, a hurt goblin hurt for both, every room in order, the end paying the friend.

## 2026-11-01: loot and gold (Kyle; Opus 5.5)

- Gear rarely drops on the way now (a small goblin 2%, a butcher 15%); chests stay as they were.
- The treasure at the end of a job won is each player's own (shared/treasure.ts): one piece always,
  35% a second, better for worse places and deep jobs, rolled for that player's class by their own
  browser. What won't fit in the pack sells for 20 gold. Shown on the results panel.
- Gold drops often (85% of small goblins) and goes in one pot for the party: whoever picks it up,
  everyone is paid the whole pot at the end, and spends their own in town.
- A friend's pickups, potions drunk and gear changes in the leader's job come home with them (the
  pack now travels in the snapshots).

## 2026-11-01: less lag for friends (Opus 5.5)

- The leader sends 20 patches a second (was 12).
- A friend's own hero walks the moment they press. Each input carries the friend's clock and the
  leader hands back the newest one it has used, which times the trip there and back; the friend's
  hero is drawn at the leader's position plus the walking done here since then, eased in, snapped
  if more than 1.5 tiles off. Rolls, swings, hits and knockbacks stay the leader's alone.
- scripts/party-online.cjs now runs with 150 ms of lag on every message (LAG_MS on the local
  server): the friend's hero moves within 0.11 s of the press, and never jerks back while walking.

## 2026-11-01: handing the job on, and coming back (Opus 5.5)

- Every 2 s the leader sends the whole job (`saveRoom`: the run and every field of the room, its
  dice included). Leader quiet 9 s: the friend first in line by id takes the room over with
  `want=take` (the next waits 5 s more, in case the first is gone too) and leads; the others hear
  `hosted` and follow. Friends' heroes now move between rooms as they are, not re-dressed.
- A job with friends is kept in this browser (`session.ts`, 15 minutes fresh): a reload goes
  straight back in as a friend, and the old leader coming back follows whoever leads now.
- Known: module id counters (bolts, drops) restart on the new leader, so an id can repeat once.

## 2026-11-01: the board remembers, one voice per device (Opus 5.5)

- A job won is written to the shared world as a deed (title, place, the party's names) by the
  browser that ran it; the board shows the last five under DONE LATELY. The world server cleans it.
- Council votes are cast by the device (`relic-device` in this browser), not the hero, so one
  person's heroes share one voice (Kyle's worry). A second browser is still a second voice; real
  one-per-person needs sign-in, later if it's ever gamed.

## 2026-11-01: places and lengths (Kyle; Opus 5.5)

- Three new kinds of place: river (deep water across the room, two fords to wade, stepping stones
  drawn), marsh (bog pools, two too deep to cross; reeds, drowned trees, mud), ruins (broken walls,
  rubble, pillars, statues). Six new places named by the lore keeper (the Sheepwash, Brokenbridge,
  the Peat Cuts, Sallow Carr, Ketterby, Hesketh Hall). Shallow water slows everyone to 55%; deep
  water stops bodies, never shots.
- Four ordinary jobs a day, each a different kind of place: short (2 rooms, about 5 minutes), two
  medium (3), long (5, about 15), plus the deep dive. Pay = (18 + 9 per ruin, +6 at night) per room,
  x1 / 1.15 / 1.35 by length. Treasure: a piece; a piece, maybe two; two pieces a cut above.
- River and marsh borrow the wood's music, ruins the village's, till they have their own.

## 2026-11-01: drills at the trainer (Kyle; Opus 5.5)

- Your own class's trainer sells drills for gold: POWER (+5% damage a rank), HEALTH (+8), SPEED
  (+3%), CRITICAL (+4% chance a rank for a blow or shot to land 1.5x; shows CRIT), WIND (+8% stamina
  back), SKILL (class skill back 8% sooner a rank, 3 ranks) and the class TECHNIQUE (3 ranks):
  Warrior SLAM, Healer MENDING HANDS, Rogue KNIFEWORK, Ranger TRAPPER, Mage QUICK CHANNEL.
- Price = base x (rank+1)^1.6; a trainer goes one rank further every two levels. Perks on levelling
  stay free picks. Crits roll on the hero's own seeded dice, so the room's dice never shift.

## 2026-11-01: taught at the trainer; a calmer hound in training (Kyle; Opus 5.5)

- A new hero comes out of the wood with their weapon and a plain dodge only (no class skill in the
  wood: Kyle's call; the Stoker's goal no longer mentions it). Their trainer teaches the class skill
  from level 2 (60 gold), and from level 3 (80 gold) a Ranger's snare on the jump and a Mage's image
  on the blink. Heroes made before this (no `learned` list) keep everything they had.
- An untaught skill has no button and its press is spent; the relic button carries the javelin.
- In the wood and the yard the hound joins in a third as often, never goes for a goblin that's
  swinging at you, and never knocks one off its stride: those blows are yours to meet.

## 2026-11-01: playtest batch (Kyle's notes; Opus 5.5)

- Doors: the hero on the far side takes every press so far as seen, and stands still (no repeat of
  the last swing or roll). Goblins after you (awake, within 7 tiles, not named, four at most) come
  through the door a second later, in and out (`followers.ts`).
- The caged call out when you're near (a gold mark over the cage) and, freed, stand where it was and
  thank you (`captives.ts`; drawing only).
- The run banner has a readable backing and shows get-ups as hearts; going down alone says how many.
- The trainer is short: where you stand and a button for each thing; tap one for what it does.
- Sneaking: walk slowly (part-way stick, or Shift) and goblins at rest see you from 45% as far. The
  first blow on one that hasn't seen you is an AMBUSH: 2.2x, and it reels 1.2 s.
- Jobs mix in spear-lungers, brutes and shield-bearers (a plank shield: a quarter from the front
  unless heavy, held fast or unaware), more of them deeper and in worse places.
- Rogue: no parry, dodge only; dash costs more breath (30, x1.5) on a 0.35 s cooldown; feet 1.12.
  Everyone else dodges less often (roll 1.1 s, jump 1.0, heavy 1.4, Healer 1.3). The Mage's taps are
  slower and a little harder. The dodge button says ROLL, JUMP, DASH or BLINK.
- The hound joins in every 3.5 s (5 in training) and, in training, never on a goblin swinging at you.
- Hew: one word of praise a lesson, in passing (the fight doesn't stop), and "more of them" once.
  The dodge freeze-frame doesn't happen if you're already rolling or out of where the blow lands.
- Merged from helpers: panels reveal in reading order (`reveal.ts`), and the dice are thrown on a
  little pixel table (`diceanim.ts`).
## 2026-11-01: every house its own (Kyle's playtest note; Opus 5.5)

- One seed per house (job, room, house) picks its sort, its outside and its fire: the street block
  carries it as `look`, the inside uses the same one, so a lit window outside means a lit hearth in.
- Cottages: one room (hearth, beds, table), a back room behind a wall, a weaver's (looms), a smithy
  (forge, anvil, racked tools), a storehouse (sacks, crates, barrels, oil), or either of the first two
  looted (furniture smashed, the table in pieces, often a body). Barns: stalls with hay, or an open
  threshing floor with bales and a cart. Size, floor (planks, dirt, flagstone) and sides vary; any
  layout may be mirrored.
- Who's in: nobody (about a fifth), one or two asleep (still and half-sighted, like goblins at the
  dead, drawn curled up), some at a body, or a band; a butcher in a barn only at ruin 2 and up, one
  time in five. Light: the hearth lit or cold, moonlight through a stove-in roof, the goblins' fire,
  a lantern post in a barn. Collision sizes outside are unchanged.
- A hiding survivor is a cage tucked in the back (the only rescue the room knows); a free one who
  talks would need new lines and a run-side talk handler.

## 2026-11-01: no dodge for Warriors and Healers (Kyle; Opus 5.5)

- Warriors and Healers can't dodge at all; there's no button for it on a phone. They block, and walk
  out of anything striped. Pressing dodge does nothing (`CLASS_DODGES` in `weapons.ts`).
- Walking out of a striped blow aimed at you counts as a dodge (`EnemyAttack.aimed`; a charge that runs
  its line and misses its mark counts too), so traits and the wood can count it.
- The wood's second lesson for them is STEP OUT: the freeze comes earlier (0.45 s) and the stick
  answers it. Rogue, Ranger and Mage keep the dodge lesson, with their own button's name in prompts.
- The Healer's block stays a little weaker than the shield (mace guard cost 1.1). A sword-and-censer
  Healer kit could come later.
- Hew screams as the Stoker takes him ("No! No, no, n"), cut off at the bite.
- The pixel font now has punctuation, a heart, and draws lowercase as capitals, so captives' words show.

## 2026-11-01: the Warrior's two skills, blocks cost breath, an easier grab (Kyle; Opus 5.5)

- The War Cry no longer helps allies block (they might not block). It now draws every goblin in
  earshot to the Warrior, and nobody else, for 5 s; it wakes the ones at rest. Small goblins right
  beside them flinch.
- New: Shield Charge. A 5-tile run shield first along where you face; small goblins in the way are
  knocked aside and left reeling (so they can be grabbed), big ones stagger, crates and barrels burst,
  a wall stops it (`src/sim/bash.ts`, `BASH` in magic.ts).
- A class can have a choice of skills (`SKILL_CHOICES`): the trainer teaches them together and the hero
  carries one, swapping for free at the trainer (`Profile.skill`). Only the Warrior has two for now.
- A held block costs no health at all, only breath, and a lot of it (2.4 per point of damage; a butcher's
  cleave takes most of a full bar). Weapon `chip` values are unused now.
- Grabbing: a small goblin that is busy (feeding, swinging at someone else, or at the end of a swing)
  can be grabbed as well as one reeling or one you're behind. The wood's field has crates and a barrel
  off the burning carts, and the Warrior's grab lesson teaches throwing those first.
- Hew no longer says "skittles" (it read as the sweets, not the old pin game).

## 2026-11-01: the pick screen, the Cleric, new looks (Kyle; Opus 5.5)

- The pick screen says only RELIC, A NEW CHAPTER, "Choose your destiny." and the five classes by name
  and look. Tapping one shows it fighting (a live loop: blows, a heavy, a dodge or a guard,
  `src/client/preview.ts`), its ratings, a name and BEGIN. No weapon or skill text: Kyle, "less is more".
- The Healer is called the Cleric on screen (`CLASS_NAME`); the id stays HEALER.
- Every class has eyes that glow in the dark. The Mage has a tall pointed hat, a robe, sleeves and a
  beard; the Cleric wears a mail coif and a white tabard with the Lantern on it in gold; the Ranger is
  hooded. Three Warrior looks are drawn for Kyle to choose from (`WARRIOR_LOOKS`: knight, sellsword,
  blackiron). Kyle: three looks for every class, chosen on the pick screen (`LOOKS`, `Profile.look`, `Hero.look`; sent to the town so friends see it).
- Halvard buys packed gear (never hungry); gear given to a town work counts for half again.
## 2026-11-01: Wickhold starts broken, mends with gold, and gets raided (Kyle; Opus 5.5)

Kyle: start the town broken down and bloody, with an unfinished garden, so there's something to put
money towards and watch it clean up; NPCs comment as it gets nicer. Then: bad walls (sticks) that get
better with time, and world events where the town is attacked and bloodied again.

- **The breach.** Wickhold's north wall came down in a recent assault; the stretch either side of the
  gate (tiles 17 to 39) is hurdles, stakes and a cart bed lashed up with rope (`GameMap.breach`,
  painted in `client/breach.ts`). The rest of the wall is the old stone Wenna saw go up, so it is still
  "the last walled town". Blood on the square and at the gate, a drag trail, the dead on a cart by the
  church with crows, burnt carts and rubble in the lanes, scorch, lamp posts down, buildings scorched
  with boarded windows and holed roofs, and Perrin's trampled physic garden with a dead tree.
- **What's broken is data** (`shared/mend.ts`, from the world's works, so the same on every screen):
  paint-only floor marks (`GameMap.marks`, `client/marks.ts`), a `worn` flag on buildings
  (`client/wear.ts`), a laden cart (`look: 3`), and two paint-only round kinds (`crows`, `moths`,
  `client/streetlife.ts`). Wrecks sit clear of doors and patrols (the town reach test covers a fully
  mended town too).
- **New works, all gold, all seen:** Wash the Square 60 (blood, crows and the dead cart go, fresh graves
  by the church), Clear the Lanes 150, Mend the Shutters and Roofs 200, Lanterns along the Lanes 120
  (eight lit posts), the garden in three stages (Clear and Dig 80, Plant the Beds 120, Benches and a
  Lamp 160), the wall in three (Stakes for the Breach 150, A Timber Wall and a Walk 350, Stone for the
  North Wall 800). Stages are separate ids with `after`; a stage opens only when the one before is done.
  Gifts never overshoot what a work still needs. The first three works are unchanged.
- **The TOWN WORKS panel** (`client/worksui.ts`): Hollis, your gold, a dim line of what's done, then one
  button per open work with its progress (mending first; only the next stage of a line). Tap for what it
  is, GIVE 25 / GIVE n, and for the defence works (`arms`: the watch and the three wall stages) GIVE GEAR,
  the gear flow from main moved there.
- **Raids** (`shared/raids.ts`): from day 10, never within 6 days of the last, a 15% chance a day, and
  only once the town has two mended things to lose. A raid always brings the blood back (if the square
  was washed) and pulls down one more (two once five are standing): only the top stage of a line (the
  garden loses its newest stage, the wall drops back one), never the watch, the Old Quarter, the sewers,
  and never stone. Recorded in `world.raids` (newest four).
- **Who decides a raid:** it's rolled in `contribute` as days pass, seeded by the day, so it's the same
  everywhere. For a shared world only the world server rolls it (the browser passes `raids = false` while
  online, and takes the server's world back); off the server, the browser rolls it for its own world.
  Days pass per finished run, as gold does, so a busy world is raided more and mends faster in
  proportion. No server change was needed.
- **The town talks** (`shared/townsays.ts`, lines in `shared/mendlines.ts`): a fresh raid (3 days), then
  a work finished in the last 4 days (`world.mended`, kept in `contribute`), then on two days in three how
  the town stands (broken, mending, mended with the garden in flower), or after any raid, Wenna and Dunn
  remembering it. Old Wenna, Tam, the gate guard, Dunn, Hob, Pike, Orla, Rowan, and Widow Perrin (new, in
  the garden; her line follows its stage, and of an evening once there are benches). The first time you
  see a raided town Dunn tells you (`client/raidnews.ts`, once per raid per device), and the job board's
  DONE LATELY says when it was hit.
- **The garden at dusk:** once the benches are in, a soft lamplit pool over the benches and beds and
  moths round the lamp after dark.
- Not done: barks when walking past a newly finished work (there's no bubble system yet); a raid you
  fight in town.

## 2026-11-01: winded (Kyle; Opus 5.5)
- Run stamina all the way out (a dodge, a block, a guard break) and you're winded: the bar flashes red,
  nothing comes back for a second (`HERO.windedDelay`), and there's no dodge, blink, block or parry until
  the bar is full again.
## 2026-11-01: Wickhold's ground, and a town alive under siege (Kyle; Opus 5.5)

Kyle: the square is too uniform, all cobbles; add gallows and a gravedigger shifting the bodies; make
it seem more alive and under siege. Less is more for new lines.

- **The ground** (`shared/ground.ts`, painted by `client/groundpaint.ts` as more floor marks): old
  flagstones worn into the cobbles round the Lantern and the well; packed earth where carts turn inside
  the gate, by the square's cart, the tavern and the west lane; wheel ruts down the gate road and along
  the lanes; paths worn corner to corner (square to tavern, to barracks, to the forge, to Rescue Row); a
  drain down to the sewer grate and along the north lane; puddles; straw by the stalls and the tavern;
  weeds along the walls and edges. Fixed data, each mark painted from its own seed: the same on every
  screen. Washing the square takes its broken cobbles; clearing the lanes takes the churned mud, the
  lane holes and the spent arrows under the breach. The rest stays when fully mended.
- **Under siege** (`shared/siege.ts`, drawn in `client/siegedraw.ts`): a gallows at the square's east
  edge with an empty noose and a crow on the beam (empty, not a hanged goblin: the bible has Wickhold
  taking nobody and the horror in absences; the lore keeper can change it). Gravedigger Cobb walks
  Odric's cart to the churchyard with the dead over his shoulder, digs a while, goes back; once the
  square is washed he only tends the graves. The Tulls, burned out of the north lane, round a new
  brazier inside the gate till the shutters and roofs are mended (not refugees: those wait outside the
  gate for the council). Goodwife Mab drawing water at the well; Recruit Wat at the whetstone by the
  barracks. Wicker hurdles either side of the gate road till the timber wall is up. Smoke past the north
  wall; a dog nosing along the south lane.
- New NPC fields (paint only): `Npc.work` (what they're busy at) and `Npc.mute` (background people: no
  mark, nobody to talk to). Two block kinds (`gallows`, `hurdle`), two round kinds (`dog`, `smoke`).
  Nothing blocks a door, a spot or a patrol; the reach test covers it.

## 2026-11-01: the ground is mostly earth and mud now (Kyle; Opus 5.5)

The square still read as one cobble grid with a flagstone patch. The ground is now made of materials
in big soft-edged shapes (`GameMap.soil`, `shared/ground.ts` `townSoil`, painted by `client/soil.ts`):
mud everywhere first, packed earth over the square, the gate yard, the market and the lane mouths; the
cobbles survive in islands and strips over that (round the Lantern and the well, along the building
fronts, the old road down from the gate, a spine down each lane); then wear over all of it (a track
worn corner to corner across the square, mud fans where carts turn, wet round the well, straw under
the stalls, ash round the braziers). Edges are broken by seeded value noise; the material is decided
per 4x4 pixels and coloured per 2x2, written straight into the floor's pixels once per map (about
50 ms). Each material has its own colour family, dark for the stepped lighting. Washing the square
sweeps its earth and relays three more cobble islands; clearing the lanes sweeps bands of lane mud,
widens the cobble spines and takes the cart-turn mud fans. The small marks (flagstones, ruts, drains,
puddles, weeds, missing cobbles, arrows) stay on top; the earth, path, mud and straw marks are gone.

## 2026-11-01: the Roll as a leaderboard (Kyle; Opus 5.5)
- Two sides, THE BRAVE and THE UNLUCKY, each a card per tally with a podium of the top three (their
  faces), places four to ten below, and your own count if you're not on it (`src/client/rollui.ts`).
- New tallies, counted per player in a run and kept on the shared Roll online: butchers killed, gold
  earned, friends picked up; and on the unlucky side times knocked down, picked up by friends, friends
  floored. Old heroes start the new tallies at nothing.

## 2026-11-01: back to 1x sprites (Kyle; Opus 5.5)
- The 2x jointed figures were reverted (Kyle: "doughy and soft", and the idle bob jumped about; the 1x
  look was grittier). The work stays on branch `juice` (97ffc72) for reference. The anticipation and
  payoff pass from before the 2x step stays in.
## 2026-11-01: the freed can be hurt, and are only saved once you get them out (Kyle; Opus 5.5)
- Breaking a cage puts its person in the room as a body (`sim/survivors.ts`, tuning `SURVIVOR` in
  `shared/props.ts`): 24 health, they stand a moment, then follow the nearest player at a slow walk a
  gap behind, step out of a hero's way (heroes never push past them), and wait where they are with
  nobody near. Goblins ignore them for now. They're in the room's state, so guests see the same people.
- Everything of the party's that can hurt a friend hurts them, at full weight and solo too
  (`sim/survivorhits.ts`): swings, arrows and spells, blasts, a slammed barrel, the oil going up, a
  javelin, goblins and props flung into them, the shield charge, and fire caught from burning goblins
  and buildings. A holy smite, the net and the hound spare them. The blow that breaks the cage doesn't
  land on whoever's inside. Killed, they fall and stay where they fell.
- Freed is not saved (Kyle: bring them out, don't babysit the whole job): they count as brought home
  (`survivorhome`) once walked out of the house they were caged in, or, caged out in the open, back to
  where the party came into the room. Then they walk off and are gone. A rescue job's goal now waits on
  them. Stepping out of a house with someone, a third of the time 2 or 3 goblins (more for a bigger
  party, at most 5, some lungers or shields) are waiting by the door (`sim/ambush.ts`, the room's own
  seeded stream).
- The Roll: RESCUES STRUCK (blows landed on the freed) and RESCUES KILLED take the place of PICKED UP
  BY FRIENDS on the unlucky side (`carried` is still counted, off the board). Counted per hero id in the
  run so a friend's game reads its own; the job's end now swaps ids for a guest the way patches do.

## 2026-11-01: the Rogue throws a dagger (Kyle; Opus 5.5)
- The daggers' held attack is a thrown dagger instead of the power thrust: 14 damage, 30 at full,
  8 tiles, tumbling in flight and sticking where it lands (`shot: 'knife'`).

## 2026-11-01: the Mage casts (Kyle; Opus 5.5)
- The Mage's tap spell is a cast: about half a second rooted in place (wind-up 0.3 to 0.36 s across the
  three kits). Burning hits harder to make up for it: 7 every half second for 3 s (was 4).

## 2026-11-01: bigger parties, better rewards (Kyle; Opus 5.5)
- Each extra player adds a quarter to a won job's pay and its objective xp (`PARTY.reward`); kill gold
  and xp already grow with the extra goblins. Two or more players each find one more piece of
  treasure; three or more roll it a cut above.

## 2026-11-01: finding your way on a job (Kyle; Opus 5.5)
Kyle: he didn't know how many were left to rescue, the people he freed didn't follow him out of houses,
and he couldn't tell when or where he could leave.
- **The freed came out in the wrong place.** Walking out of a house moved them to the street, but they
  were pushed against the house's map (the map in use at that moment), so they turned up across the
  street, counted as home at once and walked off without being seen. They now come out by the door
  behind you (the street's own tick settles them), with SAVED over them, then walk off toward the way in.
  Tested through the real door, alone and with a friend leading them.
- **The goal counts people** (`sim/goal.ts`, moved out of run.ts): "2 to free, 1 to bring out", plus
  "3 more in the houses" for anyone caged indoors (extra, never needed: on a rescue, every house has
  someone; that would be seven in a village). Anyone freed, indoors or out, has to be brought out
  before a rescue's way home opens. A friend's screen shows the leader's words and count.
- **The way out is plain** (`client/wayout.ts`): a gap painted in the back wall where the way on is;
  stakes across it while it's shut; once open, light in it, a torch either side and gold chevrons
  running into it; a sill, light and chevrons at a house's door. The goal names it ("Way on: north",
  "The larder is ruined. Way home: north"), "WAY ON: NORTH" / "WAY HOME: NORTH" / "PICK A ROAD" rises
  over you the moment it opens, and the wood's gold arrow at your feet points the way on a job
  (`client/wayfind.ts`): the cage, out of the door once someone's freed, back to the way in with
  someone freed out in the open, then the way on. Someone freed and left out of sight gets a pale mark
  at the screen's edge. Every kind of place has its way out at the top middle (forks: two at the top);
  a test floods each from the way in and checks nothing stands in front of it.

## 2026-11-01: the job board, and story missions need a party (Kyle; Opus 5.5)
- The board lists each job on one line: its kind, the place, its length, how hard (five pips:
  ruin, length, night, deep, story) and the pay. Tap one for the rest and the buttons.
- Online, a story mission needs a party of three (`STORY_PARTY`): no GO ALONE, and the party can't set
  out short-handed. Off the shared world (and in the one-file build) it can still be taken alone.
## 2026-11-01: what the goblins do; wrecked, blocked and burning houses (Kyle; Opus 5.5)

- Big houses on long and deep jobs (now and then deeper into a medium one): a longhouse (two or three
  rooms off its hall, each through a doorway), a manor (a hall with a long table and a back wing walled
  off it: a bedroom and a store), a tithe barn (posts, grain bays, bales, a cart). The door and the
  way out stay at the bottom middle.
- What the goblins left, paint only, laid out from the house's seed (shared/grim.ts): bodies torn apart
  with pieces strewn, a body dragged across the floor, one tied up on the back wall and opened, one hung
  by the ankles from a rafter hook, a cook-pot on their fire with a hand or a foot in it, a heap of bones
  and clothes, what's left of the last one by a cage, bloody handprints, a count scratched in fives
  (the rumour about captives' marks). More of it the worse the place and the deeper the job; about a
  third of houses at ruin 1 (still some at the worst) stay quiet. Goblins still at the dead are the
  existing feeding goblins over a corpse.
- Fates on the street, more of them the worse the place: wrecked (a gable end down, the roof caved, beams
  and rubble spilled; inside, rubble heaps and the sky through the roof), blocked (fallen in across the
  door: no door, no prompt), burning (smouldering outside, never spreading). A caged person is only
  ever inside a house you can enter.
- Inside a burning house (HOUSEFIRE in tuning.ts, judged in sim/blaze.ts, drawn from the same plan):
  patches smoke for 3 s then burn whoever stands in them (14 a second, 4 at a time); beams come down
  every 5 to 7 s on a striped circle (1.6 s warning, 22 damage, a roll gets you out); between 52 and
  64 s the roof falls in after 10 s of falling dust: everyone inside is thrown out the door hurt (never
  below 1 health), the freed with them, and anyone still caged is lost (`run.lost`). Fire never touches
  the doorway or the way from the door to the cage. The house is rubble in the street once it falls.

## 2026-11-01: small fixes (Opus 5.5)
- Knock-downs, pick-ups and friends floored are counted per player in a run, so a friend following a
  job gets their own tallies, not the leader's.
- The results say how many were lost to a fire.
- On a job, the banner fades when you're near the top of a room so it doesn't hide the way on.
## 2026-11-01: places with a plan (Kyle; Opus 5.5)

- Every place on the board is one of twelve sorts (shared/sites.ts): Barrowby a village round its
  green (cottages facing the lane, yards and fences, kitchen gardens, the well and a shrine, strip
  fields and hedges at the edges); Tollan's Farm a farmstead; Lowfurrow Fields fields cut by tracks and
  hedgerows; Fennick Ford a better-off street (stone terraces, gutters, a walled garden, a courtyard,
  a fountain or market cross, stalls, a gatehouse); the Charcoal Camps and Brokenbridge shanties
  (shacks and tents along a twisting muddy path, cookfires, washing lines, a latrine ditch; charcoal
  clamps in the wood, the broken bridge by the river); Hesketh Hall a manor's grounds; Ketterby a
  village gone to ruin; Hangman's Wood a wood with its clearing and gallows; the Copperdeep Shafts a
  gallery; the Sheepwash a riverbank with sheep pens; the Peat Cuts water in rows; Sallow Carr a
  willow carr. A place not on the list gets its kind's sort.
- A place's plan is seeded by its name and the room, not the job, so it looks the same every visit;
  the job's seed still places the objective, goblins and chests. The objective is placed first and the
  plan drops whatever would land on it, the way in or out, the forks' roads, raised ground or water,
  or the clear line up the middle.
- The ground comes from soil shapes (grass, ploughed furrows, standing grain, earth, mud, gravel)
  over each place's floor. Enemy rolls, themes' light and torches are untouched.

## 2026-11-01: jobs at any hour, and spiders (Kyle; Opus 5.5)
Kyle: maps don't always have to be night, and other enemy types, like spiders that come in waves and poison.
- **A job's hour** (`shared/timeofday.ts`): dawn, day, dusk or night, rolled from the job's own seed on its
  own stream (the rest of the board is unchanged). Night is still the twist with its extra pay; a quarter
  of the rest are dawn, a quarter dusk, the rest day. The room is lit through the same pass as the town:
  the place's own tint mixed toward the hour's sky as far as the place lets the sky in (a forest less, a
  mine not at all), `torch` scales torches, braziers, posts and lanterns (day 0.35), dusk stretches every
  shadow east, dawn lays mist bands over the ground. The board shows the hour as one word on each line
  (". At night" left the detail). Old saved jobs read as night if they were night jobs, else day.
- **Darkness and stealth**: nothing judged depended on the dark before. Now a resting goblin's sight is
  0.8 of itself at night, 0.9 at dawn and dusk; a censer's glow gives a Healer away half as far by day.
- **Spiders** (`shared/spiders.ts` numbers, `shared/nests.ts` where, `sim/spiders.ts`, `sim/poison.ts`,
  `sim/puddles.ts`): in forests, marshes, mines and ruins only (never villages, farms, fields, rivers or
  under Wickhold), 25% a room plus 12% a room in, 5% a point of ruin, 15% on a deep job. A room with them
  gets a nest (two from the third room, or on a deep job) with two spiders on it, and two fewer plain
  goblins a nest. A nest wakes when a hero comes within 8.5 tiles (or it's hit), hatches 3 spiders 1.2 s
  later and every 8 s after while fewer than 7 of its own live; it counts toward clearing the room ("Clear
  the room (N left)" while spiders are about). A spider: 14 health, fast, zigzags in, circles while it
  gathers itself, pounces 2.4 tiles along a shown lane (blockable, parryable) for 5 and a stack of poison.
  The brood mother (from the third room, the second on a deep job, 40% plus 30% deep): 240 health, slow;
  a bite (14) up close and, from 2.8 to 7 tiles, a lobbed glob at where you stand: a striped circle that
  lands exactly there for 10 and leaves a poison puddle 5 s. She hangs back in spitting range.
- **Poison**: up to 3 stacks, 2 a stack a second, never the last point of health; a stack wears off 5 s
  after the last bite, then one every 1.5 s. A Bitter cures it; a Healer's heal takes a stack off. Green
  cast and drips on the hero, the health bar goes green. Synced to friends on the hero and puddles as a
  collection.
- **Weaknesses** (`WEAK` in shared/spiders.ts, read by `damage()` and melee): spider fire 2.5, storm 1.2;
  brood fire 1.8, blades 0.9; nest fire 3, blades 0.6, frost 0.5, storm 0.8. WEAK pops over a hit on one.
  Fire spreads between spiders half a tile further than between goblins, and a burn tick kills a spider.
  Spiders give xp (3; nest 20; brood 60) but no gold or loot and don't count as goblins killed.
- In a party, nests aren't copied (their waves grow by one a player past the first, and their cap with
  them); the brood mother isn't copied and gets tougher like a named one.

## 2026-11-01: trainer ranks level locked and dearer; a trainer screen you can read (Kyle; Opus 5.5)

Kyle: "trained abilities to be level locked and cost more", and the screen was "a pain to understand".
- Every rank has a level (drills.ts `levels`): power, health, speed, critical and breath at 2, 4, 6,
  8, 10; skill at 4, 7, 10; technique at 5, 8, 10. Prices doubled on the same curve (power 80, 245,
  465, 735, 1050). The whole set is about 17,800 gold, a long road past the chapter's level cap.
- The class skill lesson moves to level 3 for 150 gold; a Ranger's snare and a Mage's image to level 5
  for 250. Class sheets read the levels from drills.ts so they can't drift.
- The rules live in shared/training.ts (`drillState`, `buyDrill`, `learnLesson`); the game only calls
  them, so a buy refuses below the level, without the gold, or before the lesson it needs. Ranks a hero
  already has above the new levels are kept; they buy on once their level catches up.
- The screen (client/trainerui.ts, rows from shared/trainrows.ts): level, an experience bar and gold
  on top; picks waiting first (tap to take); then SKILLS (the lessons, and the Warrior's CARRY choice)
  and TRAINING, one row each with pips (filled, open, hatched for a level not reached), what the next
  rank adds, and a price, LEVEL n, NEEDS SKILL or MAX. Buyable rows are gold-edged; locked ones dim.
  Tap a row for NOW and NEXT, every rank with its level and price, and one buy button.
- The greeting is one line at most: the grown line when picks wait, or Isolde's coal line.


## 2026-11-01: each hall its own place, inside and out (Kyle; Opus 5.5)

Kyle: the wizard tower doesn't look very wizard-towery outside or inside; personalise each hall.

- **Inside** (`shared/townhalls.ts`; `interiors.ts` hands the town's halls to it): the tower has
  bookcases, a star chart, a stair curling up, a desk of books and jars, a chalked circle and a brazier
  of coloured fire, and Magister Vell has a tall hat; the barracks racks, shields and a banner, bunks,
  a map table and a dummy on strewn rushes; the lodge bows, antlers and pelts on the wall, a skinning
  bench, a bear hide, the hounds' bowls; the church candles, a runner up the aisle, coloured windows and
  Mother Isolde's cot; the Drowned Rat casks, the dice table, Whisper's curtained booth, its sign and
  notices, sawdust; the forge bellows, a quench tub, tools and horseshoes, soot; the town hall the
  council desk with its ledgers, the valley map, notices, a rug; the infirmary herbs drying, a basin, a
  candle stand. NPCs stand where they stood (the trainer panels are untouched).
- **New pieces:** twelve furniture kinds (`client/hallsdraw.ts`), two live rounds (`candles`,
  `witchfire`, lit by the scene: candlelight, and fire that drifts violet, green and blue), seven floor
  marks (`client/hallfloor.ts`), and `GameMap.hangs`, things on the back wall (`client/hangs.ts`).
- **Outside** (`client/exterior.ts`, by door, on labelled town buildings): the tower round and shaded,
  a crooked slate cone with a vane, slit windows lit odd colours and coloured smoke from its flue; the
  barracks shields and a banner; the lodge logs, antlers, pelts, a bow; the church a round window and an
  empty belfry (the bell went for arrowheads in the siege); the Drowned Rat casks and a lamp; the forge a
  chimney stack that smokes and sparks, horseshoes, a quench barrel; the town hall notices, its banner,
  worn steps; the infirmary herbs under the eaves and a lamp.
- `tests/halls.test.ts` floods each hall from the door and checks everyone and the way out can be
  reached, and that each is the same every time with its own pieces.

## 2026-11-01: the quick channel, and each element a job (Kyle; Opus 5.5)

Kyle: the channel isn't much fun, and there's no reason to switch element unless goblins resist some
and fall to others. His call: give each element a job.

- **The channel is a quick switch** (`CHANNEL` in `shared/magic.ts`, `sim/channel.ts`): a tap turns
  the spells to the next element at once (fire, frost, storm), a short flourish, back in 1 s. No
  standing still. The reward for committing: the first spell after a turn is **primed**, x1.5 (more
  with the Mage's technique, now **FIRST SPELL**, +20% a rank, was QUICK CHANNEL). The skill button
  reads the element now (FIRE, FROST, STORM) in its colour, and the Mage's casting light and tip glow
  take that colour; a primed Mage has motes circling and a brighter light until the spell goes.
- **Each element's job**: fire burns and jumps further between goblins (`BURN.spread` 0.3 to 0.7),
  for crowds and spiders; frost slows feet and now wind-ups too (`FROST.windup` 0.6, locked in the
  attack's own clock so the telegraph fills at the judged pace), then freezes for a shatter, for the
  big and the quick; storm chains further and to more (3 within 3.8, 0.7 a jump) and goes round a
  shield's board, but a Mage's storm spell lands 0.8 on the first goblin.
- **One table for every foe** (`shared/weakness.ts`, read by `damage()` and the melee path): rows by
  variant, bow, named butcher (boss) or kind. Looters, drummers and spiders burn; lungers, butchers,
  bosses and the Stoker take frost hard (the Stoker shrugs fire, 0.6); brutes resist blades and frost
  a little; hexers and shield goblins fall to storm. Numbers 0.6 to 1.8 (the spiders' older 2.5 and
  the nest's 3 left as they were). **WEAK** pops in the colour of what landed it, **RESIST** small and
  grey, at most one per foe each half second (`WEAK_POP`), never on a burn's tick.
- Steam, shatter and flare unchanged; the three kits keep their shapes (wand sparks, staff orb, rod
  lance); relic augments go through the same table.
- `tests/elements.test.ts`: the switch and its cooldown, the primed spell, every table entry through
  `damage()`, the brute resisting a blade, the pop limit, storm round a shield, fire jumping a gap.

## Going down in a party, and a leader out of sight (2026-11-02, Claude Opus 5.5)
Kyle and a friend's first online job: Kyle died, the Cleric's smite didn't help (it doesn't heal;
every third mace blow does), the friend didn't know how to get him up, then the friend froze.
- Getting someone up is a button now: GRAB by a friend who's down (HELP UP on a phone, G on a
  laptop) kneels you there 2.5 s (a Cleric twice as quick). A hit, a swing or walking off stops it.
  Standing over them alone no longer does it.
- Nobody comes in 20 s: you get yourself up, once a job (`Hero.selfUp`, carried room to room).
  Raised by a friend, it isn't spent. The next time nobody comes, you're out till the job ends and
  the rest carry on (everyone out: the job is lost). The banner's heart in a party is that get-up.
- The freeze: the relay log shows the friend's game trying to take the job over at 2:15 in, refused
  because the leader's page still pinged. The leader's page had stopped drawing (out of sight), and
  the room only ran on drawn frames. Now a leader's room runs on a timer when the page is hidden,
  catching up in 0.1 s steps; and a refused takeover goes back to following the leader instead of
  running a copy of the job alone.
- Laptop grab key is G: the lesson and Hew's card said F.

## 2026-11-02: slower levels and loot, the knacks tree, class-true offers (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: purple loot and levels came too fast; he liked picking one of two
on a level up and wants to see it grow as its own place; a Rogue was offered "on block" and "on parry".

- **Measured first** (a seeded sim of a typical hero's first jobs through the real room plans, bounty,
  drop, chest and treasure code; 40 seeds). Before: solo level 3 after one job, 5 after three, 10 after
  eight; about 24 Tolmouth (purple) pieces in 15 jobs, the first around job 2. A party of three reached
  level 10 in five jobs with 38 purple.
- **Levels** (`shared/progress.ts`): `xpFor` is now 250, 780, 1590, 2680, 4050... (12330 for 10), and
  kill, rescue and objective xp roughly halved. Solo: level 2 after one job, 3 after about four (the
  trainer's skill), 5 after about ten (the leave-behind), 6 at 15, about 9 at 30. Trainer ranks at
  2/4/6/8/10 land every few jobs. Saved heroes keep their level.
- **Parties** (`shared/pace.ts`, `jobXp`): a party fights more goblins and every kill paid everyone in
  full. Now the room's xp is shared for the party's size, plus 15% a player past the first: a party of
  three earns about 1.15 to 1.25 times a solo job. Gold is unchanged.
- **Loot** (`shared/gear.ts`): new odds; danger lifts a roll only as far as Forged (`LIFT_TO`), so
  Tolmouth and Hungry are found, never lifted into. Purple is 2% from chests and butchers, 10% from a
  named butcher (the treasure of long and deep jobs). Solo: about 2 purple in 15 jobs, 4 in 30, the
  first around job 6 or 7; a party of three about 3 in 15. Blue (Forged) is what deep jobs now pour out.
- **The tree** (`shared/perks.ts`, `shared/chains.ts`): four chains of three steps a class, BODY and
  BREATH shared, then its guard or its feet, then its trade. Warrior: GUARD, WEIGHT. Healer: GUARD,
  MERCY. Ranger: FEET (jump, parry, speed), BOW. Rogue: FEET, KNIFE. Mage: BLINK, SPELLS. A level up
  offers the next step of two different chains; 12 steps and 9 picks to level 10, so not everything.
  Every knack is a number the fight already reads: gear-named ones fold into `statsOf` with gear and
  drills; `knack(h, k)` for down, block, rear, bless, counter and winded.
- **Old heroes**: the old perk ids are steps on the chains, so they stay lit. One the class can't use
  (a Rogue's GUARD, a Warrior's FOOTWORK) comes back as a pick (`fitPerks`, run on load).
- **The screen** (`client/treeui.ts`, `tree.css`): KNACKS, the level bar, then a row per chain: taken
  steps gold and linked, the two on offer green and glowing, each chain's next step blue, later steps
  dim and dashed. Tap a step for its words. Opened from the pack (KNACKS, with a ! while a pick waits),
  from a job's end when you've grown (SEE KNACKS), and from the trainer, still the one place a pick is
  taken (my call: the trainer's lines and "find your trainer" stay true; one flag, `take`, to change).
- **Class-true offers** (Kyle: "the Rogue can only dodge"). Filtered, not swapped, for gear: PARRY
  needs a parry, GUARD a held block, DODGE a dodge button (`modFits`, used by rolls, rerolls and hungry
  pieces); RIPOSTE and BULWARK need a parry and SIDESTEP a dodge (`traitsFor`); REAPER reads "A backstab
  that kills heals you" for a class with no parry. Swapped for knacks: FOOTWORK says the class's own
  dodge (Dash, Jump, Blink), and the chains only hold what the class does. The item card and hero sheet
  hide PARRY WINDOW, THROUGH A BLOCK and DODGE EVERY for a class without them; the sword and spear lines
  and the armor lines no longer promise a Warrior a roll. Relics and augments had nothing to fix.
- `tests/knacks.test.ts` walks every class through 40 pick paths to the end of the tree, checking each
  offer is two chains' next steps and nothing the class can't do, and rolls gear, rerolls, hungry
  pieces and treasure for every class, and reads the trainer's rows for every class.
- New words (for the lore keeper and line editor): KNACKS button and title; SEE KNACKS, SEE THE TREE;
  chain names; the new knacks SCARRED, LONG WIND, COUNTERSTROKE, FLEET, SLIPPERY, HEFT, HEAVY HANDS,
  KEEN, LONG SHOT, QUICK HANDS, DEEP CHARGE, POTENT, MENDER with their lines; the tree's notes.

## Level ups, Wall Brandy, and every shop laid out one way (2026-11-02, Claude Opus 5.5)
Kyle: a level up gives full health and a flash in the class's colour; townspeople stop explaining
things they don't sell; shops say what the place is, then the keeper and their lines, then the goods
as a list with a card on tap; Wall Brandy doubles damage and halves speed and stamina.
- **Level up in the room** (`sim/grow.ts`): the player's own game counts levels and sends `levelSeq`
  (a press counter, optional so older guests still read). The room fills that hero's health (not if
  they're down) and pushes a `levelup` event with the class, so the whole party sees it. Levels are
  only paid at a job's end, so on a job a level is lit the moment it's sure (`dueLevels`: what a lost
  job would still pay: the kills and rescues so far, shared for the party); any the job's own pay adds
  are lit back in Wickhold, seen by you only (the town has no shared room; townfolk don't carry it).
- **The flash** (`client/fxlevel.ts`, `LEVEL_GLOW`): rings at the feet and chest, a halo opening slowly,
  sparks, motes rising and a column of light, a light flash and LEVEL UP. Warrior gold and steel,
  Ranger green, Rogue dark violet with smoke-black wisps and a dim light, Mage arcane blue and violet,
  Cleric the Lantern's gold. A short rising chime (`sfx.levelup`).
- **Wall Brandy** (`sim/brandy.ts`, numbers in `POTION`): for its 6 seconds, blows and shots
  (melee in `combat.ts`, shots and spells in `room.loose`) x2, walking x0.5 (the follower's prediction
  too), and breath capped at half (current breath drops to half, comes back to half; winded clears at
  half). It no longer fills breath. Relic and skill damage (javelin, hook, smite zones) is not doubled.
  The card says "breath", not Kyle's "stamina": players never see "stamina" (story bible).
- **Potion lines** short and true: Bitter "Heals 40 over 2 seconds and cures poison." (numbers from
  POTION), Brandy Kyle's line with breath, Oil Kyle's line, Frost "Chills what it splashes. A second
  splash freezes.", Smoke "Hides anyone in it from goblins, unless they're close." The card adds
  "Lasts 6 seconds." for Brandy and "Thrown where you aim." for Frost and Smoke.
- **Moll** plays dice and nothing else; the smoke line and SMOKE button are gone from her table.
  Smoke is now Gannet's, over the bar, with Brandy and Oil (my call: it had to be sold somewhere; the
  belt's empty line now names Agne, Gannet and Ivo). No other panel explained something its keeper
  doesn't deal in; every potion explanation now lives only in that good's card.
- **Shops** (`client/shopui.ts`, `shopwords.ts`, `shopgoods.ts`, `shops.ts`, `stores.ts`): the title
  is the place, then its line, the keeper's name, their lines, FOR SALE as rows (picture, name,
  price), then anything else the place does. Tap a row: a small card with what it does, the price,
  BUY (or why not), and for gear, what you got afterwards. The Drowned Rat, the infirmary, Dessa's
  stall, Ivo's bench (frost flasks and rerolls as goods; relics and the shut elements under it), the
  Counting House (more shelves, then vault and pack), Tobin's stall (buy-backs and a bigger pack as
  goods, then SELL FROM YOUR PACK), the forge (Halvard's rack as goods, then the anvil; the separate
  rack panel is gone). The church sells nothing, so it's unchanged; Moll's dice too.
- `tests/grow.test.ts` (heal, once a level, a friend's level, down stays down, the sure-level rule) and
  a Brandy test in `tests/potions.test.ts` (x2 damage, half walk, half breath, all back after).
  `scripts/shops.cjs` screenshots the shops and both flashes.

## 2026-11-02: three skills a class, and training in sections (Kyle; Claude Opus 5.5)

Kyle: "it sucks that there's only one or two available per class. Let's try to think of 3 per class.
Beyond that, I want training to be its own expandable / collapsible area."

- **The fifteen** (`shared/magic.ts` SKILL_CHOICES, numbers in `shared/skillkit.ts`, lines in
  `shared/skillwords.ts`). Each changes how the class plays and sits at a cooldown like the first's.
  Warrior: SHIELD CHARGE (move), WAR CRY (pull the room to you), SHIELD STAMP (a ring around you, 0.35 s
  windup, 2.6 tiles, 16 damage, small ones flat 1.4 s, big ones stagger, 14 s). Ranger: HUNTER'S NET
  (snare), VOLLEY (a spot up to 8 tiles off; after 0.7 s arrows fall there every 0.3 s for 2.4 s, 5 a
  fall in 2.2 tiles, small ones held flinching, 18 s), SEND THE HOUND (the hound runs 1.8x at the goblin
  you face within 9 and pins it 2.6 s, big ones slowed, 16 s). Rogue: SHADOWSTEP (get behind), VANISH
  (smoke at your feet: no goblin sees you, even close, for 4 s or till you strike; blows wound up at you
  dropped; small ones in 2.2 tiles cough 0.8 s; 18 s), KNIFE FAN (five knives across 1 radian, 11 each,
  12 s). Mage: ELEMENTAL CHANNEL (switch), FIRE RING (2.6 tiles, 12 damage, thrown off and set alight,
  burns on 4 s lighting anyone who walks in, 16 s), STORM TETHER (the goblin faced within 7, struck for 6
  storm every 0.5 s for 4 s, jumping on to those near it, snaps past 9, moves on when it dies, 16 s).
  Carrying the ring or the tether, a Mage's spells are fire (my call: the Channel is what changes them,
  so giving it up is the price). Cleric: SANCTUARY (ground and ward), CENSER CHAIN (hauls the friend
  most hurt within 8, or the one you point at, to your side blessed 3 s; alone, it drags in the small
  goblin you face, reeling 1 s; 14 s), LANTERN LIGHT (0.3 s windup, 3 tiles: 12 damage and 12 mending,
  both growing with coals like every heal, small ones blinded 1 s, 18 s).
- **The room decides**: one dispatcher (`sim/skills.ts`) fires and steps them; one small file each
  (`stamp.ts`, `areas.ts`, `sic.ts`, `rogue.ts`, `tether.ts`, `cleric.ts`, `facing.ts`). What they
  leave lives in lists a friend's screen is sent already: zones (now with a `kind`: volley, fire), bolts
  (knives), smokes (vanish), and fields on heroes and goblins (`tether`, `vanishUntil`, `tow`, the
  hound's `pin`). Rings are drawn (`client/skillsdraw.ts`) from the same numbers, while the hero winds
  up; player rings are never red.
- **Taught one by one** (`shared/skillteach.ts`, `SKILL_STEPS` in drills.ts): the first at level 3 for
  150 (the old `skill` lesson), the second at 5 for 250, the third at 7 for 400. A new skill is carried
  at once; changing which you carry stays free at the trainer. Old heroes keep what they had: a Warrior
  taught before today (no `taught` list yet) still knows the War Cry.
- **The screen** (`client/trainerui.ts`, `client/trainsections.ts`): SKILLS, TECHNIQUE (the class
  technique and the dodge's leave-behind), RANKS and KNACKS, each a header you tap. Closed, a header
  says where you stand (CARRYING WAR CRY, 2 OF 3, NEXT AT LEVEL 7; SLAM 1/3; 6 OF 28) and how many things
  inside are READY. Open on a phone the first time: SKILLS and RANKS; after that as you left them, on
  that device (localStorage). A skill row says CARRYING, CARRY, LEARN, or its level, its line, and
  TAUGHT AT LEVEL n FOR n GOLD. Level-up picks stay above the sections.
- New words (for the lore keeper and line editor): SHIELD STAMP, VOLLEY, SEND THE HOUND, VANISH, KNIFE
  FAN, FIRE RING, STORM TETHER, CENSER CHAIN, LANTERN LIGHT and their buttons (STAMP, VOLLEY, HOUND,
  VANISH, KNIVES, RING, TETHER, CHAIN, LIGHT); all fifteen lines in `skillwords.ts`; the class sheets'
  "Later it teaches..." sentence; callouts STAMP, GONE, FIRE RING, PINNED; headers TECHNIQUE, RANKS;
  CARRYING, CARRY, LEARN, READY, NEXT AT LEVEL, TAUGHT AT LEVEL n FOR n GOLD; the carry note.


## 2026-11-03: setting a house alight (Kyle; Claude Opus 5.5)

Kyle: "Instead of going into a building that's a small house, you can firebomb or light the house on
fire. It goes up over time, smokes, and flushes out or kills things inside ... Con: maybe there are
prisoners in there. You cannot enter a flaming house." Then: "Not right at the door; maybe a spot to
the side that glints a little as you get close, but always the same spot ... Also a Mage can
accidentally burn it down, ditto anyone who throws fire oil."

- **The kindling spot** (`shared/kindling.ts`): every house on a job you could walk into (cottage or
  barn, standing or half fallen in) has one woodpile stacked against a side wall near its front corner,
  side and height from the house's own seed, kept clear of other walls and bushes with room to stand.
  Never at the door. Big houses (longhouse, manor, tithe barn) get one too and are slower: 2.4 s to
  light, 40 s to burn. Dens keep their rules (no spot; fire burns them out as before). Houses already
  burning or fallen in across their door have none.
- **Lighting it** (`sim/kindle.ts`, like a nest: `sim/torch.ts`): within 1.05 tiles GRAB reads BURN (laptop
  G BURN); crouch 1.5 s (a hit, a swing, a dodge or a step puts it out, starting again from nothing).
  State on the block (`lighter`, `lightT`), so a friend's screen has it; the press goes through the grab
  intent, the room decides.
- **By accident** (`sim/catching.ts`, numbers `CATCH` in tuning.ts, rolled on the room's own fire
  stream): a Lamp Oil flask bursting against a house 90% (at its kindling 90%), the oil barrel 90%; a fire
  spell or fire relic's burst against the wall (within 0.4) 75%, the edge of a burst 12%; a spark or fire
  arrow striking the wall 12%; a Fire Ring reaching it 30%; a burning goblin rubbing on it 4% a second; a
  burning neighbour within reach 2% a second. Dens, sheds and fences still catch every time.
- **Burning** (`sim/houseburn.ts`, `HOUSEBURN` in tuning.ts): catches 3 s, burns 24 more (a barn 30, a big
  house 40), the roof comes in: a burnt shell (ruined). Its health falls on that clock, so the flames
  grow (flat and 2.5D; smoke in both). Nobody goes in once it's alight. What's inside comes from the
  leader's game (`client/houseindoors.ts`): a house someone's been in from its room, one nobody has from
  its plan. Goblins choke 2.5 a second until they're out: the awake from 1.6 s, one every 0.9 s; the
  sleeping somewhere in 4 to 14 s (4 to 22 in a big house), so the longer it burns the more die; each
  comes out of the door on fire for 1 s, hurt, alert, into the street (its loot falls there). One the
  smoke has all but killed comes out at 1 health and drops on the doorstep (my call: a body in the
  doorway reads better than a silent count, and its kill and loot land where you can take them).
- **The caged** are lost as the roof comes in: `cagelost`, counted on the run as before, never a failed
  job; each takes 15% off the job's pay (at most 60%), and the result already says "Lost to the fire".
- **Chests in houses** (new, my call: the brief assumed a chest inside could burn, and houses had none):
  20% of cottages, 15% of barns, 6% of looted ones, 40% of big houses have one, on a stream of its own so
  nothing else about the house moved. Burned, it leaves 6 to 14 gold and, half the time, one plain piece
  at the door (`charred`).
- **The warning**: the gold diamond on known captive houses is unchanged; at the kindling of any house
  with someone still caged (`cry` on the block, set by the leader from the plan or the room), a muffled
  cry through the wall and SOMEONE'S INSIDE over the pile, once each time you come up. Accidental fire can
  still take them.
- **A friend inside** (per-player houses): when a house with a room catches, that room burns too (its own
  plan squeezed into the time left: `blazeFrom` in shared/blaze.ts), the smoke hurting 5 a second after a
  4 s grace (it can down you), fire patches and beams as in a burning house; as the roof comes in,
  everyone still in is thrown out into the street (`outOfTheFire` in game.ts). A guest's room is sent
  whole again so the fire shows on their screen (`coop.fresh`).
- New words for the lore keeper and line editor: BURN (button), G BURN (laptop), SOMEONE'S INSIDE
  (`client/kindlecue.ts`). Fx words reused: BURNING.
- Tests: `tests/houseburn.test.ts`; stress scenario 26 (a friend inside when the leader lights the
  house); screenshots `scripts/houseburn.cjs`.
## 2026-11-03: relics fade, the church takes them, and seven kinds to find (Kyle; Claude Opus 5.5)

Kyle: "Relics fade with usage but can be recharged at the church", "We should have more relic types",
elements built into a relic ("rare and more valuable, higher tier, more durable, still fades, but can't
be recharged"), "If you leave a relic higher charged at the church you get something", "Donate two, get
one random one back", relics a rare drop; then "I like relics being interactive with the world also ...
strong based on physics and buff or debuff ... clear that it doesn't have friendly fire".

- **Relics are items** (`shared/relicitems.ts`): id, kind, tier, element or none, charge. Plain tier 1
  holds 24 uses; elemental tier 2 holds 36; LOUD elemental (tier 3) 48. Every use spends one (the room
  spends it as the relic fires, `sim/charge.ts`); at nothing it's DARK: the RELIC button greys, a press
  says DARK and does nothing, and it's kept. The class skill has no charge. Saves migrate: every old kind
  owned becomes a full plain relic, still carried (`fitRelics`, in `client/save.ts`). Ivo's element
  setting stays shut; found relics come with theirs built in.
- **Seven kinds, all sparing friends** (`shared/relickit.ts`, `sim/foundrelics.ts`): JAVELIN (pins),
  GRAPPLING HOOK (now also yanks a barrel, crate or plank back at you, bowling goblins over; heavier
  props pull you), LODESTONE (was an orphan Mage relic; drags goblins in, bursts), GALL BOMB (lobbed,
  2.2 tiles, 16 damage, throws goblins and barrels, small ones dazed 1 s, heavy ones slide less), WIND-UP
  BOW (set down, shoots the nearest goblin in 5.5 tiles every 0.55 s for 7 s, each bolt hobbles: 60% pace
  for 1.6 s), BONE BELL (goblins in 3.4 tiles flinch and drop their swing unless striped, small ones
  pushed back; friends in reach quickened x1.25 for 4 s), BUTCHER'S KNUCKLE (a line 5 long: 12 damage,
  thrown back hard, small ones stunned 0.9 s, every goblin hit MARKED: the next blow from anyone x1.5).
  Each buffs friends or debuffs goblins. Cut from the brief's examples: tooth, cinder, heart (a fire
  patch and a heal didn't act on the world).
- **No friendly fire, and you can see it**: relic shots and blasts carry `relic` (sim/bolts.ts) and never
  hurt a friend or anyone freed; a friend inside a blast or the knuckle's line gets SPARED in warm white
  with a gold flicker; every relic telegraph and area is gold (the lodestone's purple well too), never
  the goblins' red; every relic card says SPARES FRIENDS. Tests prove no damage, no shove.
- **Rarity**: a named butcher drops a relic 12 in 100 (the room's own seeded stream, `relicRng`, so loot
  and goblins don't shift), picked up by whoever walks over it and carried at once if nothing is. A won
  deep dive surely gives one: a kind you lack (plain, full), else any. Any rolled relic is elemental 15
  in 100, and LOUD 30 in 100 of those (about 4.5 overall). The wood still gives the javelin.
- **The church** (THE STEP, from Father Odric's RELICS button; `shared/church.ts`, `client/churchrelics.ts`):
  RECHARGE a plain one, 3 gold a missing charge (a dark plain one 72); Isolde takes it round to the
  Lantern. Elemental ones are refused. LEAVE IT: the relic's gone and you carry the church's light for
  jobs: floor(fill x (3 + tier - 1) + 0.2), so full plain 3, half 1, nearly dark 0, a full elemental 4,
  a full LOUD 5, adding up to at most 6. Lit: blows land x1.15, and goblins judge you 3 tiles nearer and
  notice you 2 further off (the censer coal's rule, `sim/lantern.ts`). One job spent per job, won or not.
  LIT on the HUD; the job result says how many are left.
- **Two for one at the church, not Ivo's** (my call: the step is where things are given up, and the
  one back is "from what's been left before"). Tap two, see "N IN 100 IT COMES BACK WITH AN ELEMENT",
  leave them. Odds: elemental 10 + 30 per elemental put in + 15 per bright one (75% full or more), cap 85;
  LOUD 20 + 30 per LOUD + 10 per bright. The roll is seeded by the hero's id and their forge count, made
  and saved before the light starts: a reload gives the same relic, the next forge a new one. The forge
  (`client/forgeanim.ts`, 2.6 s, a tap skips): the two drawn in, a column of warm light, relic pictures
  flickering past slowing like a wheel, a flash, the new one turning in the light with its name.
- **Online**: charge lives on the hero in the leader's room (`found`, `relicItem`), so the leader's room
  decides uses; each player's own game writes it to their save as it changes (keepkit.ts, like the pack),
  so a drop keeps what was spent. The church's light is set from each player's own save when the room
  dresses them and spent by their own game at the end.
- New words for the lore keeper and line editor: all of `client/relicwords.ts` (each kind's line, SPARES
  FRIENDS, CHARGE n / n, DARK, LOUD, SPARED, QUICK, MARKED, SLOWED, RELIC, THE STEP, RELICS, RECHARGE (n),
  FULL, LEAVE IT (LIGHT FOR n JOBS), LEAVE IT (NO LIGHT), TWO FOR ONE and its lines, LEAVE THE TWO, CARRY
  IT, TAP TO SKIP, LIT, Isolde's and Odric's lines, Ivo's three on how a relic sounds), the names GALL
  BOMB, WIND-UP BOW (button WIND-UP), BONE BELL, BUTCHER'S KNUCKLE, and "FIRE BOMB"/"LOUD STORM WIND-UP
  BOW" style names; BELL on the bell's ring. "Blessed" is not used for the church's light.
- Tests: `tests/relicfight.test.ts` (charge, dark refusal, each kind, friends untouched),
  `tests/relicchurch.test.ts` (recharge, light, two for one, drops, migration, charge kept). Screenshots:
  `scripts/relics.cjs`.

## 2026-11-03: the town hall votes on its walls, giving a relic up is plain, the way out is lit (Kyle; Claude Opus 5.5)

- **The church step.** LEAVE IT is now GIVE IT UP, and a first tap only asks: the card shows "Gone for
  good. You carry the church's light for n jobs: +15% damage, and goblins come for you first." with YES,
  GIVE IT UP and KEEP IT. A line above the cards says the same before anything is tapped. Two for one
  says both are gone for good and gives no light, and asks the same way (GIVE BOTH UP, then YES, GIVE
  BOTH UP). The light's line is built from `LIT.dmg`, so the number can't drift from the fight. The LIT
  badge on the HUD says it on hover or as a note on a tap (`client/litbadge.ts`).
- **One CLOSE.** The tally panels (Odric's first talk, and Isolde's) had their own CLOSE and the panel's;
  they now keep one.
- **The town hall.** Two boards on the wall either side of the valley map (`vote` hangs), one per choice,
  each with its short name (new `Choice.short`: FARM THEM, TAKE THEM IN) and the names of who voted for
  it; across the top, when it closes ("CLOSES AT 4 VOTES: 3 TO GO"; alone, "YOUR VOTE DECIDES"; then
  what the council chose). There's no clock on a vote, so "closes" is the quorum. Names come from the
  world: `WorldState.voters` (voter, a device, to the name of the hero who last voted from it), set in
  `contribute` (so the server keeps it too; names are already cleaned there). One set of rows
  (`client/voteboards.ts`) is drawn by both views: on the flat glow layer, and in 2.5D on the overlay,
  each row placed on the wall's face by projection (a texture on the wall smeared under the 3D post
  pass). The shelves, banner and notices came off that wall; the torches moved between boards and map.
- **Under the boards.** Alder Bram argues for the plough and Goodwife Sell for the camp (existing
  townsfolk; their usual talk returns once the council has chosen). Voting is still at the reeve only.
- **The reeve across his table.** `Npc.reach`: a person can be talked to from that much further off.
  Hollis has 1.4 tiles more, enough from the near side of the table.
- **The way out.** Every way out of a room (`map.exit`, or roads at a fork: what the room judges you
  leaving by) has a lit threshold on the floor with an arrow out, when it's open: `client/exitmark.ts`
  places it and draws the flat one, `three/exitmat3d.ts` the 2.5D one. It replaced the chevrons.
- **Ivo is busy** for now (Kyle): one line, no panel. Relics are still carried from the pack's relic card.
  His old bench stays in `shops.ts` behind `IVO_BUSY`; the town tip no longer sends you to him for relics.
- New words for the lore keeper and line editor: listed in the report for this change (relicwords,
  storewords FORGE.busy, councilwords).

## 2026-11-03: the council sits a week (Kyle; Claude Opus 5.5)

- Kyle: "it shouldn't be playing alone; the server is anyone who comes into the server, and it happens
  that WEEK." The 4-vote quorum is gone. A council vote is open to everyone on the server all week and
  closes at midnight at the end of Sunday, Pacific (`shared/councilweek.ts`: America/Los_Angeles through
  Intl, so daylight saving is followed). A council opening with under a day left sits the next week too.
- At the close the most votes win and the effects land then. **Tie:** the council sits one more night
  (24 hours, once); tied again, Reeve Hollis breaks it for the side that was voted for first. **No votes
  at all:** it sits another week, and again, until somebody votes (nothing the council can decide is
  decided for it).
- **Changing your vote:** yes, until the close. Still one voice per device (all its heroes share it);
  the boards name it by the hero who last voted from it.
- **Lazy, no cron:** `settle(w, now)` (story.ts) runs whenever the world is read or written: in
  `contribute` (after each change), in both world stores' `load` (Redis settles what it read without
  writing it back; the same ballots give the same result, and the next write keeps it), and in the
  browser each frame (`Game.settleCouncil`), which is how a world off the server closes too. Votes after
  the close are refused. `memoryWorldStore` takes a clock for tests.
- The boards' top line: VOTING CLOSES TONIGHT / TOMORROW NIGHT / SUNDAY NIGHT (by the Pacific
  calendar), then THE COUNCIL CHOSE: X. Each board: its count (n VOTES) and up to three names.

## 2026-11-04: Text that explains the game says what it does (Claude Opus 5.5)

Kyle: the explaining text was "too much and too little", with "obscure language instead of saying what
things do" and "short, stilted sentences". The rules are now `docs/lore/prose-notes.md` section 4.
- Knacks, traits, modifiers, drills, hungry gear, potions, relic and skill lines name the effect and the
  number ("Blocking costs 25% less stamina"), not "a fifth" or "a little". Names hint at the effect:
  IRONHIDE is EASY BLOCK, SCARRED is THICK SKIN, BULWARK is STAMINA ON PARRY, the element traits are
  FIREFORGED / FROSTFORGED / STORMFORGED. The longbow trait TRUE RELEASE is DEADEYE, so it no longer
  shares a name with the Ranger knack (now PERFECT SHOT).
- One word per thing: **stamina** everywhere (the BREATH modifier and drill are STAMINA), **block** for the
  button (lessons say "hold block", not "your guard"), **change element** for the Mage's channel.
- "Mercy" is off screen (story bible): the Cleric's WIDE MERCY / EARLY MERCY / MERCY chain are WIDE HEAL,
  EARLY HEAL and HEALING; Rowan's boss tune is "No Quarter at the Bell". Code ids keep `mercy`.
- The well's coin now says what it buys (+30% damage, 25% less taken for the first 20 s of the next job,
  numbers from BLESSING), and stays "luck" on screen: "blessed" is Sanctuary's ground only.
  The "no guard" callout reads CAN'T BLOCK: ROLL / JUMP / DASH / BLINK for every class.
- Every change is listed in `docs/copy-pass.md` for the lore keeper and line editor; the whole game's
  copy is in `docs/copy-inventory.csv` (id, area, what, text) for Kyle's review. Not touched: `card.ts`
  and the KIT lines (another pass).

## 2026-11-04: off the edge of the world: the holes shut, and the dread for anyone who finds another (Kyle; Claude Opus 5.5)

Kyle: a friend "likes trying to break things, like teleport through a wall"; "if you wander off the
path you get a warning and a sense of dread, and if you stay out you get swarmed by goblins ... or a
giant hidden shadow monster thing that crushes you."

- **The holes, found by hunting them** (`scripts/dread/holes.ts`: every job place on two seeds and
  their houses, the town and its halls, the yard and the wood; a hero stood by every wall, tree and
  river tries a far blink, a roll, a shield charge, a shadowstep with nobody to step behind, a hard
  knockback and plain walking). Before: about 5,700 ways out across 134 maps (before walking was tried). After: none, and no false
  alarms (every goblin, chest, door, way out and townsperson stands on walkable ground).
  - A tick is 1/30 s, so a Mage's far blink moves 1.27 tiles a tick, a roll or step most of a tile, a
    shield charge and a 14+ tile/s knockback half a tile. `collide` pushes a body out by the nearest
    side, so past the middle of a fence, a tree of the wood's wall, a river or the keep's 1.6-tile
    wall (into the shut Old Chapel yard) it came out the far side. Now every one of those moves goes in
    steps under a hero's radius (`shared/sweep.ts`, `travel`), sliding along what's in the way.
  - Shadowstep teleported (behind a goblin across a fence, or 3 tiles ahead through anything): now it
    travels there and stops at a wall. So do the hook's zip, the Stoker's draw and a friend brought
    into a room beside you (they were dropped 0.8 tiles off with no collision, into a wall if you stood
    against one).
  - `collide` clamped to the map's edge first and pushed after, so a body squeezed between furniture
    and the wall (the church's bed, 0.3 tiles off it) was pushed out past the edge. It clamps after too.
  - A body could be wedged into a gap narrower than itself (Barrowby plants a hedge 0.46 tiles from a
    cottage), pushed out of one thing into another. A swept step that ends wedged is taken back, so a
    hero stops at the gap. Walking is swept too. (The hedge itself is the terrain's to fix.)
- **Out of bounds** (`shared/reach.ts`): past the map's edge, the middle of a body inside something
  `collide` stops bodies on, or on ground nobody can walk to from the way in. Walkable ground is a
  quarter-tile grid flooded from the way in by the same things collision uses (blocks still standing,
  round things, braziers, deep water; ledges count, joined by their ramps), never cutting a corner
  between two shut cells; rebuilt when the blocks change (a gate opened, a house burned down). A body
  touching walkable ground (within 0.6 tiles) is in, so a squeeze is never a crime. A room can also
  forbid areas outright and add ways in: the wood counts every clearing as ground, gates shut or not,
  so a cutscene that moves you never trips it; past its tree wall is out.
- **The dread** (`sim/dread.ts`, `DREAD` in tuning), judged by the room every tick, so a guest's hero
  is caught by the leader's room. Out of bounds, the dread builds a second a second: the warning at
  once, worse at 4 s, seized at 8 s (held, nothing pressed does anything), and 1.1 s later crushed or
  pulled down where they stand. Back in bounds it drains five times as fast as it came, so stepping
  back in lifts it in a moment and dancing on the line doesn't reset it. The last spot each hero
  stood in bounds is kept every tick; the taken body is put back there, downed.
- **What comes, by place** (`sim/dreadplace.ts`): wild places (Hangman's Wood, the Copperdeep, the
  Sheepwash, the Peat Cuts, Sallow Carr, and the prologue wood) send the shadow, a hand out of the dark
  that crushes them; settled ones (villages, farms, fields, streets, the manor, the burned village,
  the charcoal and river camps) and the inside of any house send the hungry, pouring out of the dark
  and pulling them under. The swarm is drawn, not spawned: nothing to kill, loot or farm.
- **The penalty: down, under the usual rules.** In a party, down and bleeding, a friend can get you
  up, nobody comes and it's your one get-up or out. **Alone, it's one of your three downs** (my call,
  not the whole job: the trick costs a heart and gains nothing, and three of them lose the job as
  usual). A Ransom Coat can't buy it off.
- **Town and the yard** (and Wickhold's halls) never kill: out 1.2 s, a dark flicker, a quiet line,
  and you're back where you last stood in bounds, unhurt.
- **On screen** (`client/dreadfx.ts`, `dreadart.ts`, `dreadsound.ts`), the same over FLAT and 2.5D: a
  low-resolution overlay under the HUD, and a grey layer (`mix-blend-mode: saturation`) that drains the
  colour. Your own hero: the edges darken and close in round you in dithered steps, breathing with a
  heartbeat that quickens (about 1 s, 0.6 s, 0.36 s once seized), a low drone that swells, a breath far
  off at the warning and a whisper at the late stage, and a plain line over you. Late stage: something
  many times a hero's height rises at the edge of the dark, a small skull on a long neck leaning in,
  pinprick eyes (wild); or pairs of sickly green eyes gather in the dark round you, more and more,
  blinking (settled). Taken, on every screen, so a friend sees it: a dark pool under them, pale eyes
  far above, and a hand bigger than a cottage coming down with its fingers spread round them, closing
  at the crush, a heavy impact and a big shake, then rising away; or the hungry running in from all
  round and piling on, then scattering back into the dark. Your own screen goes black for a moment.
- **Online:** `dread`, `dreadBy` and `takenT` ride on the hero in the leader's patches (never set to
  undefined, so the patches carry them); the `dread` events go to each friend with their room's.
- New words for the lore keeper and line editor: all of `client/dreadwords.ts`. **Assumed for the lore
  keeper:** the thing in the wild dark is never named or explained on screen, never called a shard, a
  god, a demon or the Hungry King, and nothing says whether the hungry fear it. It could be what was
  "down there first" at the Copperdeep, or not; that stays for later. It doesn't speak.
- Tests: `tests/dread.test.ts` (the stages at their times, stepping back in, the body put back, town's
  set back, a party's down, a solo heart, wild against settled, the snapshot, a blink and a shadowstep
  at a fence, the bed by the wall). Screenshots: `node scripts/dread-look.cjs`.
## 2026-11-04: Cage hits you can see, and false prisoners (Claude Opus 5.5)

Kyle: "In 2.5D it's not clear when you're hitting the cage (no shake)" and "Sometimes when you rescue a
prisoner, their body gets ripped apart and it's 2 goblins who then attack you (1 in 20 chance)."
- **Hits.** The flat view only flashed a prop for a frame and the 2.5D model did nothing; no event said a
  blow had landed. Now `damageProp` pushes `prophit` when a cage, barrel, oil barrel, crate, table or
  larder rack takes a blow and holds (never planks and staves on the floor). Both views shudder the prop
  on its spot for `PROP.shake` (0.22 s, `client/propshake.ts`, one function for both) and flash it (the
  2.5D model goes a lit pale, not the figures' unlit white, which turned the cage into a white block).
  The shared effects (`client/fxcages.ts`) throw sparks off a cage's bars, splinters and dust, a spatter
  off a larder rack, a small screen jolt; sound is an iron clang plus a thud for a cage, a thud for wood.
  `chop` (a blow on a den or wooden wall) had only its sound in both views: it now throws splinters too.
  Damage state: the flat view shows none for props, so neither does 2.5D; buildings already show theirs
  in both.
- **The roll.** As a cage breaks, `rollFalse` on the room's own `cageRng` (seeded `seed * 2971 + 41`, so it
  never shifts a goblin's, loot's or fire's roll): `FALSE_CAGE.chance` 1 in 20. The stream is handed to
  the World only when `room.falseCages && !room.indoors`; `runRoom` sets `falseCages`, `interiorRoom`
  never does, the yard and town never do. So the cages that can be false: the rescue's and the story
  mission's cages in a job's last room, and the low road's cage in each room. Never a captive in a house
  (the cry at its woodpile, SOMEONE'S IN THERE, is always real), never off a job.
- **The reveal** (`sim/falsecage.ts`): a Survivor with `tearAt` (break + `FALSE_CAGE.lurch`, 0.9 s). It
  stands silent where the cage was and lurches harder and faster (`client/falsedraw.ts`, used by the flat
  view and the 2.5D card; the box figures jerk and swell), splits down the middle and two red eyes show.
  At `tearAt` the room marks it gone, pushes `torn` (gore.ts `torn`: a body coming apart from inside) and
  spawns `FALSE_CAGE.goblins` (2) scrappers, alert, either side, held in a `flinch` of `FALSE_CAGE.beat`
  (0.6 s) so it reads, each with a `spotted` (the "!" and a goblin cackle). Then they come for you.
- **No words.** A false one says none of the captives' lines and never "help me" (the mimic's line, story
  bible); no new player-facing line was written.
- **The goal.** `waiting(s)` (freed, not home, not false) is what the goal, the marks, the way-finding,
  the edge marks and `walkOut` count; a false one is never hurt by the party (`living`), never tallied as
  rescued or killed. A rescue with a false prisoner finishes on the real ones.
- **Online.** Decided in the leader's room; `tearAt` rides in the survivor list friends already get, and
  `torn` and `spotted` with the room's events.
- Fixed on the way: the 2.5D figures' atlas cleared every card drawn earlier in a frame when it grew (a
  canvas resize wipes it), so a hero could blink out the frame new goblins appeared. It now keeps them.
- Tests: `tests/falsecage.test.ts` (the rate over 5000 seeded rolls, the reveal and the beat, the rescue
  finishing, house captives never false, determinism and the online patch), `tests/props.test.ts`
  (`prophit`). Pictures: `scripts/cages.cjs` (Playwright's clock, stepped a frame at a time).


## 2026-11-04: a Mage's bar is MAGIC, and the spellblade parries (Kyle; Claude Opus 5.5)

Kyle: "Change all Mage things to magic." and "Spellblade can perfect parry."

- **MAGIC for a Mage** (`shared/barword.ts`: `barWord(cls)`, `barWords(text, cls)`). Same bar underneath
  (`hero.stamina`); only the word and a soft violet tint change for a Mage. Where it shows: the kit rows
  ("costs magic"), NOT ENOUGH MAGIC on a fizzle, "-40 MAGIC" rising off the hero, the Mage's knacks
  (MAGIC ON CHANGE, QUICK RECOVERY, LIGHT BLINK, the MAGIC chain), the armor lines, MAGIC RECOVERY on
  the sheet and cards, gear mods and traits on a Mage's card, the trainer's rows, Wall Brandy's words.
  The laptop bar gets a MAGIC tooltip and goes violet (`.st.magic`, still red when winded). Every other
  class keeps STAMINA.
- **A Mage's magic on a phone** (Kyle: "it's not clear at all that I have a magic bar ... I don't know how
  I can teleport", then "Oh, it's the pips. Those should just be around the blink, as a cooldown I
  guess."). For a Mage the pips leave ATTACK and ring BLINK, violet, filling as magic comes back
  (`cluster.ts`). Winded, BLINK goes dull stone: it can't fire. With less magic than a blink costs (60,
  less with LIGHT BLINK) the cost shows small in red on its corner: it still fires, but leaves you
  winded (that's the room's rule, `wantsRoll` in `sim/hero.ts`; unchanged). No extra bar under health
  on a phone. Other classes keep their pips round ATTACK.
- **The spellblade parries** (`shared/mage.ts`: `parryOnly`, `spellblade`; `guardOf(kit)` in
  `shared/weapons.ts` says what a kit's block button does). Block in the parry window is a real parry
  (`sim/combat.ts`): the goblin is staggered, the counter window opens, PARRY shows, as for the
  greatsword. On top, `parryFills` (`sim/spellblade.ts`) fills the blade. Holding block says it can't
  (`noblock`), as for any parry-only kit. CATCH, CAUGHT and the `caught` event are gone. On screen: the
  touch button says PARRY, the BUTTONS legend's PARRY row adds "A parry fills your blade", GUARD reads
  PARRY ONLY, the laptop hint says PARRY, the kit row's ALSO is "Parry fills the blade", and the sheet
  shows the PARRY WINDOW. No PERFECT on a parry (none shows for any parry).
- Not changed: trait and mod rolls stay by class, so a spellblade still can't roll RIPOSTE, BULWARK or
  PARRY mods (Kyle's call if he wants them).
- Tests: `tests/magekit.test.ts` (the parry: no damage, PARRY, stagger, counter window, blade full),
  `tests/kitwords.test.ts` (PARRY ONLY, Mage rows say magic).


## 2026-11-04: Orla of the watch meets you in the wood and walks you to Wickhold (Kyle; Claude Opus 5.5)

Kyle: "In the tutorial, remove Hew's warning about getting to Father whatever. Have, to the left, a
guard on patrol come out to meet you, say some stuff and take you to town."

- **Hew's last words are gone** (`LINES.last`). Grabbed, he goes straight to the screams; the cutscene
  is 0.45 s shorter (`CUT` in `sim/woodcut.ts`; `scripts/woodlook.cjs` beats moved to match).
- **The guard is Orla of the watch** (the bible already has her knowing Hew by his boots, and the
  watch complains about boots). `sim/woodguard.ts`, lines in `shared/orla.ts`. Once the Stoker is dead
  and the relic card is gone, and its callers are dead too, she comes along the road from the west,
  out of sight (12 tiles west of you, never past the road out), walks up to you through the gap west of
  the hut and stops a step off. The world holds for her four lines, a tap each (the same `talk` box as
  Hew's waking): she saw the smoke from the road; those are Hew's boots, so that's him by the hut; you
  lived through the field when nobody else from the column did; come with her to Wickhold, she'll take
  his tally of the dead to Odric. Then she stoops by Hew's body a moment for the stick and walks west; THE
  ROAD says "Follow Orla west, to Wickhold" and the arrow points at the road out.
- **The road out** (`ROAD_OUT`, unchanged, a few steps west of the hut) takes you to Wickhold only once
  she's spoken, so nobody leaves the wood before meeting her. Tapping her afterwards repeats her last line.
- **At the gate**: Orla's greeting panel is gone (she isn't introduced twice). The road narration
  (`LINES.road`, unchanged, the wet left heel) shows alone under WICKHOLD, one tap. `greeting` is `'road'`.
- **The tally** (Kyle: "It's not clear that you get a tally stick, or what it means, or that you're
  supposed to go to the church to turn it in. Let's simplify"): the simplest version. Orla takes it
  ("his tally of the dead"); the player never carries or delivers anything, so no tracker objective or
  quest marker. Odric's separate tally scene (the panel with the notches narration) is gone: the first
  time you open the church after the wood, his usual panel starts with one plain line,
  "Orla brought me Hew's tally of the dead. I've cut a notch on it for Hew." (`TALLY.odric`, cleared by
  `profile.tally`). Not changed: a Healer's cold censer still gets no town objective; Isolde relights it
  when the Healer visits their trainer, as before.
- **Facing**: an NPC without a round can now carry `fx`/`fy` (`Npc` in `shared/arena.ts`, read by
  `npcAt`), so Orla faces the way she walks in flat and 3D. Hew is unchanged (he sets neither).
- Story bible's prologue and after-the-wood entries updated.
- Tests: `tests/wood.test.ts` (the hut): no Odric in Hew's words; the road out does nothing before she
  comes; she waits for the callers; she spawns well west, stops beside you, says her four lines; stoops
  and leads west; the road out then reaches town and the road greeting.


## 2026-11-04: Barrowfields and side-way words, lore checked (Claude Opus 5.5)

- Butchers: BLACKNAIL and THE TANNER became SPLITNAIL and THE DROVER (too near the Blacktongue title; tanning points at the books' skin goods).
- The posting is in the town's voice ("The hungry have camps all over the Barrowfields..."), never "goblins" or "one big open map".
- One word per thing: CAPTIVES (not prisoners), the CHAINED CHEST (not cache). The beacon is lit, not opened. The way out has no compass direction.
- Praying at a wayside shrine gives the well's luck, so it reads "Lucky: +30% damage, 25% less damage taken for 90 s". "Blessed" stays Sanctuary's.
- PRESSURE became ALARM: noise brings more of them.
- THE GLADE became THE SPRING: the room shows up in the village, fields and fen too, and every one has its spring.
- New lore to record or reject (Kyle): the barrows are grassed mounds older than the villages, with a shrine whose owner stays unsaid; siege engines in the Barrowfields foreshadow chapter 5 without naming the King; the beacon on the drove road brings the watch (a fire, not a bell; bells stay for chapter 5); horns are never magic; where the cookpot poison comes from stays unsaid, never the church; the chained chest's dead soldier stays unnamed. Open: why the hungry come at whoever holds the shrine.


## 2026-11-04: The new sorts, lore checked (Claude Opus 5.5)

- Words: NETTED, then ATTACK TO BREAK FREE (laptops don't tap; every class has ATTACK). CUT FREE on the button and the popup. `{n} GOLD STOLEN`, BITTER STOLEN or BRANDY STOLEN, THIEF GOT AWAY.
- The banner is a cowhide, never a person's skin, hung with keys, buckles, a spoon and a shoe (no teeth: a Blacktongue detail, and "Teeth" is the town's name for the hungry). A steady iron glint, never pulsing gold. Nothing on it rings: bells stay the town's.
- Log-carriers are drawn as two ordinary goblins under the log, not butchers (a butcher's size comes from the sliver). No person is ever driven before the ram.
- Blind hunters can't be BLINDED: the longbow's perfect still crits. Their sockets stay dark, never lit, so they're never mixed with the cold white eyes past the map's edge.
- A routed goblin scatters; no hands up (too comic).
- Lore to record or reject (Kyle): wolves are ordinary wolves kept chained and starved, no shard, never hurt the hound, no joke over a dead wolf; nets are for taking people alive; crows are ordinary crows that wake the hungry by accident (never big, ridden or feared by goblins); stolen gold never touches the Want. Open: where the blind hunters come from (lean: captives who turned in the dark of the Copperdeep), and whether sappers dig beside the captive diggers.

## 2026-11-04: a recap before the knack, quiet drops, a tracker that folds (Kyle; Claude Opus 5.5)

Kyle, from his phone: "On raid end or mission end it shouldn't immediately hit you with pick a knack; it
should give you a mission recap though", "Items falling take up a TON of space on mobile ... it shouldn't
pop up unless you click on it to pick up", "I want the mission to be smaller in the top left unless you
click it to expand", "Ditto the where you are and what you have to do in the main area", and "Can knacks
be highlighted if you click your inventory and have knacks to spend?"
- **The recap** (`client/recap.ts`, counts in `client/recaptally.ts`, words in `client/recapwords.ts`): every
  job's end, won, lost, left or an expedition, is one framed card in labelled rows: ROOMS (or JOBS and SIDE
  JOBS on the Barrowfields), GOBLINS, DENS, DOWNED, TIME, a rule, then GOLD, XP, SAVED, LOST, FOUND (gear
  picked up off the floor), TREASURE, RELIC. One button: NEXT: PICK A KNACK when a pick waits (it opens the
  knacks), else BACK TO WICKHOLD. Each player's own: the run is the leader's, the downs and what was found
  are this player's (what they carry now against what they carried when the job began). `Run.goals` counts
  the pinned jobs done; `Run.began` is the leader's clock at setting out, for TIME only (never the fight).
- **Drops stay quiet** (`client/lootcard.ts`): on the floor a drop is its sprite, glint and the LOOT or
  FORGED word as it falls, nothing more. Its card (with the comparison) opens on LOOK in the phone's
  context slot, a tap on the drop, or F on a laptop (the prompt reads F LOOK); TAKE or F again takes it,
  CLOSE or walking off shuts it. Gold, potions and relics are picked up by walking over them and never had
  a card.
- **The tracker folds** (`client/bannerfold.ts`, pieces in `client/tracker.ts`), on phone and laptop, on a
  job, in town and in the halls: one short line (the room diamonds and the objective; on an expedition
  N OF M JOBS LEFT until they're done; WICKHOLD, DAY N in town), a + to show it opens. A tap opens it (an
  expedition's opened tracker lists every pinned and side job, done or what to do), another tap folds it.
  It opens by itself for 3 s when the objective or the place changes (a count going down isn't a change)
  and while an objective's done flash plays. The wood's lessons never fold.
- **Knacks waiting in the pack**: the pack's KNACKS button turns gilt with a slow pulse and reads
  KNACKS 1 TO PICK (`KNW.packPick`); the gold count on PACK stays.
- New lines, waiting on the lore keeper and line editor: ROOMS, JOBS, SIDE JOBS, GOBLINS, DENS, DOWNED,
  TIME, FOUND, TREASURE, RELIC, "2 of 3", NEXT: PICK A KNACK, LOOK, F LOOK, CLOSE (loot card),
  N OF M JOBS LEFT, DONE, WICKHOLD, DAY N, N TO PICK.

## 2026-11-04: PUBLIC WORKS, Foreman Judd and his crew; rats on the blood (Kyle; Claude Opus 5.5)

Kyle: "Should rename works to public works and have it be a foreman and people working around him
tidying etc." and "when there's blood and rats I want them to scurry away if you walk near them, then
come back later."

- **PUBLIC WORKS** is the on-screen name everywhere the player sees it: the spot, the stall (widened to
  3.4 tiles so the label fits), the board's title, the Old Quarter rubble's text, the sewer grate's,
  Dunn's line. Internal ids stay `works`.
- **Foreman Judd** (`shared/publicworks.ts`, look `foreman` in `client/npcs.ts`) stands just west of the
  works stall by its board; talking to him opens the board (`talk: 'works'`), as the spot still does.
  He takes the board's spoken lines (they were Reeve Hollis's): Hollis keeps the book, and Judd points
  at it. His two lines (`FOREMAN` in `shared/mendlines.ts`), one each time the board opens, in turn:
  "I don't pick what gets done, mind, the town does that with its coin and whoever turns up with a
  shovel, and I just point. Hollis writes it all in his book, every coin and every den burned, so don't
  go telling him you gave more than you did." and "My lot sweep and haul and fill the barrow, or that's
  the idea, and whoever you catch leaning on a broom will swear they're ~thinking~. They aren't."
  He never chooses what gets done (the bible: the town chooses with its gold and its feet).
- **His crew** (mute, in the background): a sweeper round the front of the stall, a hauler taking planks
  off the cart in the square up to the stall, and, while the rubble stands, a digger shovelling it into
  a barrow and tipping it a few steps back (gone once the Old Quarter is cleared). Each walks a short
  loop and stops at its corners to work: `Npc.stops` (`shared/npcstops.ts`, pure; `npcAt` returns
  `still` while they stand). Drawn by `client/crewdraw.ts` over their sprite, in the flat view and the
  2.5D view's cards (box figures, `?figs=3d`, walk and stand but carry no tools).
- **Same spot on every screen**: the crew carry `clock: true` and walk on Wickhold's wall clock
  (`townclock.ts` `onClock`, run each step in town), not the room's time (which starts at 0 each time
  you come into town). Screens agree to within their own clocks. The other townsfolk are unchanged.
- **Rats** (`client/rats.ts`, `ratspots.ts`, `ratdraw.ts`): on a job they gather at blood stains (the
  floor's stains read a little at a time and gathered into spots worth a rat) and at bodies left whole;
  in Wickhold by the sewer grate behind the Drowned Rat, in the alley between it and the infirmary, and
  behind its barrels. A hero within 2.5 tiles (1.2 creeping, `sneaking`) sends them bolting, long, low
  and zigzagging, away from that hero to the first wall, edge or solid thing that way (or into the dark
  a few tiles off), where they're gone. After 15 to 25 s with nobody within 4 tiles of the spot they
  come back one at a time, 1.5 to 3.5 s apart. At most 8 at once, the nearest spots first, none past 18
  tiles. A quiet squeak and a patter on scattering (`sfxTown.rats`, set up by the soundscape).
- **Cosmetic, and each screen's own**: the room never knows about rats, they never wake a goblin (that
  stays the crows', which are in the room), Math.random is used, and a friend sees their own rats.
  Drawn on the lit layer (dark body, a pink tail tip, a pale eye glint, never green, never glowing); in
  the 2.5D view on its flat layer at the floor, as its crows and slicks are (so, like them, not hidden
  behind a wall in front).
- Lore: Judd and his lines were checked against the story bible and voice guide in the lore keeper's
  terms and then the line editor's (this session had no agent tool to hand them to, so the same
  checklists were applied here). From the drafts: a line about the rubble was dropped so his lines
  still hold once the Old Quarter is cleared; "if you catch one of them, he'll tell you" became
  "whoever you catch ... they're" (the crew is anybody); both now run on with commas and a hedge
  ("mind", "or that's the idea") and end on the joke about a person, with one mark (`~thinking~`).
  New lore for Kyle to record or reject: the name Judd, and that the works have a foreman at all.
- Tests: `tests/publicworks.test.ts` (labels, Judd opens the board, the crew's loops and stops, the
  digger gone with the rubble, `stopsAt`), `tests/rats.test.ts` (they come once it's quiet, scatter at
  2.5 and not 3, closer creeping, come back one at a time, the cap, the room untouched, the town's
  spots clear of walls). Pictures: the scratchpad script `town3-look.cjs` (not in the repo).

## 2026-11-04: techniques are moves, three a class (Kyle; Claude Opus 5.5)

Kyle: "I want more techniques", and they should be "pure upgrades, not just choosing". Each class but
the Mage now learns three techniques at its trainer instead of three ranks of a bump. Each is a move or
a new rule, always on once learned, with any of the class's weapons. Names are placeholders for the
lore keeper.

- **Taught in order** (`shared/techniques.ts` TECHS, TECH_WORDS and every number; `drills.ts`
  TECH_LEVELS): levels 4, 7 and 10, at the technique drill's prices (180, 545, 1045). The save keeps
  `drills.technique` as the count: a hero with rank n knows the first n of their class
  (`knowsTech(h, id)`, by the class of the weapon in hand). The old bumps (+25% slam, +25% backstab,
  +20% snare time, +16% heals) are gone with them. A Ranger's first still waits on the SNARE lesson.
- **The Mage is untouched**: its one row of ranks (PRIMED SPELLS, levels 5, 8, 10) stays as it was
  while its spells are rewritten; ATTUNED and SPELLTHIEF come after.
- **Warrior** (`sim/techwarrior.ts`). SLAM: a slammed goblin bursts up to 4 small goblins within
  1.3 tiles of it. SHOULDER CHARGE: 1 s on the stick within about 25 degrees of one way readies it (a
  kick of dust); the next swing, begun within 0.4 s of stopping, knocks the first goblin it hits down
  1 s (a butcher 0.5 s), shoved on, through the stun cap. IRON FEET: holding an attack, a blow lands but
  doesn't shove, stagger or (a log) knock you down; IRON FEET over you when it saves you.
- **Rogue** (`sim/techrogue.ts`), on any backstab by blade, thrown knife or dart. KNIFEWORK: it bleeds
  3 s (the skewer's ticks). SLIP AWAY (Kyle's VANISH; renamed so it isn't the skill's name): a backstab
  kill hides you 2 s by the vanish rule, and a blow wound up at you is dropped; GONE over you.
  CUTPURSE: once a goblin, a 25% chance of 1 to 3 gold on the floor, on its own seeded stream
  (`purseRng`), never off a training goblin. At most half a coin a goblin, next to the 1.7 an
  expedition kill leaves now.
- **Ranger** (`sim/techranger.ts`). TRAPPER: a snare stays set after its first goblin and catches a
  second. QUICK NOCK: a perfect bow shot ends at once (no recover), and a draw begun within 1.2 s
  starts 40% drawn; a crossbow's perfect (glinted) bolt loads the next at once, plain. STEADY: a new
  rule underneath it: an arrow or bolt loosed on the move sways off the aim, up to 0.05 rad (about 3
  degrees) either way, by the room's clock (no dice); STEADY takes the sway away. `drift(h, moving,
  now, wind)` is the hook for the weather's wind later. Tune `AIM_DRIFT.most` (0 turns it off).
- **Cleric** (`sim/techcleric.ts`). MENDING HANDS: a friend comes up 1.5x as fast (on top of a Cleric's
  2x). SANCTUARY STEP: blessed ground (the SANCTUARY skill and any other) moves with its Cleric for 3 s
  after the cast, kept where it was cast from them. JUDGEMENT: a Cleric's blow (mace, censer or flail)
  on a goblin whose blow is aimed at a friend stuns it 1 s (a butcher 0.5 s), through the stun cap; a
  striped blow or a charge carries on, as with every daze. The mace's smite already stuns everything.
- **Tells** (`client/fxtech.ts`, sounds in `soundscape.ts`): a ring and stone for SLAM's bursts; dust
  for the shoulder ready and landing (the stun says STUNNED); IRON FEET; blood for KNIFEWORK; GONE and
  smoke for SLIP AWAY; a spill of coins for CUTPURSE; a glint on the string for QUICK NOCK; a faint one
  for STEADY on the move; a gold ring on the friend for MENDING HANDS; gold motes for SANCTUARY STEP; a
  gold flash for JUDGEMENT (STUNNED from the stun). Words only for IRON FEET and GONE.
- **The trainer** (`shared/trainrows.ts` techRows, `client/trainerui.ts` techRow): under TECHNIQUE,
  three rows with EFFECT and, until learned, COST ("545 gold, level 7", "after SNARE"); tagged LEARNED,
  LEARN, LEVEL n or NEEDS; the header says "1 OF 3 · NEXT AT LEVEL 10". A tap opens the row with one
  LEARN button (the technique drill's next rank).
- New words (for the lore keeper and line editor): the twelve names and EFFECT lines in TECH_WORDS;
  callouts IRON FEET and GONE (reused); labels EFFECT and COST on the trainer's technique rows.
- Tests: `tests/techniques.test.ts` (levels and prices, save ranks, rows, the Ranger's snare wait, each
  technique firing and not firing without it, the stun cap on JUDGEMENT, CUTPURSE seeded and once a
  goblin); `tests/trainer.test.ts` reads the Warrior's three rows.
