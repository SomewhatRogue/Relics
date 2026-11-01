/**
 * Run rooms, laid out from the job's seed: each place kind has its own floor, walls, light, cover and
 * furniture (cottages and a well in a village, a barn and hay on a farm, trees in a forest, rock walls
 * and pit props in a mine). Ruin and the room's place in the run set how many goblins. The last room
 * holds the objective: cages, a named butcher, or the larder racks. Same seed, same room.
 */
import type { Block, BlockKind, GameMap, Ledge, Road, Round, RoundKind, Theme } from './arena.js';
import type { Job, PlaceKind } from './jobs.js';
import { WOOD, type PropKind } from './props.js';
import { Rng } from './rng.js';

export interface Foe { kind: 'scrapper' | 'butcher'; x: number; y: number; hp?: number; name?: string; bow?: boolean; z?: number }
/** Which way the party went at a fork. */
export type RoadId = Road['road'];
export interface RoomPlan { map: GameMap; foes: Foe[]; props: { kind: PropKind; x: number; y: number }[] }

const W = 18, H = 16, SPAWN = { x: 9, y: 14 }, EXIT = { x: 8, y: 0, w: 2, h: 0.9 };

export const THEMES: Record<PlaceKind, Theme> = {
  village: { floor: 'cobble', back: 'palisade', ambient: [0.24, 0.23, 0.32], moon: 0.55 },
  farm: { floor: 'dirt', back: 'palisade', ambient: [0.25, 0.24, 0.31], moon: 0.6 },
  field: { floor: 'wheat', back: 'trees', ambient: [0.26, 0.25, 0.33], moon: 0.7 },
  forest: { floor: 'grass', back: 'trees', ambient: [0.17, 0.19, 0.23], moon: 0.35 },
  mine: { floor: 'rock', back: 'rockface', ambient: [0.14, 0.13, 0.18], moon: 0 },
};

/** What each kind of place is furnished with. */
const KIT: Record<PlaceKind, { blocks: [BlockKind, number, number, number][]; rounds: [RoundKind, number, number][]; props: [PropKind, number][]; torches: boolean }> = {
  village: { blocks: [['house', 3.5, 2, 3]], rounds: [['well', 0.5, 1], ['stump', 0.3, 2]], props: [['barrel', 3], ['crate', 2]], torches: true },
  farm: { blocks: [['barn', 5, 3, 1], ['fence', 3.5, 0.35, 2]], rounds: [['hay', 0.6, 3]], props: [['barrel', 2], ['crate', 2], ['table', 1]], torches: true },
  field: { blocks: [], rounds: [['hay', 0.6, 3], ['stump', 0.3, 2]], props: [['crate', 1], ['barrel', 1]], torches: false },
  forest: { blocks: [], rounds: [['tree', 0.6, 5], ['pine', 0.5, 4], ['stump', 0.3, 2]], props: [['crate', 1]], torches: false },
  mine: { blocks: [['rockwall', 3.5, 1.2, 3]], rounds: [['support', 0.3, 4], ['rock', 0.5, 2]], props: [['crate', 2], ['oil', 2]], torches: true },
};

/** Wooden blocks get health (and a door if they have one); stone stays as it is. */
function wooden(b: Block): Block {
  const w = WOOD[b.kind];
  return w ? { ...b, hp: w.hp, maxHp: w.hp, burning: -1, door: w.door } : b;
}

/** A run's fork: the middle room of a three-room job has two ways out. */
export const isFork = (job: Job, index: number) => job.rooms >= 3 && index === job.rooms - 2;
export const ROADS: Record<RoadId, { label: string; text: string }> = {
  high: { label: 'THE HIGH ROAD', text: 'archers on the heights, fewer below' },
  low: { label: 'THE LOW ROAD', text: 'more goblins, someone caged' },
};

export function planRoom(job: Job, index: number, road?: RoadId): RoomPlan {
  const rng = new Rng(job.seed * 31 + index * 7 + 1), kind = job.place.kind, kit = KIT[kind], final = index === job.rooms - 1;
  const rounds: Round[] = [], blocks: Block[] = [], spots: { x: number; y: number; r: number }[] = [];
  const free = (x: number, y: number, r: number, skip?: object) =>
    Math.hypot(x - SPAWN.x, y - SPAWN.y) > r + 2.4 && Math.hypot(x - 9, y - 0.5) > r + 2.4 && Math.abs(x - 9) > r + 1.3 &&
    spots.every((s) => s === skip || Math.hypot(s.x - x, s.y - y) > s.r + r + 0.9);
  const spot = (r: number, y0 = 2.2, y1 = H - 3): { x: number; y: number } | null => {
    for (let t = 0; t < 50; t++) {
      const x = rng.range(1.4 + r, W - 1.4 - r), y = rng.range(y0 + r, y1 - r);
      if (free(x, y, r)) return spots.push({ x, y, r }), { x, y };
    }
    return null;
  };
  // A fork's two ways out, kept clear.
  const fork = isFork(job, index), obj = final ? job.objective : 'clear';
  const roads: Road[] | undefined = fork ? (['high', 'low'] as RoadId[]).map((r, i) => ({ road: r, label: ROADS[r].label, area: { x: i ? 13 : 3, y: 0, w: 2, h: 0.9 } })) : undefined;
  for (const r of roads ?? []) spots.push({ x: r.area.x + 1, y: 0.8, r: 1.4 });
  // Raised ground: always on the high road, sometimes elsewhere; archers up on it.
  const foes: Foe[] = [], ledges: Ledge[] = [];
  if (!fork && obj !== 'burn' && (road === 'high' || (road !== 'low' && index >= 1 && rng.next() < 0.4))) {
    const big = road === 'high', lw = big ? 7.5 : 6.5, lh = big ? 4.2 : 3.4, left = rng.next() < 0.5, lx = left ? 0 : W - lw;
    const ramp = { x: left ? lx + lw - 1.8 : lx, y: lh - 1.3, w: 1.8, h: 2.8 };
    ledges.push({ x: lx, y: 0, w: lw, h: lh, ramps: [ramp], kind: kind === 'mine' || kind === 'forest' ? 'rock' : 'wood' });
    for (let x = lx + 1; x < lx + lw; x += 1.5) spots.push({ x, y: lh / 2, r: lh / 2 + 0.3 });
    spots.push({ x: ramp.x + 0.9, y: ramp.y + ramp.h / 2, r: 1.5 });
    for (let i = 0; i < (big ? 3 : 2); i++) foes.push({ kind: 'scrapper', bow: true, z: 1, x: lx + 1.3 + i * (lw - 2.6) / Math.max(1, big ? 2 : 1), y: 1.3 + (i % 2) * 0.8 });
  }
  // The objective first (it must fit), then buildings and rock walls, round things, furniture.
  const props: RoomPlan['props'] = [];
  const cagesAt = ledges.length ? [0, 1, 2].map(() => spot(0.6, 2, H / 2 + 1)).filter(Boolean) as { x: number; y: number }[] : [[3, 2.2], [15, 2.2], [9, 2.6]].map(([x, y]) => ({ x, y }));
  // The low road: someone caged in every room.
  if (road === 'low' && obj !== 'rescue' && obj !== 'story') { const c = spot(0.6, 2, H / 2 + 1); if (c) props.push({ kind: 'cage', ...c }); }
  if (obj === 'burn') for (let i = 0; i < 3; i++) {
    // The dens, each with an oil barrel by it (fire spreads wood to wood).
    const c = spot(1.6, 1.5, H - 4);
    if (!c) continue;
    blocks.push(wooden({ x: c.x - 1.3, y: c.y - 0.8, w: 2.6, h: 1.6, kind: 'den' }));
    const den = spots[spots.length - 1];
    for (const [ox, oy] of [[2.1, 0.5], [-2.1, 0.5], [0, 1.6]]) {
      const x = c.x + ox, y = c.y + oy;
      if (x > 1 && x < W - 1 && y < H - 3 && free(x, y, 0.45, den)) {
        props.push({ kind: 'oil', x, y }), spots.push({ x, y, r: 0.45 });
        break;
      }
    }
  }
  if (obj === 'rescue' || obj === 'story') for (const { x, y } of cagesAt.slice(0, obj === 'story' ? 3 : 2)) props.push({ kind: 'cage', x, y }), spots.push({ x, y, r: 0.6 });
  if (obj === 'larder') for (let i = 0; i < 3; i++) {
    const c = spot(0.5, 1.5, H / 2);
    if (c) props.push({ kind: 'larder', ...c });
  }
  for (const [k, w, h, n] of kit.blocks) for (let i = 0; i < n; i++) {
    const r = Math.hypot(w, h) / 2, c = spot(r);
    if (c) blocks.push(wooden({ x: c.x - w / 2, y: c.y - h / 2, w, h, kind: k }));
  }
  for (const [k, r, n] of kit.rounds) for (let i = 0; i < n; i++) {
    const c = spot(r);
    if (c) rounds.push({ ...c, r, kind: k });
  }
  for (const [k, n] of kit.props) for (let i = 0; i < n; i++) {
    const c = spot(0.5);
    if (c) props.push({ kind: k, ...c });
  }
  // A goblin campfire to see by.
  const fire = spot(0.35, 3, H / 2 + 1);
  const braziers = fire ? [{ ...fire, r: 0.35 }] : [];
  // Goblins, in the top half.
  const ruin = job.place.ruin;
  const n = Math.max(1, Math.min(7, 2 + ruin + index + (road === 'low' ? 1 : road === 'high' ? -2 : 0)));
  for (let i = 0; i < n; i++) {
    const c = spot(0.4, 1.5, H / 2);
    if (c) foes.push({ kind: 'scrapper', ...c });
  }
  if (final && (obj === 'hunt' || obj === 'story')) foes.push({ kind: 'butcher', x: 9, y: 4.5, hp: obj === 'story' ? 560 : 420, name: job.boss });
  else if (ruin >= 2 && index >= 1) foes.push({ kind: 'butcher', x: 9, y: 4 });
  const night = job.twist === 'night', t = THEMES[kind];
  const theme: Theme = night ? { ...t, ambient: t.ambient.map((v) => v * 0.65) as Theme['ambient'], moon: t.moon * 0.5 } : t;
  const map: GameMap = {
    name: job.place.name.toUpperCase(), w: W, h: H, wallFace: 3, rounds, blocks, braziers,
    torches: kit.torches ? [{ x: 4.5, y: -1.6 }, { x: 13.5, y: -1.6 }] : [], hero: { ...SPAWN }, exit: roads ? null : { ...EXIT }, theme,
    ledges: ledges.length ? ledges : undefined, roads,
  };
  return { map, foes, props };
}
