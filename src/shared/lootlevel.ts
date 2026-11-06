/**
 * Loot by the party's level (Kyle, 2026-11-05; numbers shared/threat.ts LEVEL_SCALE): the stronger the
 * party, the better what drops, gently. Each level past the first leans the odds: plain down, Forged and
 * PRE-WAR up, the rare three up a little, Fine taking up the difference so the odds still add up; capped
 * at LEVEL_SCALE.most levels. And a drop's item level: +1 from `itemFrom`, +2 from
 * `item2`. Same draws from the stream as before, so a level-1 party's rolls are exactly what they were.
 */
import type { Tier } from './loot.js';
import { LEVEL_SCALE } from './threat.js';

const RARE: Tier[] = ['touched', 'turning', 'hungry'];

/** `odds` leaned for a party of average level `lv` (unchanged at level 1). */
export function leanOdds(odds: [Tier, number][], lv: number): [Tier, number][] {
  const k = Math.min(LEVEL_SCALE.most, Math.max(0, lv - 1));
  if (k <= 0) return odds;
  const total = odds.reduce((s, [, p]) => s + p, 0), fine = odds.find(([t]) => t === 'fine')?.[1] ?? 0;
  const lean = (t: Tier) => (RARE.includes(t) ? LEVEL_SCALE.rare : LEVEL_SCALE.lean[t as keyof typeof LEVEL_SCALE.lean] ?? 0);
  const out = odds.map(([t, p]) => [t, t === 'fine' ? 0 : p * Math.max(0, 1 + lean(t) * k)] as [Tier, number]);
  // Fine takes up the difference; if that would leave too little of it, the leaning is scaled back.
  const rest = out.reduce((s, [, p]) => s + p, 0), left = total - rest, keep = fine * LEVEL_SCALE.floor;
  if (left >= keep) return out.map(([t, p]) => [t, t === 'fine' ? left : p]);
  const sq = (total - keep) / rest;
  return out.map(([t, p]) => [t, t === 'fine' ? keep : p * sq]);
}

/** A drop's item level for a party of average level `lv`. */
export const itemLevel = (lv: number) => (lv >= LEVEL_SCALE.item2 ? 2 : lv >= LEVEL_SCALE.itemFrom ? 1 : 0);
