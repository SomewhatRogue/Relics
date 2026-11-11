# Instances: decisions

The Instances chat's log (docs/BOARD.md). Newest first, signed with the model. Spec: docs/design/instances.md.

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
