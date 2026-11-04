/**
 * Blood and poison on goblins, from the Rogue's kits (numbers: shared/venom.ts). A rapier's perfect
 * thrust skewers: a stagger and a bleed. The poisoner's dart poisons a stack; a perfect one makes the
 * goblin retch first (held fast, still ticking), then its poison ticks harder. Shadowstep stuns the goblin
 * you land behind. The room judges all of it, so a guest's goblins bleed and retch as the leader's do.
 */
import { SKEWER, VENOM, foeKind, venomTakes } from '../shared/tuning';
import { damage, isDead, isDummy, sayWeak } from './damage';
import type { Enemy, FightEvent } from './types';

/** Can be knocked helpless: never a nest, nor a goblin mid striped blow or charge (those carry on). */
export const dazeable = (e: Enemy) =>
  !isDead(e) && e.kind !== 'nest' && e.act !== 'pinned' && e.act !== 'carried' && !(e.attack && (e.attack.unblockable || e.attack.kind === 'charge'));

/** Stunned where it stands this long, if it can be. */
export function daze(e: Enemy, time: number, ev: FightEvent[]): boolean {
  if (!dazeable(e)) return false;
  Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: time, kvx: 0, kvy: 0 });
  ev.push({ k: 'stunned', x: e.x, y: e.y });
  return true;
}

export const bleeding = (e: Enemy, now: number) => (e.bleedUntil ?? 0) > now;
export const envenomed = (e: Enemy, now: number) => (e.venom ?? 0) > 0 && (e.venomUntil ?? 0) > now;

/** A rapier's perfect thrust: run through on the tip. It staggers and bleeds (a nest has no blood). */
export function skewer(e: Enemy, now: number, ev: FightEvent[]): void {
  if (isDead(e) || e.kind === 'nest') return;
  ev.push({ k: 'skewer', x: e.x, y: e.y });
  if (!bleeding(e, now)) e.bleedNext = now + SKEWER.every;
  e.bleedUntil = now + SKEWER.time;
  if (dazeable(e)) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: SKEWER.stagger });
}

/** A dart lands: one more stack (a resistant goblin says so; an immune one takes none). A perfect dart retches it first. */
export function envenom(e: Enemy, perfect: boolean, now: number, ev: FightEvent[]): void {
  if (isDead(e)) return;
  const takes = isDummy(e) ? 1 : venomTakes(foeKind(e));
  if (takes < 1) sayWeak(e, Math.max(0.01, takes), now, ev, 'physical');
  if (takes <= 0) return;
  if (!envenomed(e, now)) (e.venom = 0), (e.venomNext = now + VENOM.every), (e.venomHard = false);
  e.venom = Math.min(VENOM.most, (e.venom ?? 0) + 1);
  e.venomUntil = now + VENOM.time;
  ev.push({ k: 'envenom', x: e.x, y: e.y });
  if (!perfect) return;
  e.venomHard = true;
  const retch = VENOM.puke * takes;
  if (daze(e, retch, ev)) (e.pukeUntil = now + retch), ev.push({ k: 'puke', x: e.x, y: e.y, dx: e.fx, dy: e.fy });
}

/** Once a tick: bleeds and poison tick (a small number each), and wear off. */
export function stepVenom(enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const e of enemies) {
    if (isDead(e)) continue;
    if (bleeding(e, now) && now >= (e.bleedNext ?? 0)) {
      e.bleedNext = now + SKEWER.every;
      if (damage(e, SKEWER.dmg, now, ev, { tick: true, src: 'bleed', how: 'fall' })) continue;
    }
    if (!envenomed(e, now)) {
      if (e.venom) (e.venom = 0), (e.venomHard = false);
      continue;
    }
    if (now < (e.venomNext ?? 0)) continue;
    e.venomNext = now + VENOM.every;
    const takes = isDummy(e) ? 1 : venomTakes(foeKind(e));
    const n = Math.max(1, Math.round(VENOM.dmg * e.venom! * (e.venomHard ? VENOM.hard : 1) * takes));
    damage(e, n, now, ev, { tick: true, src: 'poison', how: 'fall' });
  }
}
