/**
 * Potions in the fight: drinking (Bitter heals over time, Brandy hits harder but slows you) and thrown flasks
 * (oil bursts into flame, frost chills, smoke hides whoever stands in it from goblins).
 */
import { cure } from './poison';
import { POTION, POTIONS } from '../shared/tuning';
import { blast } from './bolts';
import type { World } from './elements';
import type { Bolt, Hero } from './types';

export interface Smoke { x: number; y: number; until: number }

/**
 * Drink or throw the potion at the front of the belt. A flask flies to (ax, ay) from the hero: where
 * they aim, or (no aim, on a phone) the nearest goblin in range, or a few tiles ahead.
 */
export function usePotion(h: Hero, now: number, w: World, ax: number, ay: number): Bolt | null {
  const p = h.belt[0];
  if (!p || now < h.potionReady || h.act === 'down') return null;
  h.belt.shift();
  h.potionReady = now + POTION.cooldown;
  w.ev.push({ k: 'drink', x: h.x, y: h.y, kind: p });
  // A Bitter mends, and cures poison outright.
  if (p === 'bitter') return (h.mendLeft = POTION.heal), cure(h, true, w.ev), null;
  // Wall Brandy: harder blows, slower feet, half the breath (sim/brandy.ts), for a while.
  if (p === 'brandy') return (h.brandyUntil = now + POTION.brandyTime), null;
  let d = Math.hypot(ax, ay);
  if (!d) {
    const near = w.enemies.filter((e) => e.hp > 0 && e.act !== 'dead' && Math.hypot(e.x - h.x, e.y - h.y) < POTION.range).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    [ax, ay] = near ? [near.x - h.x, near.y - h.y] : [h.fx * POTION.fallback, h.fy * POTION.fallback];
    d = Math.hypot(ax, ay) || 1;
  }
  const dist = Math.min(POTION.range, Math.max(1, d)), tx = h.x + (ax / d) * dist, ty = h.y + (ay / d) * dist;
  return {
    id: -Math.floor(now * 1000) - 1, owner: h.id, kind: 'flask', x: h.x, y: h.y, dx: ax / d, dy: ay / d, speed: 0, range: dist, travelled: 0,
    dmg: p === 'smoke' ? 0 : POTION.dmg, knock: 2, pierce: false, burst: p === 'smoke' ? 0 : POTION.burst, el: p === 'oil' ? 'fire' : p === 'frost' ? 'frost' : '',
    hit: [], stun: 0, traits: [], sx: h.x, sy: h.y, tx, ty, t: 0, flight: POTION.flight, state: 'fly', life: 0, potion: p,
  };
}

/** A flask in the air: lands at its spot, then bursts (oil, frost) or smokes. */
export function stepFlask(b: Bolt, w: World, dt: number, smokes: Smoke[]): boolean {
  b.t += dt;
  const k = Math.min(1, b.t / b.flight);
  b.x = b.sx + (b.tx - b.sx) * k;
  b.y = b.sy + (b.ty - b.sy) * k;
  if (k < 1) return true;
  if (b.potion === 'smoke') {
    smokes.push({ x: b.x, y: b.y, until: w.now + POTION.smokeTime });
    w.ev.push({ k: 'smoke', x: b.x, y: b.y });
  } else blast(w, b, b.x, b.y);
  return false;
}

/** Each tick: a Bitter mends, smoke hides, smoke thins. */
export function stepPotions(heroes: Hero[], smokes: Smoke[], now: number, dt: number): Smoke[] {
  for (const h of heroes) {
    if (h.mendLeft > 0 && h.act !== 'down') {
      const n = Math.min(h.mendLeft, (POTION.heal / POTION.healTime) * dt);
      h.mendLeft -= n;
      h.hp = Math.min(h.maxHp, h.hp + n);
    }
    if (smokes.some((s) => Math.hypot(s.x - h.x, s.y - h.y) < POTION.smokeR)) h.hiddenUntil = now + 0.15;
  }
  return smokes.filter((s) => s.until > now);
}

/** Can a goblin at distance `d` see this hero? Not through smoke, unless close. */
export const visible = (h: Hero, d: number, now: number) => h.hiddenUntil <= now || d < POTION.seen;
export const potionName = (p: keyof typeof POTIONS) => POTIONS[p].name;
