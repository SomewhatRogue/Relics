/**
 * The Rogue's other skills. VANISH: smoke at their feet, and no goblin sees them, even close, till it
 * clears or they strike; a blow wound up at them is dropped, and small goblins in the smoke cough.
 * KNIFE FAN: a shotgun of knives, each its own shot, hardest up close.
 */
import { KNIVES, VANISH, type Augment, type Swing } from '../shared/tuning';
import { shoot } from './bolts';
import { held, isDead } from './damage';
import { knack } from './gearstats';
import type { Smoke } from './flasks';
import type { Bolt, Enemy, FightEvent, Hero } from './types';
import { stun } from './stuns';

export function vanish(h: Hero, enemies: Enemy[], smokes: Smoke[], now: number, ev: FightEvent[]): void {
  h.vanishUntil = now + VANISH.time;
  smokes.push({ x: h.x, y: h.y, until: now + VANISH.time, soft: true });
  ev.push({ k: 'vanish', x: h.x, y: h.y });
  for (const e of enemies) {
    if (isDead(e)) continue;
    // Lost you: anything winding up at you lets it go.
    if (e.attack && e.attack.aimed === h.id && e.attack.t < e.attack.windup) Object.assign(e, { attack: null, act: 'chase', actT: 0 });
    if (e.weight <= 1 && !held(e, now) && Math.hypot(e.x - h.x, e.y - h.y) <= VANISH.radius + e.radius) stun(e, h.id, now, VANISH.cough, ev, 'flinch');
  }
}

/** Unseen: no goblin can find this hero now. */
export const vanished = (h: Hero, now: number) => (h.vanishUntil ?? -9) > now;

/** SHARP RETURN (knack 'sharp'): the multiplier on this blow, out of a vanish (`out`) or the first from smoke (spent). */
export function sharpBlow(h: Hero, out: boolean, now: number): number {
  const k = knack(h, 'sharp');
  if (!k) return 1;
  const smoke = !!h.sharpReady && h.hiddenUntil > now;
  if (!out && !smoke) return 1;
  h.sharpReady = false;
  return 1 + k;
}

const KNIFE: Swing = { windup: 0, active: 0, recover: 0, dmg: KNIVES.dmg, range: KNIVES.range, arc: 0, lunge: 0, knock: KNIVES.knock, shot: 'knife', speed: KNIVES.speed };

/** A fan knife's damage, `b.travelled` tiles out: full up close, falling off to the far end. */
export function fallDmg(b: Pick<Bolt, 'fall' | 'travelled' | 'range' | 'dmg'>): number {
  const f = b.fall;
  if (!f) return b.dmg;
  const k = Math.max(0, Math.min(1, (b.travelled - f.at) / Math.max(0.01, b.range - f.at)));
  return Math.max(1, Math.round(f.near + (f.far - f.near) * k));
}

/** The knife fan, a shotgun: KNIVES.count shots spread evenly across KNIVES.spread either side of the facing. */
export function knifeFan(h: Hero, el: Augment, mult: number, ev: FightEvent[]): Bolt[] {
  ev.push({ k: 'knives', x: h.x, y: h.y });
  const out: Bolt[] = [];
  for (let i = 0; i < KNIVES.count; i++) {
    const a = -KNIVES.spread + (2 * KNIVES.spread * i) / (KNIVES.count - 1), c = Math.cos(a), s = Math.sin(a);
    const k = shoot({ ...h, fx: h.fx * c - h.fy * s, fy: h.fx * s + h.fy * c }, KNIFE, el, mult);
    k.fall = { at: KNIVES.full, near: k.dmg, far: Math.max(1, Math.round(KNIVES.far * mult)) };
    out.push(k);
  }
  return out;
}
