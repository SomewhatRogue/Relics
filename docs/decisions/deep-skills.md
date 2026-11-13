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
