/**
 * Foe patterns, slice 3 (docs/design/foe-patterns.md): thrown stones and fire pots from scrappers out of reach, a
 * heavy's drag, the whirl, and archers loosing together. Each begins an ordinary attack (its telegraph, its rules);
 * the numbers are in shared/foepatterns.ts. By the room's Rng.
 */
import { DRAG, POT, STONE, VOLLEY_CALL, WHIRL } from '../shared/foepatterns';
import type { Rng } from '../shared/rng';
import { ARCHER } from '../shared/tuning';
import { fleeing } from './chase';
import { begin } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

const plain = (e: Enemy) => !e.drill && !e.boss && !e.fury;

/** Out of reach, on its level, facing you and ready: a stone, a pot, or a heavy's drag. True if it began one. */
export function throwAt(e: Enemy, t: Hero, d: number, facing: number, rng: Rng, now: number, ev: FightEvent[]): boolean {
  // (Not at a hero running from it: that's a chase, sim/chase.ts, its sprint the answer.)
  if (!plain(e) || e.cooldown > 0 || facing < 0.9 || t.act === 'down' || fleeing(t, e)) return false;
  // (Now and then, not every time it's ready: a scrapper that only threw would never come in.)
  if (now - (e.threwAt ?? -99) < STONE.every) return false;
  const threw = () => !!e.attack && ((e.threwAt = now), true);
  if (e.kind === 'scrapper' && !e.variant) {
    if (d >= POT.from && d <= POT.to && rng.next() < POT.chance) {
      begin(e, 'lob', POT.spec, t, ev);
      if (e.attack) (e.attack.cx = t.x), (e.attack.cy = t.y), (e.attack.pot = true);
      return threw();
    }
    if (d >= STONE.from && d <= STONE.to && rng.next() < STONE.chance) return begin(e, 'shot', STONE.spec, t, ev), e.attack && (e.attack.stone = true), threw();
  }
  if (e.variant === 'heavy' && d >= DRAG.from && d <= DRAG.to && rng.next() < DRAG.chance) return begin(e, 'stab', DRAG.spec, t, ev), e.attack && (e.attack.crush = true), threw();
  return false;
}

/** In reach: a heavy or butcher may whirl instead. True if it began. */
export function whirlAt(e: Enemy, t: Hero, rng: Rng, ev: FightEvent[]): boolean {
  if (!plain(e) || !(e.kind === 'butcher' || e.variant === 'heavy') || rng.next() >= WHIRL.chance) return false;
  begin(e, 'slam', WHIRL.first, t, ev);
  if (!e.attack) return false;
  e.attack.spin = true;
  e.strung = [{ kind: 'slam', spec: WHIRL.next, even: true, spin: true }, { kind: 'slam', spec: { ...WHIRL.next, recover: WHIRL.dizzy }, even: true, spin: true }];
  return true;
}

/** An archer just began a shot at `t`: the others near it that are ready may loose with it, at the same hero. */
export function volleyWith(e: Enemy, t: Hero, others: Enemy[], rng: Rng, ev: FightEvent[]): void {
  if (!e.attack || rng.next() >= VOLLEY_CALL.chance) return;
  for (const o of others) {
    if (o === e || !o.bow || o.act !== 'chase' || o.hp <= 0 || o.cooldown > VOLLEY_CALL.ready || o.alert === false) continue;
    if (Math.hypot(o.x - e.x, o.y - e.y) > VOLLEY_CALL.near || Math.hypot(t.x - o.x, t.y - o.y) > ARCHER.reach) continue;
    begin(o, 'shot', ARCHER.shot, t, ev);
  }
}

/** A whirling goblin turns as it goes (drawing reads its facing; the ring's the same all round). */
export function spinOn(e: Enemy, dt: number): void {
  if (!e.attack?.spin) return;
  const a = Math.atan2(e.fy, e.fx) + WHIRL.spin * dt;
  (e.fx = Math.cos(a)), (e.fy = Math.sin(a));
}
