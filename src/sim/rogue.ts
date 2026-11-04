/**
 * The Rogue's other skills. VANISH: smoke at their feet, and no goblin sees them, even close, till it
 * clears or they strike; a blow wound up at them is dropped, and small goblins in the smoke cough.
 * KNIFE FAN: knives thrown wide at once, each its own shot.
 */
import { KNIVES, VANISH, type Augment, type Swing } from '../shared/tuning';
import { shoot } from './bolts';
import { held, isDead } from './damage';
import type { Smoke } from './flasks';
import type { Bolt, Enemy, FightEvent, Hero } from './types';
import { stun } from './stuns';

export function vanish(h: Hero, enemies: Enemy[], smokes: Smoke[], now: number, ev: FightEvent[]): void {
  h.vanishUntil = now + VANISH.time;
  smokes.push({ x: h.x, y: h.y, until: now + VANISH.time });
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

const KNIFE: Swing = { windup: 0, active: 0, recover: 0, dmg: KNIVES.dmg, range: KNIVES.range, arc: 0, lunge: 0, knock: KNIVES.knock, shot: 'knife', speed: KNIVES.speed };

/** The knife fan: KNIVES.count shots spread evenly across KNIVES.spread either side of the facing. */
export function knifeFan(h: Hero, el: Augment, mult: number, ev: FightEvent[]): Bolt[] {
  ev.push({ k: 'knives', x: h.x, y: h.y });
  const out: Bolt[] = [];
  for (let i = 0; i < KNIVES.count; i++) {
    const a = -KNIVES.spread + (2 * KNIVES.spread * i) / (KNIVES.count - 1), c = Math.cos(a), s = Math.sin(a);
    out.push(shoot({ ...h, fx: h.fx * c - h.fy * s, fy: h.fx * s + h.fy * c }, KNIFE, el, mult));
  }
  return out;
}
