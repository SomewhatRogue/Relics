/** A hero's turn each tick: presses, movement, the combo, the roll, stamina. */
import { collide } from '../shared/arena';
import { COMBO, GUARD, HERO, INPUT_BUFFER, ROLL } from '../shared/tuning';
import type { Enemy, FightEvent, Hero, Intent } from './types';
import { hitEnemy } from './combat';

export function newHero(id: string, x: number, y: number): Hero {
  return {
    id, x, y, fx: 0, fy: 1, moving: false, hp: HERO.hp, stamina: HERO.stamina, staminaAt: -9,
    act: 'idle', actT: 0, actDur: 0, combo: 0, counter: false, hitIds: [], blocking: false,
    parryOpenAt: -9, lastBlockPress: -9, rollDx: 0, rollDy: 1, lastRollAt: -9, counterUntil: -9,
    attackQueuedAt: -9, rollQueuedAt: -9, hitstop: 0, lenience: 0, seen: { attack: 0, block: 0, roll: 0 },
  };
}

const swingTime = (i: number) => COMBO[i].windup + COMBO[i].active + COMBO[i].recover;

function spend(h: Hero, n: number, now: number): void {
  h.stamina = Math.max(0, h.stamina - n);
  h.staminaAt = now;
}

/** Point the hero: aim if given, else where they're moving, else toward the nearest enemy in reach. */
function face(h: Hero, inp: Intent, enemies: Enemy[], snap: boolean): void {
  let x = inp.ax, y = inp.ay;
  if (!x && !y && snap) {
    let best: Enemy | null = null, bd = 3.2;
    for (const e of enemies) {
      if (e.act === 'dead') continue;
      const d = Math.hypot(e.x - h.x, e.y - h.y) - e.radius;
      const ahead = inp.mx || inp.my ? ((e.x - h.x) * inp.mx + (e.y - h.y) * inp.my) / Math.max(0.01, d) : 1;
      if (d < bd && ahead > -0.2) (bd = d), (best = e);
    }
    if (best) (x = best.x - h.x), (y = best.y - h.y);
  }
  if (!x && !y) (x = inp.mx), (y = inp.my);
  const l = Math.hypot(x, y);
  if (l > 0.01) (h.fx = x / l), (h.fy = y / l);
}

export function stepHero(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (inp.attackSeq !== h.seen.attack) (h.seen.attack = inp.attackSeq), (h.attackQueuedAt = now);
  if (inp.rollSeq !== h.seen.roll) (h.seen.roll = inp.rollSeq), (h.rollQueuedAt = now);
  if (inp.blockSeq !== h.seen.block) {
    h.seen.block = inp.blockSeq;
    if (now - h.lastBlockPress >= GUARD.parryRepress) h.parryOpenAt = now;
    h.lastBlockPress = now;
  }
  if (h.hitstop > 0) return void (h.hitstop -= dt);
  if (now - h.staminaAt > HERO.regenDelay) h.stamina = Math.min(HERO.stamina, h.stamina + HERO.staminaRegen * dt);
  h.actT += dt;
  h.moving = false;
  h.blocking = false;

  if (h.act === 'down') {
    if (h.actT >= h.actDur) Object.assign(h, { act: 'idle', hp: HERO.hp, stamina: HERO.stamina, actT: 0 });
    return;
  }
  if (h.act === 'hurt' || h.act === 'stun') {
    if (h.actT >= h.actDur) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  const wantsRoll = now - h.rollQueuedAt < INPUT_BUFFER && now - h.lastRollAt >= ROLL.cooldown && h.stamina >= 1;
  if (h.act === 'roll') {
    const k = ROLL.distance / ROLL.time;
    h.x += h.rollDx * k * dt;
    h.y += h.rollDy * k * dt;
    collide(h, HERO.radius);
    if (h.actT >= ROLL.time) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'attack') {
    const s = COMBO[h.combo];
    if (h.actT < s.windup) {
      const k = s.lunge / s.windup;
      h.x += h.fx * k * dt;
      h.y += h.fy * k * dt;
      collide(h, HERO.radius);
    } else if (h.actT < s.windup + s.active) {
      for (const e of enemies) hitEnemy(h, e, now, ev);
    } else {
      const queued = now - h.attackQueuedAt < INPUT_BUFFER && h.attackQueuedAt > now - h.actT;
      if (queued && h.combo < COMBO.length - 1) return startSwing(h, h.combo + 1, inp, enemies, now, ev);
      if (wantsRoll) return startRoll(h, inp, now, ev);
      if (h.actT >= swingTime(h.combo)) (h.act = 'idle'), (h.actT = 0);
    }
    return;
  }
  // Idle or walking.
  if (wantsRoll) return startRoll(h, inp, now, ev);
  if (now - h.attackQueuedAt < INPUT_BUFFER) return startSwing(h, 0, inp, enemies, now, ev);
  h.blocking = inp.block && h.stamina > 0;
  // Guarding with no aim (a phone) turns to the nearest threat, so a parry faces the right way.
  face(h, inp, enemies, h.blocking || now - h.lastBlockPress < 0.25);
  const m = Math.min(1, Math.hypot(inp.mx, inp.my));
  if (m > 0.05) {
    const sp = HERO.speed * (h.blocking ? HERO.blockSpeed : 1) * m;
    const l = Math.hypot(inp.mx, inp.my);
    h.x += (inp.mx / l) * sp * dt;
    h.y += (inp.my / l) * sp * dt;
    h.moving = true;
    collide(h, HERO.radius);
  }
}

function startSwing(h: Hero, i: number, inp: Intent, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  face(h, inp, enemies, true);
  h.act = 'attack';
  h.actT = 0;
  h.combo = i;
  h.hitIds = [];
  h.attackQueuedAt = -9;
  h.counter = now < h.counterUntil;
  if (h.counter) h.counterUntil = -9;
  ev.push({ k: 'swing', x: h.x, y: h.y });
}

function startRoll(h: Hero, inp: Intent, now: number, ev: FightEvent[]): void {
  let x = inp.mx, y = inp.my;
  if (Math.hypot(x, y) < 0.1) (x = h.fx), (y = h.fy);
  const l = Math.hypot(x, y);
  h.rollDx = x / l;
  h.rollDy = y / l;
  h.fx = h.rollDx;
  h.fy = h.rollDy;
  h.act = 'roll';
  h.actT = 0;
  h.lastRollAt = now;
  h.rollQueuedAt = -9;
  spend(h, ROLL.stamina, now);
  ev.push({ k: 'roll', x: h.x, y: h.y });
}

export { spend };
