/**
 * The Open Cut as one map (docs/design/open-cut-map.md step 2): the places built by hand (shared/cutrows.ts,
 * cutwinding.ts, cutincline.ts, cutwashing.ts) set one above another, walked from the bottom up, each its own stretch
 * (sim/stretches.ts). Between two places: a wall across with a gate in it where the place below had its way out,
 * then a lull, a quiet stretch of path with no goblins in it, to the next place's foot. Rock either side of a
 * place narrower than the map, and of the lull's path. The last place's way out is the map's, on to the Haulier.
 *
 * Each place is built as it was on its own and moved into place (`shift`): its packs renumbered by place so two
 * places' packs never count as one.
 */
import type { Block, GameMap, Stretch } from './arena.js';
import type { P } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';

/** The map's width; a lull's length and its path's width; a gate's width. */
export const CUT = { w: 28, lull: 9, path: 6, gate: 3.2, wall: 1.4 };

export interface CutPlace {
  plan: (job: Job) => RoomPlan;
  /** The named ones to kill before its gate opens, or packs (by their number in the place) if it has none. */
  keep: string[];
  packs?: number[];
}

/** Where each place sits on the map, from the bottom (tests read this). */
export interface Laid { x0: number; y0: number; w: number; h: number }

/** One place's plan moved by (dx, dy) into `into`, its packs renumbered by `pk`. */
function shift(p: RoomPlan, dx: number, dy: number, pk: number, into: { map: GameMap; plan: RoomPlan }): void {
  const m = p.map, M = into.map, mv = <T extends { x: number; y: number }>(o: T): T => ({ ...o, x: o.x + dx, y: o.y + dy });
  M.rounds.push(...m.rounds.map(mv));
  M.blocks.push(...m.blocks.map(mv));
  M.braziers.push(...m.braziers.map(mv));
  M.torches.push(...m.torches.map(mv));
  M.water!.push(...(m.water ?? []).map(mv));
  M.soil!.push(...(m.soil ?? []).map(mv));
  M.marks!.push(...(m.marks ?? []).map(mv));
  M.npcs!.push(...(m.npcs ?? []).map(mv));
  if (m.led) M.led = { ...m.led, pts: m.led.pts.map(([x, y]) => [x + dx, y + dy]) };
  if (m.rail) M.rail = { y: m.rail.y + dy, x0: m.rail.x0 + dx, x1: m.rail.x1 + dx };
  if (m.ledges) (M.ledges ??= []).push(...m.ledges.map((l) => ({ ...mv(l), ramps: l.ramps.map(mv) })));
  if (m.puzzles) (M.puzzles ??= []).push(...m.puzzles.map((q) => ({ ...mv(q), lever: mv(q.lever), from: mv(q.from) })));
  if (m.lamps) (M.lamps ??= []).push(...m.lamps.map(mv));
  if (m.gear) M.gear = mv(m.gear);
  if (m.adits) (M.adits ??= []).push(...m.adits.map(mv));
  if (m.incline) M.incline = { lanes: m.incline.lanes.map((x) => x + dx), y0: m.incline.y0 + dy, y1: m.incline.y1 + dy };
  into.plan.foes.push(...p.foes.map((f) => ({ ...mv(f), ...(f.pack ? { pack: f.pack + pk } : {}), ...(f.task?.k === 'patrol' ? { task: { ...f.task, pts: f.task.pts.map(([x, y]) => [x + dx, y + dy] as [number, number]) } } : {}) })));
  into.plan.props.push(...p.props.map(mv));
  into.plan.chests.push(...p.chests.map(mv));
}

const rock = (x: number, y: number, w: number, h: number): Block => ({ kind: 'rockwall', x, y, w, h });

/**
 * The whole map from its places, bottom first. Returns the plan and where each place was laid. `fork`: the map
 * ends in a fork yard (a last stretch with no goblins) with these two ways out, left and right (sim/fork.ts).
 */
export function cutMap(job: Job, places: CutPlace[], fork?: { name: string; ways: [string, string] }): { plan: RoomPlan; laid: Laid[] } {
  if (fork) places = [...places, { plan: () => yardPlan(fork.name), keep: [] }];
  const plans = places.map((p) => p.plan(job)), W = CUT.w, L = CUT.lull;
  const H = plans.reduce((a, p) => a + p.map.h, 0) + (plans.length - 1) * L;
  const top = plans[plans.length - 1].map;
  const map: GameMap = {
    ...plans[0].map, name: 'THE OPEN CUT', w: W, h: H, rounds: [], blocks: [], braziers: [], torches: [], water: [], soil: [], marks: [], npcs: [],
    led: undefined, rail: undefined, lamps: undefined, puzzles: undefined, gear: undefined, adits: undefined, incline: undefined, ledges: undefined, stretches: [],
  };
  const plan: RoomPlan = { map, foes: [], props: [], chests: [] }, laid: Laid[] = [], into = { map, plan }, rng = new Rng(job.seed * 2909 + 7);
  let y = H;
  plans.forEach((p, i) => {
    const m = p.map, x0 = Math.round((W - m.w) / 2), y0 = y - m.h;
    const puzzles = map.puzzles?.length ?? 0;
    shift(p, x0, y0, i * 100, into);
    laid.push({ x0, y0, w: m.w, h: m.h });
    // Rock either side of a place narrower than the map.
    if (x0 > 0) map.blocks.push(rock(0, y0, x0, m.h), rock(x0 + m.w, y0, W - x0 - m.w, m.h));
    if (i === 0) map.hero = { x: m.hero.x + x0, y: m.hero.y + y0 };
    const st: Stretch = { name: m.name, keep: places[i].keep, ...(places[i].packs ? { packs: places[i].packs!.map((n) => n + i * 100) } : {}) };
    // A place with a puzzle: its gate waits on it (its first, the map's numbering).
    if (m.puzzles?.length) st.puzzle = puzzles;
    if (i < plans.length - 1) {
      // The wall across its top, the gate where its way out was; the lull above, to the next place's foot.
      const ex = m.exit!, gx = x0 + ex.x + ex.w / 2 - CUT.gate / 2, wy = y0 - CUT.wall;
      map.blocks.push(rock(0, wy, gx, CUT.wall), rock(gx + CUT.gate, wy, W - gx - CUT.gate, CUT.wall));
      st.gate = map.blocks.length;
      map.blocks.push({ kind: 'gate', x: gx, y: wy, w: CUT.gate, h: CUT.wall });
      st.at = { x: gx - 0.3, y: y0 + 0.1, w: CUT.gate + 0.6, h: 2.6 };
      st.check = { x: gx + CUT.gate / 2, y: wy - 2.2 };
      lull(map, rng, y0 - L, wy, W);
    }
    map.stretches!.push(st);
    y = y0 - L;
  });
  map.exit = { ...top.exit!, x: top.exit!.x + laid[laid.length - 1].x0, y: 0 };
  if (fork) {
    // Two ways out of the yard's back wall, left and right, the party's vote.
    const Y = laid[laid.length - 1], out = (x: number) => ({ x: Y.x0 + x, y: 0, w: 4, h: 1.4 });
    map.roads = [
      { area: out(1), road: 'high', label: fork.ways[0], vote: true },
      { area: out(Y.w - 5), road: 'low', label: fork.ways[1], vote: true },
    ];
    map.exit = map.roads[0].area;
  }
  return { plan, laid };
}

/** A lull: rock either side of a path up the middle, a body or two, a fire basket, a few stumps; no goblins. */
function lull(map: GameMap, rng: Rng, y0: number, y1: number, W: number): void {
  const half = CUT.path / 2, mid = W / 2;
  map.blocks.push(rock(0, y0, mid - half, y1 - y0), rock(mid + half, y0, W - mid - half, y1 - y0));
  map.soil!.push({ x: mid - half, y: y0, w: CUT.path, h: y1 - y0, mat: 'earth' });
  map.braziers.push({ x: mid + half - 0.7, y: y0 + (y1 - y0) * 0.45, r: 0.3, wild: true });
  for (let i = 0; i < 3; i++) map.rounds.push({ kind: rng.pick(['stump', 'rock', 'bush'] as const), x: mid - half + 0.6 + rng.range(0, 1.2) * (i % 2 ? 1 : 0) + (i % 2 ? CUT.path - 1.6 : 0), y: y0 + 1.5 + i * 2.2, r: 0.32 });
  map.npcs!.push({ x: mid - half + 1.2, y: y0 + (y1 - y0) * 0.7, name: '', talk: 'dead', look: 'villager', pose: 'corpse' });
}

/** Where (x, y) of place `i` lands on the map. */
export const onMap = (laid: Laid[], i: number, at: P): P => ({ x: at.x + laid[i].x0, y: at.y + laid[i].y0 });

/** The fork yard: an open yard behind the last place, a fire basket each side, its two ways out in the back wall (narrow, so a phone sees both). */
function yardPlan(name: string): RoomPlan {
  const w = 14, h = 12;
  const map = {
    name, w, h, wallFace: 3, rounds: [{ kind: 'rock' as const, x: w / 2, y: 4.2, r: 0.7 }], blocks: [], braziers: [{ x: 1.2, y: 4.2, r: 0.3, wild: true }, { x: w - 1.2, y: 4.2, r: 0.3, wild: true }],
    torches: [], water: [], soil: [{ mat: 'cobble' as const, x: 1, y: 0, w: w - 2, h }], marks: [], npcs: [],
    hero: { x: w / 2, y: h - 1.6 }, exit: { x: w / 2 - 1.3, y: 0, w: 2.6, h: 0.9 },
  } as unknown as GameMap;
  return { map, foes: [], props: [], chests: [] };
}
