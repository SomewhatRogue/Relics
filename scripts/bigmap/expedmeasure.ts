// An expedition's online cost in Node: the Barrowfields room with a leader and three friends (bots,
// walking and swinging by Intent only), 150 and 300 goblins, the party together or spread; each friend's
// messages exactly as CoopHost sends them for a big room (client/bigsend.ts: near only, quiet clocks,
// the map by seed), in RelaySocket's envelope and split as it splits them (client/split.ts); the room's
// tick; and the compact save (client/bigsave.ts) against the whole room.
// Usage: npx tsx scripts/bigmap/expedmeasure.ts [seconds of play, default 30]   Prints JSON then a table.
import { BigSend } from '../../src/client/bigsend';
import { packRoom } from '../../src/client/bigsave';
import { splitMsg } from '../../src/client/split';
import { saveRoom } from '../../src/client/coop';
import { expedition } from '../../src/shared/expedjob';
import { EXPED } from '../../src/shared/tuning';
import { drive, newBot } from '../../src/sim/bots';
import { newRun, runRoom } from '../../src/sim/run';
import type { FightEvent } from '../../src/sim/types';

const SECS = Number(process.argv[2]) || 30, IDS = ['me', 'b2', 'b3', 'b4'];
const stats = (a: number[]) => {
  const s = [...a].sort((p, q) => p - q);
  return { mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), max: +s[s.length - 1].toFixed(2) };
};

function run(goblins: number, together: boolean, day: number) {
  Object.assign(EXPED, { goblins, cap: goblins + 50 });
  const job = expedition(day), r = newRun(job);
  r.party = 4;
  const room = runRoom(r), m = room.map, ins = m.hero;
  const homes = together ? IDS.map((_, i) => ({ x: ins.x + i, y: ins.y - 4 })) : [{ x: ins.x, y: ins.y - 4 }, { x: 18, y: 14 }, { x: m.w - 18, y: 14 }, { x: m.w - 18, y: m.h - 14 }];
  const bots = IDS.map((id, i) => {
    const h = room.join(id);
    Object.assign(h, homes[i], { safeT: 1e9 });
    room.prev.set('h:' + id, [h.x, h.y]);
    const b = newBot(id, homes[i], 1000 + i * 17);
    // Together: they roam out from the way in toward the middle of the map, as a party does.
    if (together) b.home = { x: m.w / 2, y: m.h / 2 };
    return b;
  });
  const send = new BigSend(), guests = IDS.slice(1), names = { me: 'A', b2: 'B', b3: 'C', b4: 'D' };
  const per = new Map(guests.map((g) => [g, 0])), sizes: number[] = [], ticks: number[] = [], evs: FightEvent[] = [];
  let now = 0, sentAt = -9, sends = 0, parts = 0, saveMax = 0, saveWhole = 0, saveParts = 0;
  for (let f = 0; f < 60 * SECS; f++) {
    now += 1 / 60;
    for (const b of bots) room.setIntent(b.id, drive(b, room, together ? 22 : 14));
    const t0 = process.cpuUsage(), tk = room.tick;
    evs.push(...room.advance(1 / 60));
    if (room.tick !== tk) { const c = process.cpuUsage(t0); ticks.push((c.user + c.system) / 1000); }
    if (evs.length > 200) evs.splice(0, evs.length - 200);
    if (Math.floor(now / 2) !== Math.floor((now - 1 / 60) / 2)) {
      const whole = JSON.stringify({ run: r, room: saveRoom(room), houses: [], members: IDS, key: 1 });
      const compact = JSON.stringify({ run: r, room: packRoom(saveRoom(room), job), houses: [], members: IDS, key: 1 });
      const wire = splitMsg('*', { save: compact }, 1);
      (saveWhole = Math.max(saveWhole, whole.length)), (saveMax = Math.max(saveMax, compact.length)), (saveParts = Math.max(saveParts, wire.length));
    }
    if (now - sentAt < 0.05) continue;
    const common = { k: 1, t: room.time, x: 0, in: 0, hc: [], dm: [], run: r, goal: 'Kill GRISTLE (3 jobs left)', names, acks: {} };
    for (const g of guests) {
      const msg = send.body(room, g, now, sends === 0, common, evs), wire = splitMsg(g, { s: msg.s }, 1);
      for (const w of wire) (per.set(g, per.get(g)! + w.length), sizes.push(w.length));
      parts += wire.length - 1;
    }
    evs.length = 0;
    sentAt = now;
    sends++;
  }
  const kb = (b: number) => +(b / 1024).toFixed(1), awake = room.enemies.filter((e) => !e.dozing && e.act !== 'dead').length;
  return {
    goblins, together, alive: room.allEnemies.filter((e) => e.act !== 'dead').length, awakeAtEnd: awake, tickMs: stats(ticks),
    perGuestKBs: kb([...per.values()].reduce((a, b) => a + b, 0) / guests.length / SECS), worstGuestKBs: kb(Math.max(...per.values()) / SECS),
    biggestMsgKB: kb(Math.max(...sizes)), msgMeanKB: +(sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024).toFixed(2), splitMsgs: parts,
    saveWholeKB: kb(saveWhole), saveCompactKB: kb(saveMax), saveParts,
  };
}

const rows = [];
for (const together of [true, false]) for (const n of [150, 300]) rows.push(run(n, together, n === 150 ? 3 : 4));
console.log(JSON.stringify(rows, null, 1));
console.log('\n| party | goblins | alive at end | tick mean / p95 ms | KB/s a friend (worst) | biggest msg KB | mean msg KB | split | save whole KB | save compact KB (parts) |\n|---|---|---|---|---|---|---|---|---|---|');
for (const x of rows) console.log(`| ${x.together ? 'together' : 'spread'} | ${x.goblins} | ${x.alive} | ${x.tickMs.mean} / ${x.tickMs.p95} | ${x.perGuestKBs} (${x.worstGuestKBs}) | ${x.biggestMsgKB} | ${x.msgMeanKB} | ${x.splitMsgs} | ${x.saveWholeKB} | ${x.saveCompactKB} (${x.saveParts}) |`);
