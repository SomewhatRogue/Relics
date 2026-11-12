/**
 * Instance puzzles: pushing tubs (docs/design/instance-puzzles.md; the grid shared/puzzle.ts, numbers
 * shared/instancetune.ts PUZZLE). The room decides it, as it does everything:
 * - Hold the stick into a tub, touching it, PUZZLE.push s, straight along the grid, and it slides a square that way,
 *   if that square is on the grid, not a wall, and has no tub (a tub's never pulled, only pushed).
 * - GRAB by the lever puts every tub back where it started (a stuck one is never a dead run).
 * - Every plate with a tub on it: solved, and the stretch's gate is ready (sim/stretches.ts). The tubs stay put.
 * - Two or more heroes up near the grid and it unsolved: goblins out of the drift (`from`) while you work it, a few
 *   at once (PUZZLE.wave). Alone, just the puzzle.
 * The tubs are props, so a friend's screen and a handed-on room have them; who's pushing and the wave's clock are
 * kept here only (they start over after a handover).
 */
import type { GameMap } from '../shared/arena';
import { centre, cellAt, isWall, onGrid, solved, type Cell, type TubPuzzle } from '../shared/puzzle';
import { HERO, INSTANCE, PUZZLE, TICK } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { players } from './party';
import { NO_INTENT, type Enemy, type Hero, type Intent, type Prop } from './types';

interface State { push: Map<string, { tub: number; dx: number; dy: number; t: number }>; seen: Map<string, number>; next: number[]; waves: Enemy[][]; done: boolean[] }
const states = new WeakMap<GameMap, State>();
const up = (h: Hero) => h.act !== 'down' && h.act !== 'roll' && !h.out && (h.z ?? 0) === 0;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
/** A puzzle's tubs (props on its grid). */
const tubsOf = (p: TubPuzzle, props: Prop[]) => props.filter((q) => q.kind === 'tub' && !q.broken && onGrid(p, cellAt(p, q.x, q.y)));

export function stepTubs(w: World, map: GameMap, intents: Map<string, Intent>, spawn: (x: number, y: number) => Enemy): void {
  const ps = map.puzzles;
  if (!ps?.length) return;
  let s = states.get(map);
  if (!s) states.set(map, (s = { push: new Map(), seen: new Map(), next: ps.map(() => -1), waves: ps.map(() => []), done: ps.map(() => false) }));
  // GRAB pressed this tick, by whom.
  const pressed = new Set<string>();
  for (const h of players(w.heroes)) {
    const prev = s.seen.get(h.id);
    s.seen.set(h.id, h.seen.grab);
    if (prev !== undefined && prev !== h.seen.grab && up(h)) pressed.add(h.id);
  }
  ps.forEach((p, i) => stepOne(w, p, i, s!, intents, pressed, spawn));
}

function stepOne(w: World, p: TubPuzzle, i: number, s: State, intents: Map<string, Intent>, pressed: Set<string>, spawn: (x: number, y: number) => Enemy): void {
  const tubs = tubsOf(p, w.props);
  // Sliding ones go on to their square; the rest held square on theirs (bodies lean on them).
  for (const t of tubs) {
    if (!t.to) {
      Object.assign(t, centre(p, cellAt(p, t.x, t.y)), { kvx: 0, kvy: 0 });
      continue;
    }
    const dx = t.to.x - t.x, dy = t.to.y - t.y, d = Math.hypot(dx, dy), go = PUZZLE.speed * TICK;
    if (d <= go) {
      Object.assign(t, { x: t.to.x, y: t.to.y, to: undefined, kvx: 0, kvy: 0 });
      if (p.plates.some((c) => same(c, cellAt(p, t.x, t.y)))) w.ev.push({ k: 'tub', what: 'plate', x: t.x, y: t.y });
    } else Object.assign(t, { x: t.x + (dx / d) * go, y: t.y + (dy / d) * go, kvx: 0, kvy: 0 });
  }
  const done = !tubs.some((t) => t.to) && solved(p, w.props);
  if (done && !s.done[i]) {
    s.done[i] = true;
    const m = centre(p, [Math.floor(p.cols / 2), Math.floor(p.rows / 2)]);
    w.ev.push({ k: 'tub', what: 'solved', x: m.x, y: m.y });
  }
  if (s.done[i]) return;
  // The lever: every tub back where it started.
  const by = players(w.heroes).find((h) => pressed.has(h.id) && Math.hypot(h.x - p.lever.x, h.y - p.lever.y) <= PUZZLE.lever);
  if (by) {
    [...tubs].sort((a, b) => a.id - b.id).forEach((t, n) => p.tubs[n] && Object.assign(t, centre(p, p.tubs[n]), { to: undefined }));
    w.ev.push({ k: 'tub', what: 'reset', x: p.lever.x, y: p.lever.y, by: by.id });
    for (const h of w.heroes) s.push.delete(h.id);
    return;
  }
  // Pushing: the stick held straight into a tub, touching it.
  for (const h of players(w.heroes)) {
    const it = intents.get(h.id) ?? NO_INTENT, mag = Math.hypot(it.mx, it.my);
    const dir: [number, number] | null = !up(h) || mag < 0.5 ? null : Math.abs(it.mx) >= 0.75 * mag ? [Math.sign(it.mx), 0] : Math.abs(it.my) >= 0.75 * mag ? [0, Math.sign(it.my)] : null;
    const t = dir && tubs.find((q) => {
      if (q.to) return false;
      const ax = q.x - h.x, ay = q.y - h.y, along = ax * dir[0] + ay * dir[1], side = Math.abs(ax * dir[1] - ay * dir[0]);
      return along > 0 && along <= HERO.radius + q.radius + PUZZLE.touch && side < p.cell * 0.45;
    });
    if (!dir || !t) {
      s.push.delete(h.id);
      continue;
    }
    const was = s.push.get(h.id), held = was && was.tub === t.id && was.dx === dir[0] && was.dy === dir[1] ? was.t + TICK : TICK;
    if (held < PUZZLE.push - 1e-6) {
      s.push.set(h.id, { tub: t.id, dx: dir[0], dy: dir[1], t: held });
      continue;
    }
    s.push.delete(h.id);
    const from = cellAt(p, t.x, t.y), to: Cell = [from[0] + dir[0], from[1] + dir[1]];
    const taken = tubs.some((q) => q !== t && (same(cellAt(p, q.x, q.y), to) || (q.to && same(cellAt(p, q.to.x, q.to.y), to))));
    if (!onGrid(p, to) || isWall(p, to) || taken) continue;
    t.to = centre(p, to);
    w.ev.push({ k: 'tub', what: 'push', x: t.x, y: t.y, by: h.id });
  }
  // Two or more at it: goblins out of the drift while it's worked, a few at once.
  const near = players(w.heroes).filter((h) => h.act !== 'down' && !h.out && h.x > p.x - PUZZLE.near && h.x < p.x + p.cols * p.cell + PUZZLE.near && h.y > p.y - PUZZLE.near && h.y < p.y + p.rows * p.cell + PUZZLE.near);
  if (near.length < 2) return;
  if (s.next[i] < 0) s.next[i] = w.now + PUZZLE.wave.first;
  s.waves[i] = s.waves[i].filter((e) => !isDead(e));
  if (w.now < s.next[i]) return;
  s.next[i] = w.now + PUZZLE.wave.every;
  if (s.waves[i].length >= PUZZLE.wave.most) return;
  const e = spawn(p.from.x, p.from.y), T = INSTANCE.tough;
  Object.assign(e, { alert: true, fierce: true, hp: Math.round(e.maxHp * T.hp), maxHp: Math.round(e.maxHp * T.hp), harm: +((e.harm ?? 1) * T.harm).toFixed(3) });
  s.waves[i].push(e);
}

/** A puzzle still to solve: a plate without a tub, or one still sliding. */
export const unsolvedAt = (map: GameMap, props: Prop[], p: TubPuzzle) => !solved(p, props) || tubsOf(p, props).some((t) => t.to);
/** A stretch's puzzle still to solve (none if it has none). */
export const unsolved = (map: GameMap, props: Prop[], n: number | undefined) => {
  const p = n === undefined ? undefined : map.puzzles?.[n];
  return !!p && unsolvedAt(map, props, p);
};
