/**
 * When the tended fires burn. Braziers, wall torches, lamp posts, a hall's door lamp and its lit
 * windows are lit as the light goes at dusk and put out once it's properly light after dawn. Wild
 * fires (a house or a wagon burning, embers in the ash, a goblin's cookfire, a camp's fire, spell fire)
 * aren't lamps and burn whatever the hour. Both views ask here, so the same lamps are lit on every
 * screen: in Wickhold by the shared day clock, on a job by the job's own hour.
 *
 * In town the lamplighter goes round: each lamp has its own place in the round (from where it stands),
 * so they come on one by one over half a minute and go out the same way. The day only runs forward,
 * and a lamp lights at a darker point in the evening than it's put out in the morning, so none of
 * them flickers on and off at the edge.
 */
import type { Theme } from './arena.js';
import type { Time } from './timeofday.js';

/** Where in the day (shared/daylight.ts phase) the first lamp is lit, and the first put out. */
export const LIT_AT = 0.71;
export const OUT_AT = 0.285;
/** How long the lamplighter's round takes, and how long a flame takes to catch (as phase). */
export const ROUND = 0.012;
const CATCH = 0.0015;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** A lamp's place in the round (0 first, under 1 last), from where it stands. */
export const lampKey = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** How lit a lamp is (0 out, 1 burning) at a point in the day, `k` its place in the round. */
export function lampsLit(phase: number, k = 0): number {
  const p = ((phase % 1) + 1) % 1;
  if (p >= 0.5) return clamp((p - (LIT_AT + k * ROUND)) / CATCH);
  return clamp((OUT_AT + k * ROUND - p) / CATCH);
}

/** A job's lamps at its hour: out in broad day, burning at dawn (not yet put out), dusk and night. */
export const lampsFor = (time: Time) => (time === 'day' ? 0 : 1);

/** How lit the lamp at (x, y) is under this theme: by the town's clock, the job's hour, or always
 *  (indoors, the yard, the wood, underground: lamps are lit whenever anyone's there). */
export function lampAt(theme: Theme, x: number, y: number): number {
  if (theme.dayAt !== undefined) return lampsLit(theme.dayAt, lampKey(x, y));
  return theme.lamps ?? 1;
}
