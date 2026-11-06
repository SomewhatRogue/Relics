/**
 * Ice on water (numbers: shared/worldfx.ts ICE; Kyle, 2026-11-05). Frost on shallows ices them for
 * ICE.time: the cold blast and the hard frost (the staff's nova) over their own size, a frost tap or any
 * freeze or chill landing on a goblin wading, a small patch round it. A patch is a circle, iced only where
 * the water is shallow (`onIce`, what both views draw clipped to the shallows). Goblins wading it are held
 * (sim/enemies.ts walk reads `onIce`), and a frozen goblin skidding over it slows less (sim/iceslide.ts), so
 * it goes further. Friends walk it as plain shallows: the frost is theirs, as the skid spares them. Fire on
 * it melts it to steam (sim/worldfire.ts). Ice lives in the room's own list, so a guest has the same.
 */
import { currentMap } from '../shared/arena';
import { ICE } from '../shared/tuning';
import { shallowAt } from '../shared/waterbody';
import type { Smoke } from './flasks';
import { isDead } from './damage';
import type { Enemy, FightEvent, Ice } from './types';

/** The room's world effects, for those that leave something behind (ice, steam). */
export interface WorldFx { ices: Ice[]; smokes: Smoke[]; iceSeq: number }

const live = (i: Ice, now: number) => now < i.until;
/** On ice: inside a live patch, where the water is shallow. */
export const iceUnder = (ices: readonly Ice[], x: number, y: number, now: number) => ices.some((i) => live(i, now) && Math.hypot(x - i.x, y - i.y) <= i.r) && shallowAt(currentMap(), x, y);

/** Is there shallow water anywhere in this circle? (Its middle, and eight points round it.) */
function wets(x: number, y: number, r: number): boolean {
  const m = currentMap();
  if (shallowAt(m, x, y)) return true;
  for (let i = 0; i < 8; i++) for (const k of [0.5, 0.95]) if (shallowAt(m, x + Math.cos((i * Math.PI) / 4) * r * k, y + Math.sin((i * Math.PI) / 4) * r * k)) return true;
  return false;
}

/** Frost lands on (x, y), `r` round: the shallows in it ice over (a patch already there covering it keeps on). */
export function iceAt(fx: WorldFx | undefined, x: number, y: number, r: number, now: number, ev: FightEvent[]): void {
  if (!fx || !wets(x, y, r)) return;
  const over = fx.ices.find((i) => live(i, now) && Math.hypot(x - i.x, y - i.y) + r <= i.r + 0.3);
  if (over) return void (over.until = Math.max(over.until, now + ICE.time));
  fx.ices.push({ id: ++fx.iceSeq, x, y, r, at: now, until: now + ICE.time });
  if (fx.ices.length > ICE.max) fx.ices.shift();
  ev.push({ k: 'iced', x, y, r });
}

/** Frost on a goblin (a tap, a chill, a freeze) wading: a small patch round it. */
export const iceOn = (fx: WorldFx | undefined, e: Enemy, now: number, ev: FightEvent[]) => (e.z ?? 0) === 0 && iceAt(fx, e.x, e.y, ICE.tapR + e.radius * 0.5, now, ev);

/** Fire on (x, y): ice there melts (the steam is the caller's). True if any did. */
export function meltAt(fx: WorldFx | undefined, x: number, y: number, pad: number, now: number, ev: FightEvent[]): boolean {
  const hit = fx?.ices.filter((i) => live(i, now) && Math.hypot(x - i.x, y - i.y) <= i.r + pad) ?? [];
  for (const i of hit) fx!.ices.splice(fx!.ices.indexOf(i), 1), ev.push({ k: 'thaw', x: i.x, y: i.y });
  return hit.length > 0;
}

/** Each tick, before the goblins move: patches gone, and who's held on what's left. */
export function stepIce(fx: WorldFx, enemies: Enemy[], now: number): void {
  if (fx.ices.length) fx.ices = fx.ices.filter((i) => live(i, now));
  for (const e of enemies) {
    const on = fx.ices.length > 0 && !isDead(e) && (e.z ?? 0) === 0 && !e.under && iceUnder(fx.ices, e.x, e.y, now);
    if (on || e.onIce) e.onIce = on;
  }
}
