// What a friend is sent when a swarm is on the party (Kyle, 2026-11-05: "the lag was worst on the big
// expedition map, probably when there were lots of goblins on screen at once"). The Barrowfields with a
// leader and three friends (bots, fighting by Intent only) together, and N goblins awake and on them (kept
// up: they can't die, so the count holds); each friend's messages exactly as CoopHost sends a big room
// (client/bigsend.ts) at its pace (every 0.05 s), in RelaySocket's envelope. Bytes a message and a second, and
// which goblin fields fill them.
// Usage: npx tsx scripts/bigmap/swarm.ts [seconds, default 20] [counts, default 40,50,60]   Prints JSON and a table.
import { BigSend } from '../../src/client/bigsend';
import { splitMsg } from '../../src/client/split';
import { quiet, stateFor } from '../../src/client/interest';
import { Encoder } from '../../src/client/snap';
import { expedition } from '../../src/shared/expedjob';
import { EXPED } from '../../src/shared/tuning';
import { drive, newBot } from '../../src/sim/bots';
import { newRun, runRoom } from '../../src/sim/run';
import type { FightEvent } from '../../src/sim/types';

const SECS = Number(process.argv[2]) || 20, COUNTS = (process.argv[3] ?? '40,50,60').split(',').map(Number), IDS = ['me', 'b2', 'b3', 'b4'];
const pct = (a: number[], q: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * q))];

function run(n: number) {
  Object.assign(EXPED, { goblins: Math.max(150, n + 40), cap: n + 200 });
  const job = expedition(4), r = newRun(job);
  r.party = 4;
  const room = runRoom(r), ins = room.map.hero, c = { x: ins.x, y: ins.y - 6 };
  const bots = IDS.map((id, i) => {
    const h = room.join(id);
    Object.assign(h, { x: c.x + (i % 2) * 1.5, y: c.y + Math.floor(i / 2) * 1.5, safeT: 1e9 });
    room.prev.set('h:' + id, [h.x, h.y]);
    const b = newBot(id, { x: h.x, y: h.y }, 300 + i * 17);
    b.home = { x: c.x, y: c.y };
    return b;
  });
  // N goblins brought round the party, awake, and kept up.
  const swarm = room.allEnemies.filter((e) => e.act !== 'dead').slice(0, n);
  swarm.forEach((e, i) => {
    const a = (i / n) * Math.PI * 2, d = 5 + (i % 5) * 2;
    Object.assign(e, { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, dozing: false });
  });
  const send = new BigSend(), guests = IDS.slice(1), sizes: number[] = [], per = new Map(guests.map((g) => [g, 0]));
  const fields = new Map<string, number>(), encs = new Map(guests.map((g) => [g, new Encoder()]));
  const evs: FightEvent[] = [];
  let now = 0, sentAt = -9, sends = 0, total = 0, onScreen = 0, looks = 0;
  for (let f = 0; f < 60 * SECS; f++) {
    now += 1 / 60;
    for (const e of swarm) if (e.hp < e.maxHp / 2 || e.act === 'dead') Object.assign(e, { hp: e.maxHp, act: e.act === 'dead' ? 'idle' : e.act });
    for (const b of bots) room.setIntent(b.id, drive(b, room, 12));
    evs.push(...room.advance(1 / 60));
    if (evs.length > 200) evs.splice(0, evs.length - 200);
    if (now - sentAt < 0.05) continue;
    const common = { k: 1, t: room.time, x: 0, in: 0, hc: [], dm: [], run: r, goal: 'Kill GRISTLE', names: { me: 'A', b2: 'B', b3: 'C', b4: 'D' }, acks: {} };
    for (const g of guests) {
      const msg = send.body(room, g, now, sends === 0, common, evs);
      for (const w of splitMsg(g, { s: msg.s }, 1)) (per.set(g, per.get(g)! + w.length), sizes.push(w.length), (total += w.length));
      // Which fields: the same patch on a twin encoder (changes only, no fulls).
      const p = encs.get(g)!.encode(quiet(stateFor(room, g), room.time), sends === 0);
      if (sends) for (const [col, q] of Object.entries(p)) for (const [, d] of q!.u) for (const [k, v] of Object.entries(d)) fields.set(col + '.' + k, (fields.get(col + '.' + k) ?? 0) + k.length + 4 + (JSON.stringify(v) ?? 'null').length);
      const h = room.heroes.find((x) => x.id === g)!;
      (onScreen += room.enemies.filter((e) => e.act !== 'dead' && Math.abs(e.x - h.x) < 12 && Math.abs(e.y - h.y) < 8).length), looks++;
    }
    evs.length = 0;
    sentAt = now;
    sends++;
  }
  const near = stateFor(room, 'b2').enemies.length, sent = [...fields.values()].reduce((a, b) => a + b, 0);
  return {
    awake: n, inRing: near, onScreen: Math.round(onScreen / looks), sendsPerSec: +(sends / SECS).toFixed(1),
    msgMeanB: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length), msgP95B: pct(sizes, 0.95), msgMaxB: Math.max(...sizes),
    perGuestKBs: +([...per.values()].reduce((a, b) => a + b, 0) / guests.length / SECS / 1024).toFixed(1), allGuestsKBs: +(total / SECS / 1024).toFixed(1),
    topFields: [...fields].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${((100 * v) / sent).toFixed(0)}%`),
  };
}

const rows = COUNTS.map(run);
console.log(JSON.stringify(rows, null, 1));
console.log('\n| awake | in a friend\'s ring | on a phone screen | sends/s | msg mean B | p95 B | max B | KB/s a friend | KB/s all 3 |\n|---|---|---|---|---|---|---|---|---|');
for (const x of rows) console.log(`| ${x.awake} | ${x.inRing} | ${x.onScreen} | ${x.sendsPerSec} | ${x.msgMeanB} | ${x.msgP95B} | ${x.msgMaxB} | ${x.perGuestKBs} | ${x.allGuestsKBs} |`);
