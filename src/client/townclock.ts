/**
 * Wickhold's hour on this screen: the shared clock (shared/daylight.ts), unless a test has set it. For
 * looking at the town at any hour: `?day=0.5` in the address (0 midnight, 0.25 dawn, 0.5 noon, 0.75
 * dusk), or `window.__setDay(0.75)` from the console (`__setDay(null)` gives the clock back).
 */
import { dayPhase } from '../shared/daylight';

const asked = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('day');
let held: number | null = asked !== null && asked !== '' && Number.isFinite(+asked) ? +asked : null;

/** Where in the day Wickhold is now (0..1). */
export const townPhase = () => (held !== null ? ((held % 1) + 1) % 1 : dayPhase(Date.now()));

if (typeof window !== 'undefined') (window as unknown as { __setDay: (p: number | null) => void }).__setDay = (p) => void (held = p);
