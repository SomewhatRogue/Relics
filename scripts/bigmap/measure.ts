// The big map's load test in Node: the room's tick time with four bots and 100 / 300 / 600 goblins,
// dozing off and on (CPU time a tick, so other work on the machine doesn't count), the bots spread to the four quarters or roaming together; then what the leader
// would send each friend a second, the whole room (today's CoopHost) against only what's near them.
// Usage: npx tsx scripts/bigmap/measure.ts [seconds of play, default 30]   Prints JSON then the tables.
import { bigRoom, addBots } from '../../src/sim/bigroom';
import { drive, newBot } from '../../src/sim/bots';
import { Encoder, stateOf } from '../../src/client/snap';
import { eventsFor, quiet, stateFor } from '../../src/client/interest';
import { board, PLACES } from '../../src/shared/jobs';
import { newRun, runRoom } from '../../src/sim/run';
import { ArenaRoom as Room } from '../../src/sim/room';
import type { FightEvent } from '../../src/sim/types';
import type { ArenaRoom } from '../../src/sim/room';

const SECS = Number(process.argv[2]) || 30, COUNTS = [100, 300, 600], IDS = ['b1', 'b2', 'b3', 'b4'];
const stats = (a: number[]) => {
  const s = [...a].sort((p, q) => p - q);
  return { mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), max: +s[s.length - 1].toFixed(2) };
};

/** Today's rooms, for comparison: a village street's first room (28 by 24) with the party in it. */
const today = () => {
  const run = newRun({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective: 'rescue', seed: 77 });
  return runRoom(run);
};

function setUp(n: number, sleep: boolean, together: boolean) {
  const room: Room = n < 0 ? today() : bigRoom(3, n, sleep), bots = addBots(room, IDS);
  if (n < 0) bots.forEach((b, i) => {
    const h = room.heroes.find((x) => x.id === b.id)!, home = { x: 10 + i * 3, y: 16 };
    Object.assign(h, home), Object.assign(b, newBot(b.id, home, 1000 + i)), (b.home = { x: 14, y: 12 });
  });
  // Together: the party roams one quarter as a pack (the usual way a party plays).
  if (together && n >= 0) bots.forEach((b, i) => {
    const h = room.heroes.find((x) => x.id === b.id)!, home = { x: 18 + i * 1.2, y: 18 };
    Object.assign(h, home), Object.assign(b, newBot(b.id, home, 1000 + i)), (b.home = { x: 30, y: 30 });
  });
  return { room, bots };
}

/** Tick time: `SECS` of play at 30 ticks a second, each tick timed. */
function ticks(n: number, sleep: boolean, together: boolean) {
  const { room, bots } = setUp(n, sleep, together), times: number[] = [], awake: number[] = [];
  for (let i = 0; i < 30 * SECS + 60; i++) {
    for (const b of bots) room.setIntent(b.id, drive(b, room));
    // CPU time, not the wall clock: this box is shared, and waiting for a turn on it isn't the room's cost.
    const t0 = process.cpuUsage();
    room.step();
    const c = process.cpuUsage(t0);
    if (i >= 60) times.push((c.user + c.system) / 1000), awake.push(room.enemies.filter((e) => !e.dozing && e.act !== 'dead').length);
  }
  return { n, sleep, together, ...stats(times), awake: Math.round(awake.reduce((a, b) => a + b, 0) / awake.length), alive: room.enemies.filter((e) => e.act !== 'dead').length };
}

/** One message as the relay carries it (CoopHost.frame's body, inside RelaySocket.send's envelope). */
const wire = (to: string, body: unknown) => JSON.stringify({ to, d: { s: JSON.stringify(body) } }).length;
const saveRoom = (room: ArenaRoom) => Object.fromEntries(Object.entries(room).filter(([k]) => k !== 'prev' && k !== 'intents' && k !== 'events'));

/** What goes out: frames at 60 a second, a send every 0.05 s, a full one every 4 s (as CoopHost does). */
function bytes(n: number, together: boolean) {
  const { room, bots } = setUp(n, true, together), guests = IDS.slice(1);
  const all = new Encoder(), each = new Map(guests.map((g) => [g, new Encoder()]));
  const base = { k: 1, t: 0, x: 0, in: 0, hc: [], dm: [], run: null, goal: '', names: { me: 'B1', b2: 'B2', b3: 'B3', b4: 'B4' }, acks: {} };
  const calm = new Map(guests.map((g) => [g, new Encoder()]));
  let sentAt = -9, fullAt = -99, now = 0, sends = 0, wAll = 0, maxAll = 0, wMine = 0, maxMine = 0, encAll = 0, encMine = 0, saves = 0, maxSave = 0, wCalm = 0, maxCalm = 0;
  const wMineBy = new Map(guests.map((g) => [g, 0])), evs: FightEvent[] = [];
  const mapBytes = JSON.stringify({ ...room.map, blocks: [] }).length;
  for (let f = 0; f < 60 * SECS; f++) {
    now += 1 / 60;
    for (const b of bots) room.setIntent(b.id, drive(b, room));
    evs.push(...room.advance(1 / 60));
    if (evs.length > 200) evs.splice(0, evs.length - 200);
    if (Math.floor(now / 2) !== Math.floor((now - 1 / 60) / 2)) {
      const s = JSON.stringify({ to: '*', d: { save: JSON.stringify({ run: null, room: saveRoom(room), houses: {}, members: IDS, key: 1 }) } }).length;
      (saves += s), (maxSave = Math.max(maxSave, s));
    }
    if (now - sentAt < 0.05) continue;
    const full = now - fullAt > 4;
    if (full) fullAt = now;
    // Today: one patch of the whole room, to everyone, the map with every full one.
    let t0 = performance.now();
    const w = wire('*', { ...base, p: all.encode(stateOf(room), full), f: full ? 1 : 0, map: full ? { ...room.map, blocks: [] } : undefined, ev: evs });
    encAll += performance.now() - t0;
    (wAll += w), (maxAll = Math.max(maxAll, w));
    // Near only: each friend their own patch of what's near them; the map once on joining, not every 4 s.
    t0 = performance.now();
    for (const g of guests) {
      const m = wire(g, { ...base, p: each.get(g)!.encode(stateFor(room, g), full), f: full ? 1 : 0, ev: eventsFor(room, g, evs) });
      (wMine += m), (maxMine = Math.max(maxMine, m)), wMineBy.set(g, wMineBy.get(g)! + m);
    }
    encMine += performance.now() - t0;
    // ...and quiet clocks too.
    for (const g of guests) {
      const m = wire(g, { ...base, p: calm.get(g)!.encode(quiet(stateFor(room, g), room.time), full), f: full ? 1 : 0, ev: eventsFor(room, g, evs) });
      (wCalm += m), (maxCalm = Math.max(maxCalm, m));
    }
    evs.length = 0;
    sentAt = now;
    sends++;
  }
  const kb = (b: number) => +(b / 1024).toFixed(1);
  return {
    n, together, sendsPerSec: +(sends / SECS).toFixed(1), mapKB: kb(mapBytes),
    fullRoom: { perGuestKBs: kb(wAll / SECS), biggestKB: kb(maxAll), encodeMs: +(encAll / sends).toFixed(2) },
    nearOnly: { perGuestKBs: kb(wMine / guests.length / SECS), worstGuestKBs: kb(Math.max(...wMineBy.values()) / SECS), biggestKB: kb(maxMine), encodeMsAllGuests: +(encMine / sends).toFixed(2) },
    quiet: { perGuestKBs: kb(wCalm / guests.length / SECS), biggestKB: kb(maxCalm) },
    save: { everyTwoSecKB: kb(saves / Math.max(1, Math.floor(SECS / 2))), biggestKB: kb(maxSave) },
  };
}

const tickRows = [], byteRows = [];
tickRows.push(ticks(-1, false, true));
for (const together of [false, true]) for (const n of COUNTS) for (const sleep of [false, true]) tickRows.push(ticks(n, sleep, together));
byteRows.push(bytes(-1, true));
for (const together of [false, true]) for (const n of COUNTS) byteRows.push(bytes(n, together));
console.log(JSON.stringify({ tickRows, byteRows }, null, 1));
console.log('\n| bots | goblins | dozing | tick mean ms | p95 | max | awake (mean) |\n|---|---|---|---|---|---|---|');
for (const r of tickRows) console.log(`| ${r.together ? 'together' : 'spread'} | ${r.n < 0 ? 'today (' + r.alive + ')' : r.n} | ${r.sleep ? 'on' : 'off'} | ${r.mean} | ${r.p95} | ${r.max} | ${r.awake} |`);
console.log('\n| bots | goblins | whole room KB/s per friend | biggest msg KB | near only KB/s (worst friend) | biggest msg KB | near + quiet clocks KB/s | biggest KB | save every 2 s KB | map KB |\n|---|---|---|---|---|---|---|---|---|---|');
for (const r of byteRows) console.log(`| ${r.together ? 'together' : 'spread'} | ${r.n < 0 ? 'today' : r.n} | ${r.fullRoom.perGuestKBs} | ${r.fullRoom.biggestKB} | ${r.nearOnly.perGuestKBs} (${r.nearOnly.worstGuestKBs}) | ${r.nearOnly.biggestKB} | ${r.quiet.perGuestKBs} | ${r.quiet.biggestKB} | ${r.save.biggestKB} | ${r.mapKB} |`);
