# Territories: decisions

The chat planning and building docs/design/territories.md (Kyle, 2026-11-17). Newest at the foot.

## 2026-11-17 (Claude Fable 5.2)

- **Kyle's ask:** the quest maps bigger and tailored, each with a theme that carries through; more bigger
  hand-laid maps, each with a story; multiplayer, with gates or screens between zones, bigger territories
  and scapes between, and a more linear feel, like an instance.
- **Where the quest maps stood:** the five postings in `shared/heroquests.ts` run the ordinary board
  generator (two to five random rooms of 28 by 24). Nothing of a quest's map was its own.
- **The spec** (docs/design/territories.md), not built: a territory is one hand-laid map on the expedition
  kit (as Hangman's Wood and Fenmere) with the Open Cut's stretches, gates and checkpoints. Zones with a
  story, scapes between them, a gate or a screen at each join, one way on. Five quest territories laid out
  zone by zone, five more sketched, a build order of nine slices.
- **The thread proposed:** the Lowfurrow line (fourteen gleaners, five brought out on the first job, nine
  roped and walked on, found along the five places). Kyle's call; nothing goes in the bible until he says.
- **Claimed a board row.** No code touched. Edits I will ask for when slice 1 starts: `shared/jobs.ts`
  (`Job.land`), `sim/run.ts` and `sim/goal.ts` (stretches and checkpoints step only for `job.instance`
  today), then `heroquests.ts` and `gatedraw.ts` later.
- **Lore keeper, one call on the whole spec: NEEDS WORK, all folded in.** The rulings:
  - Odric keeps the count of the dead only: he speaks of the burned and the dead at the face, never of
    those walked over the ford. Who came home is the recap's.
  - Tollan's barn stands or it doesn't; nobody goes back out to live; Tollan never blames a hero for a
    burned barn. Tollan with a line is new cast and needs a register in voice.md.
  - MAWL and GUTCHAIN are "it" on screen (jobs.ts "Kill it"). **For the Town quests chat:** questwords.ts
    says "Kill him" of both.
  - The Shafts: the miners stay gone and unexplained; the four at the face are field hands. The raw cut
    never points at Wickhold. The hungry's own planks over the deep on the drowned level. The boarded hole
    is rough rock and miners' timber, kept unlike the Deep and the Sealed Door. The Deep's opening is told
    in town, never beside the hole.
  - Sallow Carr's sluices drain a floor for the party and never flood or strand the hungry.
  - The gleaners: all grown, gone of their own accord, each hero's own and undated like the prologue. Rye,
    wild oat and thistle, not barley over head height. The way through the valley stays unnamed.
  - The dog: a scruffy collie sort, no name, an ordinary dog, goes only where a farm dog would. The lame man
    went lame on the road, never cut.
  - The ford: no board or written count on the near bank; the chalker only chalks over heads. The wall far
    off with nobody at it. A pack's worth of bundles and boots at the tenter field, cloth and leather only.
  - "The fold yard", not "the threshing yard"; "the end chamber", not "the sump chamber".
  - Sketches: Barrowby's bell as the bible has the hungry leave; Brokenbridge's ferry for heroes only;
    Hesketh as written; the Charcoal Camps are the hungry's burning, built last, after Kyle answers "does
    anyone ever burn Hew?".
  - Names held for the nine if ever needed: Dickon, Emmot, Sib.
- **For the bible, noted by the lore keeper:** "the Deep opens at level 9" is stale (q7 opens it at 7). The
  arcs doc's draft posting "Lowfurrow, nine in the pens" should change its number or become this thread.
- **Waiting on Kyle:** the eight calls at the foot of the spec.

## 2026-11-17, later (Claude Fable 5.2)

- **Kyle's calls:** yes to the Lowfurrow line, to tuning for one hero and up, and to a result that stays
  (each hero's own). The first job at eight minutes. "I'm blasting through most of these missions", so a
  zone's packs are fights. "I want worlds to be beautiful and interesting": the beauty rules in the spec.
  The line is in the story bible now (its own section at the foot), with the lore keeper's rulings.
- **Elevation rethought** (docs/design/elevation.md; Kyle: "hard to see ... archers are on these pre-fab
  things ... actual elevation ... not annoying"). The rules already stack levels and only the town used it.
  The change is where height is put and how it is drawn: height is the land's, most edges are slopes you
  walk up anywhere, faces are rare, archers stand on the land or a thing of the place. In the rules a slope
  is a ramp as long as its edge, so no rule changes: proved by tests/landroom.test.ts on Lowfurrow's hill.
- **Kyle: "spin up sub agents within this chat and review everything yourself to your specs."** Slice 1
  built that way: one builder on the plan side, the fight side and the review mine.
- **Slice 1 in: the frame, proved on Lowfurrow in plain blocks** (`?hero=WARRIOR&land=lowfurrow`, `&party=N`).
  - `shared/territory.ts`: `LandId`, `TERR`, `TerrPlan` (a room plan with its zones and scapes),
    `territoryPlan(job)` from the seed alone (a fresh copy each time, as `expedPlan`), `landJob`.
  - `shared/lowfurrow.ts`: 44 by 96 on the expedition kit, the road fixed and the seed only bending it:
    THE HEADLAND, the field gate, THE LONG STRIPS (a pond down a side path), THE STOOKS, the drain and its
    bridge, THE BARN ROAD (a hollow lane, the great barn on the east bank with carts across its doorway),
    THE FOLD YARD. A hill of three levels: two lynchets as slopes the map's whole width, the lane's banks
    as faces with a slope at each bank's south end. Existing kinds only: no art yet.
  - `sim/landroom.ts`: the room, dozing past `TERR.wake`, tuned for one, each hero past the first making
    goblins tougher and harder hitting (`TERR.more`), never more of them.
  - Small edits in shared files, as claimed on the board: `shared/jobs.ts` (`Job.land`), `sim/run.ts` (the
    room, and stretches and checkpoints stepped for a territory), `sim/goal.ts` (a territory's stretch goals
    till the last stretch, whose goal is the job's own), `client/main.ts` (the switch), and one line in the
    Instances chat's `client/checknotes.ts` (its gate lines said on a territory too). Nothing of the
    Instances chat's sim changed: a territory is data for it.
  - Tests: `tests/territory.test.ts` (the plan) and `tests/landroom.test.ts` (the fight and the hill).
  - `scripts/terrmap.ts` prints a plan as JSON, for drawing a map without a browser.
- **Kyle, mid-build: "sometimes it's hard to see things apart or see items on the ground or what a chest is
  v. a box ... High contrast might be helpful."** Written into the spec ("Telling things apart"): three reads
  (scenery back, things you can use forward, bodies brightest), a chest never a box, loot on a dark plate with
  its tier's rim, a HIGH CONTRAST option. **For the Art and Graphics sweep chats:** this crosses your files
  (chest and crate art, loot on the floor, the ground's contrast: your slice 5). A sheet comes first, for
  Kyle to pick from; nothing of yours is touched before that.

## 2026-11-17, evening: elevation in the rules and in 2.5D (Claude Fable 5.2; three builders, reviewed here)

- **Found by the first builder:** goblin pathing did not know levels. `sim/pathgrid.ts` blocked every ledge's whole
  box but its ramps, and a goblin with a target on another level walked at "the middle of the nearest ramp". On a
  land whose slopes are 44 tiles long and whose ground is nearly all raised, that is no pathing at all.
- **Goblins path over heights** (`sim/pathlevels.ts`, new; `sim/pathgrid.ts`, `sim/pathing.ts`; the chase's level
  lines in `sim/enemies.ts`, `rampFor` gone). Each cell has a level; a step is taken as collide's own `levels()`
  lets a body take it: into a slope always, onto lower ground (a drop: a goblin that walks off an edge is not
  hurt), never up a face. So a goblin climbs a slope anywhere along it, comes off a bank at you, and goes round by
  the slope from below. A map with no ledges is `flat` and paths exactly as it did. `tests/pathlevels.test.ts`.
  - This changes every room with a shelf, not only territories: a blade goblin on a shelf now steps off it at you
    where it used to walk to the ramp. `tests/heights.test.ts`: the goblin in the blade-reach test is held where it
    stands (one line). `tests/threat.test.ts`: the clear-time bench's limit 190 s to 210 s, with a note: its one
    knife-edge room (a dusk room with an ironhide and a rock shelf) takes the wand bot 202 s where it took 184, and
    the daggers 110 where they took 132; the sample's mean moves under two seconds. **For the General chat**, whose
    note on that bench asked for it to be weighed.
- **The fight's rules on every level** (`sim/afoot.ts`, new: `landed`, `afoot`, `sameGround`, `highShot`). About
  thirty places in `src/sim` asked "is it on the ground" as `z === 0`. On a map whose ledges carry `lv` (a land, and
  the town) the levels are the ground, so those now ask `afoot`: oil and the fire wall, storm and its picks, ice and
  the frost holds, pack rushes, the Ranger's snare, the snarer's snares, butchers feeding and the gorger, the Rogue's
  ladder, kindling a house, pulling a door, the dropper, puddles, pools, rods, the archer's hold, Hempen's sweeps.
  A burst hurts those on the ground it bursts on (`sameGround`). `separate` leaves out only what stands above its
  own ground (it left out everything at level 2 as "on a roof"). **The high ground is relative there:** a shot
  carries the level it left (`Bolt.hz`) and lands with `HEIGHT.shot` only on a goblin lower down. Off such a map
  every one of these is exactly as it was (the builder checked its tests fail with `landed` forced off).
  `tests/afoot.test.ts`. One boss's or one set piece's own tests on flat arenas were left alone (doorpair,
  haulbook, haulcarts, columns, brake, tubs, staithebits).
  - **Known, not done:** the spear thrown on its chain and a held spell get no high-ground bonus on a land; oil
    lying across a face's foot can burn a body at the lip above it; a roofer (`onRoof`: z of 2 or more) set on the
    town's upper levels would count as on a roof. **The town's fights now follow these rules on its upper levels
    too** (they were ignoring fire, storm, ice and rushes up there).
- **Land drawn as land in 2.5D** (`client/three/landledges.ts`, `shared/heights.ts`, new). `Ledge.kind` gains
  'earth' (`shared/arena.ts`, the union only; `terrkit.ts` sets it). Tops in the floor's own painting, a step
  lighter and warmer a level; slopes as the painted ground running up the bank, shaded and combed downhill, never
  steps; faces as leaning earth banks with a turf lip, a dark foot and a shadow below. `heightAt` gives the eye a
  smooth height on a slope; the rules never read it. No gorge on a land (`three/ground.ts`: the town's extras are
  the town's). The town draws as before (pixel diff: idle figures only).
  - **Small edits in other chats' files, each guarded so only a land changes** (asked of nobody first: Kyle's
    direction, flagged here as the board asks): Art's `three/cards3d.ts` (heroes, foes, cages, the freed and the
    hound stand at `bodyLv`; a level-2 goblin on a land is not drawn at roof height), New look: characters'
    `three/chars3d.ts` (two lines), and `three/actors3d.ts`, `three/overlay3d.ts`, `three/camera3d.ts` (bodies,
    props, chests, pickups, telegraphs, names, bars, quest marks and the camera at the ground's height).
  - **Limit, for the next slice:** the camera looks down from the south, so a bank that runs north to south is seen
    edge-on and reads by its lip, its lean and its shadow. A light yaw beside such a rise, or a side light on a
    land, would help. The flat view still draws a land as the town's stone (a later slice).
- **Lowfurrow, from the review:** the laying helpers moved to `shared/terrkit.ts` (the plan and the map imported
  each other). The banks run a tile under the rise so their seam is never a level lower. **A sheep track up each
  bank** from the lane (y 30 to 33), so nobody under a face is more than 8 tiles past the straight walk from a way
  up: elevation.md's first "not annoying" test, now in `tests/territory.test.ts`. `map.settle` on, as the town has
  it: found when the cages on levels 1 and 2 were pushed out to the map's edge (props, the freed and a hero up at
  a gate are set down at level 0); with it, anything set down on raised ground stands on it. Tested.
- **For the writing pass:** a territory zone's gate line is the Open Cut's "Kill the goblins at the gate", which
  is wrong where the pack is at the dinner basket. A territory wants its own.
- **Checked:** the whole suite (237 files, 2029 tests), `npm run check`, the build; in the browser at
  `?hero=WARRIOR&land=lowfurrow`: ten of twelve goblins dozing at the way in, both gates opening for the party
  with the checkpoint moving, the goal turning to the cages past the second gate, no page errors on a laptop.
  Pictures: `node scripts/land-look.cjs`.

## 2026-11-17, night: bigger, stitched, and mini quests (Claude Fable 5.2)

- **Kyle, after playing the first build:** "I like it but I think that it could actually be even bigger in each
  area. We proved out in the RAID mode that we can have pretty damn big maps ... we could stitch those sorts of
  things together. Even have mini quests within a quest: like talk to a person who tells you to hunt something that
  doesn't spawn until you talk to it." Then: "anyone you rescue has to run SUPER far out ... should just be able to
  run to next gate"; "this doesn't feel hand crafted and beautiful telling a narrative, it's just sort of ...
  there"; and, of an ordinary Hunt SKARN job played the same sitting, "it felt really cool ... felt like a tailored
  story and arena with obstacles etc. really liked it and the shadows looked GREAT"; "(Shadows are from living
  world: we should make that absolutely a feature not a toggle)".
- **The spec re-laid** (territories.md: "Bigger, stitched", "Mini quests", Lowfurrow as two maps of 96 wide). The
  bar for a territory is now the game's own good rooms: their kits, their scenes, their packs, bigger and by hand.
- **The freed make for the nearest gate** (`sim/haven.ts`, new; three lines in `sim/survivors.ts`): on a map in
  stretches, the nearest of the way in, the way out and every gate, open or shut. **For the Instances chat:** this
  is the Open Cut's too (your freed ran to the map's start).
- **The living world is the game** (`client/alive.ts`; its button, its setting and `alive.css` gone; `?alive=0` kept
  for look scripts). **For the Graphics sweep and New look: characters chats:** done at Kyle's word here; your board
  rows say it "stays an option".
- **A territory is several maps stitched** (`shared/territory.ts`: `territoryPlan(job, index)`, `mapsOf`, a room a
  map; `sim/landroom.ts`, `sim/goal.ts`, one line in `client/game.ts` so the next map starts at its own first gate).
  `?land=lowfurrow&map=1` starts on the second map.
- **The first build kept as the proving hill** (`shared/hillmap.ts`, `?land=hill`): the frame's, the pathing's and
  the rules' tests stand on it, so Lowfurrow can be re-laid freely.
- **Mini quests** (`shared/miniquest.ts`, `shared/miniwords.ts`, `sim/minis.ts`, `client/fxmini.ts`, new;
  `tests/minis.test.ts`). `map.minis` is plain data; the room keeps each one's record (offered, taken, done) and it
  is sent to friends (`client/snap.ts`: one more collection). TALK is at the head of the GRAB chain, after helping
  a friend up; E and USE press it too (`client/main.ts`), and the button reads TALK (`client/cluster.ts`). The
  goblins are made when it's taken (`ArenaRoom.wake`, the room's own foe-making moved into `fromFoe` so both use
  it), as tough as the room's others for the party. It never keeps a gate. Done, whoever was hidden steps out and
  the words are said over them; a giver goes home at once, or waits till a hero is back in sight of them. The goal
  carries a second line ("Also: ..."); gold marks over a giver who is free to speak and a hero is near, then over
  the ground it sends you to (`sim/targets.ts`). Played through on the proving hill in the browser.
- **Lines:** one lore-keeper call, one line-editor call, for Lowfurrow's two mini quests and the territory's own
  gate line ("Kill the goblins here", `shared/landwords.ts`). The lore keeper turned down the rope with nine knots
  (a second way of counting, the Tally Man's ground, and it hands a first-job player the number): the trace is a cut
  coil with unused loops. Recorded in the bible.

## 2026-11-17, late: Lowfurrow laid by hand as two maps, its two mini quests, and two things Kyle saw

- **Lowfurrow is two hand-laid maps** (`?hero=WARRIOR&land=lowfurrow`, `&map=1` for the second), each built by one
  builder to the spec and reviewed here in pictures and in a played run.
  - **THE FIELDS** (96 by 112; `shared/lowfurrowfields*.ts`): the gleaners' camp on the headland (handcarts, a
    cookfire, the dinner trodden in), eight long strips of standing rye, oat and fallow with mown rides, a pond in
    willows in a hollow of the lynchet, the stooks and a half-built rick, the drain and the far bank. 19 goblins in
    six packs, each doing something (a patrol on the road, two at the scarecrow, sheaves being carried to a cart).
  - **THE RISE** (96 by 104; `shared/lowfurrowrise*.ts`): the sunken barn road between banks with sheep tracks up
    them, the orchard, the barn and its yard behind a tumbled drystone wall, the fold on the brow with the cage,
    the hut and its fire, the stile north. 15 goblins in five packs.
  - Both builders' notes on what drew wrong are worth keeping for the next territory: water on raised ground draws
    as a pit (so the dewpond is paint), `flowers` paints a garden bed, `stone` a headstone, `trample` a dark box,
    `stump` and the `log` block read as boxes. **Art wanted, most wanted first:** water drawn at its level, gold
    rye taller than a head, a handcart on its side, a fallen trunk that reads as one, a pear tree, a proper
    sheepfold, wildflowers on grass.
- **Lowfurrow's two mini quests are in** (`shared/lowfurrowminis.ts`, new; `tests/lowfurrowminis.test.ts`).
  The sister: the woman under the near cart, once the two at the dinner are dead; three goblins made in the rye by
  the pond; her sister out of the willows. The rope: a man up the one full-grown tree in the orchard, once the
  archers who shot at him are dead; a plated brute and two made outside the barn; he comes down when a hero is back
  in sight of him, and a chest stands by the carts. A giver can be drawn off the ground (`Mini.giver.up`, pixels,
  paint only: he sits in the boughs in both views). Played through in the browser: both taken with G, both done,
  the first map's screen leads into the second.
- **A line said by someone well off the side of the screen is not drawn** (`client/saylines.ts`, three lines): it
  was pinned to the screen's edge as if said there (the woman's "I heard it go quiet" with her half a field away).
- **"wtf is this. bread?"** (Kyle, with a picture of a `hay` round). It was a rounded yellow bale with a band, in
  both views. Now a stook: sheaves leant together, tied at the waist, a tuft of ears, a dark gap at its foot
  (`client/sprites.ts`, the one `hay` line; `client/three/nature3d.ts`; `tests/parity3d.test.ts`, its corner
  count). **For the Art chat:** your file, changed at Kyle's word here; redraw it freely.
- **"guards who are walking to the right seem to be looking left"** (Kyle). The side-on townsfolk carry their
  front-view hair round to the side by moving it a pixel toward the back. A guard's helm and its dark band, a
  soldier's steel cap and any hood were moved the same way, so the helm overhung the back of the head and the band
  sat where a face would be on the wrong side. Deep headwear now sits square and its rim comes forward over the
  brow (`client/npcside.ts`, `sideHair`). **For the Art and New look: characters chats:** your file, changed at
  Kyle's word here.
- **Still thin, known:** the fold yard between the fold and the gate, and the brow, are plain grass; the pond is
  square-edged; the stubble is one flat yellow; the rick is a pale slab. Next pass with the props above.
- Signed: Claude Fable 5.2.

## 2026-11-17, night: elevation narrowed to raised areas

- **Kyle:** "the elevation doesn't read as elevation at all. It also doesn't really add anything to the game that
  much. We need to do research into how other games like this do elevation and it might just be some raised areas
  or something." Then, to the change proposed: "aligned with what you'd change. go ahead."
- **Research, in short:** slopes are close to invisible from above; this view shows height as a wall face toward
  the camera; most ground is flat; ledges drop south and are often one-way; Hades uses room shape and hazards, not
  height; CrossCode's layered height is hard to read by its makers' own account; clicking to climb annoys.
  Sources: CrossCode's "Why do we use auto jump" post (moddb.com), Kotaku on Hades' level design thread
  (2020), "How do 2D top-down games convey depth?" (jayorten.github.io), "Pixel-Art Ledges, Stairs and Bridges in
  a Tile World" (blakecrosley.com), the Zelda Wiki's Autojump page, Dexerto on Diablo 4's traversal.
- **The rules are in `docs/design/elevation.md`, "Raised areas"**, which now leads that spec: flat land, a raised
  area as a set piece two levels high with its face toward the camera, its back closed, one or two narrow ways up
  drawn as log steps, off it anywhere, a job in the fight, two or three a map.
- **Built: the knoll** (`shared/knollmap.ts`, new; `?hero=WARRIOR&land=knoll`; `tests/knoll.test.ts`, 8 tests): a
  third land in `shared/territory.ts`, a test map like the proving hill.
- **A narrow ramp is drawn as steps in 2.5D** (`client/three/landledges.ts`: trodden earth, a log riser a step, a
  post either side of its foot; any ramp 3.2 tiles wide or less, so the proving hill's sheep tracks too).
- **Not changed yet, waiting on Kyle's look at the knoll:** Lowfurrow's two maps still have their slopes and banks.
  The flat view still draws a land's raised area as grey town masonry.
- **Seen, not chased:** the look script's phone run logs one 404 for a resource on every land; the laptop run
  logs none.
- Signed: Claude Fable 5.2.

## 2026-11-18: the knoll played; landing, the hop, the Rogue's climb; Lowfurrow's slopes out

- **Kyle on the knoll:** "MUCH better - notes though. 1) when things roll off the cliff or jump sometimes they're
  not back on the 'flat' area. 2) should make it clear when they (or you) jump off and a little animation or puff
  when you hit the ground. 3) maybe rogue can climb up those areas because... rogue. 4) actually really love this."
  Of THE RISE: the lane with steps up its banks "reads really well"; the foot slope "reads really weirdly and it's
  not clear what's up with it."
- **1, landing.** The face is drawn leaning 0.55 of a tile out at its foot, but a body was stopped at the lip's line
  and set down there, so it stood in the bank. `shared/arena.ts` `levels`: an earth ledge's wall, for a body below,
  is out at its foot, and a body that comes off the lip is pushed clear of it in the same tick. One number,
  `FACE_FOOT`, for the rule and the drawing (`client/three/landledges.ts` reads it). Town and board-room ledges are
  untouched, to the tick: pushing a lander clear of those too flipped the daggers' balance bench
  (`tests/threat.test.ts`), so only earth faces do it.
- **2, the hop.** `client/three/hop.ts` (new): a body whose drawn height changes by 0.4 or more hops there over
  0.3 s. Used for heroes, goblins and the freed in the 2.5D cards. The `land` event carries `how: 'fall' | 'climb'`
  (`sim/types.ts`, one line); `client/fx.ts` holds the dust until the feet are down.
- **3, the climb.** `sim/climb.ts` (new), `HEIGHT.climb` in `shared/tuning.ts` (one line), a line in
  `sim/room.ts`. A class rule, at Kyle's word: **for the classes chat to know.**
- **Lowfurrow.** THE FIELDS is flat (`lowfurrowfieldsland.ts` `heights` returns none). THE RISE: the foot slope,
  the banks' south slopes and the brow are gone; the lane and the south are ground, the banks and the top one
  level up, a five-wide flight of log steps at the lane's head (`lowfurrowriseland.ts`). A ramp up to six tiles
  wide now draws as log steps.
- Tests: `tests/knoll.test.ts` (10), `tests/hop.test.ts` (3), both Lowfurrow map tests brought to the new levels.
  Played in the browser as a Rogue on the knoll: up the face, off the lip, landed clear of the bank.
- **Not done:** the hop and the earth face in the flat view; a raised area on THE FIELDS; the proving hill still has
  the old slopes.
- Signed: Claude Fable 5.2.

