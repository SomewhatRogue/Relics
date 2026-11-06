/**
 * A carried relic's charge, as the room keeps it: every use spends one (a relic holds a few, shared/
 * relicitems.ts RELIC_USES), and at nothing it's dark (the RELIC button refuses). The class skill has no charge. A hero handed a relic kind with no item (the
 * tests, the training yard) uses it freely. The church's light and a bell's quickening live here too.
 */
import { BELL, RELICS } from '../shared/tuning';
import { LIT } from '../shared/church';
import type { RelicItem } from '../shared/relicitems';
import type { FightEvent, Hero } from './types';

/** The relic item carried, if this hero has one in hand now. */
export function carriedItem(h: Hero): RelicItem | undefined {
  if (!h.relicItem || h.relic !== h.relics[1]) return undefined;
  const it = h.found?.find((r) => r.id === h.relicItem);
  return it && it.kind === h.relic ? it : undefined;
}

export const relicDark = (h: Hero) => (carriedItem(h)?.charge ?? 1) <= 0;

/** One use spent (the room calls it as the relic fires). The last one going says so: it's dark now. */
export function spendCharge(h: Hero, ev?: FightEvent[]): void {
  const it = carriedItem(h);
  if (!it) return;
  it.charge = Math.max(0, it.charge - 1);
  if (it.charge === 0) ev?.push({ k: 'faded', x: h.x, y: h.y, name: RELICS[it.kind].short });
}

/** Hits harder carrying the church's light. */
export const litMult = (h: Hero) => (h.lit ? LIT.dmg : 1);
/** Walks faster for a while after a friend's bone bell. */
export const quickMult = (h: Hero, now: number) => ((h.quickUntil ?? -9) > now ? BELL.quick : 1);
