/**
 * The Roll's relics (docs/design/relics.md section 2): the first hero in a world to win each relic is
 * named on it, for good. A hero's world claim carries the kinds they just won (Contribution.relics); the
 * world keeps the first name per kind and never changes it. Only relics that are won count (not the
 * javelin every hero starts with).
 */
import { RELIC_HOMES } from './relichomes.js';
import type { RelicId } from './magic.js';

/** The relics the Roll names a first winner for, in the Roll's order. */
export const ROLL_RELICS: RelicId[] = RELIC_HOMES.filter((h) => h.home !== 'start').map((h) => h.kind);

/** What the world keeps: kind to the first winner's name. */
export type FirstRelics = Partial<Record<RelicId, string>>;

/** A claim's kinds, made sound: only Roll relics, each once, at most a few. */
export function cleanRelicClaim(raw: unknown): RelicId[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = [...new Set(raw.filter((k): k is RelicId => ROLL_RELICS.includes(k as RelicId)))].slice(0, 4);
  return out.length ? out : undefined;
}

/** Name `name` first on each kind nobody has won yet. */
export function claimFirst(w: { firstRelics?: FirstRelics }, name: string, kinds: readonly RelicId[]): void {
  for (const k of kinds) if (ROLL_RELICS.includes(k) && !w.firstRelics?.[k]) (w.firstRelics ??= {})[k] = name;
}
