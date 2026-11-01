/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, parry, roll). */
import { FLINCH, GUARD, HERO, HITSTOP, HURT_STAGGER, WEAPONS, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { frozen, isDummy, kill, stunOf } from './damage';
import { shatter } from './elements';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

export { respawnOf, stunOf } from './damage';

export const inArc = (ox: number, oy: number, fx: number, fy: number, x: number, y: number, range: number, arc: number, r: number) => {
  const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy);
  if (d - r > range) return false;
  if (d < r + 0.2) return true;
  // The target's own size widens the arc a little, so a thrust can graze a big body.
  const widen = Math.atan2(r, d);
  return Math.acos(Math.max(-1, Math.min(1, (dx * fx + dy * fy) / d))) <= ((arc / 2) * Math.PI) / 180 + widen;
};

/** The hero's swing during its active frames: each enemy is hit at most once per swing. */
export function hitEnemy(h: Hero, s: Swing, e: Enemy, now: number, ev: FightEvent[]): void {
  if (e.act === 'dead' || h.hitIds.includes(e.id)) return;
  if (!inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, s.range, s.arc, e.radius)) return;
  h.hitIds.push(e.id);
  const heavy = h.counter || h.heavy || s.knock >= 7;
  // From behind: the hero stands where the enemy's facing points away (dummies have no back).
  const tx = h.x - e.x, ty = h.y - e.y, tl = Math.hypot(tx, ty) || 1;
  const rear = !isDummy(e) && (e.fx * tx + e.fy * ty) / tl < GUARD.rearCos;
  const rearMult = rear ? (WEAPONS[h.weapon].backstab ?? GUARD.rearMult) : 1;
  const ice = frozen(e, now);
  const mult = (h.counter ? GUARD.counterMult : e.act === 'stunned' || e.act === 'pinned' || ice ? GUARD.stunnedMult : 1) * rearMult;
  const n = Math.round(s.dmg * mult);
  e.hp -= n;
  e.hitAt = now;
  const stop = h.counter ? HITSTOP.parry : heavy ? HITSTOP.heavy : HITSTOP.light;
  h.hitstop = Math.max(h.hitstop, stop);
  e.hitstop = Math.max(e.hitstop, stop);
  // A blow sweeping all round (the healer's blessing) throws outward; anything else, along the swing.
  const ring = s.arc >= 360, dl = Math.hypot(e.x - h.x, e.y - h.y) || 1;
  const kx = ring ? (e.x - h.x) / dl : h.fx, ky = ring ? (e.y - h.y) / dl : h.fy;
  if (e.act !== 'pinned' && e.act !== 'carried') shove(e, kx, ky, s.knock + (h.counter ? 5 : 0), e.weight);
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter, backstab: rear && rearMult >= 2 });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    if (ice && heavy) shatter(e, now, ev);
    return;
  }
  if (e.hp <= 0) return kill(e, ev);
  // A heavy blow breaks the frozen.
  if (ice && heavy) return shatter(e, now, ev);
  // Light goblins flinch out of their wind-up on any hit; the butcher only to a strong heavy.
  const big = h.heavy && h.power >= 0.7;
  if (e.act !== 'stunned' && e.act !== 'pinned' && e.act !== 'carried' && !ice && (e.kind === 'scrapper' || big)) {
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: big && e.kind === 'butcher' ? 0.6 : FLINCH });
  }
}

/** Is this hero inside the attack's shape? */
export function attackCovers(a: EnemyAttack, h: Hero): boolean {
  if (a.kind === 'slam') return Math.hypot(h.x - a.cx, h.y - a.cy) <= a.radius + HERO.radius;
  return inArc(a.ox, a.oy, a.dx, a.dy, h.x, h.y, a.range, a.arc, HERO.radius);
}

/** An enemy's attack lands on a hero: rolled through, parried, blocked, or taken. */
export function hitHero(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  if (h.act === 'down' || !attackCovers(a, h)) return;
  const w = WEAPONS[h.weapon];
  if (h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= w.dodge.iTo + h.lenience) {
    ev.push({ k: 'dodge', x: h.x, y: h.y });
    return;
  }
  const tx = e.x - h.x, ty = e.y - h.y, tl = Math.hypot(tx, ty) || 1;
  // Pushed away from where the blow came from (the slam's centre for a slam).
  const sx = a.kind === 'slam' ? h.x - a.cx : -tx, sy = a.kind === 'slam' ? h.y - a.cy : -ty, sl = Math.hypot(sx, sy) || 1;
  // The kit's guard covers an arc in front: a shield covers nearly everything ahead.
  const facing = (h.fx * tx + h.fy * ty) / tl > Math.cos(((w.guardArc / 2) * Math.PI) / 180);
  const canGuard = !a.unblockable && facing && (h.act === 'idle' || h.act === 'attack' || h.act === 'charge');
  if (canGuard && now - h.parryOpenAt <= w.parryWindow + h.lenience) {
    h.counterUntil = now + GUARD.counterWindow;
    h.parryOpenAt = -9;
    h.hitstop = Math.max(h.hitstop, HITSTOP.parry);
    e.hitstop = HITSTOP.parry;
    Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: stunOf(e) });
    shove(e, tx / tl, ty / tl, 4, e.weight);
    ev.push({ k: 'parry', x: (h.x + e.x) / 2, y: (h.y + e.y) / 2 });
    ev.push({ k: 'stunned', x: e.x, y: e.y });
    return;
  }
  if (canGuard && h.blocking) {
    const chip = Math.round(a.dmg * w.chip);
    h.hp -= chip;
    h.stamina -= a.dmg * GUARD.staminaPerDmg * w.guardCost;
    h.staminaAt = now;
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    shove(h, sx / sl, sy / sl, a.knock * 0.4, HERO.weight);
    if (h.stamina <= 0) {
      Object.assign(h, { stamina: 0, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
      ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    } else ev.push({ k: 'block', x: h.x, y: h.y });
    return downIfDead(h, ev);
  }
  h.hp -= a.dmg;
  Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER + a.knock * 0.012 });
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  shove(h, sx / sl, sy / sl, a.knock, HERO.weight);
  ev.push({ k: 'hit', x: h.x, y: h.y, n: a.dmg, heavy: a.dmg >= 25, on: 'hero' });
  downIfDead(h, ev);
}

function downIfDead(h: Hero, ev: FightEvent[]): void {
  if (h.hp > 0) return;
  Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn, kvx: 0, kvy: 0 });
  ev.push({ k: 'down', x: h.x, y: h.y });
}
