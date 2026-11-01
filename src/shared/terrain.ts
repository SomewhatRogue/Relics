/**
 * Run rooms, laid out from the job's seed: each place kind has its own floor, walls, light, cover and
 * furniture (cottages and a well in a village, a barn and hay on a farm, trees in a forest, rock walls
 * and pit props in a mine). Ruin and the room's place in the run set how many goblins. The last room
 * holds the objective: cages, a named butcher, or the larder racks. Same seed, same room.
 */
import type { Block, BlockKind, GameMap, Round, RoundKind, Theme } from './arena';
import type { Job, PlaceKind } from './jobs';
import type { PropKind } from './props';
import { Rng } from './rng';

export interface Foe { kind: 'scrapper' | 'butcher'; x: number; y: number; hp?: number; name?: string }
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

export function planRoom(job: Job, index: number): RoomPlan {
  const rng = new Rng(job.seed * 31 + index * 7 + 1), kind = job.place.kind, kit = KIT[kind], final = index === job.rooms - 1;
  const rounds: Round[] = [], blocks: Block[] = [], spots: { x: number; y: number; r: number }[] = [];
  const free = (x: number, y: number, r: number) =>
    Math.hypot(x - SPAWN.x, y - SPAWN.y) > r + 2.4 && Math.hypot(x - 9, y - 0.5) > r + 2.4 && Math.abs(x - 9) > r + 1.3 &&
    spots.every((s) => Math.hypot(s.x - x, s.y - y) > s.r + r + 0.9);
  const spot = (r: number, y0 = 2.2, y1 = H - 3): { x: number; y: number } | null => {
    for (let t = 0; t < 50; t++) {
      const x = rng.range(1.4 + r, W - 1.4 - r), y = rng.range(y0 + r, y1 - r);
      if (free(x, y, r)) return spots.push({ x, y, r }), { x, y };
    }
    return null;
  };
  // The objective first (it must fit), then buildings and rock walls, round things, furniture.
  const props: RoomPlan['props'] = [];
  const obj = final ? job.objective : 'clear';
  if (obj === 'rescue' || obj === 'story') for (const [x, y] of [[3, 2.2], [15, 2.2], [9, 2.6]].slice(0, obj === 'story' ? 3 : 2)) props.push({ kind: 'cage', x, y }), spots.push({ x, y, r: 0.6 });
  if (obj === 'larder') for (let i = 0; i < 3; i++) {
    const c = spot(0.5, 1.5, H / 2);
    if (c) props.push({ kind: 'larder', ...c });
  }
  for (const [k, w, h, n] of kit.blocks) for (let i = 0; i < n; i++) {
    const r = Math.hypot(w, h) / 2, c = spot(r);
    if (c) blocks.push({ x: c.x - w / 2, y: c.y - h / 2, w, h, kind: k });
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
  const ruin = job.place.ruin, foes: Foe[] = [];
  const n = Math.min(6, 2 + ruin + index);
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
    torches: kit.torches ? [{ x: 4.5, y: -1.6 }, { x: 13.5, y: -1.6 }] : [], hero: { ...SPAWN }, exit: { ...EXIT }, theme,
  };
  return { map, foes, props };
}
