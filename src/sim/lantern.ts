/**
 * Coals: a butcher that dies leaves a live coal on the floor for a while (behind the scenes, a crumb of
 * the sliver it ate; never say so on screen). A Healer who walks over it feeds the censer, whose coal
 * was lit from the Last Lantern, for life: every heal they give grows, and the hungry smell it, notice
 * them sooner and go for them first. Nobody else can take one. See docs/lore/story-bible.md.
 */
import { LANTERN, WEAPONS } from '../shared/tuning';
import type { Enemy, FightEvent, Hero } from './types';
import { statsOf } from './gearstats';
/** The church's light (shared/church.ts) is lit from the Lantern too: the hungry come for whoever carries it. */
import { LIT } from '../shared/church';

export interface Coal { id: number; x: number; y: number; life: number }
let nextId = 1;

const healer = (h: Hero) => WEAPONS[h.weapon].cls === 'HEALER';
/** How much more this hero heals. */
export const healMult = (h: Hero | undefined) => 1 + (h && healer(h) ? LANTERN.heal * h.glow : 0) + (h ? statsOf(h).mending : 0);
/** How many tiles nearer a goblin judges this hero (goes for them first), and how much further off it notices them. */
export const lure = (h: Hero) => (healer(h) ? LANTERN.lure * h.glow : 0) + (h.lit ? LIT.lure : 0);
export const seenFrom = (h: Hero) => (healer(h) ? LANTERN.notice * h.glow : 0) + (h.lit ? LIT.notice : 0);

export function dropCoal(e: Enemy, coals: Coal[]): void {
  if (e.kind === 'butcher') coals.push({ id: nextId++, x: e.x, y: e.y, life: LANTERN.life });
}

/** Healers take the coals they walk over; the rest fade. */
export function stepCoals(coals: Coal[], heroes: Hero[], ev: FightEvent[], dt: number): Coal[] {
  return coals.filter((m) => {
    const h = heroes.find((o) => healer(o) && o.act !== 'down' && o.glow < LANTERN.max && Math.hypot(o.x - m.x, o.y - m.y) < LANTERN.reach);
    if (h) {
      h.glow++;
      ev.push({ k: 'coal', x: h.x, y: h.y, n: h.glow });
      return false;
    }
    return (m.life -= dt) > 0;
  });
}
