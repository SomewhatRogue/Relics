/**
 * Carrion crows (numbers: shared/prowlers.ts CROWS): a flock on the dead, not a fighter. Walk near them,
 * or fight near them, and they burst up: anyone close is lost in them a moment (drawn on every screen),
 * and every goblin in earshot wakes to the noise. Creep past and they stay put. They come back to the
 * dead once it's been quiet a while.
 */
import { CROWS } from '../shared/tuning';
import type { Enemy, FightEvent, Hero } from './types';

/** A flock: where it sits, and the room time it went up (-1 settled). */
export interface Flock { id: number; x: number; y: number; up: number }

export const newFlocks = (at: { x: number; y: number }[] = []): Flock[] => at.map((p, i) => ({ id: i + 1, x: p.x, y: p.y, up: -1 }));

/** Once a tick: flocks flushed, the goblins they call, and flocks settling again. */
export function stepCrows(flocks: Flock[], heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const f of flocks) {
    const near = heroes.filter((h) => h.act !== 'down' && h.id !== 'squire');
    if (f.up >= 0) {
      // Quiet a while, nobody close: back down on the dead.
      if (now - f.up > CROWS.settle && near.every((h) => Math.hypot(h.x - f.x, h.y - f.y) > CROWS.near * 2)) f.up = -1;
      continue;
    }
    const walked = near.some((h) => Math.hypot(h.x - f.x, h.y - f.y) <= (h.sneaking && h.act !== 'roll' ? CROWS.creep : CROWS.near));
    const fight = ev.some((v) => (v.k === 'hit' || v.k === 'death' || v.k === 'swing' || v.k === 'shoot') && Math.hypot(v.x - f.x, v.y - f.y) <= CROWS.fight);
    if (!walked && !fight) continue;
    f.up = now;
    ev.push({ k: 'crows', x: f.x, y: f.y });
    for (const h of near) if (Math.hypot(h.x - f.x, h.y - f.y) <= CROWS.cloud) h.crowsUntil = now + CROWS.blind;
    for (const e of enemies) if (e.alert === false && e.act !== 'dead' && Math.hypot(e.x - f.x, e.y - f.y) <= CROWS.call) (e.alert = true), (e.feeding = false), ev.push({ k: 'spotted', x: e.x, y: e.y });
  }
}
