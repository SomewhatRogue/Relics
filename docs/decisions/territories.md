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
