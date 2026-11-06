/**
 * The hungry's camps on an expedition's map, and what each main job is laid as (docs/terrain-nodes.md
 * 2.8, the warcamp): tents and shacks in a ring round a wild fire, a band at rest about it (made a pack
 * once the map is laid, shared/expedpacks.ts: a banner-bearer's, an oil crew's, a butcher's, a drum's).
 * A camp can hold one of the jobs: the larder and its cookpot, a siege engine half built, prisoners in
 * cages behind hurdles, the dens, or a named butcher at the fire. The barrows are where the old shrine
 * is held. Each returns where its job is and what it's made of (indexes into the kit's lists).
 */
import { block, claim, free, mark, patch, prop, round, spotIn, type Kit, type P } from './expedkit.js';
import type { Foe } from './terrain.js';

export type GoalKind = 'larder' | 'engine' | 'prisoners' | 'dens' | 'shrine' | 'butcher'
  /** The Staithe (shared/expedstaithe.ts): never rolled with the six; pinned on its own roll, else a side job. */
  | 'staithe';
export type SideKind = 'cache' | 'pray';
/** A job on the map: where, and its parts (blocks by index, cages by place, a goblin by its foe index). */
export interface GoalSpot { kind: GoalKind | SideKind; x: number; y: number; camp?: number; blocks?: number[]; cages?: P[]; foe?: number; chest?: number }
export interface Camp { x: number; y: number; foes: number[] }

/** The siege engine: a wagon-bed with its arm (drawn by `look`), wooden, smashed or burned to wreck. */
export const ENGINE = { look: 4, hp: 320, w: 3.6, h: 1.8 };

/** Goblins round a point, at rest, `d0` to `d1` off it; returns their foe indexes. */
export function ring(k: Kit, at: P, n: number, d0: number, d1: number, more: Partial<Foe> = {}): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < 16; t++) {
      const a = k.rng.range(0, Math.PI * 2), d = k.rng.range(d0, d1), x = at.x + Math.cos(a) * d, y = at.y + Math.sin(a) * d * 0.85;
      if (!free(k, x, y, 0.4, 0.4)) continue;
      claim(k, x, y, 0.45);
      out.push(k.foes.push({ kind: 'scrapper', x, y, ...more }) - 1);
      break;
    }
  }
  return out;
}

/**
 * A camp at `c` (its middle claimed already), with job `goal` if any. Returns the camp, the job's spot,
 * and the band at the fire (`band`, made a pack later; the job's own guards stay small ones).
 */
export function camp(k: Kit, c: P, goal: GoalKind | null, boss: string, index: number): { camp: Camp; spot: GoalSpot | null; band: number[] } {
  const rng = k.rng, foes: number[] = [];
  patch(k, 'mud', c.x - 5, c.y - 4, 10, 8);
  k.braziers.push({ x: c.x, y: c.y, r: 0.4, wild: true });
  claim(k, c.x, c.y, 1.2);
  const n = 4 + rng.int(2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.3, 0.3), d = rng.range(3.8, 4.6), w = rng.range(1.8, 2.5), h = 1.5;
    const x = c.x + Math.cos(a) * d - w / 2, y = c.y + Math.sin(a) * d * 0.8 - h / 2;
    // A gap in the ring toward the bottom of the screen, so the way in is plain.
    if (Math.sin(a) > 0.75) continue;
    if (free(k, x + w / 2, y + h / 2, 1.4, 0.8)) block(k, rng.next() < 0.6 ? 'tent' : 'shack', x, y, w, h);
  }
  round(k, 'cookfire', c.x + 1.5, c.y + 0.7, 0.3);
  k.grim.push({ kind: 'bones', x: c.x - 1.4, y: c.y + 1, k: rng.int(4) });
  const band = ring(k, c, 7 + rng.int(4), 1.3, 3.2);
  foes.push(...band);
  const near = (r: number, d0 = 5, d1 = 8.5): P | null => {
    for (let t = 0; t < 40; t++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(d0, d1), x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d * 0.8;
      if (free(k, x, y, r, 1.2)) return claim(k, x, y, r), { x, y };
    }
    return null;
  };
  let spot: GoalSpot | null = null;
  if (goal === 'larder') {
    // The larder: racks hung with what they keep, a cookpot on its own fire; poison the pot.
    const pot = near(2.6);
    if (pot) {
      k.braziers.push({ x: pot.x, y: pot.y - 0.2, r: 0.35, wild: true });
      k.grim.push({ kind: 'pot', x: pot.x, y: pot.y - 0.1, k: rng.int(4) });
      for (let i = 0; i < 3; i++) prop(k, 'larder', pot.x - 1.8 + i * 1.8, pot.y - 1.9);
      foes.push(...ring(k, pot, 2, 1.2, 2.2, { feeding: true }));
      spot = { kind: 'larder', x: pot.x, y: pot.y + 0.9, camp: index };
    }
  } else if (goal === 'engine') {
    const at = near(2.8);
    if (at) {
      const b = k.blocks.length;
      block(k, 'cart', at.x - ENGINE.w / 2, at.y - ENGINE.h / 2, ENGINE.w, ENGINE.h, { look: ENGINE.look, hp: ENGINE.hp, maxHp: ENGINE.hp, burning: -1 });
      mark(k, 'debris', at.x - 2.4, at.y + 0.7, 4.8, 1.3);
      prop(k, 'oil', at.x + 2.6, at.y + 0.8);
      foes.push(...ring(k, at, 3, 2, 3));
      spot = { kind: 'engine', x: at.x, y: at.y, camp: index, blocks: [b] };
    }
  } else if (goal === 'prisoners') {
    // Cages in a row behind wicker hurdles, a guard or two.
    const at = near(3);
    if (at) {
      const cages: P[] = [];
      for (let i = 0; i < 3; i++) {
        const x = at.x - 1.7 + i * 1.7, y = at.y;
        prop(k, 'cage', x, y);
        cages.push({ x, y });
      }
      block(k, 'hurdle', at.x - 2.6, at.y - 1.3, 5.2, 0.4);
      foes.push(...ring(k, at, 2, 2.4, 3.2));
      spot = { kind: 'prisoners', x: at.x, y: at.y, camp: index, cages };
    }
  } else if (goal === 'dens') {
    // The dens: low huts of their own, oil by each (burn them with it).
    const blocks: number[] = [];
    for (let i = 0; i < 3; i++) {
      const at = near(1.8, 5.5, 9);
      if (!at) continue;
      blocks.push(k.blocks.length);
      block(k, 'den', at.x - 1.3, at.y - 0.8, 2.6, 1.6);
      prop(k, 'oil', at.x + 1.9, at.y + 0.6);
    }
    if (blocks.length) {
      const b = blocks.map((i) => k.blocks[i]), x = b.reduce((s, q) => s + q.x + q.w / 2, 0) / b.length, y = b.reduce((s, q) => s + q.y + q.h / 2, 0) / b.length;
      spot = { kind: 'dens', x, y, camp: index, blocks };
    }
  } else if (goal === 'butcher') {
    const f = k.foes.push({ kind: 'butcher', x: c.x, y: c.y - 1.6, hp: 520, name: boss }) - 1;
    foes.push(f, ...ring(k, c, 3, 1.6, 2.8));
    spot = { kind: 'butcher', x: c.x, y: c.y - 1.6, camp: index, foe: f };
  }
  return { camp: { x: c.x, y: c.y, foes }, spot, band };
}

/** The barrows: grassed mounds older than the villages, standing stones, and a shrine to hold. */
export function barrows(k: Kit, c: P): GoalSpot {
  const rng = k.rng;
  patch(k, 'grass', c.x - 6, c.y - 5, 12, 10);
  for (let i = 0; i < 3; i++) {
    const a = rng.range(0, Math.PI * 2), m = { x: c.x + Math.cos(a) * 7, y: c.y + Math.sin(a) * 5.5 };
    if (free(k, m.x, m.y, 1.4, 1)) mark(k, 'mound', m.x - 1.8, m.y - 1, 3.6, 2), claim(k, m.x, m.y, 1.2);
  }
  round(k, 'shrine', c.x, c.y - 0.6, 0.35);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3, x = c.x + Math.cos(a) * 4.6, y = c.y + Math.sin(a) * 3.8;
    if (free(k, x, y, 0.4, 0.8)) round(k, 'stone', x, y, 0.4);
  }
  return { kind: 'shrine', x: c.x, y: c.y + 0.6 };
}

/** A cache: a chained chest somewhere quiet (a wood's edge, a ruin), a dead man's things about it. */
export function cache(k: Kit, x0: number, y0: number, x1: number, y1: number): GoalSpot | null {
  const at = spotIn(k, x0, y0, x1, y1, 1.6);
  if (!at) return null;
  k.chests.push({ x: at.x, y: at.y, chained: true });
  k.dead.push({ x: at.x + 1.1, y: at.y + 0.6, name: '', talk: 'dead', look: 'soldier', pose: 'corpse' });
  return { kind: 'cache', x: at.x, y: at.y, chest: k.chests.length - 1 };
}
