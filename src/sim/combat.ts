/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, parry, roll). */
import { BUTCHER, COMBO, GUARD, HERO, HITSTOP, HURT_STAGGER, ROLL, SWING_DUMMY } from '../shared/tuning';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

const inArc = (ox: number, oy: number, fx: number, fy: number, x: number, y: number, range: number, arc: number, r: number) => {
  const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy);
  if (d - r > range) return false;
  if (d < r + 0.2) return true;
  return (dx * fx + dy * fy) / d >= Math.cos(((arc / 2) * Math.PI) / 180);
};

/** The hero's swing during its active frames: each enemy is hit at most once per swing. */
export function hitEnemy(h: Hero, e: Enemy, now: number, ev: FightEvent[]): void {
  if (e.act === 'dead' || h.hitIds.includes(e.id)) return;
  const s = COMBO[h.combo];
  if (!inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, s.range, s.arc, e.radius)) return;
  h.hitIds.push(e.id);
  const heavy = h.counter || h.combo === COMBO.length - 1;
  const n = Math.round(s.dmg * (h.counter ? GUARD.counterMult : 1));
  e.hp -= n;
  e.hitAt = now;
  const stop = h.counter ? HITSTOP.parry : heavy ? HITSTOP.heavy : HITSTOP.light;
  h.hitstop = Math.max(h.hitstop, stop);
  e.hitstop = Math.max(e.hitstop, stop);
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter });
  if (e.kind === 'dummy' || e.kind === 'swingDummy') {
    if (e.hp <= 0) e.hp = e.maxHp;
    return;
  }
  if (e.hp <= 0) {
    e.hp = 0;
    e.act = 'dead';
    e.actT = 0;
    e.actDur = BUTCHER.respawn;
    e.attack = null;
    ev.push({ k: 'death', x: e.x, y: e.y });
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
  if (h.act === 'roll' && h.actT >= ROLL.iFrom && h.actT <= ROLL.iTo + h.lenience) {
    ev.push({ k: 'dodge', x: h.x, y: h.y });
    return;
  }
  const tx = e.x - h.x, ty = e.y - h.y, tl = Math.hypot(tx, ty) || 1;
  const facing = (h.fx * tx + h.fy * ty) / tl > 0.15;
  const canGuard = !a.unblockable && facing && (h.act === 'idle' || h.act === 'attack');
  if (canGuard && now - h.parryOpenAt <= GUARD.parryWindow + h.lenience) {
    h.counterUntil = now + GUARD.counterWindow;
    h.parryOpenAt = -9;
    h.hitstop = Math.max(h.hitstop, HITSTOP.parry);
    e.hitstop = HITSTOP.parry;
    e.attack = null;
    e.act = 'stagger';
    e.actT = 0;
    e.actDur = e.kind === 'butcher' ? BUTCHER.parryStagger : SWING_DUMMY.parryStagger;
    ev.push({ k: 'parry', x: (h.x + e.x) / 2, y: (h.y + e.y) / 2 });
    return;
  }
  if (canGuard && h.blocking) {
    const chip = Math.round(a.dmg * GUARD.chip);
    h.hp -= chip;
    h.stamina -= a.dmg * GUARD.staminaPerDmg;
    h.staminaAt = now;
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    push(h, tx / tl, ty / tl, 0.25);
    if (h.stamina <= 0) {
      h.stamina = 0;
      h.act = 'stun';
      h.actT = 0;
      h.actDur = GUARD.guardBreakStun;
      ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    } else ev.push({ k: 'block', x: h.x, y: h.y });
    return downIfDead(h, ev);
  }
  h.hp -= a.dmg;
  h.act = 'hurt';
  h.actT = 0;
  h.actDur = HURT_STAGGER;
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  push(h, tx / tl, ty / tl, 0.6);
  ev.push({ k: 'hit', x: h.x, y: h.y, n: a.dmg, heavy: a.dmg >= 25, on: 'hero' });
  downIfDead(h, ev);
}

function push(h: Hero, towardX: number, towardY: number, d: number): void {
  h.x -= towardX * d;
  h.y -= towardY * d;
}

function downIfDead(h: Hero, ev: FightEvent[]): void {
  if (h.hp > 0) return;
  h.hp = 0;
  h.act = 'down';
  h.actT = 0;
  h.actDur = HERO.respawn;
  ev.push({ k: 'down', x: h.x, y: h.y });
}
