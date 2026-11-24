/**
 * HEARTSEEKER, the Ranger's third skill (Kyle, 2026-11-23, in Send the Hound's place; the id 'sic' kept for saves):
 * the skill's wind-up is the aim, standing still; then one heavy arrow at the goblin you face, through a
 * shield-bearer's board as a full draw goes. The single-target answer to Volley's crowd. Numbers: shared/skillkit.ts.
 */
import { HEARTSEEKER, type Augment, type Swing } from '../shared/tuning';
import { shoot } from './bolts';
import type { Bolt, FightEvent, Hero } from './types';

const ARROW: Swing = { windup: 0, active: 0, recover: 0, dmg: HEARTSEEKER.dmg, range: HEARTSEEKER.range, arc: 0, lunge: 0, knock: HEARTSEEKER.knock, shot: 'arrow', speed: HEARTSEEKER.speed };

export function heartseeker(h: Hero, el: Augment, mult: number, ev: FightEvent[]): Bolt {
  const b = shoot(h, ARROW, el, mult);
  b.charged = true;
  ev.push({ k: 'sic', x: h.x, y: h.y });
  return b;
}
