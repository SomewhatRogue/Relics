# Realtime on Vercel + Upstash Redis: spending few commands without adding lag

A portable guide for any project that does what Come Bye! does: players hold WebSockets to a
Vercel Function, any function instance may hold any player, and instances share rooms through
Redis (one pub/sub channel per room, a few keys for who's where). Written Oct 31 2026 from Come
Bye!'s relay (`api/_relay.ts`), its tests (`tests/relay.test.ts`) and live playtests.

## 1. The budget

- **Upstash Redis free plan: 500K commands a month**, 250 MB data, 10 GB bandwidth. Over the limit,
  commands fail ("max requests limit exceeded") until the month resets. No charge: billing only
  starts if a card is entered (pay-as-you-go, $0.20 per 100K commands; set a monthly budget there
  and it rate-limits instead of billing more).
- **Vercel Hobby:** over its included usage the project pauses, no charge. WebSocket functions bill
  provisioned memory while open (360 GB-hrs included) and active CPU (4 CPU-hrs). A relay mostly
  waits, so it's rarely the limit. Hobby caps a function at 300 s: rotate sockets before that.
- 500K a month is ~16K a day, **~700 an hour if spread evenly.** That's tiny next to a game's
  message rate, so the design has to keep most messages away from Redis entirely.

## 2. Count before you build

Every Redis call is a command: PUBLISH, SET, GET, EXPIRE, DEL, SUBSCRIBE. Assume each message a
subscriber receives may count as well (Upstash's docs don't say; plan as if it does).

Come Bye! before the fix, 5 players in one room:

| Source | Rate | Commands an hour |
|---|---|---|
| Host snapshots, PUBLISH each | 15 a second | 54,000 |
| Guest inputs, PUBLISH each (4 guests, ~5 changes a second while moving) | ~20 a second | 72,000 |
| Host claim refresh (SET + EXPIRE every 2 s) | 1 a second | 3,600 |
| Deliveries to the other instance (if they count) | same as publishes | up to 126,000 |
| **Total** | | **~130K to 250K** |

So the whole month went in **2 to 4 hours of play**. After the fix, with everyone on one
instance (the usual case): **~5K an hour**, about 100 hours of play a month.

Rule: for anything that runs per message or per tick, write down commands per second × players ×
hours a month before shipping it.

## 3. Techniques, by payoff (and what each costs in latency)

### a. Deliver locally first; Redis only carries what must cross instances (latency: lower)
Each instance delivers a message to its own sockets straight away, then publishes for the others,
tagging it with its own origin id so its echo is skipped. Players on the same instance never wait on
Redis at all.

### b. Publish only while another instance is listening (latency: none in steady state)
Most rooms live on one instance (Fluid compute reuses warm instances). PUBLISH's reply is the
number of subscribers that got the message, and the sender is subscribed itself, so **a reply of 1
means nobody else is here**. Then:

- stop publishing that room's ordinary messages, but **let one through every 2 s** (a probe), so a
  newcomer elsewhere is found;
- **anything received from another instance opens the room again at once**, and keeps it open for
  10 s regardless of PUBLISH counts (covers a count that under-reports);
- **joins, leaves and "I'm the host now" always go out** (rare and important);
- **fail open:** a reply of 0 or an error can't be right (we're subscribed), so keep publishing.

```ts
private alone = new Map<string, number>();      // room -> when PUBLISH said only we heard it
private elsewhere = new Map<string, number>();  // room -> when we last heard another instance

private async send(room: string, env: Envelope) {
  this.deliver(room, env);                        // our own sockets, now
  const now = Date.now();
  const at = this.alone.get(room);
  const quiet = now - (this.elsewhere.get(room) ?? 0) > 10_000;
  if (env.k === 'msg' && quiet && at !== undefined && now - at < 2000) return;
  const heard = await bus.publish(chan(room), JSON.stringify(env)); // node-redis returns the count
  if (heard === 1) this.alone.set(room, now); else this.alone.delete(room);
}
private fromBus(room: string, raw: string) {
  const env = JSON.parse(raw);
  if (env.o === this.origin) return;               // our own echo
  this.alone.delete(room);
  this.elsewhere.set(room, Date.now());
  this.deliver(room, env);
}
```

This is only safe when the protocol tolerates a message lost while the room was thought empty:
- state messages are **full state** (a snapshot, the current input), so the next one repairs it;
- anything that must arrive (a "hello, I'm joining") is **repeated until answered**;
- the newcomer **speaks first** (its hello goes out because its instance hears the host's traffic,
  or because the probe found it), so the room opens before the reply is sent.

**Two traps Relic hit (Nov 2 2026), and what it does instead** (`api/_presence.ts`):
- **Don't name an instance with `Math.random`.** Vercel started several instances whose
  Math.random ran the same numbers, so two were both "evqgzyea"; each took the other's messages for
  its own echo and dropped them, and a friend on one never heard the leader on the other. Name it
  with Redis `INCR` (a number no other instance gets), a crypto suffix on top.
- **Don't let a count of 1 shut a room.** A count that leaves out a listener elsewhere would keep
  messages home from a friend who only listens. Instead each instance says `here` on the room's
  channel when it gets its first player there (sending everything for half a second while others
  answer), answers any newcomer's `here` at once, says `here` again after 15 s of saying nothing
  else, and `away` when its last player goes. Messages go out while another instance was heard in
  the last 40 s. A count above one may still open a room; it never closes one. Cost on one
  instance: one `here` per room every 15 s (240 an hour), against a probe every 2 s before.

Test it both ways (see `tests/relay.test.ts`, "the relay spares Redis"): a few seconds of play on
one instance must publish only a handful of times, and a friend joining on a second instance must
still get the hello through, a direct reply, and every following message.

### b2. Bring a split party together (latency: a reconnect, once)
A room split over two instances can't go below about one PUBLISH per instance a tenth of a second
while it plays, however it batches: the leader's snapshots have to cross ~10 times a second. Relic
(Nov 4 2026) tells a friend whose socket landed on another instance than the leader's (`far: 1` on
the role, or on `hosted`), and the friend's socket reconnects, up to 3 times, swapped like a rotation
(new socket first, old one closed once the new one talks), to try to land beside the leader. Each try
is ~8 commands; a party that ends up together then costs Redis nothing as it plays. One trap: an
instance that has published while the other was still subscribed has PUBLISH's count saying 2, and
that guess must be dropped when the other says 'away', or it keeps the room on the bus for 40 s.
Whether Vercel spreads a reconnect over its instances is for the live logs to show (each join logs
its instance).

### c. Never send heartbeats through Redis (latency: none)
Answer application pings at the instance (`{ping:1}` gets `{t:'pong'}` straight back). Liveness
between players comes from the messages they already send.

### d. Throttle liveness writes (latency: none)
Refresh a claim at most every 2 s per room, not per message. Better still: one `SET key val EX ttl`
that carries both the claim and the last-seen time, rather than SET + EXPIRE (halves that line).

Relic (Nov 4 2026): liveness is judged only by the last-seen time's value, so the claim itself can
keep a long TTL (15 minutes, one EXPIRE every 5) and only the seen time is written: one SET at most
every 7/16 of the stale time (3.5 s of 8). The client's heartbeat (4 s) is more than that, so a
host saying nothing else is written on each beat and is never more than ~4 s old when judged.
3,600 commands an hour per hosted room became ~1,000.

### e. Send less to begin with (latency: none, or better)
- Inputs: send only when they change, plus a slow keepalive (Come Bye!: every 3 s). A stick or a
  mouse changes every frame, so "when it changes" is 60 a second: Relic sends a button at once
  (marked urgent) and the stick and aim at most 10 times a second, rounded to hundredths.
- Positions others only watch (a town): dead reckoning. Send the velocity with the position, let the
  others carry the figure on along it, and speak only on a start, a stop, a turn, or half a tile of
  drift (`src/client/reckon.ts`). Nothing at all with nobody to hear it.
- Snapshots: ~15 a second with client interpolation feels smooth; 60 a second is 4× the cost for
  little gain. A compact wire format also saves bandwidth (Upstash's 10 GB a month counts payload).

### f. Put the function region next to the Redis region (latency: lower)
Every PUBLISH that does go out is a round trip. Same region is ~1 ms; across the US ~70 ms.
Pick the Upstash region to match the Vercel Functions region (Vercel's default is `iad1`, US East).

### g. Watch the meter
- Count every command per instance in memory (Relic: `api/_meter.ts`, a counting decorator on the
  backend), and add it now and then to a per-month key with one INCRBY that counts itself (at most
  once a minute, only once 200 have built up or 15 minutes have passed: under 1% of the budget).
  Read it back from one endpoint (`/api/room?meter=1`) and show it where the owner can see it.
- Log a per-instance command counter every few minutes (one line, so it shows in runtime logs).
- The Upstash console shows commands per day; check it after a playtest.
- If commands start failing with a limit error, degrade: keep delivering locally, log it once, and
  tell players on other instances the room can't reach them, rather than hanging. Relic tells every
  player `{t:'full'}` and closes with 4429; the client stops reconnecting and plays on alone (the
  town and any job run in that browser), with one line saying so. The relay doesn't try Redis
  again for 10 minutes.
- **Count the steady costs, not just play.** Every open tab sits in a shared town: a tab left open
  (or hidden in a phone's pocket) costs all month. Say nothing with nobody to hear, nothing but
  the heartbeat while still, and leave the room after a minute hidden or a few minutes idle.
  HTTP endpoints count too: a "look at the world" every 30 s per player was 15 commands each
  (a sorted set per stat); keep the answer as one value and cache it per instance.

### h. Keep solo places off the relay, and speak only to the place you're in
Relic (Nov 5 2026): only Wickhold is shared (its square and the halls anyone can walk into). Everywhere
a player is alone by design (the training yard and its practice pens, the prologue wood, a job alone)
runs in that browser and says nothing to the relay: the town's socket closes on the way out and opens
on the way back (`client/townpresence.ts`). Closing and reopening costs about 8 commands (close 5, open 3);
an open but quiet socket costs its instance about 90 an hour (a presence beat a minute and a rejoin
each 4 minute swap), so for anything longer than about 5 minutes away, closing wins. Inside the town,
where you stand goes out only while someone else is in the same place: alone in a shop or the vault you
say only that you came or went, and the moment someone walks in you tell them where you stand.

Patches: the room state is a delta (`snap.ts`), and since Nov 5 the slow parts that rode whole in every
patch (the run, the banner, names, the houses' counts) go only when they change, as big rooms already did.
That's bandwidth, not commands (a patch is one message either way), but Upstash counts bandwidth too.

### i. Check it every day
`node scripts/budget-check.cjs` (seconds): the page's real code on a counting socket and the relay's real
costs (`tests/townbudget.test.ts`) give commands an hour for an idle town tab and a tab in the yard, and the
test fails past a set limit. `--live` adds real Chromium on a real redis-server for town, yard and 2 and 4
player jobs (`scripts/budget-online.cjs`, about 10 minutes); `--url https://the-site` adds the month's meter
and its pace. Each run is kept in `docs/budget-history.jsonl` and compared with the last. Run it after any
big day of merges: new per-tick or per-input traffic shows there first.

## 4. Things that save commands but cost latency (avoid for realtime)

- **Polling** Redis lists or keys as mailboxes: commands on every poll, plus up to one poll
  interval of delay. Pub/sub pushes.
- **Batching** several messages into one publish: saves commands only by waiting. Relic does it
  anyway once a room is split over instances (`api/_outbox.ts`), because a split party otherwise
  publishes once per snapshot and per input: at most one PUBLISH per room per instance a tenth of a
  second, but the first after a quiet spell goes at once (no wait for sparse traffic like the town),
  and a message marked urgent (a button pressed: `{to, d, u: 1}`) takes the queue with it at once,
  so a parry is never held. Players on the same instance are delivered to at once, as before.
- **Dropping the snapshot rate** below ~10 a second: players feel it.
- **Sticky routing** isn't available on Vercel Functions; don't build on it. Measure how often
  rooms split across instances instead (log the instance id on join).

## 5. Pitfalls we hit

- **An unhandled promise rejection kills the instance and every player on it.** Redis drops its
  connection now and then; any fire-and-forget command must be wrapped (`safe(p)` logs and
  swallows), and keep a last-resort `process.on('unhandledRejection')` in the function.
- **Liveness is proven by messages, never by connecting.** A crashed page whose timers still ran
  kept reconnecting every 10 s and never sent anything. Each reconnect refreshed its host claim,
  so nobody else could take the room. A host coming back to a claim it already holds must not
  refresh it until it actually sends something. And on a goodbye, don't delete the claim (the next
  connect would then be a fresh claim): clear its last-seen time instead, so it's takeable at once
  but only messages win it back. A brand-new claim gets only a short grace (1.5 s) before its
  holder must speak, and the client pings the moment it's told it holds the room. (All three found
  by the stress test, with several dead pages reconnecting in turn.)
- **A socket that says open can be dead** (iOS after backgrounding). Heartbeat both ways and
  reconnect on silence.
- **Only a player's newest connection may say goodbye**, or a late close from an old socket
  undoes a reconnect. Keep the newest connection id in a key.
- **Rotate sockets before the function's maximum duration** (Hobby 300 s): open the new one first,
  then close the old.
- **Dead subscribers inflate PUBLISH counts** until their connection closes. That only makes the
  gate in 3b publish more than needed (safe direction).

## 6. Checklist for a new project with this setup

1. Same region for Functions and Redis.
2. Local delivery first, origin-tagged publishes, echoes skipped.
3. Gate publishes on PUBLISH's count (3b), fail open, probes, always publish joins and leaves.
4. Full-state messages, and repeat-until-answered for anything that must arrive.
5. Pings answered at the edge; claim refresh throttled to ~2 s; one SET with EX.
6. `safe()` around every un-awaited Redis call, plus an `unhandledRejection` handler.
7. A test that counts publishes for a one-instance room, and one that splits players across two
   instances (memory backend and real `redis-server`).
8. A log line with the instance id per join and a command counter, then read the logs after the
   first real session.
