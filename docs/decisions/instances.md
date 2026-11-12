# Instances: decisions

The Instances chat's log (docs/BOARD.md). Newest first, signed with the model. Spec: docs/design/instances.md.

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
