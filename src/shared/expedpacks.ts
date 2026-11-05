/**
 * An expedition's goblins as packs (Kyle, 2026-11-04: "I didn't see too many enemy types, just big guys
 * and little guys"). Each camp, each stretch's set piece and each road patrol becomes one pack from the
 * templates (shared/encounters.ts), laid exactly as a job's room lays one (encounter.ts `lay`): one
 * centrepiece, one kind backing it, small ones round them. What a band may be comes from its ground
 * (tuning EXPED_PACKS.where), the job's ruin, the roofs near it and its cap on specials. Carrion crows
 * settle on the dead out in the open. On a stream of its own, after the ground is laid, so the same seed
 * lays the same map on every screen and the ground is as it was. Waves use the same pick (sim/expedwave.ts).
 */
import type { Block } from './arena.js';
import { cast, cost, lay, roofsIn, type Compose } from './encounter.js';
import { TEMPLATES, type Template } from './encounters.js';
import { claim, free, MH, MW, spotIn, type Kit, type P } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe } from './terrain.js';
import { EXPED_PACKS } from './tuning.js';

export type Ground = keyof typeof EXPED_PACKS.where;
/**
 * A band of goblins to make a pack of: their indexes in the kit's list, the ground they stand on, the
 * most specials it may have, how close to a road its new goblins may stand (a patrol's are on one), and
 * templates it mustn't be (a named butcher's camp has its centrepiece already), and whether it keeps all
 * its goblins (a camp: the ones past the template's count stay on as small ones).
 */
export interface Band { idx: number[]; ground: Ground; cap: number; road?: number; not?: string[]; keep?: boolean }

/** Packs on the big map are numbered from here (a job's room uses 1 to 3, and 90 for a ledge). */
export const PACK0 = 100;

/** The templates from `ids` the job's ruin allows, with roofs to stand on if they need them, under `cap` specials. */
export function templatesFor(ids: string[], ruin: number, cap: number, roofs = false): Template[] {
  return TEMPLATES.filter((t) => ids.includes(t.id) && ruin >= (t.ruin ?? 0) && (!t.roofs || roofs) && cost(t) <= cap);
}

/** One of `ts` by weight (the swarm if there's none). */
export function pickTemplate(next: () => number, ts: Template[]): Template {
  if (!ts.length) return TEMPLATES[0];
  let r = next() * ts.reduce((s, t) => s + t.weight, 0);
  for (const t of ts) if ((r -= t.weight) < 0) return t;
  return ts[ts.length - 1];
}

const mid = (fs: Foe[]): P => ({ x: fs.reduce((s, f) => s + f.x, 0) / fs.length, y: fs.reduce((s, f) => s + f.y, 0) / fs.length });
const at = (b: Block): P => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * Every band made a pack, in order. Goblins a pack doesn't keep go into `gone` (the map drops them
 * last, so indexes hold till then); new ones go on the end of the kit's list; nothing within `clear` of
 * the way in (`spawn`). Returns each band's pack.
 */
export function packAll(k: Kit, bands: Band[], job: Job, spawn: P, gone: Set<Foe>, clear = 14): number[][] {
  const rng = new Rng(job.seed * 4337 + 19), ruin = job.place.ruin, perched = new Set<Block>(), used = new Set<string>();
  return bands.map((b, n) => {
    // (None too near the way in, where the map drops them anyway: a pack is laid whole or not at all.)
    const ok = (x: number, y: number) => Math.hypot(x - spawn.x, y - spawn.y) >= clear;
    const band = b.idx.map((i) => k.foes[i]).filter((f) => f && !gone.has(f) && ok(f.x, f.y));
    if (!band.length) return [];
    const m = mid(band), pad = b.road ?? 0.4;
    // Roofs near the band nobody's on yet (a roof archer's perch).
    const roofs = rng.shuffle(roofsIn(k.blocks).filter((q) => !perched.has(q) && Math.hypot(at(q).x - m.x, at(q).y - m.y) < 9)), left = new Set(roofs);
    const ids = EXPED_PACKS.where[b.ground].filter((id) => !b.not?.includes(id));
    // One of each before any twice, so the map's fights differ (Kyle saw only big ones and little ones).
    const ts = templatesFor(ids, ruin, b.cap, roofs.length > 0), fresh = ts.filter((q) => !used.has(q.id));
    const t = pickTemplate(() => rng.next(), fresh.length ? fresh : ts);
    used.add(t.id);
    const c: Compose = {
      foes: k.foes, job, index: 1, W: MW, H: MH, spawn, blocks: k.blocks,
      spot: (r) => {
        const q = spotIn(k, m.x - 5, m.y - 5, m.x + 5, m.y + 5, r, pad);
        return q && ok(q.x, q.y) ? q : null;
      },
      free: (x, y, r) => ok(x, y) && free(k, x, y, r, pad),
      claim: (x, y, r) => claim(k, x, y, r),
    };
    const kept = lay(c, band, t, PACK0 + n, rng, roofs);
    for (const q of left) if (!roofs.includes(q)) perched.add(q);
    // A camp keeps its whole band at the fire: what the template doesn't need stays on as small ones.
    if (b.keep) for (const f of band) if (!kept.includes(f)) kept.push(Object.assign(cast(f, 'fodder'), { pack: PACK0 + n }));
    for (const f of band) if (!kept.includes(f)) gone.add(f);
    return kept.map((f) => {
      const i = k.foes.indexOf(f);
      return i >= 0 ? i : k.foes.push(f) - 1;
    });
  });
}

/** Carrion crows on the dead out in the open: each body a chance (EXPED_PACKS.crowChance), one flock a stretch, EXPED_PACKS.crows at most. */
export function flocksOn(dead: P[], job: Job): P[] {
  const rng = new Rng(job.seed * 61 + 5), out: P[] = [];
  for (const d of dead) if (out.length < EXPED_PACKS.crows && out.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > 12) && rng.next() < EXPED_PACKS.crowChance) out.push({ x: d.x, y: d.y - 0.2 });
  return out;
}
