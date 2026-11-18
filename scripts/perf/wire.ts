// Wire and CPU profile of an ordinary co-op job room, sent exactly as CoopHost.frame sends it.
// Usage: npx tsx scripts/perf/wire.ts [seconds] [place kind]
import { Decoder, Encoder, stateOf, COLLS } from '../../src/client/snap';
import { loud, quiet } from '../../src/client/interest';
import { board, PLACES } from '../../src/shared/jobs';
import { drive, newBot } from '../../src/sim/bots';
import { newRun, runRoom } from '../../src/sim/run';
import type { FightEvent } from '../../src/sim/types';

const SECS = Number(process.argv[2]) || 30, KIND = process.argv[3] ?? 'village', IDS = ['me', 'b2', 'b3', 'b4'];
const run = newRun({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === KIND)!, objective: 'rescue', seed: 77 });
run.party = 4;
const room = runRoom(run);
const bots = IDS.map((id, i) => {
  const h = room.join(id), home = { x: 10 + i * 3, y: 16 };
  Object.assign(h, home, { safeT: 0 });
  room.prev.set('h:' + id, [h.x, h.y]);
  const b = newBot(id, home, 1000 + i);
  b.home = { x: room.map.w / 2, y: room.map.h / 2 };
  return b;
});
// Keep the fight going: nobody dies for good.
const keepUp = () => {
  for (const h of room.heroes) if (h.hp < h.maxHp / 2) h.hp = h.maxHp;
  for (const e of room.enemies) if (e.hp < e.maxHp / 3 && e.act !== 'dead') e.hp = e.maxHp;
};
const enc = new Encoder(), dec = new Decoder(), said: Record<string, string> = {};
const fields = new Map<string, { bytes: number; n: number }>();
const evs: FightEvent[] = [];
let now = 0, sentAt = -9, fullAt = -99, sends = 0, fulls = 0;
let inner = 0, outer = 0, innerPatch = 0, outerPatch = 0, tEnc = 0, tStr = 0, tSlow = 0, tGuest = 0, tTick = 0, ticks = 0, maxEnc = 0;
const cpu = () => { const c = process.cpuUsage(); return (c.user + c.system) / 1000; };
const sizes: number[] = [];
for (let f = 0; f < 60 * SECS; f++) {
  now += 1 / 60;
  keepUp();
  for (const b of bots) room.setIntent(b.id, drive(b, room, 10));
  let t0 = cpu();
  const tk = room.tick;
  evs.push(...room.advance(1 / 60));
  tTick += cpu() - t0; ticks += room.tick - tk;
  if (now - sentAt < 0.05 - 0.004) continue;
  const full = now - fullAt > 4;
  t0 = cpu();
  const p = enc.encode(quiet(stateOf(room), room.time), full);
  let d = cpu() - t0; tEnc += d; maxEnc = Math.max(maxEnc, d);
  t0 = cpu();
  const slow: Record<string, unknown> = {};
  for (const [key, v] of Object.entries({ hc: [], dm: [], run: { ...run, board: undefined }, goal: 'Free the captives', names: { me: 'A', b2: 'B', b3: 'C', b4: 'D' } })) {
    const j = JSON.stringify(v);
    if (full || said[key] !== j) (slow[key] = v), (said[key] = j);
  }
  tSlow += cpu() - t0;
  t0 = cpu();
  const body = { p, f: full ? 1 : 0, k: 1, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, w: now, x: 0, in: 0, ...slow, ev: evs, acks: {} };
  const s = JSON.stringify(body), wire = JSON.stringify({ to: '*', d: { s } });
  tStr += cpu() - t0;
  inner += s.length; outer += wire.length; sizes.push(wire.length);
  if (!full) { innerPatch += s.length; outerPatch += wire.length; }
  if (!full) for (const [col, q] of Object.entries(p)) for (const [, dd] of q!.u) for (const [k, v] of Object.entries(dd)) {
    const key = col + '.' + k, e = fields.get(key) ?? { bytes: 0, n: 0 };
    e.bytes += k.length + 4 + (JSON.stringify(v) ?? '').length; e.n++;
    fields.set(key, e);
  }
  // The guest's end: unwrap, swap ids, parse, apply.
  t0 = cpu();
  const m = JSON.parse(JSON.stringify({ t: 'msg', from: 'me', d: { s } })) as { d: { s: string } };
  const b2 = JSON.parse(m.d.s.split('"me"').join('"@lead"').split('"b2"').join('"me"'));
  const st = dec.apply(b2.p, !!b2.f) as unknown as Record<string, Record<string, unknown>[]>;
  loud(st.enemies, b2.t);
  tGuest += cpu() - t0;
  if (full) (fullAt = now), fulls++;
  evs.length = 0; sentAt = now; sends++;
}
const tot = [...fields.values()].reduce((a, b) => a + b.bytes, 0);
const st = stateOf(room);
console.log(JSON.stringify({
  place: KIND, map: `${room.map.w}x${room.map.h}`, secs: SECS,
  counts: Object.fromEntries(COLLS.map((c) => [c, (st[c] ?? []).length]).filter(([, n]) => n)),
  enemiesAlive: room.enemies.filter((e) => e.act !== 'dead').length,
  sendsPerSec: +(sends / SECS).toFixed(1),
  wireKBs: +(outer / SECS / 1024).toFixed(1), innerKBs: +(inner / SECS / 1024).toFixed(1), escapeOverheadPct: +(100 * (outer - inner) / inner).toFixed(1),
  patchMeanB: Math.round(outerPatch / (sends - fulls)), fullMeanB: Math.round((outer - outerPatch) / fulls),
  p95B: [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length * 0.95)],
  ms: { tickMean: +(tTick / ticks).toFixed(3), encodePerSend: +(tEnc / sends).toFixed(3), encodeMax: +maxEnc.toFixed(2), slowPartsPerSend: +(tSlow / sends).toFixed(3), stringifyPerSend: +(tStr / sends).toFixed(3), guestApplyPerPatch: +(tGuest / sends).toFixed(3) },
  leaderNetCpuPctOfFrame: +(100 * ((tEnc + tSlow + tStr) / sends) / 16.7 * (sends / (60 * SECS)) ).toFixed(1),
  topFields: [...fields].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 28).map(([k, v]) => `${k} ${(100 * v.bytes / tot).toFixed(1)}% (${(v.n / (sends - fulls)).toFixed(1)}/patch)`),
}, null, 1));
