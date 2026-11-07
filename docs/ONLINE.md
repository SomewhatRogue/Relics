# Online play for Relic: what Come Bye taught us, and what it means for our builds

Come Bye's team wrote up everything they learned getting rooms to work on real phones
(`SomewhatRogue/Comearound`: `docs/ONLINE.md`, every failure in it happened live) and how to keep
Redis inside the free plan (copied here as `docs/REALTIME-REDIS-BUDGET.md`). Read both before
touching `api/`, saves, or anything that decides who a player is. This page is the short version
for Relic, and the rules our code is built to now, before online play exists.

## The shape (same as Come Bye)

- **The party leader's browser tab runs the game.** There is no game server: Vercel Functions
  can't tick a room. Friends' tabs draw what the leader sends and send their Intent.
- **Everyone connects to `/api/room`** (`api/room.ts`, `api/_relay.ts`, copied from Come Bye on
  2026-11-01 with its tests, key prefix `rl:`). It routes; Redis joins rooms across instances.
- **Roles:** host (made the party), take (was in it, its host went quiet), join (opened a code:
  never claims). A host silent 8 s can be replaced; only messages keep a claim, never connecting.
- **Identity:** a token per device, and a seat comes back by token, then **by hero name** for an
  empty seat. Heroes have names now (the start screen), which is what this needs.
- **Everyone talks every 3 s; sockets ping every 4 s and swap every 4 min** (Vercel's max duration).

## Rules our code follows from today

1. **The room decides everything, and all of it is plain data.** A run (`sim/run.ts`), its rooms
   (`ArenaRoom`: heroes, goblins, props, bolts, the map's blocks with their health and fire) must
   be JSON the leader can save every 2 s, so a run survives the leader's page dying and a friend
   can take over from the last snapshot. No closures, classes with hidden state, or `Math.random`
   in the room. (The map's blocks carry their own `hp`, `burning`, `ruined` for this reason.)
2. **Intents are full state** (press counters, held buttons), so a lost message repairs itself.
   Send on change plus a 3 s keepalive.
3. **The leader runs every room someone is in.** Going into a building makes a second room
   (`Game.outside` keeps the first running: fires burn, dens breed, its kills still pay). Online,
   the party can split: one into the barn, the others holding the yard. Each guest is sent only
   the room they're in.
4. **Snapshots about 15 a second, compact.** Our rooms hold more than Come Bye's (gore, bolts,
   props); the wire format sends what changed and what's on screen, not the whole room.
5. **The shared world is cheap.** The town, the chapter and the votes only change when a run ends
   or the council sits: a few Redis writes per run (or the leader's save is the party's world, to
   start). Never per tick.
6. **Count Redis commands before shipping anything that talks to it per message.** Free plan:
   500K a month. With the relay's publish gate, a party on one instance costs about 5K an hour.

## When we build slice 4 (online)

Copy Come Bye's client side (`src/client/relay.ts`, `online.ts`, `local.ts`), `src/server/resume.ts`
as the model for a `RunSave`, and its browser scenarios (`npm run test:online`) and stress run.
Every fix gets a test that fails on the old code.

## The shared world (built 2026-11-01)

`/api/world` (plain HTTP, `api/world.ts`, store in `api/_world.ts`). GET `?g=CODE`: the world and its
Roll of the Brave. POST `{g, c}`: a contribution (`shared/worldsync.ts`), cleaned and capped on the
server. Redis per world: `rl:world:CODE` (the world as JSON, changed under WATCH), `rl:b:CODE:STAT`
(sorted sets), `rl:n:CODE` (hero names). About a dozen commands per finished run and a few per look
(the client looks at most every 30 s in town). No Redis: worlds live in the function's memory (dev).

## Staying on one socket, and a relay that hears itself (2026-11-05)

What the Florida night taught (docs/DECISIONS.md 2026-11-05, "the join storm"):

- **A subscriber connection can go half-open** and say nothing: no error, a SUBSCRIBE never answered, no
  messages in, while commands on the other connection work. The relay never waits on a SUBSCRIBE more than
  2.5 s, listens for its own `here` coming back (5 s), and on either opens a fresh subscriber connection and
  subscribes again to every room it has players in (`api/_subs.ts`). Subscribe and unsubscribe go in order per
  room, and a room is only unsubscribed if it's still empty.
- **One socket per room per page** (`src/client/relay.ts`): the current one and, while swapping, the one it
  replaces. Never two opening. Retries back off with jitter (`backoff.ts`). Hops to the leader's instance:
  three per 4-minute rotation, one at a time, 1.5 s apart, never renewed by a rejoin.
- **A friend's rejoin when the leader is quiet**: 10 s before the first whole room, 5 s after, doubling to
  30 s while it keeps happening (`coop.ts`). A far leader's slow welcome is not a reason to reconnect.
- **Patches are played at the pace they were made** (`src/client/playout.ts`), at most 0.1 s late; hits and
  sounds don't wait.
- **Nothing that ticks goes in a patch.** A goblin's act and its blow go as when they began (`a0`, `t0`:
  `client/interest.ts`), what only the leader's room reads stays home, facing and knockback go to a tenth.
  A swarm's blows were over half of every patch. Measure with `npx tsx scripts/bigmap/swarm.ts`.
- **The whole-job save** goes to the friend first in line every 2 s, everyone every 8 s, never with a patch;
  friends' periodic whole rooms are at least a second apart.
- **Who should lead:** the relay is in `sfo1`; every friend's trip is their way there plus the leader's. The
  player nearest the relay (smallest `RelaySocket.rtt`) makes the best leader. Functions stay in `sfo1`, next
  to Redis.
- **Redis must sit with the functions** (`sfo1`): each instance logs `redisMs` from its first command.
- **Reproduce it:** `node scripts/florida-online.cjs` (a deaf leader's instance, a far leader, Kyle moved off;
  `KYLE_ROUTE=i0` for a split party's lag, `PLAYOUT=0` for the old way of applying patches, `NORESET=1` for a
  connection the relay can't heal).

## Swaps that keep a party together, and a hidden desktop host (2026-11-06)

- A guest's 4-minute swap that lands away from the leader, while the old socket is beside them, keeps the
  old one and tries again 15 s on (taken anyway at 285 s). A hop that lands where it left stops hopping.
- `hosted` for the leader a guest already follows is a swap, not a new leader: nothing starts over.
- A hidden desktop host runs its room from a worker's timer at full pace, and hands on after 15 s (phones at once).
- Patches go 20 a second steadily and carry the leader's send clock (`w`) for the playout.
- The relay's `join` line has the page's last timed trip (`rtt`, ms).
