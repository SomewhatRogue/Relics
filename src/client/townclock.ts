/**
 * Wickhold's hour on this screen: the shared clock (shared/daylight.ts), unless a test has set it. For
 * looking at the town at any hour: `?day=0.5` in the address (0 midnight, 0.25 dawn, 0.5 noon, 0.75
 * dusk), or `window.__setDay(0.75)` from the console (`__setDay(null)` gives the clock back).
 */
import type { Npc } from '../shared/arena';
import { dayPhase } from '../shared/daylight';

const asked = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('day');
let held: number | null = asked !== null && asked !== '' && Number.isFinite(+asked) ? +asked : null;

/** Where in the day Wickhold is now (0..1). */
export const townPhase = () => (held !== null ? ((held % 1) + 1) % 1 : dayPhase(Date.now()));

/** Seconds on Wickhold's wall clock (what everyone's screen agrees on, give or take their clocks). */
export const townSeconds = () => Date.now() / 1000;

/** Keep anyone who walks on the clock (`clock`) on it: their round is read at the wall clock's second,
 *  whatever the room's own time says (it starts at 0 each time you come into town). */
export function onClock(npcs: Npc[] | undefined, roomTime: number): void {
  const now = townSeconds();
  for (const n of npcs ?? []) if (n.clock) n.lag = roomTime - now;
}

if (typeof window !== 'undefined') (window as unknown as { __setDay: (p: number | null) => void }).__setDay = (p) => void (held = p);
