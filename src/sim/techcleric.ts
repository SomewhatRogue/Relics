/**
 * The Cleric's techniques in the room (numbers: shared/techniques.ts). MENDING HANDS: a friend comes
 * up faster (sim/party.ts asks `raiseRate`). SANCTUARY STEP: blessed ground moves with the Cleric who
 * cast it for a few seconds. JUDGEMENT: a Cleric's blow on a goblin attacking a friend stuns it, one
 * hero's stun on one goblin once every 6 s at most (sim/stuns.ts).
 */
import { JUDGEMENT, MENDING, SANCT_STEP, knowsTech } from '../shared/techniques';
import { isDead } from './damage';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero, Zone } from './types';

/** How much faster this hero gets a friend up. */
export const raiseRate = (h: Hero) => (knowsTech(h, 'mending') ? MENDING.rate : 1);

/** Blessed ground just cast: with SANCTUARY STEP it follows its Cleric a while, kept where it was cast from them. */
export function stepGround(z: Zone, h: Hero, now: number, ev: FightEvent[]): Zone {
  if (!knowsTech(h, 'sanctstep')) return z;
  ev.push({ k: 'sanctstep', x: h.x, y: h.y });
  return Object.assign(z, { follow: now + SANCT_STEP.follow, ox: z.x - h.x, oy: z.y - h.y });
}

/** Each tick: blessed ground still following moves with its Cleric (not while they're down). */
export function followGround(zones: Zone[], heroes: Hero[], now: number): void {
  for (const z of zones) {
    if (z.kind || (z.follow ?? 0) <= now) continue;
    const h = heroes.find((o) => o.id === z.owner);
    if (!h || h.act === 'down') continue;
    z.x = h.x + (z.ox ?? 0);
    z.y = h.y + (z.oy ?? 0);
  }
}

/** Its blow is meant for someone on your side who isn't you, and hasn't finished landing. */
const atFriend = (h: Hero, e: Enemy) => {
  const a = e.attack;
  return !!a && !!a.aimed && a.aimed !== h.id && a.t <= a.windup + a.active;
};

/** JUDGEMENT: a Cleric's blow on a goblin that's attacking a friend. True if it stunned it. */
export function judge(h: Hero, e: Enemy, now: number, ev: FightEvent[]): boolean {
  if (isDead(e) || !atFriend(h, e) || !knowsTech(h, 'judgement')) return false;
  if (!daze(e, JUDGEMENT.stun * (e.kind === 'butcher' ? JUDGEMENT.big : 1), h.id, now, ev)) return false;
  ev.push({ k: 'judged', x: e.x, y: e.y });
  return true;
}
