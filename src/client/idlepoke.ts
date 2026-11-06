/**
 * Whether this frame's input is anything at all (idles.ts: any input cuts your hero's idle off): the
 * stick off centre, a button held, the aim moved, or any press counted since the last frame.
 */
import type { Intent } from '../sim/types';

let last: Record<string, unknown> | null = null;

export function touchedIdle(i: Intent): boolean {
  const was = last, now = i as unknown as Record<string, unknown>;
  last = { ...now };
  if (i.mx || i.my || i.attack || i.block) return true;
  if (!was) return false;
  for (const k in now) if (typeof now[k] === 'number' && now[k] !== was[k]) return true;
  return false;
}
