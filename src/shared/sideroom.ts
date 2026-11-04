/**
 * The dead end through a side way (docs/terrain-nodes.md 3.4, slice 3): a small room of its own off
 * the job's room, planned from the side way's door (shared/sideway.ts) and the job, the same on every
 * screen. A glade with its spring, the hungry's pens, old workings with their pillars of rock, or a
 * cave pocket; a chest at the far end, and the one other thing it was worth coming for: someone caged,
 * a nest, a cache of oil, or a shrine the hungry fouled. You go back out the way you came in.
 */
import type { Block, GameMap, Mark, Round, Soil, Water } from './arena.js';
import type { Job } from './jobs.js';
import { SPIDERS } from './nests.js';
import { NEST } from './spiders.js';
import { OPP, spawnAt, wayArea, type Port } from './ports.js';
import type { PropKind } from './props.js';
import { Rng } from './rng.js';
import { readSide } from './sideway.js';
import { THEMES, type Foe, type RoomPlan } from './terrain.js';
import { lightFor, timeOf } from './timeofday.js';
import { weatherAt } from './weather.js';

const W = 20, H = 16;

export function sideRoom(job: Job, roomIndex: number, door: string): RoomPlan {
  const d = readSide(door)!, back: Port = { side: OPP[d.face], at: OPP[d.face] === 'N' ? W / 2 : H / 2 + 1 };
  let h = (job.seed * 2654435761) >>> 0;
  for (const c of `${roomIndex}:${door}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const rng = new Rng(h % 2147483647 || 1), hero = spawnAt(back, W, H), exit = wayArea(back, W, H);
  const rounds: Round[] = [], blocks: Block[] = [], soil: Soil[] = [], marks: Mark[] = [], water: Water[] = [], foes: Foe[] = [], props: { kind: PropKind; x: number; y: number }[] = [];
  // The far end (where the chest is), and how far anything keeps from the way in.
  const far = { x: back.side === 'W' ? W - 3.5 : back.side === 'E' ? 3.5 : W / 2, y: back.side === 'N' ? H - 4 : H / 2 - 1 };
  const clear = (x: number, y: number, r: number) => Math.hypot(x - hero.x, y - hero.y) > r + 2.6 && x > r + 0.8 && x < W - r - 0.8 && y > r + 0.8 && y < H - r - 1 &&
    rounds.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + 0.5) && blocks.every((b) => x < b.x - r - 0.5 || x > b.x + b.w + r + 0.5 || y < b.y - r - 0.5 || y > b.y + b.h + r + 0.5) &&
    props.every((p) => Math.hypot(p.x - x, p.y - y) > r + 0.9) && water.every((q) => x < q.x - r || x > q.x + q.w + r || y < q.y - r || y > q.y + q.h + r);
  const spot = (r: number): { x: number; y: number } | null => {
    for (let t = 0; t < 60; t++) {
      // Inside the ring (round the edge it's trees or rock all the way).
      const a = rng.range(0, Math.PI * 2), k = Math.sqrt(rng.next()) * 0.92, x = W / 2 + Math.cos(a) * (W / 2 - 2.2 - r) * k, y = H / 2 + Math.sin(a) * (H / 2 - 2.4 - r) * k;
      if (clear(x, y, r)) return { x, y };
    }
    return null;
  };
  // What rings it: trees or reeds (a glade), wicker hurdles (the pens), rock (the workings, a cave).
  const ringKind = d.node === 'glade' ? (d.country === 'fen' ? 'reed' : 'tree') : 'rock';
  for (let a = 0; a < Math.PI * 2; a += d.node === 'glade' ? 0.16 : 0.22) {
    const x = W / 2 + Math.cos(a) * (W / 2 - 0.9), y = H / 2 + Math.sin(a) * (H / 2 - 1.1);
    if (Math.hypot(x - hero.x, y - hero.y) < 3.4 || d.node === 'pens') continue;
    rounds.push({ kind: ringKind, x: x + rng.range(-0.3, 0.3), y: y + rng.range(-0.3, 0.3), r: ringKind === 'reed' ? 0.3 : rng.range(0.5, 0.7) });
  }
  if (d.node === 'glade') {
    soil.push({ mat: 'grass', x: 2, y: 2, w: W - 4, h: H - 4, round: true });
    const p = spot(1.6);
    if (p) water.push({ x: p.x - 1.2, y: p.y - 0.7, w: 2.4, h: 1.4 }), marks.push({ kind: 'flowers', x: p.x - 2, y: p.y + 0.8, w: 4, h: 1.2 });
  } else if (d.node === 'pens') {
    // The fold: wicker hurdles round a muddy pen, the gate toward you.
    soil.push({ mat: 'mud', x: 3, y: 3, w: W - 6, h: H - 6, round: true });
    const x0 = W / 2 - 4, y0 = H / 2 - 3;
    for (let x = x0; x < x0 + 8; x += 2.2) if (Math.abs(x + 1.1 - W / 2) > 1.2 || back.side !== 'N') blocks.push({ kind: 'hurdle', x, y: y0, w: 2.2, h: 0.45 });
    for (let x = x0; x < x0 + 8; x += 2.2) if (Math.abs(x + 1.1 - W / 2) > 1.4) blocks.push({ kind: 'hurdle', x, y: y0 + 6, w: 2.2, h: 0.45 });
    for (const sx of [x0 - 0.45, x0 + 8.2]) for (let y = y0 + 0.5; y < y0 + 5.8; y += 2.2) if (Math.abs(y + 1.1 - hero.y) > 1.4 || Math.abs(sx - hero.x) > 4) blocks.push({ kind: 'hurdle', x: sx, y, w: 0.45, h: Math.min(2.2, y0 + 6 - y) });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) rounds.push({ kind: 'rock', x: W / 2 + sx * (W / 2 - 1.2), y: H / 2 + sy * (H / 2 - 1.4), r: 0.5 });
  } else {
    // Old workings or a cave: pillars of rock left standing, ore heaps, a pool in the dark.
    soil.push({ mat: d.node === 'cave' ? 'wet' : 'earth', x: 2, y: 2, w: W - 4, h: H - 4, round: true });
    for (let i = 0; i < (d.layout === 'pillars' || d.node === 'cave' ? 4 : 2); i++) {
      const p = spot(1);
      if (p) rounds.push({ kind: 'rock', x: p.x, y: p.y, r: rng.range(0.7, 1) });
    }
    for (let i = 0; i < (d.layout === 'heaps' ? 3 : 1); i++) {
      const p = spot(1.3);
      if (p) blocks.push({ kind: 'rubble', x: p.x - 1.1, y: p.y - 0.5, w: 2.2, h: 1 });
    }
    const p = d.node === 'cave' ? spot(1.6) : null;
    if (p) water.push({ x: p.x - 1.4, y: p.y - 0.8, w: 2.8, h: 1.6, ...(d.layout === 'pool' ? { deep: true } : {}) });
  }
  // The chest at the far end, then what else is here.
  const chests = [clear(far.x, far.y, 0.6) ? far : spot(0.6) ?? far];
  props.push({ kind: 'crate', x: chests[0].x + 1.2, y: chests[0].y + 0.4 });
  if (d.cache === 'captive') {
    const c = d.node === 'pens' ? { x: W / 2, y: H / 2 } : spot(0.7);
    if (c) props.push({ kind: 'cage', ...c });
  } else if (d.cache === 'oil') {
    for (let i = 0; i < 3; i++) { const c = spot(0.45); if (c) props.push({ kind: i < 2 ? 'oil' : 'barrel', ...c }); }
  } else if (d.cache === 'shrine') {
    const c = spot(0.6);
    if (c) rounds.push({ kind: 'shrine', ...c, r: 0.3 }), marks.push({ kind: 'blood', x: c.x - 0.8, y: c.y + 0.4, w: 1.6, h: 0.7 });
  } else {
    const c = spot(NEST.radius + 0.6);
    if (c) foes.push({ kind: 'nest', ...c, wave: NEST.wave }), Array.from({ length: SPIDERS.guards }, (_, i) => foes.push({ kind: 'spider', x: c.x + Math.cos(i * 2.4) * 1.15, y: c.y + Math.sin(i * 2.4) * 0.9 }));
  }
  // A few of them about it (the pens are guarded).
  for (let i = 0; i < (d.node === 'pens' ? 2 + rng.int(2) : rng.int(3)); i++) {
    const c = spot(0.4);
    if (c) foes.push({ kind: 'scrapper', ...c });
  }
  const theme = weatherAt(job, roomIndex, { ...lightFor(THEMES[d.light], d.light, timeOf(job)), floor: d.floor, back: d.back === 'palisade' ? 'trees' : d.back });
  const map: GameMap = {
    name: job.place.name.toUpperCase(), w: W, h: H, wallFace: 3, rounds, blocks, braziers: [], torches: [], hero, exit, theme,
    soil, marks, ...(water.length ? { water } : {}),
  };
  return { map, foes, props, chests };
}
