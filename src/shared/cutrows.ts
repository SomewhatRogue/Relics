/**
 * The Open Cut, area 1: THE ROWS (docs/plans/atlas.md, Rakehead). The miners' rows up the hill, their
 * doors unbroken because the miners walked out roped. You come in at the spoil heaps by the bottom of
 * the street, where some of the hungry eat at their fire; up the street a line of roped diggers is being
 * driven for the top of the village (catch it before it's gone over the hill); a cage at either side of
 * the rows, each kept; three walking a round across the street; and at the top, in the square by the
 * well, the rest of them. THE DROVER drives the line, in front of it (free the line and it has nothing to stand
 * behind); the gate up out of the square opens when it's dead.
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, newKit, patch, path, prop, round, scatter, mark, type P } from './expedkit.js';
import type { Pt } from './spine.js';
import { atArc } from './scenes4.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body, keeper, pack } from './cutkit.js';
import { CUT_AREAS, CUT_NAMES } from './opencutwords.js';

/** Narrow enough that a phone (about 12 tiles across) sees the street and both rows. */
export const ROWS = { w: 16, h: 44 };
/** Where each scene is (tests and the spec read these). */
export const ROWS_AT = {
  fire: { x: 5.4, y: 36.5 }, line: { x: 8, y: 31 }, cageL: { x: 4.9, y: 28.2 }, cageR: { x: 11.1, y: 19.2 },
  round: 14.6, square: { x: 8, y: 5.6 }, well: { x: 4.2, y: 6.6 }, chest: { x: 2.2, y: 3.2 },
};

export function rowsPlan(job: Job): RoomPlan {
  const { w, h } = ROWS, A = ROWS_AT, k = newKit(new Rng(job.seed * 4813 + 11)), mid = w / 2;
  // The ground: the street trodden up the middle, the square cobbled, spoil at the foot.
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'cobble', 1, 1.6, w - 2, 9.4);
  path(k, 'earth', [{ x: mid, y: h }, { x: mid, y: 10 }], 1.5);
  // The rows: slate-roofed cottages either side, doors shut.
  // (Each its own look from the seed, standing: no door to go in by.)
  const home = (x: number, y: number) => block(k, 'house', x, y, 3.4, 2.5, { look: (job.seed * 53 + k.blocks.length * 17 + 3) >>> 0, fate: 'standing' });
  for (const y of [11.6, 16.2, 20.8, 25.4, 30]) {
    home(0.5, y), home(w - 3.9, y);
    if (y !== 16.2 && k.rng.next() < 0.6) prop(k, k.rng.next() < 0.5 ? 'barrel' : 'crate', w - 4.3, y + 2.1);
  }
  // Spoil heaps at the foot of the street, and the well and a fire basket in the square.
  for (const [x, y] of [[1.6, 40.6], [3, 42.4], [14.2, 39.4], [14.6, 42], [12.4, 41.8]] as [number, number][]) round(k, 'rock', x, y, 0.55 + k.rng.range(0, 0.25));
  round(k, 'well', A.well.x, A.well.y, 0.6);
  k.braziers.push({ x: 12.4, y: 4.6, r: 0.32 }, { x: A.fire.x, y: A.fire.y, r: 0.34, wild: true });
  scatter(k, 2, ['bush', 'stump'], 1, 33, w - 1, 38, [0.3, 0.42]);

  // 1. At their fire at the foot of the street, eating.
  body(k, A.fire.x - 1, A.fire.y + 0.8, 'villager'), body(k, A.fire.x + 1.1, A.fire.y - 0.6, 'villager');
  mark(k, 'blood', A.fire.x - 1.6, A.fire.y + 0.4, 1.4, 0.8);
  pack(k, 1, A.fire, ['fodder', 'fodder', 'lunger'], 1.5, { feeding: true });

  // 2. The roped line, driven up the street for the top of the village: THE DROVER in front, a guard behind.
  const pts: Pt[] = [[A.line.x, A.line.y], [mid, 20], [mid, 10], [mid + 1.8, 6.5], [mid, 1.4]], n = 3, front = 1.4 + (n - 1) * 0.8;
  for (const [s, off] of [[front + 1, 0.55], [0.4, -0.55]] as [number, number][]) {
    const p = atArc(pts, s), at = { x: p.x - p.dy * off, y: p.y + p.dx * off };
    if (s > 1) Object.assign(keeper(k, 2, at, 'heavy', CUT_NAMES.drover, 380), { task: { k: 'escort', s, off }, drives: true });
    else k.foes.push({ kind: 'scrapper', ...at, task: { k: 'escort', s, off }, pack: 2 });
  }
  mark(k, 'drag', mid - 0.6, 10, 1.2, A.line.y - 10);

  // 3 and 4. A cage either side of the rows, each kept.
  prop(k, 'cage', A.cageL.x, A.cageL.y), prop(k, 'cage', A.cageR.x, A.cageR.y);
  pack(k, 3, { x: A.cageL.x + 1.4, y: A.cageL.y - 1 }, ['hexer', 'fodder', 'fodder'], 1);
  pack(k, 4, { x: A.cageR.x - 1.4, y: A.cageR.y - 1 }, ['shield', 'archer', 'fodder'], 1);

  // 5. Three walking a round across the street.
  const beat: Pt[] = [[4.6, A.round], [w - 4.6, A.round]];
  for (let i = 0; i < 3; i++) k.foes.push({ kind: 'scrapper', x: 5.4 + i * 1.1, y: A.round, task: { k: 'patrol', pts: beat, i: 1 }, pack: 5 });

  // 6. The square: the rest of them by the well, the gate behind them.
  pack(k, 6, A.square, ['shield', 'hexer', 'fodder', 'fodder', 'archer'], 2);
  k.chests.push({ ...A.chest });
  return areaPlan(k, job, { name: CUT_AREAS[0], w, h, kind: 'village', torches: [3.4, w - 3.4] }, { led: { pts, n, hold: true } });
}

/** (For the tests: every scene's spot is inside the area.) */
export const rowsSpots = (): P[] => Object.values(ROWS_AT).filter((v): v is P => typeof v === 'object');
