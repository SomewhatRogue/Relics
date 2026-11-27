/**
 * Strings of blows and the held swing (docs/design/foe-patterns.md, slice 1; Kyle, 2026-11-27: "more interesting
 * attack patterns ... a bit harder"). A scrapper's stab can run on into a second stab and a lunge, a heavy's swing
 * into another, a butcher's cleave into the slam: each with its own telegraph, the last a beat late. A big goblin's
 * cleave can hold full a moment before it lands. All by the room's Rng, so every screen sees the same.
 */
import { CHAINS, HOLD } from '../shared/foepatterns';
import type { Rng } from '../shared/rng';
import { begin } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/** Which string a goblin can throw, if any (not the wood's drilled ones, a boss of the kit, or a fury). */
function chainOf(e: Enemy) {
  if (e.drill || e.boss || e.fury) return null;
  if (e.kind === 'butcher') return CHAINS.butcher;
  if (e.variant === 'heavy') return CHAINS.heavy;
  if (e.kind === 'scrapper' && !e.variant) return CHAINS.scrapper;
  return null;
}

/** A blow just begun in reach: maybe the start of a string, maybe a held swing. */
export function chainUp(e: Enemy, rng: Rng): void {
  const a = e.attack;
  if (!a || e.act !== 'attack') return;
  const c = chainOf(e);
  // (A fresh blow from a goblin's own choice: any string it was in, broken by a stagger or a stun, is gone.)
  e.strung = undefined;
  if (c && !e.strung && rng.next() < c.chance) (e.strung = c.then.map((s) => ({ ...s }))), (a.recover *= CHAINS.quick);
  // (A big one's cleave: full, then held, shaking, for a moment you can't count.)
  if (a.kind === 'cleave' && (e.kind === 'butcher' || e.variant === 'heavy') && !e.drill && rng.next() < HOLD.chance) {
    const hold = HOLD.least + rng.next() * (HOLD.most - HOLD.least);
    (a.windup += hold), (a.hold = hold);
  }
}

/** A blow of a string over: the next, at the same hero, if they're still up and near. True if one began. */
export function nextInChain(e: Enemy, heroes: Hero[], ev: FightEvent[]): boolean {
  const step = e.strung?.shift(), aimed = e.attack?.aimed;
  if (!step) return (e.strung = undefined), false;
  const t = heroes.find((h) => h.id === aimed && h.hp > 0 && h.act !== 'down');
  if (!t || Math.hypot(t.x - e.x, t.y - e.y) > 4) return (e.strung = undefined), false;
  begin(e, step.kind, step.spec, t, ev);
  if (!e.attack || e.act !== 'attack') return (e.strung = undefined), false;
  if (e.strung!.length) e.attack.recover *= CHAINS.quick;
  else (e.attack.windup *= CHAINS.late), (e.strung = undefined);
  return true;
}
