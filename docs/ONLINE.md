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
