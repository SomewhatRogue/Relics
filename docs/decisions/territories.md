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

## 2026-11-18, later: height is range; the flat view catches up

- **Kyle:** "I'd like us to fix the flat view sort of stuff because that's almost accessibility. I also want that if
  there's ranged units above a hill firing down onto it, they almost get like a range increase or range bonus, but
  have to be kind of closer to the edge. Whereas if you're firing up, you almost get a range decrease. Like it
  takes that as extra space... so that there's benefits to taking higher zones."
- **Height is range** (`sim/highrange.ts`, new; `HEIGHT.reach` 1.5, `edge` 2.5, `least` 3 in `shared/tuning.ts`).
  My reading of "closer to the edge": the gain is only for a shot loosed with lower ground within 2.5 tiles ahead.
  Tiles a level, not a share of the range, so a short bow and a long one gain and lose the same.
  - A hero's shot (`sim/room.ts` where it stamps the shot's level; `sim/bolts.ts` where it meets a goblin): further
    from a lip; loosed up from too far it passes under them, once, with a `short` event (`sim/types.ts`).
  - A goblin archer (`sim/enemies.ts`, its three lines): the same shift on its reach and its telegraph's length,
    and on a height it walks to the lip and stops. Off a land nothing changes: the shift is 0 and the old lines run.
  - **For the classes and balance chats:** this is a fight rule for every ranged kit on a land. The javelin, the
    hook, a Mage's holds, the smite and thrown flasks do not feel it yet.
- **OUT OF REACH** over a goblin a shot fell short of (`client/fx.ts`). Not sent to the lore keeper or the line
  editor: two words already on screen ("OUT", "NOTHING IN REACH").
- **The flat view** (`client/levelpaint.ts`, `client/scene.ts`: **the Graphics sweep chat's files**, changed at
  Kyle's word here). A land's raised area was painted as the town's grey masonry with stone steps. Now an earth
  bank with a turf lip and a shadow at its foot, its sides leaning out by the rules' own `FACE_FOOT`, log steps
  with a post either side of their foot. Heroes, goblins and the freed hop there as in 2.5D. Two things it also
  put right on a land: a goblin on level 2 was drawn as if on a roof, and the freed were not lifted to their level.
- Tests: `tests/highrange.test.ts` (6, on the knoll). Pictures taken of the flat knoll and the flat Rise.
- Signed: Claude Fable 5.2.

## 2026-11-18, midday: the leap, and effects at their own height

- **Kyle:** "better but it still feels like I'm falling off the edge not jumping and landing." And: "when I'm up
  the hill I feel like... it's casting or attacking from BELOW where my character / weapon is? like it thinks I'm
  UNDER myself."
- **The leap** (`client/three/hop.ts`). It was the height alone easing down over 0.3 s after the rules had already
  moved the body out from the lip in one tick, so it read as a slide and a drop. Now `hopAt` carries the body from
  where it was last drawn on the lip to where it was set down, along an arc that rises 0.7 of a tile first, in
  0.42 s. In 2.5D its shadow lies on the ground where it will land (`figs3d.ts`, a `ground` option on a card).
  More dust and a firmer shake on landing, none before it.
- **Under myself.** In both views every shot and every effect of the fight was placed at level 0. Fixed at the two
  places they are made: `client/fx.ts` stamps whatever a fight event adds with the level of the ground the event
  happened on (`atLevel`), and both views draw it that high; shots, javelins, coals and ground rings take the
  ground's height where they are, a shot from the level it left (`shared/heights.ts` `shotLv`). A goblin's own
  telegraph was already at its level.
- Drawing only: nothing in `src/sim` changed. Seen in the browser as a Mage on the knoll in both views: BURNING,
  the numbers and the hit all on the goblin on the top. The leap is in a unit test of its arc and carry; I could
  not catch it mid-air in a still.
- **The Graphics sweep chat's files touched again** (`client/scene.ts`, `client/fx.ts`, `three/actors3d.ts`,
  `three/overlay3d.ts`, `three/figs3d.ts`), a line or a few each, at Kyle's word here.
- Signed: Claude Fable 5.2.

## 2026-11-18, noon: the mouse's aim on raised ground

- **Kyle:** "now the aiming is too high. I want to be able to click on a goblin and have it hit them easily if
  they're on the same height as me :)"
- **Two causes, both in the 2.5D view** (`client/three/view3d.ts` `heroScreen`). The aim is the pointer minus the
  hero's place on the screen. That place was taken at level 0, while the hero and whoever stood beside them on a
  raised area were drawn a level or two up the screen: every aim up there pointed north of what was clicked. And
  it was taken at the hero's feet, while you click a goblin's body: a smaller pull north, on any ground. Now it is
  the middle of the hero's body at the height they stand at (the flat view already did both).
- **Other levels** (`shared/heights.ts` `aimOnGround`, wired through `client/input.ts` and one line of
  `client/main.ts`): the aim is moved back onto the ground the pointer is over, by each view's own shift a level
  (`views.levelShift`). Without it a goblin on the field clicked from the top, off to one side, was missed by a
  dozen degrees.
- Measured in the browser, as a Ranger on the knoll, pointer on the middle of a pinned goblin, both views: top to
  top, top to field, field to top, field to field all within about a degree (they were up to 15 off), and the
  arrow lands in each where nothing stands in the way.
- `tests/aimground.test.ts` (4). **For whoever owns input and the 2.5D camera:** the feet-to-body change moves the
  2.5D aim on every map by about half a tile's height, toward what is clicked.
- Signed: Claude Fable 5.2.

## 2026-11-18, afternoon: the sweep of other maps and specs

- **Kyle:** "Can we sweep any other maps and designs and move to this new elevation system where / if it makes
  sense please."
- **Found:** raised ground is laid in five places: the board's job rooms (`shared/terrain.ts`, the classic rooms;
  `shared/roomledge.ts`, layout 3 and 4), the Open Cut's winding gantry, the town, and this chat's lands. The
  table of what was moved and what was left, with why, is in `docs/design/elevation.md`, "The sweep".
- **Moved: the outdoor job rooms.** One object each in `terrain.ts` and `roomledge.ts`: outdoors the ledge is
  `{ kind: 'earth', lv: 1 }` (it was `'wood'` or `'rock'`); a mine's and the under's stay `'rock'`. Same box, same
  ramp, same archers. With a level on it the map's levels are its ground, so all of today's rules reach the daily
  jobs. **Neither file is on the board under a chat; if they are yours, this is the change and Kyle asked for it.**
- **Tests moved, each with its note:** the four pinned room hashes (`tests/layout3pin`, `route`, `routeports`,
  `variety`), and `tests/threat.test.ts`'s limit 210 to 240 s for the one sampled room with a bank (the wand bot:
  231 s, hit about a tenth more; daggers 120, staff 83). **For the General chat:** that room has now had its limit
  raised three times; the last two were heights.
- **A test link:** `?hero=WARRIOR&job=<day>:<n>` (and `&area=<room>`) opens a day's board job (`client/main.ts`,
  three lines). `?hero=WARRIOR&job=2:3&area=3` is the wood room with a bank. Seen in both views.
- **Specs:** `elevation.md` gains "The sweep" and "The quest territories' raised areas" (the old per-territory
  heights marked history); `territories.md` says flat where it said lynchets and "no territory is flat";
  `docs/terrain-nodes.md`, one cell.
- **Not run again:** the whole suite, after the pins. It ran once on this change (250 files passed, these five
  failed as above); the five were rerun and pass, and nothing in `src/` changed after but the test link.
- **Next slice, if wanted:** the stone-faced raised area for mines and the Shafts' benches; then the mound on THE
  FIELDS.
- Signed: Claude Fable 5.2.

## 2026-11-18, later afternoon: the rock-faced raised area, and the bank on THE FIELDS

- **Kyle:** "continue" (to the next slice named: mines, then the Fields' archer).
- **`kind: 'crag'`** (`shared/arena.ts`: the kind, and `raised(l)`, the one test for "a raised area under the
  land's rules", earth or rock; `shared/heights.ts` `isLand`, `sim/climb.ts` and the foot rule ask it). The same
  bank drawn in hewn rock: `client/three/landledges.ts` takes its colours from a palette a ledge (stone steps, no
  posts, no turf); `client/levelpaint.ts` the same in the flat view.
- **The mines' and the under's job rooms** (`shared/terrain.ts`, `shared/roomledge.ts`) lay it, a level up, in
  place of the old rock shelf. So every board room's raised ground is now under the one set of rules. The old
  shelf rule is left for built things (the Open Cut's gantry) and is still tested, on a deck
  (`tests/afoot.test.ts`, its last test rewritten to say so).
- **THE FIELDS' one raised area** (`lowfurrowfieldsland.ts` `MOUND`, `lowfurrowfieldsstooks.ts`): the old headland
  bank behind the near hay cart, 10 by 4.6, a level up, log steps up its face at the west end and up its east
  end, a hedge along its back. Pack 103's archer stands on its lip over the loading; no stooks on it or at its
  foot.
- Tests: the four room pins moved again for the mines' kind (noted in each); the balance bench did not move.
  Whole suite: 251 files passed, those four failed as expected, rerun and passing. Seen in both views: a
  Copperdeep room (`?hero=WARRIOR&job=1:1&area=1`) and THE FIELDS.
- Signed: Claude Fable 5.2.


## 2026-11-18, evening: Lowfurrow's thin places

Kyle said go on the two things I named: Lowfurrow's thin places, then Tollan's Farm. This is the first; Tollan's
two maps are being laid by two builders and get their own entry when reviewed.

- **The pond is an oval** (`lowfurrowfieldsland.ts` `POND`): fourteen bands half a tile deep, the middle pushed a
  little east. One box with two caps read as a tank in both views.
- **The rick is a rick** (`client/pieces.ts`, `haystack` with `look: 1`; `lowfurrowfieldsstooks.ts` sets it): three
  courses taller than a man, a dark thatched ridge, the trodden line between courses, a ladder up its front, the
  fork in its top. The boss barn's low hay heaps (no `look`) are untouched, so nobody else's arena moved.
- **The woman hides behind the near cart, not in front of it** (`lowfurrowfieldsfoot.ts` `GIVER`, 37.6, 90.9): the
  cart's bed hides her to the chest in both views and she is drawn low (`terrkit.ts` `giverNpc`: `low` now kneels
  as well as creeps). You walk round the cart's end to talk. Stood a step south of it she read as a man waiting
  by a cart. The sacks that were behind the cart moved to its west end.
- **The cut strip is not one sheet** (`lowfurrowfieldsland.ts`): bare swathe lines between the cut rows, the east
  end cut in steps with rye standing past them, a tongue of rye left round a nest, wheel ruts to the rick. Paint.
- **The Rise's gathering ground** (`lowfurrowrisefold.ts` `gathering`): between the fold and the gate was plain
  grass. Now the shepherd's cart with spare hurdles leant by it, the water tub and salt barrels, a row of
  sheaves, the corner of a drystone creep, the sheep's paths worn from the gate to the fold and the pens.
- **The brow** (`brow`): the wayside cross is gone (it read as a grave). A wind-bent thorn, a travellers' cairn,
  what the line dropped going over, long grass in clumps, and two standing runs of the old boundary wall with
  the rest down. The `rockwall` kind draws near black in daylight, so I kept the runs short: a long one read as
  a ridge of basalt. For Art: a paler drystone would let walls be used more.
- Not done: the 2.5D stook is still small and bright; `villager` is the only look the woman has and it reads as
  a bald man.
- Tests: `lowfurrowfields`, `lowfurrowrise`, `lowfurrowminis` pass (the minis test stands a hero east of a
  giver on the ground, since a cart may be south of her). Seen in both views.
- Signed: Claude Fable 5.2.

## 2026-11-18, evening: Tollan's Farm, slice 1 (three maps, played end to end)

Built as a big system from its spec (territories.md, "2. Tollan's Farm"): two builders laid a map each to a
brief, I reviewed with pictures and a played run and changed what did not hold.

- **The frame** (`territory.ts`): `tollan` is a land of three maps, its job a hunt for MAWL (`WORK`), in `LANDS`
  now. `knownLand` for the test link. `scripts/land-look.cjs` has picture spots for all three.
- **Map 1, THE HOME GROUND** (`tollanorchard*.ts`, a builder's): the lane's end and milk stand, the walled
  orchard in rows (one tree being shaken bare, the hives kicked over, a trail of spilt apples to the sacks by
  the door), the door in the orchard wall as its gate, then the paddocks: hurdle lanes, a hay paddock, an oval
  dewpond, a side lane to the field shelter with a cage standing in for the roped man. Eighteen goblins in six
  packs. Flat. What I changed: the rows planted close in the row with shade under every tree (at 3.8 each way it
  was a grid of single trees), and an apple tree's drawn size now follows its trunk (`client/pieces.ts`; every
  apple tree was one size, so old and young read the same). A half-tile trunk draws as before.
- **Map 2, THE YARD** (`tollanyard*.ts`, a builder's): the home close under the yard's wall (hay cart, rickyard,
  troughs, duck pond), then the yard as the map's one raised area, a `'crag'` terrace two levels up right across
  the map, a six-wide stone flight where the cart road climbs and two-wide steps at the east corner, two archers
  on the lip either side of the flight. On it the farmhouse, cart shed, granary, byre, sties, well, midden, and
  the house's goods dropped along the way to the barn. Fourteen goblins.
- **The barn was laid as a walled court on the yard map and read as one, so I rebuilt it.** Outside, on the yard
  map (`tollanyardbarn.ts`): a roofed barn, its body and a bay either side of the wagon porch, the great doors
  shut in the porch's mouth as the yard's gate. They open when the yard's are dead and the party stands at them;
  the porch behind them is the map's way out. **Map 3, THE BARN** (`tollanbarn.ts`, mine): the inside, 26 by 18,
  a room with a plank back wall: six roof posts in two rows, three hay stacks down the west aisle, stalls along
  the back, the flagged threshing floor open in the middle, MAWL's larder heaped down the east aisle, three
  feeding at it, a chained chest behind. Its goal is the job's: kill MAWL, then the way home is back out of the
  doors. An inside has to be a room, not ground with a wall round it.
- **A bug of mine from this afternoon, found here and fixed** (`shared/heights.ts` `heightAt`): it sloped only
  `'earth'` ramps, so a rock-faced bank's steps drew as two flat slabs with the face run across them, and bodies
  popped up them. It tests `raised(l)` now. This also puts right the mines' banks pushed this afternoon. Drawing
  only: the fight never used it.
- **The duck pond** on the yard map is an oval in bands (it was one rect).
- **Kept from the spec, not done:** the yard gate at the top stands open, as Tollan left it, and leads nowhere
  yet (the dog's slice). The bows are on the wall's lip, not the cart shed's roof. No kitchen interior, no dog,
  ordinary gate art for the great doors, a cage for the roped man.
- **For Art, from both builders' wish lists:** straw skeps, ground windfalls, a milk stand with churns, an
  open-fronted shelter and cart shed, a stone trough, a midden heap, a farmhouse door standing open, and a paler
  drystone (`rockwall` is near black by day, and Tollan's orchard is walled in it).
- **Words:** none new on screen. Zone and stretch names are not shown; the goal lines are the hunt's own.
- **Tests:** `tests/tollanorchard.test.ts` (9), `tollanyard.test.ts` (11), `tollanbarn.test.ts` (5).
  `tests/perfparity.sim.golden.json` re-recorded: only the hill scene moved, because a hiding giver's person now
  carries `kneel` (paint). Whole suite: 258 files, that one failure, re-recorded and passing. A played run in
  the browser by the room's own rules: orchard gate, paddocks, out; the yard, the doors, the porch; the barn,
  MAWL dead, home.
- Signed: Claude Fable 5.2.

## 2026-11-18, night: Tollan's dog and the two-leaf doors; Sallow Carr begun

Kyle: "Do it" (the dog and the two-leaf doors, then start Sallow Carr).

- **The dog** (`client/farmdog.ts`; territories.md, "Only here: the dog"). Paint only, as the spec's dog is: it
  can't be hurt and never fights, so the room never knows it is there and each screen works it out from the
  heroes every screen has. A map says where it waits (`GameMap.dog.posts`, in order, each with how high it
  stands: on a wall). It sits watching whoever is nearest and runs on to the next post when they come within
  6.5 tiles; at its last it stays. Drawn by the hound painter as a collie (`FARM_DOG`), one line in each view
  (`client/scene.ts`, `three/cards3d.ts`, beside Maeve's runner). On the home ground: on the orchard wall as you
  come up the lane, on the far wall by the door, ahead in the hurdle lane, at the lane's head. On the yard map:
  by the paddock gate, the foot of the corner steps (the quiet way up), its place by the yard wall, home at the
  farmhouse door. In the barn it is not there while MAWL stands (`late`), and is at the doors after.
  Not done: it is not yet with Tollan in town afterwards, nor gone from the ground for a hero who has done the
  job (that needs Tollan in town, new cast, and a line in the hero's save: the Town quests chat's ground).
- **The barn's great doors are hauled** (`Stretch.haul`, `Block.open`; `sim/stretches.ts`, the Instances chat's
  file, a small edit). With the yard's dead and the party at them, they come open over 4 seconds for one hero
  and 2.5 times as fast for two or more; step away and they swing back. The gate rule runs once a frame, so the
  haul goes by the room's clock. `look: 2` on a gate draws two leaves parting from the middle and a bar over
  the lintel for how far the haul has come (`client/gatedraw.ts`, `three/gate3d.ts`, `three/extras3d.ts`: the
  Instances chat's small files, edited). `client/checknotes.ts` no longer says "waiting for the rest" when
  everyone is already there (one line). No new words.
- **A stretch's dens** (`Stretch.dens`, `stretches.ts` `densOf`, `goal.ts`): a gate does not open while its
  stretch's dens stand, and the goal says so in the burn job's own line. For Sallow Carr; nothing uses it yet.
- **Sallow Carr, slice 1, begun.** The frame is in (`territory.ts`: `sallow`, two maps, a burn job; not in
  `LANDS` yet) and two builders are laying THE OSIER BEDS and THE WILLOW HOLT. Slice 1's cuts from the spec,
  mine to own: a sluice is a hauled gate with the cut beyond it laid already drained (water that drops when
  you wind it is the new system the spec asks for, and touches how water is drawn and sent; its own slice);
  no skimmer and no oil alight on water yet.
- Tests: `tests/farmdog.test.ts` (7: the dog's rules, its posts on all three maps, the hauled doors). Whole
  suite: 259 files pass. Played in the browser end to end with the haul.
- Signed: Claude Fable 5.2.

## 2026-11-18, late: Sallow Carr, slice 1 (two maps, played end to end)

Built from its spec (territories.md, "3. Sallow Carr") by two builders to a brief each; reviewed with pictures
and a played run.

- **The job** (`territory.ts`): `sallow`, two maps, objective `burn`, in `LANDS`.
- **Map 1, THE OSIER BEDS** (`sallowbeds*.ts`, a builder's): its ground is a grid of dry, wading and deep laid in
  layers of ovals and bands (`sallowbedsland.ts`). The drove's end; rows of stools between two ditches; a pen
  half woven; den 1 and its oil on the bank; the first sluice across a deep cut; the drained bottom; the old
  causeway half under with boards over its two breaks; Lowfurrow's tools under a dead willow; a wade to a
  hummock with a chest; the holm with den 2, the pot, drying racks and the cage eight tiles from the den; the
  second sluice; the last cut. Nineteen goblins in seven packs. What I changed: the beds' two ditches are deep
  and black, crossed only at the drove's boards, with reed and sedge standing along their banks. At wading
  depth they drew a clean bright turquoise and were nothing to fight.
- **Map 2, THE WILLOW HOLT** (`sallowholt*.ts`, a builder's): one duckboard zig-zagging through dense pollards
  and dead trees over black water, deep off the boards; a camp hummock; side boards to a web pocket with a
  chest, a nest and a brood mother; a hurdle gate where the boards come ashore; then the main bank, the map's
  one raised area (`'crag'`, a level up, a six-wide flight and narrow east steps, two archers on its lip): the
  hut, the one den against its wall, seven kegs of oil, the great sluice's frame, a keg cart stuck on the bank
  road. Thirteen goblins and the spiders. Taken as laid.
- **A sluice** is a gate that is wound (`haul` 5) and kept shut by its den (`Stretch.dens`, added this evening).
  The goal line while a den stands is the burn job's own ("Burn out the dens (1 hut left)"). On the last map
  the goal is the job's: its goblins dead and its den burned.
- **Cut from this slice, said in the spec too:** the water does not drop when a sluice is wound (the cut beyond
  is laid already drained). That is the new system the spec asks for; water is built once on each screen and
  not sent, so it wants its own short spec. No skimmer, no oil alight on water, no fire behind you on the way
  out.
- **For Art, from both builders:** a pollard willow (squat crown, grey-green), an osier stool, webs strung
  between trees, a small stone hut, a sluice frame with its leaf and winding gear, a log across water that
  reads as a log (`gangway` draws as a dark slab), dark peaty shallows, mist banks.
- **Tests:** `tests/sallowbeds.test.ts` (9), `sallowholt.test.ts` (13), `sallowcarr.test.ts` (3: the job, a
  sluice shut by its den and then wound, the last map's goal). Played in the browser end to end.
- Signed: Claude Fable 5.2.

## 2026-11-18, late: flora research (no build)

Kyle: "grass (reeds?) look a little weird sometimes in general and trees etc could use more variety. I want
these worlds to be beautiful. Spin up some sub agents and get them researching." Three researchers: an audit of
how every plant is drawn today in both views (pictures in `scratch/flora/`), and two reading how other games do
ground cover and trees. Written up as `docs/design/flora.md`: nine defects worst first with their causes, what
good looks like, and four slices. Nothing built. Most of what it would touch is the Art chat's, so who builds
it is Kyle's call. Signed: Claude Fable 5.2.

## 2026-11-18, late: flora slice 1 (the weird reeds, lollipop trees, glaring straw)

Kyle, on the flora research: "do it". Slice 1 of `docs/design/flora.md`, as small edits in the Art chat's files:

- **Flat-view reeds** (`client/sprites.ts` `reedClump`; `makeSprite` takes `outline`, default as before;
  `client/blocks.ts` `drawRound`): three clumps, 15 by 20, one-pixel stems at mixed heights, dark blue-green at
  the foot, green, a pale yellow-green tip, some bent, a brown head on a few tall ones, about one stem in seven
  dead and straw-coloured, no outline and no edge shading. Picked and flipped by where the clump stands. They
  were five fat outlined stems of one height and read as a black comb that buried bodies.
- **2.5D reeds** (`three/rounds3d.ts`): eight stems at mixed heights, each a dark foot and a paler top, heads on
  a few, graded as every other plant is (they skipped the grade and were the brightest thing on the map).
- **A living tree's trunk follows its size in 2.5D** (`three/rounds3d.ts`): height `0.6 + 1.2 r`, width
  `0.14 + 0.22 r`, both capped at the old 1.5 by 0.3, the crown lowered with it. A dead tree is as it was. The
  ditch-bank willows I laid on Sallow Carr this evening are a proper size now (0.42 to 0.6), not 0.22.
- **Crop and straw** (`client/soil.ts`): 20% and 17% flecks, not 35% and 30%, and the near-white gold is gone.
- Seen in both views on Sallow Carr and Lowfurrow. Whole suite: 262 files pass.
- Signed: Claude Fable 5.2.
