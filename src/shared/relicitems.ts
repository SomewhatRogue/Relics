/**
 * Relics as things you own (2026-11-03, Kyle: "Relics fade with usage but can be recharged at the
 * church"; 2026-11-05: "increase the power of those items ... but limited uses"). Each found relic is
 * its own item: a kind (what it does, magic.ts), a tier, an element built in or none, and a charge.
 * A relic holds a few uses (3 to 6, by how strong it is); every use spends one and it fades a stage;
 * at nothing it's dark: kept, but dead metal on the RELIC button. Plain relics are tier 1. Elemental
 * ones are rarer, tier 2 or (LOUD) 3, hold a use or two more, and can't be recharged. Pure: the room,
 * the church and the save all use it.
 */
import type { Rng } from './rng.js';
import { ELEMENT_NAME, FOUND_RELICS, RELICS, type Element, type RelicId } from './magic.js';

export interface RelicItem {
  id: string;
  kind: RelicId;
  tier: 1 | 2 | 3;
  el: Element | '';
  charge: number;
  /** 2: charge counts uses (3 to 6). Missing: an old save's, out of 24 / 36 / 48 (fitRelics turns it). */
  v?: 2;
}

/** Uses a full plain relic holds, by kind: the strongest hold fewest. An elemental one holds one more, a LOUD one two. */
export const RELIC_USES: Partial<Record<RelicId, number>> = { javelin: 4, hook: 4, lodestone: 3, bomb: 4, sentry: 3, bell: 4, knuckle: 4 };
/** Before 2026-11-05 every relic held 24, 36 or 48 by tier (fitRelics scales an old one down). */
const OLD_MAX: Record<RelicItem['tier'], number> = { 1: 24, 2: 36, 3: 48 };

export const relicMax = (r: { kind: RelicId; tier?: number }) => (RELIC_USES[r.kind] ?? 4) + ((r.tier ?? 1) - 1);
/** How full, 0 to 1. */
export const relicFill = (r: RelicItem) => Math.max(0, Math.min(1, r.charge / relicMax(r)));
export const isDark = (r: Pick<RelicItem, 'charge'>) => r.charge <= 0;

/**
 * How faded it looks, card and icon alike: 0 full, 1 used a little (more than half left), 2 half or
 * less, 3 the last use, 4 dark. Each stage is drawn dimmer than the one before.
 */
export type RelicStage = 0 | 1 | 2 | 3 | 4;
export function relicStage(r: { kind: RelicId; tier?: number; charge: number }): RelicStage {
  const max = relicMax(r);
  if (r.charge <= 0) return 4;
  if (r.charge >= max) return 0;
  if (r.charge === 1) return 3;
  return r.charge * 2 > max ? 1 : 2;
}

/**
 * The odds of a relic found off a named butcher (`named`, a seeded roll in the room; rarer since
 * 2026-11-05, when the big places became where relics come from), and of any relic rolled being
 * elemental (`elemental`) and, if so, LOUD (`loud`, tier 3).
 */
export const RELIC_DROP = { named: 0.04, elemental: 0.15, loud: 0.3 };
const ELEMENTS: Element[] = ['fire', 'frost', 'storm'];

/** An id from the roll's own stream (never Math.random: the room and the save must agree). */
export const relicId = (rng: Rng) => 'r' + Math.floor(rng.next() * 2176782336).toString(36).padStart(6, '0');

/** A fresh, full relic. */
export function makeRelic(rng: Rng, kind: RelicId, el: Element | '' = '', tier?: RelicItem['tier']): RelicItem {
  const t = tier ?? (el ? 2 : 1);
  return { id: relicId(rng), kind, tier: t, el, charge: relicMax({ kind, tier: t }), v: 2 };
}

/** A relic rolled: any found kind, elemental at `elemental` odds and LOUD at `loud` of those. */
export function rollRelic(rng: Rng, elemental = RELIC_DROP.elemental, loud = RELIC_DROP.loud, kinds: RelicId[] = FOUND_RELICS): RelicItem {
  const kind = rng.pick(kinds), el = rng.next() < elemental ? rng.pick(ELEMENTS) : '';
  return makeRelic(rng, kind, el, el ? (rng.next() < loud ? 3 : 2) : 1);
}

/** Its name on screen: "BONE WHISTLE", "FROST JAVELIN", "LOUD STORM HOOK". */
export function relicName(r: RelicItem): string {
  if (!r.el) return RELICS[r.kind].name;
  return (r.tier === 3 ? 'LOUD ' : '') + ELEMENT_NAME[r.el] + ' ' + (r.kind === 'sentry' ? RELICS.sentry.name : RELICS[r.kind].short);
}

/** Before relics had charge, a hero kept a list of kinds and the one carried: each becomes a full plain relic. */
export function fromOld(kinds: unknown[], carried: unknown, seed: number): { relics: RelicItem[]; relic: string } {
  const out: RelicItem[] = [];
  let relic = '';
  kinds.forEach((k, i) => {
    if (typeof k !== 'string' || !(k in RELICS)) return;
    const it: RelicItem = { id: `r${seed.toString(36)}${i}`, kind: k as RelicId, tier: 1, el: '', charge: relicMax({ kind: k as RelicId, tier: 1 }), v: 2 };
    out.push(it);
    if (k === carried && !relic) relic = it.id;
  });
  return { relics: out, relic };
}

/**
 * One relic as it's kept now. An old one (charge out of 24 / 36 / 48) keeps the same share of its
 * charge in uses, rounded to the nearest, never below one unless it was dark: a full one stays full,
 * a dark one stays dark.
 */
export function fitRelic(r: RelicItem): RelicItem {
  const tier = ([1, 2, 3] as const).includes(r.tier) ? r.tier : 1, max = relicMax({ kind: r.kind, tier });
  const raw = Number.isFinite(r.charge) ? r.charge : max;
  const charge = r.v === 2 ? raw : raw <= 0 ? 0 : Math.max(1, Math.round((raw / OLD_MAX[tier]) * max));
  return { ...r, tier, charge: Math.max(0, Math.min(max, Math.round(charge))), v: 2 };
}

/** A save's relics, whatever age: items fitted to uses, old kinds made into items. */
export function fitRelics(p: { relics?: unknown[]; relic?: unknown }, seed: number): { relics: RelicItem[]; relic: string } {
  const list = Array.isArray(p.relics) ? p.relics : [];
  if (list.every((x) => x && typeof x === 'object')) {
    const relics = (list as RelicItem[]).filter((r) => r.kind in RELICS).map(fitRelic);
    const relic = typeof p.relic === 'string' && relics.some((r) => r.id === p.relic) ? p.relic : '';
    return { relics, relic };
  }
  return fromOld(list, p.relic, seed);
}
