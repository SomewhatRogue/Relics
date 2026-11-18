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

## 2026-11-17: slice C, draw waste (built by an Opus 5.5 agent, reviewed by Claude Fable 5.2)

- `wolfdraw.ts`: a standing wolf's pose carries a number that is new every frame, and the sprite cache was
  keyed on the pose: a new canvas a frame per wolf, never let go. Sprites are now kept by the picture
  (`houndMap`'s own text), so 4,000 swings of the tail are 14 sprites; both lists capped at 96.
  `hound.ts`: a cap of 512 only (its keys were already few). Only the cache; nothing of the look.
- `doorsteps.ts`: a door whose marks cannot touch the canvas is skipped. Against the old body on the real town
  map, flat and tilted views: the same rectangles on screen, the same pen left behind; 1,413 calls to 0 with
  no door in view.
- `domset.ts` (new) and `hud()`: the HUD's words, bars and marks are written only when the page would change,
  each compared with what the page holds now. The edit in `main.ts` is inside `hud()` and one import.
- `three/view3d.ts`: the scene's matrices are worked out by the first of the four passes and not again by
  the other three. `three/lights3d.ts`: each light's score once, the same order.
- Proof: `tests/doorsteps.test.ts`, `tests/lightsplace.test.ts`, `tests/wolfcache.test.ts`; `look.cjs` with no
  page errors and the HUD read off the screenshots.

## 2026-11-17: slice D, the second wire format (built by an Opus 5.5 agent, reviewed by Claude Fable 5.2)

- A friend's hello says `v: 2`. The leader sends a message in the second format only when everyone it goes to
  has said so; anyone else gets the first, byte for byte (the parity tests still hold it).
- The second format (`client/wire2.ts`): the patch as an object, not text inside text; a hero's act clock as
  `a0`, when the act began, worked back out by the friend as each patch is applied; a whole room's map only
  when someone needs it or it changed. A change of format sends the room whole.
- A friend with no room ignores a whole room that has no map and says hello (it would have thrown).
- `api/_relay.ts` `deliver`: the text of a message is made once, not once per socket. The same bytes.
- Proof: `tests/wire2.test.ts`, `tests/wire2host.test.ts` (two real guests, one fed each format, the same
  room after every patch with heroes' clocks within a hundredth, the same own-hero state; mixed parties both
  ways; an old leader with a new friend; the relay's texts), the five relay files, the co-op files.
- Measured, the relay's whole envelope, KB/s: an ordinary room 15.2 to 11.7 (23% less), a deep dive 21.6 to
  15.7 (27%), a swarm of 60 to three friends 189 to 158 (17%). **Less than the 35 to 40% I wrote in the spec**:
  whole rooms still carry every hero's kit, and a Ranger's hound is a nested object sent whole whenever it
  moves (about 18% of a second-format patch). Sending the hound's fields one by one is the next saving.
- Left as found: the first format's text swap would rewrite a chat line ending in `"me`; a friend following a
  new leader keeps its old room until its own hello brings the new one.

## 2026-11-17: main merged in, and the last checks (Claude Fable 5.2)

- `main` had moved (the mini quests: a new collection in `snap.ts`, a new field on the room). Merged; only the
  board conflicted. The reference copies in `tests/perfref/` were taken again from `main`'s files, and the sim
  parity record was taken again from `main` untouched (a separate worktree with only the two test files
  added), then the merged branch held to it: the same, hash for hash.
- The whole suite on the merged branch: 250 files, 2,106 tests, green. `npm run check` clean.
- In a browser: `look.cjs` with no page errors; the same profile script on `main` and the branch
  (`scripts/perf/browser.cjs`), numbers in the spec, section 9.
- `scripts/party-online.cjs` (two browsers, a local relay with Redis, both pages on the new build): 25 of 30
  steps pass, the same five failing as on `main` in this container.
- `scripts/smoke.cjs` fails on `main` itself; noted on the board for its owner.

## 2026-11-18: slice F, two more of the tick's hot spots (built by an Opus 5.5 agent, reviewed by Claude Fable 5.2)

- `sim/enemies.ts` `notice`: the look at each hero stops once the goblin has seen one (nothing in the loop
  writes anything); a hero with no marks counts as 1 without a list being made; whether a fight is near enough to
  hear is tried on each axis first against the farthest hearing there is (`heardNear`), the old sum after it.
- `sim/pathgrid.ts`: the text that says a map's grids are out of date is made again only when one of the numbers it
  is made of has changed (kept per map); every other call reads the numbers and makes no text.
- `sim/pairgrid.ts`: each cell's bodies in one flat typed list where it was an array a cell; the same pairs in
  the same order.
- Proof: `tests/perfparity.sim.test.ts` hash for hash; the nearby files green; `npm run check` clean.
- Measured by CPU profile on the 300-goblin map: the whole run 5,644 ms to 4,705 (17% less), `notice` 807 ms to
  381, `nearPairs` 271 to 183. The box was too busy that hour for tick timings to show it on their own (they
  ran 10% either way), so the profile is the number to trust. CI's run of the whole suite stands for the full
  local run on this push.
- Next in the profile: `field` in `sim/pathing.ts` (the search itself), `stepAll` in `sim/room.ts`.
