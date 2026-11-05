/**
 * Where spiders turn up: in the wilder places (forest, marsh, mine, ruins), never in villages, farms,
 * fields or by the river, and never under Wickhold. More often deeper into a job, on worse ground and
 * on deep jobs. A room that has them gets a nest or two (two spiders resting on each) and loses a few
 * of its plain goblins to make room; from the third room on (the second on a deep job) a brood mother
 * may be waiting. Rolled on its own seeded stream, so the rest of a room is as it always was; placed
 * through the room's own `spot`, after everything else.
 */
import type { Job, PlaceKind } from './jobs.js';
import { Rng } from './rng.js';
import { NEST } from './spiders.js';
import type { Foe } from './terrain.js';

export const SPIDERS = {
  places: ['forest', 'marsh', 'mine', 'ruins'] as PlaceKind[],
  /** The chance a room has them: `base`, plus `perRoom` a room in, `perRuin` a point of ruin, `deep` on a deep job. */
  base: 0.25,
  perRoom: 0.12,
  perRuin: 0.05,
  deep: 0.15,
  /** Spiders resting on each nest when you come in. */
  guards: 2,
  /** Plain goblins a room gives up for each nest. */
  thin: 2,
  /** A brood mother: from room `from` (a room sooner on a deep job), this often (more on a deep job). */
  brood: { from: 2, chance: 0.4, deep: 0.3 },
};

/** The chance room `index` of `job` has spiders (0 where they never go). */
export function spiderChance(job: Job, index: number): number {
  if (!SPIDERS.places.includes(job.place.kind) || job.place.region === 'Wickhold') return 0;
  return Math.min(0.9, SPIDERS.base + index * SPIDERS.perRoom + job.place.ruin * SPIDERS.perRuin + (job.deep ? SPIDERS.deep : 0));
}

type Spot = (r: number, y0?: number, y1?: number) => { x: number; y: number } | null;

/** Maybe put spiders in a room being laid out (`h`: the room's height). Changes `foes` in place. */
export function rollSpiders(foes: Foe[], job: Job, index: number, spot: Spot, h: number, w: number): void {
  const rng = new Rng(job.seed * 71 + index * 13 + 5);
  if (rng.next() >= spiderChance(job, index)) return;
  const want = 1 + (index >= 2 || job.deep ? 1 : 0);
  let nests = 0;
  for (let i = 0; i < want; i++) {
    const c = spot(NEST.radius + 0.6, 2.5, h - 7);
    if (!c) continue;
    foes.push({ kind: 'nest', x: c.x, y: c.y, wave: NEST.wave });
    nests++;
    for (let g = 0; g < SPIDERS.guards; g++) {
      const a = rng.range(0, Math.PI * 2), x = Math.max(1, Math.min(w - 1, c.x + Math.cos(a) * 1.15)), y = Math.max(1.5, c.y + Math.sin(a) * 0.9);
      foes.push({ kind: 'spider', x, y });
    }
  }
  if (!nests) return;
  // Room for them: a few plain goblins fewer (from the back of the list, so the ones at the fires go first).
  let cut = SPIDERS.thin * nests;
  for (let i = foes.length - 1; i >= 0 && cut > 0; i--) {
    const f = foes[i];
    if (f.kind === 'scrapper' && !f.bow && !f.variant && !f.feeding && !f.name && !f.task) foes.splice(i, 1), cut--;
  }
  const b = SPIDERS.brood;
  if (index >= b.from - (job.deep ? 1 : 0) && rng.next() < b.chance + (job.deep ? b.deep : 0)) {
    const c = spot(0.9, 2.5, h / 2 + 2);
    if (c) foes.push({ kind: 'brood', ...c });
  }
}
