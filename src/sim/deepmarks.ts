/**
 * The Deep's curses and blessings in the room (shared/deepmarks.ts): each player's marks for the run ride on
 * their input (Intent.marks, kept on their save); once a tick each hero takes on the list its player sends,
 * and its health is fitted again when that changes its health. A relic use back each floor is given when the
 * next floor's room is made (client/game.ts descend: relicBack).
 */
import { isMark, markSum } from '../shared/deepmarks';
import { relicMax } from '../shared/relicitems';
import { refreshHealth } from './gearstats';
import type { Hero, Intent } from './types';

export function syncMarks(heroes: Hero[], intents: Map<string, Intent>): void {
  for (const h of heroes) {
    // The floor its player chose GO DEEPER on, for every screen to show who's chosen what (client/deepui.ts).
    const v = intents.get(h.id)?.deep;
    if (typeof v === 'number' && v !== h.deepVote) h.deepVote = v;
    const m = intents.get(h.id)?.marks;
    if (!Array.isArray(m)) continue;
    const ids = m.filter(isMark);
    if (ids.join() === (h.marks ?? []).join()) continue;
    h.marks = ids;
    refreshHealth(h);
  }
}

/** A new floor: each blessing of a relic use back gives the relic a hero carries one use, up to full. */
export function relicBack(heroes: Hero[]): void {
  for (const h of heroes) {
    const n = markSum(h.marks, 'relic'), r = h.found?.find((x) => x.id === h.relicItem);
    if (n > 0 && r) r.charge = Math.min(relicMax(r), r.charge + n);
  }
}
