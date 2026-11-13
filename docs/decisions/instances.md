# Instances: decisions

The Instances chat's log (docs/BOARD.md). Newest first, signed with the model. Spec: docs/design/instances.md.

## 2026-11-11: act 1's reckoning house, arc step 2 (Kyle: "do it"; Claude Opus 5.5)

`shared/cutreckon.ts`, between the rows and the fork yard (a lull either side). Rakehead's pay office as the goblins'
counting house: a forecourt with a tipped ore cart and two at the door; stone walls, a front and a back door; shelves
of books down the west wall (`books`), the pay counter, desks, sacks of pay tins, the floor littered; a chalker at the
tally board, 45 strokes up (`variant: 'chalker'`, task `tally`); the clerk's room boxed off with a partition, the
clerk dead at the desk and a chest; and the back door kept by a shield, a shield and an archer (pack 3), whose deaths
open the gate (`Stretch.packs`; goal "Kill the goblins keeping the gate", a new line for the next writing pass). The
clerk's book with the Overman's mark (the spec) waits for a way to read things in the world. Next: over the top's
places (the winding house, the incline).

## 2026-11-11: acts and the fork vote, arc step 1 (Kyle: "build it"; Claude Opus 5.5)

docs/design/open-cut-arc.md step 1. An instance's areas are its acts; an act can be a fork (`InstanceArea.ways`), the
map loaded for it the way the party chose (`run.way`, `areaOf(job, i, way)`). A map can end in a fork yard
(`cutMap(..., fork)`: a last stretch with no goblins, 14 wide so a phone sees both ways, two roads in its back wall,
`Road.vote`, their names drawn from the start). The vote (`sim/fork.ts`, on the leader in tally): once the yard's
reached, when every hero who's up stands on one way or the other, the way with more of them wins; a tie decides
nothing; alone, your way is the way. Then the party walks out by the chosen way (`client/game.ts`) and the next map
is that way's. Each hero stepping onto a way hears its count ("OVER THE TOP: 2 of 3"). The Open Cut for now: act 1
Rakehead (the rows, then the fork yard), act 2 over the top (the workings, the Brakesman) or under the hill (the washing
floor, the Sluicer and Raker), act 3 the Haulier; the new places come in the next steps. Writing pass (lore keeper,
line editor) on the gate and fork lines and the board row: "Everyone stand at the gate together", "Everyone stand on
one of the two ways. The way with most of you on it wins", "Down through Rakehead to the pit, about 30 minutes, someone
keeping each gate" (the line editor's "a named foe" not taken: the bible keeps "named" off these). Next: act 1's
reckoning house.

## 2026-11-11: the Open Cut's story and its ways, spec (Kyle; Claude Opus 5.5)

Kyle asked for each instance anchored in a story arc with a few choices of way, several bigger maps each with its own
mini-boss and boss, and the way leading back to the start. The fork: "majority rules, all have to line up on it";
THE OVERMAN for now, each instance its own theme. Spec: `docs/design/open-cut-arc.md` (and the Project's
`claude/open-cut-arc.md`): three acts (Rakehead; over the top OR under the hill; the pit floor), the cage back up to
the rows. New: the reckoning house, the fork yard and its vote, THE LAMPMAN (the lamp room, fights in the dark),
the Haulier as the over-the-top way's boss and the Sluicer and Raker as the other's. Lore keeper: on theme, with its
fixes taken (heads and loads only, "the forge" not Coldscar on screen, no shard hints, the watch lamp kept apart,
the ending a story that replays). Open for Kyle: which relic the Overman gives (the bible has the Grappling Hook from
Hempen).

## 2026-11-11: the Open Cut on one map, step 2 stage A (Kyle: "exactly like that. some periods of lull in between mobs"; Claude Opus 5.5)

`shared/cutmap.ts` joins the places built by hand into one map, bottom to top: the rows, a gate, a lull (a quiet
path of 9 tiles, a fire basket, a body, no goblins), the workings, a gate and a lull, the washing floor, then the map's
way out to the Haulier's arena (the job is now 2 rooms: the map, the arena). Each place is moved into place with its
packs renumbered by place; rock either side of a place narrower than the 28-wide map. A stretch can now also be
kept by guard packs (`Stretch.packs`) where there's no named one. Fewer goblins, each much tougher: 35 on the map
(was 47 across the areas), every one at 3x a job goblin's health (`INSTANCE.tough.hp`, was 1.5x), the named ones 1.5x
(was 1.25x). Fixed on the way: the Raker lifts from a gap between their bodies (`PAIR.reach` 0.9), not from their
middles 1.1 apart, which the two bodies pushing apart could keep it just short of. Board posting: "Down through
Rakehead into the pit, about 30 minutes, a boss in each place" (to the writing pass with the gate lines). Next, stage
B: the new places (the reckoning house, the winding house, the terraces) between these. Kyle also asked for story
arcs with a few choices of way (a dungeon or the main hall and kitchen), several bigger maps each with its own
mini-boss and boss, the way leading back to the start: to design next, with the lore keeper.

## 2026-11-11: one map in stretches, step 1 (Kyle: "go for it"; Claude Opus 5.5)

docs/design/open-cut-map.md step 1 (`sim/stretches.ts`). A map lists its stretches (`map.stretches`: the named ones to
kill, the gate block at its end, where the party gathers, the checkpoint beyond). A new block kind `gate`, solid until
the room marks it `ruined` (open), which the path grid and every friend's screen already follow; drawn shut as banded
timber, open as its posts (`client/gatedraw.ts`). The gate opens when the stretch's named ones are dead and every hero
who's up stands at it (GATE OPEN); the party's then in the next stretch (`run.stretch`), the checkpoint moves to the gate
(`run.check`, where a wipe gets everyone up: `sim/checkpoint.ts`) and the wipe count starts again. The goal line, the
way-on arrow, the waiting line and the boss plate follow the current stretch. A new room (the boss arena) clears the
stretch and checkpoint. The stress map now has a stretch a row, a gate in each wall and a WARDEN (dev label) to kill
(`?stress=1`). Waiting on the writing pass, with step 2's lines: "Way on: through the gate, all of you together" and
GATE OPEN. Next: step 2, the Open Cut remade as one map.

## 2026-11-11: the Open Cut as one map: the spec, and step 0 measured (Kyle: "do it"; Claude Opus 5.5)

Kyle wants one huge WoW-like map with paths and branches, fewer and tougher goblins, each boss in a crafted place
with a story, intros for the mini-bosses, the Haulier a mini-boss and an end boss in stages with better loot. Spec:
`docs/design/open-cut-map.md` (also the Project's `claude/open-cut-map.md`).
Step 0, the stress test (`shared/stressmap.ts`, dev only, `?stress=1`; `STRESS=1 npx vitest run tests/stress.test.ts`):
a 150x150 map (twice Fenmere), a path winding between rock walls, 150 goblins in packs of three, 2,600 trees and rocks.
Node: plan 3 ms, room 2 ms, first tick 40 ms (the path grid), then 0.5 ms a tick (p95 0.7, max 12); split three ways,
0.6 ms (p95 0.9). Browser at phone size with the CPU slowed 4x: load 2.4 s, frames 23 ms on average (p95 33), the
room's step 1.4 ms (p95 3.1, max 29, path fields as packs wake); Fenmere on the same run: load 1.9 s, frames 34 ms (p95
50), step 1.7 ms. So one map twice Fenmere's size is cheaper than Fenmere is now: go. The one spike to watch is a path
field built as a pack wakes (up to about 30 ms once). Next: step 1, stretches and in-map gates on one map.

## 2026-11-11: harder, no damage cut down, CUT FREE (Kyle's play notes; Claude Opus 5.5)

Kyle: "it just didn't feel hard enough. too easy to dodge everything without even skill and low damage numbers to
bosses just felt like a self punishment"; and of the Drover: "what did 'stand still by' even mean? ... it's fine if
there's a trick to do extra damage to a boss but it's really unclear what it is or how you learn it".
- No blow on a named one is ever cut down any more: the Drover's quarter and the Brakesman's half are gone. The trick
  pays instead: cut the Drover's line, or knock the Brakesman off its brake, and it's OPEN, taking 1.5x for 5 s
  (`INSTANCE.open`, `takes`/`openUntil`, an `opened` event that says OPEN).
- The Drover's cut is a button now: by a roped digger the context button reads CUT FREE (the Staithe's word; GRAB
  pressed), and a ring fills on the digger while you stay by them (`ropedNear`, `client/cluster.ts`). Goal: "CUT FREE
  the roped diggers, then kill THE DROVER" (built of the button's own words, so no writing pass).
- Fiercer: every instance goblin winds up in 0.8 of the time (never under an elite Quick one's floors), rests 0.7 as
  long between blows and moves 1.1x (`INSTANCE.fierce`, `fierce`, hooks in `sim/elite.ts`); every pack of two or more
  is led by an elite, its affix by the seed (`INSTANCE.leaders`, `shared/cutkit.ts`). On top of 1.5x health and 1.3x
  hits from the change before.
Open: a Warrior pressing CUT FREE by a digger may also hear NOTHING TO GRAB.

## 2026-11-11: Kyle's first play of the Open Cut, and two fixes (Claude Opus 5.5)

Kyle: "the Raker was super fun. sluicer was okay but didn't really feel unique and honestly i have NO idea what the one
throwing carts was meant to do none of the carts came to me and i couldn't throw them back... it felt like it was just
a small room to a mini boss to a miniboss and then finally a boss. I want the BOSS to be a miniboss and bosses to be
even more epic and stage based but have a lot better loot pay off. And i want enemies to be even harder on the
instances."

Why the Brakesman failed: the GRAB button shows only by something liftable (or for a Warrior), and a rail cart isn't
liftable, so most heroes never had a button by a cart; and the carts ran across the chamber on one rail, so they only
came at whoever stood in that lane. Fixed now: GRAB shows by a cart standing on a rail (`client/cluster.ts`, which
also covers the Haulier's carts in the Deep). Harder now: every instance goblin 1.5x health and 1.3x hits, the named
ones 1.25x health, at any party size (`INSTANCE.tough`), before the three-hero floor and the fourth hero's share.
Proposed to Kyle, waiting on his yes: the Haulier becomes a mini-boss, a new end boss for the Open Cut in stages with
the better loot, longer areas between bosses, the Brakesman's chamber as an incline the carts come down at you, the
Sluicer given its flood.

## 2026-11-11: THE SLUICER and THE RAKER (Kyle: "continue"; Claude Opus 5.5)

Step 3, the washing floor's pair, from the spec's "one raises the other, so kill both close together" (`sim/pairfall.ts`,
numbers `PAIR` in `shared/instancetune.ts`, the lift's ring `client/pairdraw.ts`). A blow that would kill THE SLUICER
while THE RAKER stands drops it in the water instead (`fallen`, hp 1, nothing lands: a hook in `sim/damage.ts`; IN THE
WATER). The Raker leaves the fight, walks to it and lifts it 2.5 s (a ring at the Sluicer's feet; a stun on the Raker
starts it over), and the Sluicer is up at half its health (STOOD UP). Kill the Raker while it lies there and it's
dead too; kill the Raker first and the Sluicer fights on alone and dies as any. The Raker is the tougher (380 to the
Sluicer's 260), so killing it first is the long way. Goal: "Kill THE SLUICER and THE RAKER close together. If the
Sluicer drops first, the Raker drags it back out" (lore keeper and line editor). Found and fixed for both this and the
Brakesman: a goblin walking somewhere (the Raker to the Sluicer, the Brakesman back to its brake) rocked between there
and the nearest hero, its own chase pulling it back each tick; now its own movement that tick is undone while it
walks. The atlas's flooding isn't in. Open: every number.

## 2026-11-11: THE BRAKESMAN's fight (Kyle: "go"; Claude Opus 5.5)

Step 3, the second named one, from the spec's "it rides the brake at the top of the incline and lets the carts go"
(`sim/brake.ts`, numbers `BRAKE` in `shared/instancetune.ts`, the lane `client/brakedraw.ts`). A rail across the
workings' last chamber (`map.rail`, drawn as the Haulier's), its top end at the left by the brake, its bottom by the
way in. On its brake it stands at its post braced (blows at half, BLOCKED) and swings at whoever comes close. Every 4 s
(2.6 s under 40%) a cart comes up to the top, its lane striped the rail's length for 1 s, then runs down and knocks
flat whoever's in it (striped: out of the lane saves you). GRAB held 0.6 s by a cart standing on the rail sends the
head of its queue back up; into the Brakesman, it's knocked off the brake (30 hurt, stunned 3 s, no carts for 6 s) and
fights in the open, then walks back to the brake. It never dozes (the rail is longer than an area's wake distance) but
lets no cart go till someone's within an area's wake distance of the brake. `screened` is now the share that gets
through (the Drover's quarter, the Brakesman's half). Carts are counted on the rail only (the first chamber's two are
scenery). The writing pass for both fights: "Stand still by a roped digger to cut them loose, then kill" and "GRAB a
cart and send it up the rail at the brake, then kill"; CUT LOOSE kept. The spec's carters below who kick carts loose
are not in yet. Open: every number; the 2.5D view doesn't draw the striped lane.

## 2026-11-11: THE DROVER's fight (Kyle: "continue"; Claude Opus 5.5)

Step 3, the first named one. The spec's line "free the line and it has nothing to stand behind" as a rule (`sim/drover.ts`,
numbers `DROVER` in `shared/instancetune.ts`). THE DROVER is the guard in front of the roped diggers (`Foe.drives`).
While any digger is still roped it's `screened`: a blow lands at a quarter and says BLOCKED (`sim/damage.ts`). Standing
still by a roped digger for 1.6 s cuts the whole line loose (a ring on the digger fills: `client/captives.ts`; CUT LOOSE):
the diggers are free, and the Drover and its guard leave the line and come at you. One holds it while another cuts;
alone, you cut first. Its line is held (`led.hold`): at the top of the street the guards stop over the diggers, still
roped, instead of walking out of the room with them (`sim/tasks.ts`, `sim/scenes.ts`), so letting it walk is no way
round the fight and the diggers are never lost. The goal says "Cut the diggers loose (stand by them), then kill THE
DROVER" while it's screened. Under it the Drover is still the stand-in heavy (380, at three heroes' health).
Open: every number (a quarter, 1.6 s, 1.1 tiles).

## 2026-11-11: instances, the frame and the first one, the Open Cut (Kyle; Claude Opus 5.5)

Kyle: "Build instances from the spec, starting with build-order step 1 (the instance frame), then the first instance."
Spec `docs/design/instances.md`, steps 1 and 2.

**The frame.** An instance is a job (`Job.instance`) whose rooms are its areas, taken in turn by the run as any job's
rooms are (`shared/instances.ts`); each area is built by hand from the job alone (`shared/cutkit.ts` on the expedition
kit), the last can be a boss arena (`Job.arena`). `sim/instanceroom.ts` builds an area: goblins doze past an area's
distance (`INSTANCE.wake` 15, `doze` 19, `room.sleepAt`, not a big map's 24/30) and with that a friend is sent only what's
near them (`client/interest.ts`, already keyed on dozing rooms); the pacing caps hold. An area's gate opens when its
named ones are dead (`sim/goal.ts`; cages are there to free, never needed) and takes the whole party standing in it
(`Game.together`, as before). **Checkpoints** (`sim/checkpoint.ts`): every gate is one. A wipe (alone, going down; in a
party, everyone down with nobody left to get up on their own) is a 3 s beat, then everyone up whole at the gate and the
goblins still standing back where they were put, whole; the dead stay dead. The third wipe since the last gate loses
the run (`run.downs` counts wipes, zeroed at each gate). Out while friends fight on: up at the gate 10 s later (the walk
back). Lines over your hero for a gate passed, a wipe and waiting in an open gate (`client/checknotes.ts`).
A guard driving a roped line never dozes (`sim/sleep.ts`): a dozing one read as dead and freed the line for nothing.

**The Open Cut** (posted on the board after Fenmere; `?hero=WARRIOR&cut=1`, `&area=N` to start at area N): from the
atlas's Rakehead and Kyle's cast in the spec (2026-11-11, none a butcher). THE ROWS (16 wide so a phone sees both rows: a
pack at its fire, the roped diggers driven up the street by THE DROVER in front of them, a kept cage either side, three on
a round, the rest in the square); THE WORKINGS (three rock chambers, each way through at the other end: sleepers by the
carts, a cage, a shield wall, a round, THE BRAKESMAN); THE WASHING FLOOR (shallow pools, the deep sluice crossed at two
fords, a shield pair with a hexer behind on one, archers over the other, a cage, THE SLUICER and THE RAKER, both to
kill); then the Haulier's working from the Deep. The named ones are stand-ins with boss health (a heavy, an ironhide);
step 3 gives each its own fight. **Built for three** (spec, Kyle 2026-11-11): the hand-laid packs as they are for one
to three heroes, never more goblins; each hero past three, every goblin 30% tougher and 15% harder hitting
(`INSTANCE.party`, `.more`); the named ones and the Haulier at three heroes' health at the least.

Lore keeper and line editor on `shared/opencutwords.ts`: everyone taken, not every man; "gate" not "checkpoint"; the run
"lost", not "over". Open for Kyle: the atlas planned the reckoning house and the hush gully where this has THE WORKINGS
and THE OPEN CUT; a wipe at the Haulier leaves it as it was (its kit isn't reset); no unique drops yet (they roll in the
Deep only; step 4). Every number.

Touched outside this chat's files, small: `docs/design/instances.md` (General's) only its status line ("steps 1 and
2 built"); shared `game.ts`, `main.ts`, `tuning.ts` (a re-export), `jobs.ts` (`Job.instance`), `sim/run.ts`,
`sim/room.ts` (`sleepAt`), `sim/sleep.ts` (escorts never doze), `sim/goal.ts` (an area's gate), `client/boardui.ts`.
Next: step 3 (each named one its own fight, then the Open Cut's Haulier), then step 4, where Rakehead's pools go into
`shared/uniques.ts` and the two Haulier lists merge (the board's collision).

## 2026-11-11: over the top, the winding house and the incline (arc step 3, first two places)

- Over the top is now two places on one map: THE WINDING HOUSE (`cutwinding.ts`: the burnt headframe and drum, a
  wooden gantry on the east with archers on it and a shield at its stair's foot; that pack keeps the gate,
  `WINDING_GUARDS`) then THE INCLINE (`cutincline.ts`: three rail lanes up to the brake, rock banks, carters at the
  foot, a shield and an archer halfway, a spent cart at the foot of the middle lane). `cutworkings.ts` is gone.
  `cutmap.ts` now carries a place's ledges and `map.incline` when it lays it on the map.
- THE BRAKESMAN reworked for the incline (`sim/brake.ts`): it lets a cart go down the lane nearest the nearest
  climber, striped while it waits at the top and while it runs (brakedraw.ts). Kyle (2026-11-11), on the old one:
  "no idea what it was meant to do, the carts never came to me and I couldn't throw them back"; then "maybe you
  send a cart back by timing a power hit at it so it flips back". So: **a held attack let go as a cart reaches you
  sends it back up the lane** (`BRAKE.flip`, at most 2.6 tiles, so a bow can't do it from the foot; late and the
  cart has you). At the top it knocks the Brakesman off (stunned, OPEN, no carts a while). A cart going up smashes
  one coming down off the rails. GRAB at a spent cart at the foot still sends it, slowly. The first two carts it
  lines up on someone, how to is said over them (`BRAKE.told`, BRAKE_WORDS.how), and SENT BACK over a hit cart.
- Lines: lore keeper then line editor. Goal "Hit a cart back, then kill"; "HOLD ATTACK, LET GO AS IT REACHES YOU"
  (kept "let go", the game's word; the editor's "as it hits" read like getting hit); "SENT BACK"; the gate pack's
  "Kill the goblins at the gate". Lore keeper notes for the bible: the Brakesman isn't in story-bible.md yet, and like
  the Open Cut's Haulier it should be neither a butcher nor from the Deep.
- Tests: the Brakesman's rewritten for the incline (lane aimed at you, the flip, too late, GRAB, walk back); the walk
  check counts a goblin on a ledge as reachable when its stair's foot is. Full suite green.
- Touched outside my row, small: `client/fxhaul.ts` (the flip and the how-to cues, beside the cart's), `client/scene.ts`,
  `sim/types.ts` (`cart` events 'flip' and 'aim', `brakes.told`), `shared/arena.ts` (`GameMap.incline`).
- Next: the loading stage and THE HAULIER as this way's boss, in the map. (Claude Opus 5.5)

## 2026-11-11: the out-of-bounds dread switched off

Kyle: "that's something we put in place to avoid people trying to break the game and go out of bounds but it's not
working right... can we nix that feature entirely for now?" (it was warning on the incline, in bounds). `DREAD.off`
in shared/tuning.ts, checked at the top of sim/dread.ts `stepDread`: nobody is warned, seized or set back anywhere
(town included), and with the dread never building nothing is drawn or heard. The code and tests/dread.test.ts stay
(the test switches it back on for itself), so it can return once it judges bounds right. Small edits in shared files
(tuning.ts, sim/dread.ts, tests/dread.test.ts). (Claude Opus 5.5)

## 2026-11-11: Kyle's play notes: the Drover fights, boss stuns, real numbers

Kyle, after playing: "the first boss didn't actually ever attack, which was kind of anticlimactic"; "some stuns should
still happen like rogue backstab, shadowstep etc but just not perma stun, e.g. after a stun or freeze they can't be
again for 20s or so"; "the numbers are TOO inflated now. I meant more that I don't want numbers to be nerfed for
bosses: normal damage minus shield and armor, but bigger health pools. I feel like I'm doing BIG numbers now but it's
not killing quickly, so kind of anticlimactic".
- THE DROVER walked its line and only turned on someone right on top of it or hitting it (reproduced: a hero 2.8 tiles
  off was ignored 12 s). Now anyone within `DROVER.notice` (5) and it leaves the line to come for them; its guards
  walk the line on (sim/drover.ts). Test added.
- **For the Deep chat (boss-threat step 2), changed at Kyle's word:** `BOSS_HOLD` now `{ freeze 1, freezeAgain 20,
  stunShare 1, stunAgain 20 }`, and a stun or a freeze sets both timers (sim/bosshold.ts). sim/stuns.ts: a kit boss no
  longer shrugs every ordinary stun (`immune` dropped from `mayStun`): any boss or BIG ONE takes a hero's stun in full,
  then none for 20 s; a Ranger's blind counts as its stun (sim/rangershots.ts). POISE and forced knockdowns as before.
  Tests that pinned the old rule updated (bosshold, boss, hempen).
- **Also yours, at Kyle's word:** `SHOWN` back to 1 (shared/shown.ts, kept as a knob); shown and trainer tests read
  it through `shown`. docs/design/boss-threat.md still says x10: yours to update.
- Bosses already took every blow in full minus their armor (plates, a door); nothing changed there. The instance's
  bigger pools (`INSTANCE.tough`) stay as Kyle asked. (Claude Opus 5.5)

## 2026-11-12: the loading stage, THE HAULIER as over the top's boss (arc step 3 done)

- Kyle: "Do it" (the loading stage and the Haulier). THE LOADING STAGE (`shared/cutloading.ts`) is over the top's
  third place: the Haulier's whole working from its own ground (shared/sumparena.ts `SUMP_SPOTS`, moved by
  `LOADING_AT`): the rail and its two carts, the gear and its legs, the sump, the adit; ropeway pylons, the stage hut
  and ore bins about it; the chained chest behind. `cutmap.ts` now carries a place's gear and adits.
- `sim/instanceroom.ts` `kitBosses`: a kit boss in an area gets its body, notes and book as in its arena
  (sim/arenaroom.ts), the chained chest the sure one; it's left out of the instance's toughness and fierce hooks (tuned
  as in its ground, three heroes at the least). Its unique drop goes as before (sim/uniquedrop.ts keys on the boss).
- Act 3 (the Haulier's arena) is gone for now, so over the top doesn't meet it twice: the job is two acts, no
  `arena`, no `boss`, and each way's boss ends the run (the last stretch of the last area says "Way home", sim/goal.ts)
  till the pit floor and the Overman (arc step 5).
- Found on the way: the Brakesman took any cart standing above its incline for one sent back up (the stage's carts
  would have jammed it): its own lanes' carts only now. And the GRAB button for carts only showed on maps with a rail,
  so never on the incline alone (client/cluster.ts).
- It notices you as any goblin does (about 5 tiles in the mine's dark), then fights its full rotation; screenshot
  checked on a phone. Tests: the stage's pieces, its toughness by party, waking and fighting, the way home at its
  death. Full suite green.
- Kyle's puzzle idea written up for his yes: docs/design/instance-puzzles.md. (Claude Opus 5.5)

## 2026-11-12: instance puzzles, the first: pushing tubs on THE SORTING FLOOR

- Kyle: "some puzzles in the instance could be good. Simple pushing boxes or old runes... especially in multiplayer
  having a wave come at you while you solve. Single solo would just be the puzzle." Spec docs/design/instance-puzzles.md;
  Kyle: "Yup" to tubs first.
- The frame: `shared/puzzle.ts` (a grid, its walls, plates, starts, the lever, the drift; `fromRows` from text;
  `solved`), `map.puzzles`, a stretch's `puzzle` (its gate waits on it: sim/stretches.ts `gateReady`, and the goal says
  what to do: sim/goal.ts), `cutmap.ts` carries puzzles. Tubs are a prop kind ('tub') like the Haulier's carts: never
  broken, knocked, lifted. `sim/tubs.ts`: hold the stick into a tub straight along the grid `PUZZLE.push` (0.3 s),
  touching it, and it slides a square if it's on the grid, not rock and free; GRAB by the lever puts every tub back;
  every plate covered, solved, and it stays so. Two or more up near it and unsolved: a goblin out of the drift every
  `PUZZLE.wave.every` s, three at most, instance-tough. Alone, just the puzzle.
- THE SORTING FLOOR (`shared/cutsorting.ts`), first under the hill before the washing floor. The layout was picked with
  a solver (ten pushes at the least, one stranding first push); tests/puzzles.test.ts solves it in TS too.
- On screen (`client/tubdraw.ts`): tubs, iron plates with chalked squares (faint on the glow layer so they read in the
  dark, gold once a tub's on), the lever. Fire baskets at the grid's corners and boulders for its rock, after a phone
  screenshot showed it too dark to read. The button by the lever reads PULL (client/cluster.ts); cues and sounds in
  client/fxweak.ts. A test link `?cut=1&area=1&way=1` for under the hill (main.ts, game.ts `startJob` way).
- Lines: lore keeper then line editor (see the spec). Full suite green. (Claude Opus 5.5)
- **For the Deep chat:** your cart rework (4735cb9, carts grabbed and thrown anywhere) runs `stepCarts` over every cart
  on the map while the Haulier's awake. Over the top, the Haulier's stage shares a map with THE BRAKESMAN's incline,
  so its lane carts would have been grabbed and pushed sideways. One guard in sim/haulcarts.ts `isCart`: not a cart on
  `map.incline`'s lanes. (Claude Opus 5.5)

## 2026-11-12: THE LAMP ROOM and THE LAMPMAN (under the hill)

- Kyle: "continue". The arc spec's lamp room: `shared/cutlamproom.ts`, between the sorting floor and the washing floor.
  Six miners' lamps on posts in a ring (`map.lamps`; `cutmap.ts` carries them), racks on the back wall, the counter
  by the way in, two at the door, no light but a basket at the way in and the lamps.
- `sim/lampman.ts`: which lamps are lit is plain data on the Lampman (`lamps.lit`), so friends see the same. Roused,
  every `LAMP.every` (8 s) it walks to the lit lamp nearest the nearest hero and snuffs it in `LAMP.snuff` (0.9 s), its
  blows dropped meanwhile (an opening); gives up on one after `LAMP.give`. Out of every lamp's light (`LAMP.r` 4.2) its
  `harm` is `LAMP.dark` (1.4) times. GRAB by a dark lamp (the button reads BURN, client/cluster.ts) lights it; with
  the Lampman in that light, stunned `LAMP.dazzle` (2.2 s) and OPEN. The first two lamps it puts out, "BURN A LAMP
  NEAR IT TO STUN IT" over it (`LAMP.told`).
- On screen (`client/lampmandraw.ts`): brass lamps hung on the posts, lit with a flame and a pool of light the size
  of their reach (into the scene's light pass), out as dark glass, guttering while snuffed. Phone screenshot checked.
- Lines: lore keeper ("BURN is now a third use": the lamp lit from the hero's own torch, never the church's light;
  no on-screen DAZZLED, OPEN says it), then line editor: goal "BURN a lamp, kill" (+ the name, fits a phone), LAMP
  OUT, BURN A LAMP NEAR IT TO STUN IT, THE LAMP ROOM.
- Tests tests/lampman.test.ts; full suite green. Its loot pool waits on the arc's loot step. (Claude Opus 5.5)

## 2026-11-12: SOULBOUND, and an instance boss's drop for someone there

- Kyle: "in solo [I keep] getting loot for other heroes. If you're solo it's fine if it's for another hero but you
  should still be able to pick up and sell. Maybe lock for trading, call it soul bound." Then: "it's specifically in
  an instance: the boss loot pool might not be for your hero."
- **Pick up anything:** sim/loot.ts `takeLoot` no longer refuses another class's piece; it goes in the pack with
  `bound: true` (shared/loot.ts `Item.bound`), never on hungry gear. The loot card offers TAKE with "Yours to sell.
  SOULBOUND: can't be given to another hero."; the item card a SOULBOUND row (client/card.ts, lootcard.ts, copy.ts,
  shopwords.ts). It sells as any piece.
- **For the Trading chat:** `tradeable` in shared/trade.ts is false for a bound piece and `cleanItem` refuses one, so it
  never goes in an offer or comes in from another browser. (A hacked client could strip the flag; the ledger server
  doesn't know it. Yours to judge if it matters.)
- **For the Deep chat:** sim/uniquedrop.ts `give` now picks from the pool's pieces someone in the room can use (armor
  and rings fit anyone), the whole pool only if none fits. The Haulier's: a solo Ranger gets the plate or the ring,
  never the pick.
- Lines: lore keeper (SOULBOUND safe: no tie to the church, the Lantern or the Want; keep it off hungry gear; "traded"
  also means selling here, so "given to another hero"), then line editor. tests/soulbound.test.ts; tests/loot.test.ts's
  old "another class cannot take it" now checks it's taken SOULBOUND. (Claude Opus 5.5)

## 2026-11-12: the long trips at the barracks with Corporal Brisk; the Night Watch gone

- Kyle: "get the instances and expeditions not from the town hall where it is today, but inside the barracks, which
  already has things laid out and a board there, and you can talk to the guy who you previously could talk to about
  defending the wall at night. We're going to nix that entirely; instead you talk to him to start an expedition or
  quest. Still queue up the same way (parties and solo)."
- shared/townhalls.ts: CORPORAL BRISK at the barracks' map table is now the `map` talk (the long trips, the same list
  and party queue the clerk had: client/boardui.ts `openBoard(.., 'map')`); the town hall's map table and CLERK
  TAMSIN (the Art chat's, 8031a54) are gone. client/voicebank.ts: Brisk's voice on `map`.
- The Night Watch: every way in removed (Brisk's shift offer in client/townui.ts, the `?watch=1` switch in main.ts).
  Its code (client/watch*.ts, shared/watchpay.ts, watchtune.ts, sim/watchscore.ts, the hero's `watch` record, the
  `watch` mode in game.ts) is unreachable; left in place, to clear out in a cleanup of its own (it touches the save).
- Lines: lore keeper, line editor. Brisk: "These are a fair way past anything on the board, so mind your boots. Say
  which one and I'll mark it on the map, just you or the lot of you, I don't mind." The board: "Corporal Brisk in the
  barracks sends you to the Barrowfields, Hangman's Wood, Fenmere or the Open Cut." The bible's Night Watch section
  marked gone. (Claude Opus 5.5)

## 2026-11-12: a guest off the map in an Instance (from the Deep chat's lead)

- Kyle had seen a guest standing off the map in an Instance; the Deep chat checked its own boss floors (fine) and found
  where: a big room (one whose far goblins doze, `isBig` = `room.sleepFar`, as every Instance's is) never sends its
  map, and the guest built it with `expedPlan(job)`, an expedition's map. For over the top: 96 x 72 against the
  leader's 28 x 124. `shared/guestmap.ts`: the guest builds an Instance's area (`areaOf`, the fork's way included),
  else the expedition's; client/coop.ts uses it. tests/guestmap.test.ts: the same map in every area and both ways.
- The Deep chat's other change (a whole send brings the leader's map) is for rooms that send their map; an Instance's
  doesn't. Nothing of mine changes the map mid-run: gates are blocks (they come piece by piece), the tubs props, the
  lamps and the Brakesman's state on goblins; the Haulier's fight changes nothing in it. Full suite green.
  Not checked in two browsers. (Claude Opus 5.5)
