/**
 * The Rogue's SMOKE BOMB (numbers in shared/skillkit.ts SMOKEBOMB) and the smoke's rules for goblins,
 * on top of the old ones (sim/flasks.ts: anyone standing in smoke is hidden unless a goblin is close).
 * A goblin standing in smoke sees nobody at all (`smokeBlind`, read by sim/enemies.ts): it stumbles about, the
 * big ones swinging blind (`stumbleBlind`). A blow it had wound up at anyone is dropped, and so is one wound up
 * from outside at someone hidden in it (unless close), an archer's shot too: it's lost you.
 */
import { POTION, SMOKEBOMB } from '../shared/tuning';
import { isDead } from './damage';
import { begin, walk } from './enemies';
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

/** In smoke, a goblin sees nobody, not even close (Kyle, 2026-11-23). */
export const smokeBlind = (e: Enemy, _d: number, now: number) => (e.smokedUntil ?? -9) > now;

/** A blind swing's mark: no one (so the smoke never drops it, and nobody's aimed at). */
const NOBODY = { id: '', x: 0, y: 0 } as unknown as Hero;

/**
 * A goblin in smoke with nothing to go for: it stumbles about, turning every `turn` s; a big one
 * (`blindWeight` up) swings blind where it faces every `blindEvery` s, its usual red telegraph and all.
 */
export function stumbleBlind(e: Enemy, now: number, dt: number, ev: FightEvent[]): void {
  const k = Math.floor(now / SMOKEBOMB.turn + e.id * 0.61), a = Math.sin(k * 12.9898 + e.id * 4.1) * Math.PI;
  e.fx = Math.cos(a);
  e.fy = Math.sin(a);
  walk(e, e.fx, e.fy, SMOKEBOMB.stumble, dt);
  if (e.weight < SMOKEBOMB.blindWeight || e.cooldown > 0 || !e.smokeSwing) return;
  begin(e, 'cleave', SMOKEBOMB.blind, { ...NOBODY, x: e.x + e.fx * 2, y: e.y + e.fy * 2 }, ev);
  e.cooldown = SMOKEBOMB.blindEvery;
}

/** Each tick, before the goblins move: who's standing in smoke, and the blows that have lost their mark. */
export function stepSmoke(enemies: Enemy[], heroes: Hero[], smokes: Smoke[], now: number): void {
  if (!smokes.length) return;
  for (const e of enemies) {
    if (isDead(e)) continue;
    const inside = smokes.filter((s) => Math.hypot(s.x - e.x, s.y - e.y) < smokeR(s) + e.radius);
    // (A vanish's smoke at a Rogue's feet blinds as well, but no one swings blind in it.)
    if (inside.length) (e.smokedUntil = now + 0.15), (e.smokeSwing = inside.some((s) => !s.soft));
    const a = e.attack, h = a && a.t < a.windup ? heroes.find((o) => o.id === a.aimed) : undefined;
    if (!a || !h) continue;
    // In the smoke, nothing aimed is kept; from outside it, a blow at someone hidden in it unless they're close.
    if ((e.smokedUntil ?? -9) > now || (h.hiddenUntil > now && Math.hypot(h.x - e.x, h.y - e.y) >= POTION.seen)) Object.assign(e, { attack: null, act: 'chase', actT: 0 });
  }
}
