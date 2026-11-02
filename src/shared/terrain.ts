/**
 * Run rooms. Each place is laid out to its own plan (shared/sites.ts: a village round its green, a
 * shanty, a better-off street, a manor's grounds, a wood, a mine...), the same every time you go there;
 * the job's seed puts the objective, the goblins and the chests into it. Ruin and the room's place in
 * the run set how many goblins. The last room holds the objective: cages, a named butcher, or the
 * larder racks. Same seed, same room.
 */
import type { Block, BlockKind, GameMap, Ledge, Npc, Road, Round, RoundKind, Theme, Water } from './arena.js';
import { settle } from './houses.js';
import type { Job, PlaceKind } from './jobs.js';
import type { PropKind } from './props.js';
import { layOut, placeSeed, siteWater } from './sites.js';
import { siteClear, wooden, type Site } from './sitekit.js';
import { Rng } from './rng.js';
import { rollBackline } from './roster.js';
import { rollSpiders } from './nests.js';
import { lightFor, timeOf } from './timeofday.js';

/** `wave`: a nest's spiders a wave (more in a party; shared/nests.ts). */
export interface Foe { kind: 'scrapper' | 'butcher' | 'spider' | 'brood' | 'nest'; wave?: number; x: number; y: number; hp?: number; name?: string; bow?: boolean; z?: number; awake?: boolean; feeding?: boolean; variant?: 'looter' | 'lunger' | 'heavy' | 'stoker' | 'shield' | 'hexer' | 'drummer' }
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

/** Which places have torches on their back wall. */
const KIT: Record<PlaceKind, { torches: boolean }> = {
  village: { torches: true }, farm: { torches: true }, field: { torches: false }, forest: { torches: false },
  mine: { torches: true }, river: { torches: false }, marsh: { torches: false }, ruins: { torches: true },
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

/** A run's fork: the middle room of a three-room job has two ways out. */
export const isFork = (job: Job, index: number) => job.rooms >= 3 && index === job.rooms - 2;
export const ROADS: Record<RoadId, { label: string; text: string }> = {
  high: { label: 'THE HIGH ROAD', text: 'archers on the heights, fewer below' },
  low: { label: 'THE LOW ROAD', text: 'more goblins, someone caged' },
};

export function planRoom(job: Job, index: number, road?: RoadId): RoomPlan {
  const rng = new Rng(job.seed * 31 + index * 7 + 1), kind = job.place.kind, kit = KIT[kind], final = index === job.rooms - 1;
  const rounds: Round[] = [], blocks: Block[] = [], spots: { x: number; y: number; r: number }[] = [];
  let site: Site | null = null;
  const free = (x: number, y: number, r: number, skip?: object) =>
    Math.hypot(x - SPAWN.x, y - SPAWN.y) > r + 2.4 && Math.hypot(x - MID, y - 0.5) > r + 2.4 && Math.abs(x - MID) > r + 1.3 &&
    spots.every((s) => s === skip || Math.hypot(s.x - x, s.y - y) > s.r + r + 0.9) && (!site || siteClear(site, x, y, r));
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
  const own = siteWater(job, index, W, H);
  for (const w of own ?? []) spots.push({ x: w.x + w.w / 2, y: w.y + w.h / 2, r: Math.max(w.w, w.h) / 2 + 0.2 });
  const water = own ?? waters(kind, new Rng(placeSeed(job.place, index) + 2), (x, y, r) => spots.push({ x, y, r }));
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
  // The place itself, to its plan, round the ways in and out, the raised ground, the water and the job's spots.
  site = layOut(job, index, { w: W, h: H, fork, water }, roads ? roads.map((r) => r.area) : [EXIT], ledges.flatMap((l) => [l, ...l.ramps]), [...spots], SPAWN);
  blocks.push(...site.blocks), rounds.push(...site.rounds), props.push(...site.props);
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
  // In the wilder places, sometimes spiders: nests that hatch waves, and deep in, a brood mother (shared/nests.ts).
  rollSpiders(foes, job, index, spot, H, W);
  // Each house's look and fate outside come from the same seed as its inside.
  const spill = settle(job, index, blocks);
  // Lit for the job's hour (shared/timeofday.ts): broad day, a misty dawn, a long dusk, or night.
  const theme: Theme = lightFor(THEMES[kind], kind, timeOf(job));
  const map: GameMap = {
    name: job.place.name.toUpperCase(), w: W, h: H, wallFace: 3, rounds, blocks, braziers,
    torches: kit.torches ? [{ x: 4.5, y: -1.6 }, { x: MID - 4, y: -1.6 }, { x: MID + 4, y: -1.6 }, { x: W - 4.5, y: -1.6 }] : [], hero: { ...SPAWN }, exit: roads ? null : { ...EXIT }, theme,
    ledges: ledges.length ? ledges : undefined, roads, npcs: dead.length ? dead : undefined, water: water.length ? water : undefined,
    marks: spill.length ? spill : undefined,
  };
  // The place's own ground, floor and back wall.
  Object.assign(map, { theme: { ...map.theme, floor: site.floor, back: site.back ?? map.theme.back }, soil: site.soil, marks: [...site.marks, ...spill] });
  return { map, foes, props, chests };
}
