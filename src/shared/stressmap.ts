/**
 * Step 0 of docs/design/open-cut-map.md: a stress map to measure one big instance map before building on it. About
 * twice Fenmere's size: a path that winds back and forth down the map between rock walls (each wall's way through
 * at the other end from the last), trees and rock thick along the walls, and `goblins` in packs of three along the
 * path, each led by an elite. Each row is a stretch with a gate in its wall (sim/stretches.ts). Dev only (`?stress=1`, tests/stress.test.ts); never posted.
 */
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, pack } from './cutkit.js';
import type { Stretch } from './arena.js';

export const STRESS = { w: 150, h: 150, rows: 9, goblins: 150, trees: 2600, gap: 8 };

export function stressPlan(job: Job): RoomPlan {
  const S = STRESS, k = newKit(new Rng(job.seed * 7919 + 1)), rng = k.rng, band = S.h / S.rows;
  // Walls across, every `band`, the way through at alternate ends.
  for (let i = 1; i < S.rows; i++) {
    const y = i * band, left = i % 2 === 1;
    k.blocks.push({ kind: 'rockwall', x: left ? S.gap : 0, y: y - 1, w: S.w - S.gap, h: 2 });
  }
  // Trees and rock thick along each wall, off the middle of the path.
  for (let t = 0; t < S.trees; t++) {
    const row = rng.int(S.rows), y0 = row * band, side = rng.next() < 0.5, y = side ? y0 + rng.range(1.4, 3.6) : y0 + band - rng.range(1.6, 3.8);
    k.rounds.push({ kind: rng.pick(['tree', 'pine', 'rock', 'bush', 'deadtree']), x: rng.range(S.gap + 1, S.w - S.gap - 1), y, r: rng.range(0.35, 0.65) });
  }
  // Packs of three along the path, row by row.
  const per = Math.ceil(S.goblins / 3 / S.rows);
  let id = 1;
  for (let row = 0; row < S.rows; row++) {
    for (let p = 0; p < per && (id - 1) * 3 < S.goblins; p++) {
      const x = S.gap + 4 + ((p + 0.5) / per) * (S.w - 2 * S.gap - 8), y = row * band + band / 2;
      pack(k, id++, { x, y }, ['fodder', 'shield', 'archer'], 1.2);
    }
  }
  // Stretches (sim/stretches.ts): a row each, from the bottom; each row's way through its wall shut by a gate, the
  // row's first pack's leader a named WARDEN (a dev label) to kill before it opens.
  const stretches: Stretch[] = [];
  for (let st = 0; st < S.rows; st++) {
    const row = S.rows - 1 - st, i = row, name = `WARDEN ${st + 1}`;
    const lead = k.foes.find((f) => f.pack && Math.abs(f.y - (row * band + band / 2)) < band / 2 && f.elite?.length && !f.name);
    if (lead) Object.assign(lead, { name, hp: 300 });
    if (i === 0) {
      stretches.push({ name: `ROW ${st + 1}`, keep: lead ? [name] : [] });
      break;
    }
    const left = i % 2 === 1, gx = left ? 0 : S.w - S.gap, y = i * band;
    const gate = k.blocks.length;
    k.blocks.push({ kind: 'gate', x: gx, y: y - 1, w: S.gap, h: 2 });
    stretches.push({ name: `ROW ${st + 1}`, keep: lead ? [name] : [], gate, at: { x: gx, y: y + 1, w: S.gap, h: 3 }, check: { x: gx + S.gap / 2, y: y - 3 } });
  }
  const plan = areaPlan(k, job, { name: 'STRESS', w: S.w, h: S.h, kind: 'village' }, { stretches });
  // In at the bottom of the last row, at the end its wall leaves open.
  plan.map.hero = { x: S.rows % 2 ? S.w - 4 : 4, y: S.h - band / 2 };
  return plan;
}
