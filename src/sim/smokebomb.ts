/**
 * The Rogue's SMOKE BOMB (numbers in shared/skillkit.ts SMOKEBOMB) and the smoke's rules for goblins,
 * on top of the old ones (sim/flasks.ts: anyone standing in smoke is hidden unless a goblin is close).
 * A goblin standing in smoke sees nobody beyond arm's reach either (`smokeBlind`, read by sim/enemies.ts),
 * and a blow wound up across the smoke's edge, an archer's shot too, is dropped: it's lost you.
 */
import { POTION, SMOKEBOMB } from '../shared/tuning';
import { isDead } from './damage';
import { spotFor } from './facing';
import type { Smoke } from './flasks';
import type { Bolt, Enemy, FightEvent, Hero, Intent } from './types';

/** Thrown: it flies to the spot (sim/flasks.ts lands it) and smokes there. */
export function throwSmoke(h: Hero, enemies: Enemy[], aim: Intent | undefined, now: number, ev: FightEvent[]): Bolt {
  const t = spotFor(h, enemies, aim, SMOKEBOMB.range, SMOKEBOMB.fallback), dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy) || 1;
  ev.push({ k: 'smokebomb', x: h.x, y: h.y });
  return {
    id: -Math.floor(now * 1000) - 7, owner: h.id, kind: 'flask', x: h.x, y: h.y, dx: dx / d, dy: dy / d, speed: 0, range: d, travelled: 0,
    dmg: 0, knock: 0, pierce: false, burst: 0, el: '', hit: [], stun: 0, traits: [], sx: h.x, sy: h.y, tx: t.x, ty: t.y, t: 0, flight: SMOKEBOMB.flight,
    state: 'fly', life: 0, potion: 'smoke', relic: true, smokeR: SMOKEBOMB.radius, smokeTime: SMOKEBOMB.time,
  };
}

/** How far a smoke reaches. */
export const smokeR = (s: Smoke) => s.r ?? POTION.smokeR;

/** In smoke, a goblin sees nobody further than close. */
export const smokeBlind = (e: Enemy, d: number, now: number) => (e.smokedUntil ?? -9) > now && d >= POTION.seen;

/** Each tick, before the goblins move: who's standing in smoke, and the blows that have lost their mark. */
export function stepSmoke(enemies: Enemy[], heroes: Hero[], smokes: Smoke[], now: number): void {
  if (!smokes.length) return;
  for (const e of enemies) {
    if (isDead(e)) continue;
    if (smokes.some((s) => Math.hypot(s.x - e.x, s.y - e.y) < smokeR(s) + e.radius)) e.smokedUntil = now + 0.15;
    const a = e.attack, h = a && a.t < a.windup ? heroes.find((o) => o.id === a.aimed) : undefined;
    if (!a || !h || Math.hypot(h.x - e.x, h.y - e.y) < POTION.seen) continue;
    if ((e.smokedUntil ?? -9) > now || h.hiddenUntil > now) Object.assign(e, { attack: null, act: 'chase', actT: 0 });
  }
}
