# Deep skills: decisions

The Deep skills chat's log (docs/design/deep-skills.md). Newest at the foot.

## 2026-11-13: floor 20 as it is now (Opus 5.5)
Asked of the Deep chat's log and code before building the gate, told to Kyle:
- Floor 20 is the fourth layer's boss floor (the wood, Greyhollow). THE HEDGER is only drafted, so it's the
  Haulier or the Doorkeepers by the run's turn (shared/deep.ts).
- One run from floor 1: 19 floors (2 to 4 minutes each), bosses at 5, 10 (THE LISTENER) and 15 (THE LEECHMAN);
  dying ends the run.
- Floors 16 to 19 (shared/deepbands.ts): goblins hit about 2.6 times as hard as in town for a level 10 party
  (band 1.7, DEEP_PAST 1.2 by 19, levelHarm 1.3 at its cap), wind-ups 0.7, rests 0.6, up to 4 elites a room,
  a named butcher every other floor, three curses by then. A butcher's slam on 18 comes to about 100:
  a 100-health hero with no health gear dies to one, so you roll it.
- Read: untested past 15, not proven out of reach. The gate is one number (DEEP_SKILL.floor), 20 as approved.
- For Kyle to play the cut without the dive: `?deepbest=20` sets the hero's deepest floor (test hook).

## 2026-11-13: step 1, the deepest floor, the button, the trainer's hidden row (Opus 5.5)
- `Profile.deepBest` (shared/deepskill.ts reachFloor): kept in game.ts deepJoin as each floor starts, leading or
  following, so a floor reached in a party counts. Older heroes (client/save.ts fromJson): their saved run's floor,
  or their line on either DEEPEST board, whichever is deepest.
- The button: `Intent.deepSeq`, counted (sim/deepskill.ts), started once the hero is free and it's ready. Phone:
  its own spot above the class's own button (client/deepskill.css, centre 188 from the right, 212 from the foot,
  gilt, its name over it in gold, rung gold till first pressed like any new button). Laptop: Z, last in the bar.
- The trainer: one row, `learn:deep` (shared/deeprow.ts), on its own track FROM THE DEEP under SKILLS (carried as
  well as the class skill, not instead). Not listed at all till deepBest reaches DEEP_SKILL.floor (20). Price:
  twice the class's last skill, so it follows the economy's scale. Only built skills are offered (BUILT: the cut).
- A NEW SKILL: errands.ts `skill` now also opens when the floor opens the Deep skill and the trainer hasn't seen
  you since (`Errands.deep`). Small edits in the town quests chat's errands.ts, trainrows.ts, upgrades.ts,
  upgradeui.ts (merged with their trainer talk change).
- Test hooks: `?deepbest=20` (the trainer offers it), `&deepskill=1` (taught, on its button), for a save's heroes
  and a `?hero=` quick start (client/deeptest.ts).

## 2026-11-13: the long cut, the room's side (Opus 5.5)
shared/cuttune.ts CUT, sim/samuraicut.ts: act `cut`. Stance 0.55 s, the line (Hero.cutLine) out to a wall or 9
tiles, swung by the stick or mouse while it shows (a phone with neither turns to the nearest goblin as it starts);
a stagger in the stance loses it and costs nothing. The slash: everything within 0.75 of the line marked
(Enemy.longCut) and stunned still till it lands; the hero crosses in 0.14 s, untouchable (one line in combat.ts,
as the spellblade's storm dash). The sheathe 0.75 s; then every one cut takes 150 times the hero's damage at once
(stepCuts, from room.ts each tick, so it lands even if the Rogue is hit by then). 40 s cooldown. Bosses shrug most
of the still off, as any stun. tests/samuraicut.test.ts. Not drawn yet.
