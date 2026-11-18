# A friend's map in a territory: decisions

## 2026-11-18: a friend stood on the wrong map in a territory (Claude Fable 5.2)

Kyle: "the other person is in a different spot on their screen ... they're not both sending their same
location to each other", and then: on a job, "a raid and/or instance".

- **The cause.** A room whose far goblins doze is never sent its map: the friend builds it from the run
  (`shared/guestmap.ts`). That file knew an Instance's areas and an expedition. A territory's room
  (`sim/landroom.ts`, since 2026-11-16) is such a room too, and fell through to the expedition's: the leader was
  on LOWFURROW FIELDS (96 by 112) and the friend built THE BARROWFIELDS (96 by 72) and stood on that. The
  positions sent were right; the ground under them was not the same ground. The same slip as 2026-11-12 (an
  Instance), one kind of room later.
- **Fix.** `guestMap` builds a territory's map (`territoryPlan(job, index)`), and reads in the order `runRoom`
  picks a room's kind.
- **Proof.** `tests/guestmap.test.ts`: every map of every territory, and an expedition, the friend's map against
  the leader's (size, name, every block, the way in, ledges, water, gates). The territory test fails on main
  as it stood. And a tripwire: the test lists the files in `src/sim` that make a room with `sleep: true`, so a
  fourth kind of big room fails it until this file is taught.
- **Not done, worth doing.** The leader could send a short mark of its map with a whole big room, and a friend
  whose own map differs could ask for the map itself. That would mend any future slip on the spot. It changes
  what `bigsend.ts` sends, so it wants doing after the performance sweep's branch is in.
