# Performance and architecture sweep (2026-11-17)

Asked by Kyle: find the weird hacks, the performance misses, what goes over the network and how much,
how lighting is set up, and the weak spots in the architecture; then fix what can be fixed with the
perceived experience unchanged. This is the analysis and the plan. The log is
`docs/decisions/perf-sweep.md`. Work is on the branch `perf-sweep`, not `main`.

Everything measured here was measured on commit `1dbfcd3` in a cloud container (2 cores, Node 22,
Chrome with software GL). CPU numbers are for that box: a phone is roughly 3 to 5 times slower.
GPU cost could not be measured here (software GL), so GPU findings are from reading the code and are
marked "read, not measured".

## 1. The short version

1. **Leading a party under a swarm, the browser spends more CPU describing the fight to friends than
   running the fight.** Building patches is 30% of the leader's CPU against 25% for the whole
   simulation (60 goblins, 3 friends). Every field of every entity is rounded and turned to text for
   every friend, 20 times a second. Fixable with identical bytes on the wire.
2. **About a fifth of every byte sent in co-op is backslashes.** A patch is JSON packed as a string
   inside another JSON message, so every quote mark is escaped: 23% overhead, measured.
3. **A hero's animation clock is 23% of an ordinary room's patch bytes.** Goblins already send "when
   the act began" once; heroes still send the ticking clock every patch.
4. **The whole room and the whole job are re-sent on timers.** A whole room every 4 s (18 KB, about
   30% of an ordinary room's traffic) and the whole job every 2 s to the friend first in line (16 to
   21 KB, as many bytes as all the patches put together).
5. **A wolf standing still builds a new sprite canvas every frame and never frees it.** A cache keyed
   on a number that changes every frame: a leak and a per-frame cost.
6. **Nothing is cached by the browser.** Every asset is served `no-cache`, so every visit re-asks for
   all 2.8 MB of script, though the file names are already content-hashed.
7. **Four files carry the game and every chat has to edit them.** `game.ts` (1,883 lines),
   `main.ts` (897 lines, 158 imports, one frame function several hundred lines long), `scene.ts`
   (747 lines, 112 imports) and `room.ts` (one tick calling about 80 systems in a fixed order).
   That is the architecture's weak spot and also the board's main collision point.

The relay itself (`api/`) is in good shape. The Redis budget work already done there (publish only
when another instance listens, batched outbox, pings answered at the edge, the meter) is sound and I
found nothing obscene in the request pattern: no polling loops, no per-tick HTTP, one socket a room.

## 2. What goes over the network

### 2.1 Every request the page makes

| What | When | Size | Verdict |
| --- | --- | --- | --- |
| Page load | once | 25 requests, 2.8 MB script (1.9 MB in one chunk), 152 KB CSS | all `no-cache`: see N7 |
| `/api/world` GET | on load, then at most once a minute in town | about 5 KB | fine |
| `/api/room` WebSocket | one per room; ping every 4 s; swapped every 4 min | 10 bytes a ping | fine |
| `/api/room?meter=1` | settings panel only | tiny | fine |
| `/api/names`, `/api/save`, `/api/ledger`, `/api/owed` | on a player's action | small | fine |
| Music, sound, voices | on first use, per file | 164 + 172 + 87 files | no cache headers: see N7 |

Town presence is dead reckoning and already quiet. The traffic that matters is a job with friends.

### 2.2 A job with friends, measured

An ordinary job room (28 by 24, 4 heroes, 6 to 8 goblins), sent exactly as `CoopHost.frame` sends it:

| Stream | Rate | Size | KB/s |
| --- | --- | --- | --- |
| Patches | 20 a second | 522 B mean, 1,086 B p95 | about 10 |
| Whole room (every 4 s) | 0.25 a second | 18,002 B | about 4.5 |
| **Total to the room** | | | **14.7** |
| Whole job, to the friend first in line (every 2 s) | 0.5 a second | 16 to 21 KB | about 10 |
| Whole job, to everyone (every 8 s) | 0.125 a second | 16 to 21 KB | about 2.5 each |

Under a swarm on the expedition map (`scripts/bigmap/swarm.ts`): 55 KB/s to each friend with 40
goblins awake, 68 KB/s with 60. A leader with three friends uploads 166 to 204 KB/s. On a phone's
uplink that queues, and queueing is lag: this matches "worst on the big map with lots of goblins".

Where an ordinary room's patch bytes go (changed fields only):

| Field | Share | Times a patch |
| --- | --- | --- |
| `heroes.actT` | 22.7% | 3.8 (every hero, nearly every patch) |
| `heroes.x`, `heroes.y` | 23.5% | 2.6, 2.2 |
| `enemies.x`, `enemies.y` | 13.7% | 1.6, 1.3 |
| `enemies.attack` | 7.6% | 0.1 |
| everything else | 32.5% | |

In a swarm it is goblin positions (40%) and blows (19%).

### 2.3 Findings

**N1. The encoder does every friend's work from scratch (CPU).** `Encoder.encode` (`client/snap.ts`)
walks every entity in 22 collections and, for every field, deep-copies and rounds it, turns it to
text with `JSON.stringify`, and stores the text in a fresh `Map`, whether or not it changed. On a big
map each friend has their own encoder, so a goblin three friends can see is rounded and stringified
three times a send. Before that, `quiet` (`client/interest.ts`) rebuilds every goblin object with
spreads, again per friend. Profile of the swarm run: `encode` 33%, `quiet` 20%, garbage collection
8%, the simulation 25% (the script encodes twice, so the true split is about 30% netcode to 25% sim).

**N2. Double JSON.** `sock.send('*', { s: JSON.stringify(body) })`: the patch is a string inside a
JSON envelope. Measured escape overhead: 23.2% of the inner bytes, about 19% of every byte on the wire.
It exists so a friend can swap ids with a text replace before parsing
(`d.s.split('"me"').join('"@lead"')...`), which is itself a hack: it works because ids are always
quoted whole, and would rewrite any chat line or name that happened to contain `"me"` in quotes.

**N3. Heroes' act clocks tick on the wire.** `actT` goes up every tick, so it changes every patch.
Goblins solved this on 2026-11-03 (`a0`: the room time the act began; the friend works the clock out).
Heroes never got it.

**N4. The map rides in every whole room.** 2.9 to 6 KB of the 18 KB, every 4 s, though it changes
only when a house burns or a boss reshapes its arena.

**N5. The whole job every 2 s.** 16 to 21 KB with bare heroes; bigger with real packs. It exists so a
friend can take the job over if the leader's page dies. It is the single largest stream to the
friend first in line. Not changed in this sweep: any saving means a delta format for saves, and a
wrong takeover is worse than the bytes. Recommendation in section 7.

**N6. The relay turns each message to text once per recipient.** `deliver` calls `tell` per socket,
and `tell` runs `JSON.stringify` on the same envelope each time. With 4 players that is 3 identical
stringifies of every patch on the function's CPU (Hobby gives 4 CPU-hours).

**N7. No cache headers.** `vercel.json` sets none, so hashed assets revalidate on every visit.

**N8. The protocol has no version.** Fields are added by convention. A friend on yesterday's page
and a leader on today's works only if every change happens to be backward compatible. Any wire change
needs a capability word in the friend's hello.

## 3. Lighting

Two separate implementations of the same lights.

**Flat view** (`scene.ts`, `light.ts`, `smoothlight.ts`; frozen as the weak-phone fallback).
The scene is painted with canvas 2D at low resolution into two canvases (`lit` and `glow`).
`Scene.render` gathers a list of lights by hand from about 35 sources (torches, braziers, lamps,
chests, coals, spells, burning goblins, the moon), drops those that cannot reach the screen, and
hands the first 32 to one WebGL2 pass. Smooth light (today's default) is two draws: the light summed
at art resolution into a half-float target, then a mix pass at the screen's own pixels.
- Sound overall: one shader, lights culled to the screen, cost independent of scene complexity.
- Both canvases are uploaded with `texImage2D` every frame, which reallocates the texture each time;
  `texStorage2D` once and `texSubImage2D` per frame is the cheaper path (read, not measured).
- Over 32 on-screen lights, the list is cut in arrival order, not by brightness: lights can pop.
- The mix pass runs at full device resolution (1170 by 2535 on a phone at 3x): cheap per pixel
  (three texture reads) but it is 3 million pixels (read, not measured).

**2.5D view** (`three/`; the look). Forward-rendered three.js at low resolution (195 by 422 on a
phone at HIGH), then one post pass (outline, bloom, fog, mist, haze) and a 2D overlay canvas.
- A fixed pool of point lights (4, 8 or 12 by quality) is dealt each frame to the best-scoring
  lights near the camera (`lights3d.ts`), so shaders never recompile mid-fight. Good design.
- The light list is gathered a second time, by a second hand-written list (`three/roomlights.ts`),
  in different units. The two lists have already drifted (2.5D lights a block with
  `fate === 'burning'`; the flat view does not).
- The scene is rendered four times a frame (the world, heroes as a silhouette, heroes, then smoke
  and telegraphs), plus the shadow map, plus the post pass. Each pass re-walks the whole scene graph.
- **The shadow map at HIGH is 2048 by 2048, 4.2 million texels, for a picture of 82 thousand
  pixels.** HIGH is the default on every device. Dropping to 1024 would be near invisible at this
  output size, but it is a visual change, so it is not made here (read, not measured).
- **Every figure is redrawn and the whole figure atlas re-uploaded every frame** (`three/figs3d.ts`):
  each hero, goblin and townsperson in sight is painted by the flat view's code into a 96 by 96 cell,
  then both atlas canvases (lit and glow, 960 pixels wide, as many rows as were ever needed) are sent
  to the GPU. In the profile this upload is the largest single item on the main thread (29% of
  script time in a 16-figure fight, under software GL). The atlas grows and never shrinks.
- Dead shader work: every material still computes the stepped, dithered light and then mixes it
  away (`uSmooth` is always 1 since bands were retired on 2026-11-17).
- The shader chunks of three.js are patched by string replace at load, and silently do nothing if
  the text is not found. Safe while three is pinned at 0.160.0; a trap on any upgrade.

`light.ts`, `smoothlight.ts`, `three/post.ts` and `three/figmat.ts` belong to the Graphics sweep chat
and were edited today. I have not touched them. The lighting items above are written up for that chat
in section 7.

## 4. The simulation

Tick cost (CPU a tick, 30 ticks a second): 0.5 ms in an ordinary room, 2.3 ms mean and 5.6 ms p95
with 90 goblins awake. On a phone that is 7 to 25 ms a tick under a swarm.

Profile of the swarm (self time):

| Where | Share | What |
| --- | --- | --- |
| `pathing.ts` `field` | 9.3% | A flow field allocates and fills two arrays the size of the whole map (27,648 cells on the expedition map) to search a small window round the goal, and only 12 fields are kept |
| `room.ts` `stepAll` | 8.7% | A new string key and a new array per body per tick for `prev`, a `Set` of the living, three `filter` passes for the dead, a dozen closures |
| `sweep.ts` `settled` | 8.6% | `{ ...p }` copies the whole goblin (40-odd fields) to test two numbers, once per 0.2-tile step of every move |
| `stepEnemy`, `separate`, `nearPairs`, `collide` | 16% | the real work; already on a grid |

All three of the first rows can be fixed with the fight's outcome bit for bit the same.

## 5. The client frame

Script time a frame in a 2.5D fight with 16 figures (software GL inflates the GPU calls, so read
these as proportions): atlas upload 29%, figures drawn 19%, the simulation 12%, the HUD 5.5%.

**C1. The wolf leak.** `wolfdraw.ts` keys its sprite cache on `JSON.stringify(pose)`, and a standing
wolf's pose carries `Math.sin(now * 2 + id) * 6`, a new number every frame. So every standing wolf
builds a sprite (a canvas, a 2D context, a sharpening pass) every frame, and the cache never forgets
one. 0.54 ms a frame with two wolves in the profile, and memory that only grows.
`hound.ts` has the same cache shape and wants the same look.

**C2. Doorsteps are drawn for every door on the map, on screen or not.** `doorsteps.ts` paints about
150 projected one-pixel rectangles per door per frame with no culling: 1.28 ms a frame in town.

**C3. The HUD writes the page every frame.** 0.75 to 0.85 ms a frame in `hud`, `paintButton`,
`showStreak`, plus `getBoundingClientRect` in the frame loop (forces layout).

**C4. Four scene walks a frame** in `view3d.ts`: three.js updates every object's matrix on each
`render` call though nothing moves between the passes.

**C5. `Lights.place` sorts with a comparator that recomputes each light's score** (a `hypot`) on
every comparison, and allocates two arrays a frame.

## 6. Hacks and weak spots in the architecture

- **A1. Four hub files.** `game.ts` 1,883 lines and 78 imports; `main.ts` 897 lines and 158
  imports; `scene.ts` 747 lines and 112 imports; `room.ts` with a 170-line tick naming about 80
  systems. The house rule is one job a file and under 200 lines (53 of 1,209 files break it, these
  four worst). Every new feature edits these files, which is why the board has a "shared files" rule.
  The fix is registries: a table of tick systems, a table of light sources, a table of draw layers,
  so a feature adds a file and one line. **Not done in this sweep**: every active chat has edits in
  flight against these four files, and a restructure would conflict with all of them at once.
- **A2. Hidden context in module variables.** `useMap` and `currentMap`, `useBoard`, `useLate`,
  `useBook`, `OWN_KIT.*` set on each tick, `BARE.on`, `CAVE`, `SWING`, `HOLE`: 61 exported mutable
  flag objects. It works because one room steps at a time and each sets its context first, but the
  leader steps several rooms a frame (the street and each house), and anything that reads context
  outside a step reads whichever room went last. Passing the `World` through is the fix; it touches
  most of `src/sim`. Not done here.
- **A3. No protocol version** (N8). Fixed here with a capability word in the hello.
- **A4. Two hand-kept light lists** (section 3). For the Graphics sweep chat.
- **A5. The id swap by text replace** (N2). Removed here for friends on the new format.
- **A6. Unbounded caches keyed on continuous values** (C1). Fixed here.
- **A7. 58 `as unknown as` casts**, 45 in the client, mostly the netcode treating a room as
  `Record<string, unknown[]>`. A typed list of the room's collections would remove most.
- **A8. The suite takes 8 minutes 51 seconds** (237 files, a worker spawned per file, 2,030 tests).
  Vitest itself reports about 21 s to be had from `isolate: false`. Worth a look, not done here.
- **A9. HIGH quality on every device by default**, with no step down when frames run long.
  A phone that cannot hold 60 gets the 2048 shadow map and 12 lights until the player finds the
  switch. An automatic step down changes what players see, so it is Kyle's call.
- **A10. Dev pages ship in the main chunk** (`lineup`, `armourpage`, `gearlookpage`, `bigmode`), and
  two dynamic imports are defeated by static ones (`anvilmode.ts`, `heroart.ts`): the build says so.

## 7. The plan

Rule for everything below: **the perceived experience must be the same before and after.** Each
slice has a proof, written before the change and run on the old code first.

### Proofs (written first, by the main chat)

- **Sim parity** (`tests/perfparity.sim.test.ts`): seeded jobs of every kind (village, farm, forest,
  mine, marsh, river, the hill territory, the Deep, an expedition swarm) driven by seeded bots for
  some hundreds of ticks; a hash of the whole room at intervals must equal the hashes recorded on
  `1dbfcd3`. Any change to an outcome, a position or a random draw fails it.
- **Wire parity** (`tests/perfparity.wire.test.ts`): today's `Encoder`, `quiet` and `stateFor` are
  kept verbatim as a reference; over the same seeded fights, the new encoder's patches must be the
  same JSON text, full and partial, for the whole room and for each friend on a big map.
- **Draw parity**: a recording 2D context for `doorsteps` (the same rectangles land on screen), and
  for sprites the cache key is the sprite's own parts, so pixels are equal by construction.
- **The existing suite** (237 files green on `1dbfcd3`), `npm run check`, and for netcode the
  browser scenarios in `npm run test:online` on a local relay with a real Redis.

### Slices

| # | Slice | Files | Proof | Expected |
| --- | --- | --- | --- | --- |
| A | Encoder CPU: quiet once per send and shared across friends, per-entity text made once per send, numbers and strings compared without stringifying | `client/snap.ts`, `interest.ts`, `bigsend.ts` | wire parity, byte for byte | 3x or better less encode CPU under a swarm |
| B | Sim hot paths: `settled` copies only what `collide` reads; flow fields search a window and reuse arrays; `stepAll` stops allocating per body | `shared/sweep.ts`, `sim/pathing.ts`, `sim/room.ts` (small) | sim parity, hash for hash | 15 to 25% off a swarm tick |
| C | Client draw waste: wolf and hound sprite caches keyed on parts and bounded; doorsteps culled to the screen; HUD writes only on change; one matrix update for the four passes; `Lights.place` scores once | `client/wolfdraw.ts`, `hound.ts`, `doorsteps.ts`, `hud*.ts`, `three/view3d.ts` (small), `three/lights3d.ts` | draw parity, suite, a look in the browser | the leak gone; about 2 to 3 ms a frame off town and fights on a phone |
| D | Wire format 2, only between pages that both say they speak it: hero act clocks as `a0`; the patch as an object, not a string in a string; the map left out of a whole room when it has not changed; the relay stringifies once per message | `client/coop.ts`, `bigsend.ts`, `interest.ts`, `api/_relay.ts` | new tests for old-with-new both ways; `test:online` | about 35 to 40% fewer bytes in an ordinary room, about 20% under a swarm |
| E | Cache headers for hashed assets | `vercel.json` | read the header | repeat visits load from cache |

A and B run together (no shared files), then C and D together. Each agent is Opus 5.5 as Kyle asked,
one narrow slice, the files named, told to stop at its proof. The main chat reviews every diff
against this page before the next pair starts.

### Held for Kyle's word, with reasons

- **The hub files (A1) and hidden context (A2).** Right to do, wrong to do today: 16 chats are
  mid-edit on those files. Best done in a quiet hour with the board told first.
- **The whole-job save every 2 s (N5).** Suggest: send it every 2 s only while the friend first in
  line has not acknowledged the last one, and otherwise every 6 s; or a delta against the last save.
  Needs a takeover test on real phones.
- **Shadow map size and automatic quality (A9).** Visual changes.
- **Music and sound cache headers.** Their file names are not hashed, so a long cache could serve a
  stale sound after a change. A day's cache is probably right; Kyle to say.

### For the Graphics sweep chat (their files, not touched)

- `light.ts`: allocate the two textures once (`texStorage2D`) and update with `texSubImage2D`.
- `light.ts`: when more than 32 lights reach the screen, keep the 32 strongest, not the first 32.
- `three/post.ts`, `three/figmat.ts`: the stepped-light sums behind `uSmooth` are dead since
  2026-11-17 and still run in every fragment.
- `three/figs3d.ts`: the atlas never shrinks after a swarm, and is uploaded whole each frame; worth
  measuring on a real phone with `?perf=1`.
- `scene.ts` and `three/roomlights.ts`: one list of light sources in tiles, read by both views.
- `three/post.ts`: the three.js shader patches should throw if their anchor text is missing.

## 8. Baseline numbers (commit `1dbfcd3`)

| Measure | Value |
| --- | --- |
| Suite | 237 files, 2,030 tests, 8 min 51 s |
| Sim tick, ordinary room | 0.50 ms mean, 2.10 ms p95 |
| Sim tick, swarm (90 awake) | 2.29 ms mean, 5.56 ms p95 |
| Encode per send, ordinary room | 0.34 ms mean, 4.4 ms max |
| Leader CPU split, swarm with 3 friends | netcode about 30%, sim about 25% |
| Wire, ordinary room | 14.7 KB/s to the room, 23.2% of it escaping |
| Wire, swarm 40 / 60 | 55.4 / 67.9 KB/s a friend |
| Whole room / whole job message | 18.0 KB / 16.5 to 20.9 KB |
| Page load | 25 requests, 2.8 MB script, none cacheable |

Scripts used: `scripts/bigmap/swarm.ts` (existing), and three new ones kept in `scripts/perf/`
(`wire.ts`, `simprof.ts`, `browser.cjs`).
