/**
 * Relics as things you own (2026-11-03, Kyle: "Relics fade with usage but can be recharged at the
 * church"). Each found relic is its own item: a kind (what it does, magic.ts), a tier, an element
 * built in or none, and a charge. Every use spends one charge; at nothing it's dark: kept, but dead
 * metal on the RELIC button. Plain relics are tier 1. Elemental ones are rarer, tier 2 or (LOUD) 3,
 * hold more charge, and can't be recharged. Pure: the room, the church and the save all use it.
 */
import type { Rng } from './rng.js';
import { ELEMENT_NAME, FOUND_RELICS, RELICS, type Element, type RelicId } from './magic.js';

export interface RelicItem {
  id: string;
  kind: RelicId;
  tier: 1 | 2 | 3;
  el: Element | '';
  charge: number;
}

/** Uses a full relic holds, by tier. */
export const RELIC_MAX: Record<RelicItem['tier'], number> = { 1: 24, 2: 36, 3: 48 };
export const relicMax = (r: RelicItem) => RELIC_MAX[r.tier];
/** How full, 0 to 1. */
export const relicFill = (r: RelicItem) => Math.max(0, Math.min(1, r.charge / relicMax(r)));
export const isDark = (r: RelicItem) => r.charge <= 0;

/**
 * The odds of a relic found off a named butcher (`named`, a seeded roll in the room), and of any
 * relic rolled being elemental (`elemental`) and, if so, LOUD (`loud`, tier 3).
 */
export const RELIC_DROP = { named: 0.12, elemental: 0.15, loud: 0.3 };
const ELEMENTS: Element[] = ['fire', 'frost', 'storm'];

/** An id from the roll's own stream (never Math.random: the room and the save must agree). */
export const relicId = (rng: Rng) => 'r' + Math.floor(rng.next() * 2176782336).toString(36).padStart(6, '0');

/** A fresh, full relic. */
export function makeRelic(rng: Rng, kind: RelicId, el: Element | '' = '', tier?: RelicItem['tier']): RelicItem {
  const t = tier ?? (el ? 2 : 1);
  return { id: relicId(rng), kind, tier: t, el, charge: RELIC_MAX[t] };
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
    const it: RelicItem = { id: `r${seed.toString(36)}${i}`, kind: k as RelicId, tier: 1, el: '', charge: RELIC_MAX[1] };
    out.push(it);
    if (k === carried && !relic) relic = it.id;
  });
  return { relics: out, relic };
}

/** A save's relics, whatever age: items kept as they are, old kinds made into items. */
export function fitRelics(p: { relics?: unknown[]; relic?: unknown }, seed: number): { relics: RelicItem[]; relic: string } {
  const list = Array.isArray(p.relics) ? p.relics : [];
  if (list.every((x) => x && typeof x === 'object')) {
    const relics = (list as RelicItem[]).filter((r) => r.kind in RELICS).map((r) => ({ ...r, charge: Math.max(0, Math.min(RELIC_MAX[r.tier] ?? 24, r.charge)) }));
    const relic = typeof p.relic === 'string' && relics.some((r) => r.id === p.relic) ? p.relic : '';
    return { relics, relic };
  }
  return fromOld(list, p.relic, seed);
}
