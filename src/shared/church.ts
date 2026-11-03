/**
 * Relics at the church (2026-11-03, Kyle): a plain relic is recharged for gold; any relic can be left
 * on the step, and the brighter it was the longer you carry the church's light on jobs ("lit"); and
 * two left together get one back from what others have left before, a seeded roll kept with the hero
 * so a reload can't roll it again. Elemental relics are never recharged. Pure: Game and the tests use it.
 */
import { Rng } from './rng.js';
import { RELIC_DROP, isDark, makeRelic, relicFill, relicMax, rollRelic, type RelicItem } from './relicitems.js';

/** Gold for each charge put back in a plain relic (a dark plain one: 24 x 3 = 72). */
export const RECHARGE = { perCharge: 3 };
/** The church's light carried on jobs: blows land `dmg` times as hard, and goblins judge you `lure`
 *  tiles nearer and notice you `notice` further off (they come for you first). At most `max` jobs. */
export const LIT = { dmg: 1.15, lure: 3, notice: 2, max: 6 };
/** Two left for one: the odds it comes back elemental, and LOUD if so (see forgeOdds). */
export const FORGE = { elemental: 0.1, perElemental: 0.3, perBright: 0.15, loud: 0.2, perLoud: 0.3, loudBright: 0.1, cap: 0.85, bright: 0.75 };

/** What the church holds a hero's relics with: just these fields of a profile. */
export interface RelicHolder { id: string; gold: number; relics: RelicItem[]; relic: string; lit?: number; forges?: number }

export const canRecharge = (r: RelicItem) => !r.el && r.charge < relicMax(r);
export const rechargeCost = (r: RelicItem) => (r.el ? 0 : (relicMax(r) - r.charge) * RECHARGE.perCharge);

/** Recharge a plain relic to full for gold. False: elemental, already full, or too poor. */
export function recharge(p: RelicHolder, id: string): boolean {
  const r = p.relics.find((x) => x.id === id);
  if (!r || !canRecharge(r) || p.gold < rechargeCost(r)) return false;
  p.gold -= rechargeCost(r);
  r.charge = relicMax(r);
  return true;
}

/** Jobs of the church's light a relic left on the step is worth: full plain 3, half 1, nearly dark
 *  none; an elemental one a job more (LOUD two more). */
export function litFor(r: RelicItem): number {
  if (isDark(r)) return 0;
  return Math.floor(relicFill(r) * (3 + (r.tier - 1)) + 0.2);
}

/** Leave a relic on the step: it's gone, and you carry the light for that many more jobs. Returns the jobs added. */
export function leaveRelic(p: RelicHolder, id: string): number {
  const r = p.relics.find((x) => x.id === id);
  if (!r) return -1;
  p.relics = p.relics.filter((x) => x !== r);
  if (p.relic === id) p.relic = '';
  const n = litFor(r), was = p.lit ?? 0;
  p.lit = Math.min(LIT.max, was + n);
  return p.lit - was;
}

/** The odds two relics left together come back elemental, and LOUD if so. */
export function forgeOdds(a: RelicItem, b: RelicItem): { elemental: number; loud: number } {
  const both = [a, b], bright = both.filter((r) => relicFill(r) >= FORGE.bright).length;
  const els = both.filter((r) => r.el).length, louds = both.filter((r) => r.tier === 3).length;
  return {
    elemental: Math.min(FORGE.cap, FORGE.elemental + FORGE.perElemental * els + FORGE.perBright * bright),
    loud: Math.min(FORGE.cap, FORGE.loud + FORGE.perLoud * louds + FORGE.loudBright * bright),
  };
}

/** The hero's own forge dice: seeded by who they are and how many times they've done it before. */
export function forgeSeed(id: string, n: number): number {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (Math.imul(h ^ (n + 1), 2654435761) >>> 0) || 1;
}

/** Two relics left together, one back. Both go; the new one is kept, and the count moves on (so
 *  the same two on a reload give the same one, and the next forge is a new roll). Null: not two of yours. */
export function forge(p: RelicHolder, a: string, b: string): RelicItem | null {
  const ra = p.relics.find((x) => x.id === a), rb = p.relics.find((x) => x.id === b);
  if (!ra || !rb || ra === rb) return null;
  const rng = new Rng(forgeSeed(p.id, p.forges ?? 0)), o = forgeOdds(ra, rb);
  const got = rollRelic(rng, o.elemental, o.loud);
  p.relics = p.relics.filter((x) => x !== ra && x !== rb);
  if (p.relic === a || p.relic === b) p.relic = got.id;
  p.relics.push(got);
  p.forges = (p.forges ?? 0) + 1;
  return got;
}

/** The relic at the bottom of a won deep dive: a kind you don't have yet (plain, full), else any, rolled. */
export function deepRelic(owned: RelicItem[], kinds: readonly string[], seed: number): RelicItem {
  const rng = new Rng(seed || 1), missing = kinds.find((k) => !owned.some((r) => r.kind === k));
  return missing ? makeRelic(rng, missing as RelicItem['kind']) : rollRelic(rng, RELIC_DROP.elemental, RELIC_DROP.loud);
}
