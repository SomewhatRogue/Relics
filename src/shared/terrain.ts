/**
 * Run rooms, laid out from the job's seed: each place kind has its own floor, walls, light, cover and
 * furniture (cottages and a well in a village, a barn and hay on a farm, trees in a forest, rock walls
 * and pit props in a mine, a river with its fords, bog pools in a marsh, broken walls in ruins). Ruin
 * and the room's place in the run set how many goblins. The last room
 * holds the objective: cages, a named butcher, or the larder racks. Same seed, same room.
 */
import type { Block, BlockKind, GameMap, Ledge, Npc, Road, Round, RoundKind, Theme, Water } from './arena.js';
import { houseSeed } from './houses.js';
import type { Job, PlaceKind } from './jobs.js';
import { WOOD, type PropKind } from './props.js';
import { Rng } from './rng.js';
import { rollBackline } from './roster.js';

export interface Foe { kind: 'scrapper' | 'butcher'; x: number; y: number; hp?: number; name?: string; bow?: boolean; z?: number; awake?: boolean; feeding?: boolean; variant?: 'looter' | 'lunger' | 'heavy' | 'stoker' | 'shield' | 'hexer' | 'drummer' }
/** Which way the party went at a fork. */
export type RoadId = Road['road'];
export interface RoomPlan { map: GameMap; foes: Foe[]; props: { kind: PropKind; x: number; y: number }[]; chests: { x: number; y: number; chained?: boolean }[] }

/** A run room: big enough to explore before the way on; you come in at the bottom, leave at the top. */
export const ROOM = { w: 28, h: 24 };
const W = ROOM.w, H = ROOM.h, MID = W / 2, SPAWN = { x: MID, y: H - 2 }, EXIT = { x: MID - 1, y: 0, w: 2, h: 0.9 };

export const THEMES: Record<PlaceKind, Theme> = {
  village: { floor: 'cobble', back: 'palisade', ambient: [0.24, 0.23, 0.32], moon: 0.55 },
  farm: { floor: 'dirt', back: 'palisade', ambient: [0.25, 0.24, 0.31], moon: 0.6 },
  field: { floor: 'wheat', back: 'trees', ambient: [0.26, 0.25, 0.33], moon: 0.7 },
  forest: { floor: 'grass', back: 'trees', ambient: [0.17, 0.19, 0.23], moon: 0.35 },
  mine: { floor: 'rock', back: 'rockface', ambient: [0.14, 0.13, 0.18], moon: 0 },
  river: { floor: 'grass', back: 'trees', ambient: [0.2, 0.22, 0.28], moon: 0.6 },
  marsh: { floor: 'mud', back: 'trees', ambient: [0.18, 0.2, 0.22], moon: 0.45 },
  ruins: { floor: 'flagstone', back: 'stone', ambient: [0.2, 0.19, 0.26], moon: 0.5 },
};

/** What each kind of place is furnished with. */
const KIT: Record<PlaceKind, { blocks: [BlockKind, number, number, number][]; rounds: [RoundKind, number, number][]; props: [PropKind, number][]; torches: boolean }> = {
  village: { blocks: [['house', 3.5, 2, 5]], rounds: [['well', 0.5, 1], ['stump', 0.3, 3], ['bush', 0.35, 4]], props: [['barrel', 5], ['crate', 3], ['oil', 1]], torches: true },
  farm: { blocks: [['barn', 5, 3, 2], ['fence', 3.5, 0.35, 4], ['house', 3.5, 2, 1]], rounds: [['hay', 0.6, 6], ['bush', 0.35, 2]], props: [['barrel', 3], ['crate', 3], ['table', 1], ['oil', 1]], torches: true },
  field: { blocks: [['fence', 3.5, 0.35, 3]], rounds: [['hay', 0.6, 6], ['stump', 0.3, 3], ['tree', 0.6, 2]], props: [['crate', 2], ['barrel', 2]], torches: false },
  forest: { blocks: [], rounds: [['tree', 0.6, 9], ['pine', 0.5, 8], ['stump', 0.3, 3], ['bush', 0.35, 5], ['rock', 0.5, 2]], props: [['crate', 2], ['oil', 1]], torches: false },
  mine: { blocks: [['rockwall', 3.5, 1.2, 6]], rounds: [['support', 0.3, 7], ['rock', 0.5, 4]], props: [['crate', 3], ['oil', 3]], torches: true },
  river: { blocks: [], rounds: [['reed', 0.3, 10], ['tree', 0.6, 4], ['rock', 0.5, 3], ['bush', 0.35, 3]], props: [['crate', 2], ['barrel', 1]], torches: false },
  marsh: { blocks: [], rounds: [['reed', 0.3, 12], ['deadtree', 0.45, 6], ['stump', 0.3, 3]], props: [['crate', 1], ['oil', 1]], torches: false },
  ruins: { blocks: [['rubble', 2.6, 1.4, 4], ['wall', 3.5, 0.7, 4]], rounds: [['pillar', 0.45, 6], ['statue', 0.5, 2], ['stone', 0.35, 4]], props: [['crate', 2], ['barrel', 2], ['oil', 1]], torches: true },
};

/**
 * The water in a room. A river runs across the middle with two fords to wade; a marsh has bog pools
 * all about, a couple too deep to cross. Kept clear of the way in and out.
 */
function waters(kind: PlaceKind, rng: Rng, reserve: (x: number, y: number, r: number) => void): Water[] {
  const out: Water[] = [];
  if (kind === 'river') {
    const y = rng.range(H * 0.38, H * 0.52), h = 2.6, a = rng.range(3, MID - 4), b = rng.range(MID + 1, W - 6), fw = 3.2;
    out.push({ x: 0, y, w: a, h, deep: true }, { x: a, y, w: fw, h }, { x: a + fw, y, w: b - a - fw, h, deep: true }, { x: b, y, w: fw, h }, { x: b + fw, y, w: W - b - fw, h, deep: true });
    for (let x = 0.8; x < W; x += 1.6) reserve(x, y + h / 2, 1.5);
  } else if (kind === 'marsh') {
    for (let i = 0; i < 6; i++) {
      const w = rng.range(2.2, 4), h = rng.range(1.4, 2.4), x = rng.range(1, W - 1 - w), y = rng.range(5, H - 5 - h), deep = i < 2 && w < 3.2;
      if (Math.abs(x + w / 2 - MID) < w / 2 + 1.6 && deep) continue;
      out.push({ x, y, w, h, deep }), reserve(x + w / 2, y + h / 2, Math.max(w, h) / 2 + 0.2);
    }
  }
  return out;
}

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
    Math.hypot(x - SPAWN.x, y - SPAWN.y) > r + 2.4 && Math.hypot(x - MID, y - 0.5) > r + 2.4 && Math.abs(x - MID) > r + 1.3 &&
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
  const roads: Road[] | undefined = fork ? (['high', 'low'] as RoadId[]).map((r, i) => ({ road: r, label: ROADS[r].label, area: { x: i ? W - 5 : 3, y: 0, w: 2, h: 0.9 } })) : undefined;
  for (const r of roads ?? []) spots.push({ x: r.area.x + 1, y: 0.8, r: 1.4 });
  const water = waters(kind, rng, (x, y, r) => spots.push({ x, y, r }));
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
  const cagesAt = ledges.length ? [0, 1, 2].map(() => spot(0.6, 2, H / 2 + 1)).filter(Boolean) as { x: number; y: number }[] : [[4, 2.2], [W - 4, 2.2], [MID, 2.8]].map(([x, y]) => ({ x, y }));
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
  // Goblins at their fires: a band or two by each, at rest until they see you. The first room is all
  // small ones; butchers come deeper in.
  const fires = [spot(0.35, 3, H - 7), spot(0.35, 3, H / 2)].filter(Boolean) as { x: number; y: number }[];
  const braziers = fires.map((f) => ({ ...f, r: 0.35 }));
  const ruin = job.place.ruin;
  const n = Math.max(2, Math.min(10, 4 + ruin + index + (road === 'low' ? 2 : road === 'high' ? -2 : 0)));
  for (let i = 0; i < n; i++) {
    const f = fires[i % Math.max(1, fires.length)];
    let c: { x: number; y: number } | null = null;
    for (let t = 0; f && t < 12 && !c; t++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(1, 2.4), x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d;
      if (x > 1 && x < W - 1 && y > 1.5 && y < H - 4 && free(x, y, 0.4)) (c = { x, y }), spots.push({ ...c, r: 0.4 });
    }
    c ??= spot(0.4, 1.5, H - 6);
    if (c) foes.push({ kind: 'scrapper', ...c });
  }
  // Often: a heap of the dead and goblins at it, too busy eating to look up till you're close.
  const dead: Npc[] = [];
  if (rng.next() < 0.6) {
    const c = spot(1.1, 3, H - 6);
    if (c) {
      const look = ({ village: 'villager', farm: 'farmer', field: 'farmer', forest: 'soldier', mine: 'villager' } as Record<string, string>)[kind] ?? 'villager';
      dead.push({ x: c.x, y: c.y, name: '', talk: 'dead', look, pose: 'corpse' });
      if (rng.next() < 0.6) dead.push({ x: c.x + 0.6, y: c.y - 0.35, name: '', talk: 'dead', look: look === 'farmer' ? 'villager' : 'soldier2', pose: 'corpse' });
      const k = 1 + Math.floor(rng.next() * 3);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + rng.range(-0.4, 0.4);
        foes.push({ kind: 'scrapper', x: c.x + Math.cos(a) * 0.9, y: c.y + Math.sin(a) * 0.55, feeding: true });
      }
    }
  }
  // Not every small goblin is the same: spear-lungers (roll out of the line), brutes (big, slow blows
  // to parry or dodge) and shield-bearers (hit them from behind, or hard). More of them deeper in.
  for (const f of foes) {
    if (f.kind !== 'scrapper' || f.bow || f.feeding || f.name) continue;
    const r = rng.next(), deep = index * 0.05 + ruin * 0.04;
    if (r < 0.14 + deep) f.variant = 'lunger';
    else if (r < 0.26 + deep * 2 && ruin >= 1) f.variant = 'shield';
    else if (r < 0.33 + deep * 2.5 && index >= 1) f.variant = 'heavy';
  }
  if (final && (obj === 'hunt' || obj === 'story')) foes.push({ kind: 'butcher', x: MID, y: 4.5, hp: obj === 'story' ? 560 : 420, name: job.boss });
  if (index >= 1 && ruin >= 2) foes.push({ kind: 'butcher', x: fires[0]?.x ?? MID, y: (fires[0]?.y ?? 6) - 1.2 });
  if (final && ruin >= 2 && obj !== 'hunt' && obj !== 'story') foes.push({ kind: 'butcher', x: fires[1]?.x ?? MID, y: (fires[1]?.y ?? 5) - 1.2 });
  // The back of the pack: now and then a hexer or a drummer among them (shared/roster.ts).
  rollBackline(foes, job, index);
  // Chests: sometimes one in a room, always one in the last; on a deep job, a chained one by the named butcher.
  const chests: RoomPlan['chests'] = [];
  if (final || rng.next() < 0.4) {
    const c = spot(0.6, 2.5, H - 5);
    if (c) chests.push(c);
  }
  if (final && job.deep) chests.push({ x: MID + 2.2, y: 3.2, chained: true });
  // Each house's look outside comes from the same seed as its inside.
  blocks.forEach((b, i) => b.door && (b.look = houseSeed(job, index, i)));
  const night = job.twist === 'night', t = THEMES[kind];
  const theme: Theme = night ? { ...t, ambient: t.ambient.map((v) => v * 0.65) as Theme['ambient'], moon: t.moon * 0.5 } : t;
  const map: GameMap = {
    name: job.place.name.toUpperCase(), w: W, h: H, wallFace: 3, rounds, blocks, braziers,
    torches: kit.torches ? [{ x: 4.5, y: -1.6 }, { x: MID - 4, y: -1.6 }, { x: MID + 4, y: -1.6 }, { x: W - 4.5, y: -1.6 }] : [], hero: { ...SPAWN }, exit: roads ? null : { ...EXIT }, theme,
    ledges: ledges.length ? ledges : undefined, roads, npcs: dead.length ? dead : undefined, water: water.length ? water : undefined,
  };
  return { map, foes, props, chests };
}
