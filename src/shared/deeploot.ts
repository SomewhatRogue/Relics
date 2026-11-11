/**
 * Loot in the Deep (docs/design/the-deep.md, "Floors and loot"): a chest's or a goblin's tier odds leant
 * by the floor's band (shared/deepbands.ts), PRE-WAR and the rare three that many times as likely, the
 * rare three more again for each floor past fifteen, without end. The other tiers give up the difference.
 */
import { bandOf, DEEP_PAST, pastOf } from './deepbands.js';
import type { Tier } from './loot.js';

const RARE3: Tier[] = ['touched', 'turning', 'hungry'];

/** `odds` for a Deep floor `n` (0: not the Deep, as they are). Sums to what they summed to. */
export function deepOdds(odds: [Tier, number][], n: number): [Tier, number][] {
  if (n <= 0) return odds;
  const b = bandOf(n), rare = b.rare * (1 + DEEP_PAST.rare * pastOf(n));
  const total = odds.reduce((s, [, p]) => s + p, 0);
  const out = odds.map(([t, p]) => [t, p * (t === 'tolmouth' ? b.pre : RARE3.includes(t) ? rare : 1)] as [Tier, number]);
  const sum = out.reduce((s, [, p]) => s + p, 0);
  return out.map(([t, p]) => [t, (p * total) / sum]);
}
