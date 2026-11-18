# Performance sweep: decisions

The spec is docs/design/perf-sweep.md. Branch `perf-sweep`. One entry a change, newest last.

## 2026-11-17: the analysis, and the proofs before any change (Claude Fable 5.2)

- Measured on `1dbfcd3`: the numbers are in the spec, section 8. The scripts are kept in `scripts/perf/`
  (`wire.ts`, `full.ts`, `simprof.ts`, `browser.cjs`, and `top.mjs` and `jsonly.mjs` to read a CPU profile).
- **Sim parity** (`tests/perfparity.sim.test.ts`, scenes in `tests/perfparity.scenes.ts`, record in
  `tests/perfparity.sim.golden.json`): thirteen seeded fights (eight kinds of place, a board job, a deep dive,
  the hill territory, a swarm of 60 on an expedition, 300 goblins on the big map), four bots that walk, swing,
  dodge, block, change weapon and use their skill by the tick; the whole room hashed every 25 ticks. Checked
  that it fails on a change of one hundredth of a tile in `SWEEP_STEP`.
- **Wire parity** (`tests/perfparity.wire.test.ts`, the old code kept in `tests/perfref/`): every message of
  the same fights against the code as it stood, text for text. Checked that it fails on a third decimal place.
- **`roomsend.ts`**: an ordinary room's message cut out of `CoopHost.frame` as it was, the same lines, so it
  can be measured and tested like `bigsend.ts`. `coop.ts` calls it. No change in what is sent.
- On a branch, not `main`: the second wire format cannot be tried on real phones from here, and `main` deploys.
- Not touched: `light.ts`, `smoothlight.ts`, `three/post.ts`, `three/figmat.ts`, `three/figs3d.ts` (the Graphics
  sweep chat's, edited the same day). What I found there is in the spec for that chat.

## 2026-11-17: slice B, the fight's hot paths (built by an Opus 5.5 agent, reviewed by Claude Fable 5.2)

- `shared/sweep.ts`: `settled` no longer copies the whole body to ask where `collide` would leave it. Two
  scratch bodies, one with a `z` key and one without (`collide` tests `'z' in p`), carrying every field
  `collide` and `levels` read or write.
- `sim/pathing.ts`: a flow field keeps only the square of cells within reach of its goal (read through `fd`,
  Infinity outside it), the oldest field's array is the new one's, and the heap and the seen flags are scratch.
  The same cells in the same order, so ties break as they did. `pathgrid.ts`: the type of `Grid.fields` only.
- `sim/room.ts` (small): `prev`'s keys made once per id and its tuples written in place (checked: nothing keeps
  a tuple past the frame it is read in), the living counted in one loop.
- Proof: `tests/perfparity.sim.test.ts` hash for hash, 15 nearby test files green.
- Measured back to back on one box (CPU ms a tick, mean): swarm 1.64 to 1.33 (19% less), 300 goblins 1.70 to
  1.54 (9% less), an ordinary room 0.26 to 0.23 (12% less).
- Left for later, seen in the profile: `notice` in `sim/enemies.ts` (13.6% of the big map's tick), `gridOf`
  rebuilding its signature text on every `wayTo`, `nearPairs`.

## 2026-11-17: slice A, the leader's sending (built by an Opus 5.5 agent, reviewed and finished by Claude Fable 5.2)

- `client/snap.ts`: the encoder compares values, not their JSON text (`same` gives the answer the text would:
  minus zero is zero, nothing is null, keys in order), rounds and copies only what changed, and keeps one record
  an entity, brought up to date in place, where it made a map of strings per entity per send.
- `client/interest.ts`: a goblin's quiet reading (`quietInto`) goes straight into the encoder without a copy of
  the goblin; `quiet` and `stateFor` still give what they gave.
- `client/sendframe.ts` (new): what one send of a big room works out once for every friend: each entity read
  once, each building's copy, the slow parts' text, the expedition's view. Never what a friend was last sent.
- `client/bigsend.ts`, `roomsend.ts`: send through those. `CoopHost` is unchanged.
- Proof: `tests/perfparity.wire.test.ts` byte for byte over the thirteen fights, and a new
  `tests/perfparity.fuzz.test.ts`: made-up rooms (fields that come and go, two entities with one id, minus
  zero, lists in lists, objects that aren't plain) against the old encoder, three ways of reading. Checked
  that it fails on a minus-zero slip and on a lost duplicate id.
- Measured (CPU ms a send, three friends, mean): swarm of 60, 5.7 to 1.7; 300 goblins, 3.1 to 1.0; an
  ordinary room, 0.68 to 0.40; a deep dive, 0.9 to 0.6. The bytes sent are the same to the byte.
- The agent's session was cut off by a restart before it reported; its work was complete in the tree. I read
  it line by line and added the fuzz test before taking it. `snap.ts` is now 241 lines (the encoder's two
  inner loops are near twins, for speed in ordinary rooms): over the house's 200, noted.

## 2026-11-17: slice E, cache headers (Claude Fable 5.2)

- `vercel.json`: `/assets/*` (every file there is content-hashed by the build) is served
  `public, max-age=31536000, immutable`. Vercel's default is `max-age=0, must-revalidate`, a question to the
  server for every file on every visit. Music and sounds are not hashed and are left alone (Kyle to say).
- Corrected in the spec: I first wrote that every visit downloads the script again. It asks again and is
  told "not modified"; the cost is the round trips.
