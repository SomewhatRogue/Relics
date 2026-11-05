/**
 * The Ranger's movement ladder, the jump (numbers: shared/ladder.ts). JUMP SHOT: an attack press mid-jump
 * looses the bow at once, part drawn (a crossbow its bolt). TWO SNARES: the jump leaves a pair across
 * it (sim/ranger.ts lays them where `snareSpots` says). HARD LANDING: small goblins beside where you
 * land go over.
 */
import { INPUT_BUFFER, WEAPONS, type Swing } from '../shared/tuning';
import { AIR_SHOT, LANDING, TWIN_SNARE, knowsRung } from '../shared/ladder';
import { shove } from './bodies';
import { isDead, isDummy, small } from './damage';
import { statsOf } from './gearstats';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero } from './types';

/** Mid-jump, a fresh attack press: shoot now (once a jump; a crossbow only with a bolt on). The press is spent. */
export function airShot(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (h.airShot || !knowsRung(h, 'airshot') || h.attackQueuedAt < h.lastRollAt || now - h.attackQueuedAt >= INPUT_BUFFER) return false;
  const w = WEAPONS[h.weapon];
  if (!w.heavy.shot || (w.reloads && h.xbowEmpty)) return false;
  Object.assign(h, { airShot: true, attackQueuedAt: -9, heavy: false, perfect: false });
  // The bolt is gone off a crossbow, as any shot takes it.
  if (w.reloads) Object.assign(h, { xbowEmpty: true, xbowGlint: false, xbowClean: false, xbowWind: 0 });
  ev.push({ k: 'airshot', x: h.x, y: h.y });
  return true;
}

/** The shot loosed mid-jump: the bow's hold at AIR_SHOT.draw of a full draw (a crossbow's bolt is always full). */
export function airSwing(h: Hero): Swing {
  const w = WEAPONS[h.weapon], hv = w.heavy, k = w.reloads ? 1 : AIR_SHOT.draw, more = 1 + statsOf(h).damage;
  return { ...hv, dmg: Math.round((hv.dmg + (hv.dmgFull - hv.dmg) * k) * more), knock: hv.knock + (hv.knockFull - hv.knock) * k, pierce: !!hv.pierce && k >= 1 };
}

/** Where the jump's snares go: where you stood, or (TWO SNARES) a pair across the jump. */
export function snareSpots(h: Hero): [number, number][] {
  if (!knowsRung(h, 'twinsnare')) return [[h.rollX, h.rollY]];
  const half = TWIN_SNARE.apart / 2, px = -h.rollDy, py = h.rollDx;
  return [[h.rollX + px * half, h.rollY + py * half], [h.rollX - px * half, h.rollY - py * half]];
}

/** HARD LANDING: the small goblins within reach of where a jump came down are knocked over. */
export function hardLanding(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  if (!knowsRung(h, 'landing')) return;
  let any = false;
  for (const e of enemies) {
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (isDead(e) || isDummy(e) || !small(e) || (e.z ?? 0) !== (h.z ?? 0) || d > LANDING.r + e.radius) continue;
    if (!stun(e, h.id, now, LANDING.down, ev)) continue;
    shove(e, dx / (d || 1), dy / (d || 1), LANDING.knock, e.weight);
    any = true;
  }
  if (any) ev.push({ k: 'landing', x: h.x, y: h.y, r: LANDING.r });
}
