/**
 * Goblins through the shallows, measured (Kyle: "Some shallow water seems to really hurt pathing").
 * On the layout-2 and layout-3 river, ford, stream and fen rooms and the Barrowfields, stands a hero on
 * one side of a stretch of shallow water and wakes a goblin (a small one, then a butcher) on the other,
 * and counts: stuck (never reached the hero in 40 s), stalls (2 s without moving 0.3 tiles), detours
 * (walked over 1.4 times the shortest way a body that size can walk), shallows avoided (the shortest
 * way wades, the goblin went round), and time against the best time, wading slow included.
 *   npx tsx scripts/water/crossing.ts            (add "v" for the worst cases)
 */
import { collide, inArea, useMap, WADE, type GameMap, type Water } from '../../src/shared/arena';
import { board, type Job } from '../../src/shared/jobs';
import { planRoom } from '../../src/shared/terrain';
import { expedition } from '../../src/shared/expedjob';
import { expedPlan } from '../../src/shared/expedmap';
import { onWalkedGround } from '../../src/shared/reach';
import { Rng } from '../../src/shared/rng';
import { BUTCHER, SCRAPPER } from '../../src/shared/tuning';
const ENEMIES = { scrapper: SCRAPPER, butcher: BUTCHER };
import { ArenaRoom } from '../../src/sim/room';
import { NO_INTENT } from '../../src/sim/types';
import { geodesic } from './geodesic';

const VERBOSE = process.argv.includes('v');
type Set = { name: string; maps: { name: string; map: GameMap }[] };
const shallow = (m: GameMap) => (m.water ?? []).filter((w) => !w.deep);
const sets: Set[] = [{ name: 'layout 2 river and ford', maps: [] }, { name: 'layout 2 stream and fen', maps: [] }, { name: 'layout 3 river and ford', maps: [] }, { name: 'layout 3 stream and fen', maps: [] }, { name: 'Barrowfields', maps: [] }];
for (let day = 1; day <= 40; day++) for (const [ji, job] of board(day).entries()) for (const layout of [2, 3] as const) {
  const j: Job = { ...job, layout };
  for (let i = 0; i < j.rooms; i++) {
    let map: GameMap;
    try { map = planRoom(j, i).map; } catch { continue; }
    if (!shallow(map).length) continue;
    const river = (map.water ?? []).some((w) => w.deep && (w.w > 8 || w.h > 8));
    const s = sets[(layout === 2 ? 0 : 2) + (river ? 0 : 1)];
    if (s.maps.length < 24) s.maps.push({ name: `${job.place.name} d${day} j${ji} r${i} L${layout}`, map });
  }
}
for (const day of [1, 2, 3, 4]) sets[4].maps.push({ name: `Barrowfields d${day}`, map: expedPlan(expedition(day)).map });

/** Is (x, y) somewhere a body of radius r can stand? */
const standable = (m: GameMap, x: number, y: number, r: number) => {
  if (!onWalkedGround(m, x, y)) return false;
  const q = { x, y, z: 0 };
  collide(q, r);
  return Math.hypot(q.x - x, q.y - y) < 1e-6;
};
const wet = (m: GameMap, x: number, y: number) => shallow(m).some((w) => inArea(w, x, y));

/** Pairs either side of a stretch of shallows: a goblin's start and the hero's spot. */
type Pt = { x: number; y: number };
function pairs(m: GameMap, rng: Rng, r: number): { a: Pt; b: Pt; c: Pt | null }[] {
  const out: { a: Pt; b: Pt; c: Pt | null }[] = [], pools = shallow(m);
  for (let t = 0; t < 400 && out.length < 6; t++) {
    const w: Water = pools[rng.int(pools.length)], cx = w.x + rng.range(0.2, 0.8) * w.w, cy = w.y + rng.range(0.2, 0.8) * w.h;
    // Across the water's short side (over a ford, through a stream), give or take.
    const across = w.w > w.h ? Math.PI / 2 : 0, a = across + rng.range(-0.7, 0.7) + (rng.next() < 0.5 ? Math.PI : 0);
    const d1 = rng.range(3, 8), d2 = rng.range(3, 8), a2 = a + Math.PI + rng.range(-0.5, 0.5);
    const A = { x: cx + Math.cos(a) * (d1 + Math.min(w.w, w.h) / 2), y: cy + Math.sin(a) * (d1 + Math.min(w.w, w.h) / 2) };
    const B = { x: cx + Math.cos(a2) * (d2 + Math.min(w.w, w.h) / 2), y: cy + Math.sin(a2) * (d2 + Math.min(w.w, w.h) / 2) };
    if (!standable(m, A.x, A.y, r) || !standable(m, B.x, B.y, r) || wet(m, A.x, A.y) || wet(m, B.x, B.y)) continue;
    // And the hero standing in the water itself, where it's somewhere to stand.
    out.push({ a: A, b: B, c: standable(m, cx, cy, 0.32) ? { x: cx, y: cy } : null });
  }
  return out;
}

type Row = { inWater: boolean; stuck: boolean; stalls: number; detour: number; avoided: boolean; ratio: number; secs: number; what: string };
function cross(map: GameMap, kind: 'scrapper' | 'butcher', a: { x: number; y: number }, b: { x: number; y: number }, what: string): Row | null {
  const spec = ENEMIES[kind], room = new ArenaRoom(7, { map, foes: [{ kind, x: a.x, y: a.y, awake: true }] });
  const best = geodesic(map, spec.radius, a, b, spec.speed, WADE);
  if (!best) return null;
  const h = room.join('me'), e = room.enemies[0];
  Object.assign(h, { x: b.x, y: b.y, safeT: 1e9 });
  e.alert = true;
  room.setIntent('me', { ...NO_INTENT });
  const reach = spec.reach + 0.25, TICKS = 40 * 30;
  let walked = 0, px = e.x, py = e.y, waded = false, stalls = 0, mark = { x: e.x, y: e.y, t: 0 }, t = 0;
  for (; t < TICKS; t++) {
    Object.assign(h, { x: b.x, y: b.y, hp: h.maxHp, act: h.act === 'down' ? 'idle' : h.act });
    room.step();
    walked += Math.hypot(e.x - px, e.y - py);
    (px = e.x), (py = e.y);
    if (wet(map, e.x, e.y)) waded = true;
    if (Math.hypot(e.x - b.x, e.y - b.y) < reach) break;
    if (t - mark.t >= 60) {
      if (Math.hypot(e.x - mark.x, e.y - mark.y) < 0.3) stalls++;
      mark = { x: e.x, y: e.y, t };
    }
  }
  const secs = t / 30, stuck = t >= TICKS;
  return { inWater: wet(map, b.x, b.y), stuck, stalls, detour: walked / Math.max(0.5, best.len - reach), avoided: best.wades && !waded && !wet(map, b.x, b.y), ratio: secs / Math.max(0.3, best.secs - reach / spec.speed), secs, what };
}

/** A hero pushing the stick straight at b from a (where nothing deep is in the way): blocked if not there in 15 s. */
function heroWalk(map: GameMap, a: Pt, b: Pt): boolean | null {
  for (let k = 1; k < 40; k++) if ((map.water ?? []).some((w) => w.deep && inArea(w, a.x + ((b.x - a.x) * k) / 40, a.y + ((b.y - a.y) * k) / 40))) return null;
  const room = new ArenaRoom(7, { map, foes: [] }), h = room.join('me');
  Object.assign(h, { x: a.x, y: a.y, safeT: 1e9 });
  for (let t = 0; t < 15 * 30; t++) {
    const dx = b.x - h.x, dy = b.y - h.y, d = Math.hypot(dx, dy);
    if (d < 0.6) return false;
    room.setIntent('me', { ...NO_INTENT, mx: dx / d, my: dy / d });
    room.step();
  }
  if (VERBOSE) console.log(`  hero blocked ${currentMapName} ${a.x.toFixed(1)},${a.y.toFixed(1)} -> ${b.x.toFixed(1)},${b.y.toFixed(1)} at ${h.x.toFixed(2)},${h.y.toFixed(2)}`);
  return true;
}
let currentMapName = '';
let heroRuns = 0, heroBlocked = 0;

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const p90 = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.9)] ?? 0;
const all: Row[] = [];
console.log('set | runs | stuck | stalled | detour >1.4 | shallows avoided | walked/shortest mean p90 | time/best mean p90 | secs mean | hero in the water: runs, stuck, time/best');
for (const s of sets) {
  const rows: Row[] = [];
  s.maps.forEach((m, mi) => {
    useMap(m.map);
    currentMapName = m.name;
    // A hero walking straight over each stretch of shallows, through its middle, bank to bank.
    for (const w of shallow(m.map)) {
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2, v = w.w > w.h, a = v ? { x: cx, y: w.y - 1.6 } : { x: w.x - 1.6, y: cy }, b = v ? { x: cx, y: w.y + w.h + 1.6 } : { x: w.x + w.w + 1.6, y: cy };
      if (!standable(m.map, a.x, a.y, 0.32) || !standable(m.map, b.x, b.y, 0.32)) continue;
      for (const [p, q] of [[a, b], [b, a]]) {
        const hw = heroWalk(m.map, p, q);
        if (hw !== null) (heroRuns++, hw && heroBlocked++);
      }
    }
    for (const kind of ['scrapper', 'butcher'] as const) {
      const rng = new Rng(1000 + mi * 31 + (kind === 'butcher' ? 7 : 0));
      for (const p of pairs(m.map, rng, ENEMIES[kind].radius)) {
        for (const b of p.c ? [p.b, p.c] : [p.b]) {
          const r = cross(m.map, kind, p.a, b, `${kind} ${m.name} ${p.a.x.toFixed(1)},${p.a.y.toFixed(1)} -> ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
          if (r) rows.push(r);
        }
      }
    }
  });
  all.push(...rows);
  const n = rows.length, f = (k: (r: Row) => boolean) => `${rows.filter(k).length} (${Math.round((100 * rows.filter(k).length) / Math.max(1, n))}%)`;
  const ok = rows.filter((r) => !r.stuck);
  console.log([s.name, n, f((r) => r.stuck), f((r) => r.stalls > 0), f((r) => r.detour > 1.4), f((r) => r.avoided),
    `${mean(ok.map((r) => r.detour)).toFixed(2)} ${p90(ok.map((r) => r.detour)).toFixed(2)}`, `${mean(ok.map((r) => r.ratio)).toFixed(2)} ${p90(ok.map((r) => r.ratio)).toFixed(2)}`, mean(ok.map((r) => r.secs)).toFixed(1),
    `${rows.filter((r) => r.inWater).length}, ${rows.filter((r) => r.inWater && r.stuck).length}, ${mean(ok.filter((r) => r.inWater).map((r) => r.ratio)).toFixed(2)}`].join(' | '));
}
const ok = all.filter((r) => !r.stuck);
console.log(`ALL | ${all.length} | stuck ${all.filter((r) => r.stuck).length} | stalled ${all.filter((r) => r.stalls).length} | detour>1.4 ${all.filter((r) => r.detour > 1.4).length} | avoided ${all.filter((r) => r.avoided).length} | time/best ${mean(ok.map((r) => r.ratio)).toFixed(2)}`);
console.log(`a hero walking straight over the shallows: ${heroRuns} runs, ${heroBlocked} blocked`);
if (VERBOSE) for (const r of [...all].sort((p, q) => (q.stuck ? 99 : 0) + q.stalls + q.detour - ((p.stuck ? 99 : 0) + p.stalls + p.detour)).slice(0, 40)) console.log(`  ${r.stuck ? 'STUCK' : ''} stalls ${r.stalls} detour ${r.detour.toFixed(2)} ${r.avoided ? 'AVOIDED ' : ''}${r.secs.toFixed(1)}s ${r.what}`);
