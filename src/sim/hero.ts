/**
 * A hero's turn each tick: presses, movement, the weapon's combo, the charged heavy, the roll.
 * A tap of attack swings on release; holding past CHARGE.start charges a heavy instead.
 */
import { collide } from '../shared/arena';
import { CHARGE, GUARD, HERO, HOOK, INPUT_BUFFER, JAVELIN, RELICS, RELIC_ORDER, ROLL, WEAPONS, WEAPON_ORDER, type Swing } from '../shared/tuning';
import { slide } from './bodies';
import { hitEnemy } from './combat';
import type { Enemy, FightEvent, Hero, Intent } from './types';

export function newHero(id: string, x: number, y: number): Hero {
  return {
    id, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, moving: false, hp: HERO.hp, stamina: HERO.stamina, staminaAt: -9, weapon: 'sword',
    act: 'idle', actT: 0, actDur: 0, combo: 0, heavy: false, power: 0, counter: false, hitIds: [], blocking: false,
    parryOpenAt: -9, lastBlockPress: -9, rollDx: 0, rollDy: 1, lastRollAt: -9, counterUntil: -9,
    attackQueuedAt: -9, rollQueuedAt: -9, relic: 'javelin', relicReady: { javelin: 0, hook: 0 }, relicQueuedAt: -9, hitstop: 0, lenience: 0,
    seen: { attack: 0, block: 0, roll: 0, weapon: 0, relic: 0, relicSwap: 0 },
  };
}

/** The swing in progress: a combo step, or the heavy scaled by its charge. */
export function currentSwing(h: Hero): Swing {
  const w = WEAPONS[h.weapon];
  if (!h.heavy) return w.combo[h.combo];
  const k = h.power, hv = w.heavy;
  return { ...hv, dmg: Math.round(hv.dmg + (hv.dmgFull - hv.dmg) * k), knock: hv.knock + (hv.knockFull - hv.knock) * k };
}

const swingTime = (s: Swing) => s.windup + s.active + s.recover;

export function spend(h: Hero, n: number, now: number): void {
  h.stamina = Math.max(0, h.stamina - n);
  h.staminaAt = now;
}

/** Point the hero: aim if given, else toward the nearest enemy in reach (snap), else where they move. */
function face(h: Hero, inp: Intent, enemies: Enemy[], snap: boolean, reach = 3.2): void {
  let x = inp.ax, y = inp.ay;
  if (!x && !y && snap) {
    let best: Enemy | null = null, bd = reach;
    for (const e of enemies) {
      if (e.act === 'dead') continue;
      // Goblins before training dummies.
      const d = Math.hypot(e.x - h.x, e.y - h.y) - e.radius + (e.kind === 'dummy' || e.kind === 'swingDummy' ? 2.5 : 0);
      const ahead = inp.mx || inp.my ? ((e.x - h.x) * inp.mx + (e.y - h.y) * inp.my) / Math.max(0.01, d) : 1;
      if (d < bd && ahead > -0.2) (bd = d), (best = e);
    }
    if (best) (x = best.x - h.x), (y = best.y - h.y);
  }
  if (!x && !y) (x = inp.mx), (y = inp.my);
  const l = Math.hypot(x, y);
  if (l > 0.01) (h.fx = x / l), (h.fy = y / l);
}

function walk(h: Hero, inp: Intent, k: number, dt: number): void {
  const m = Math.min(1, Math.hypot(inp.mx, inp.my));
  if (m < 0.05) return;
  const l = Math.hypot(inp.mx, inp.my), sp = HERO.speed * k * m;
  h.x += (inp.mx / l) * sp * dt;
  h.y += (inp.my / l) * sp * dt;
  h.moving = true;
}

export function stepHero(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], fire: (h: Hero) => void): void {
  if (inp.relicSeq !== h.seen.relic) (h.seen.relic = inp.relicSeq), (h.relicQueuedAt = now);
  if (inp.relicSwapSeq !== h.seen.relicSwap) {
    h.seen.relicSwap = inp.relicSwapSeq;
    h.relic = RELIC_ORDER[(RELIC_ORDER.indexOf(h.relic) + 1) % RELIC_ORDER.length];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: RELICS[h.relic].name });
  }
  if (inp.attackSeq !== h.seen.attack) (h.seen.attack = inp.attackSeq), (h.attackQueuedAt = now);
  if (inp.rollSeq !== h.seen.roll) (h.seen.roll = inp.rollSeq), (h.rollQueuedAt = now);
  if (inp.blockSeq !== h.seen.block) {
    h.seen.block = inp.blockSeq;
    if (now - h.lastBlockPress >= GUARD.parryRepress) h.parryOpenAt = now;
    h.lastBlockPress = now;
  }
  if (inp.weaponSeq !== h.seen.weapon) {
    h.seen.weapon = inp.weaponSeq;
    if (h.act === 'idle') {
      h.weapon = WEAPON_ORDER[(WEAPON_ORDER.indexOf(h.weapon) + 1) % WEAPON_ORDER.length];
      ev.push({ k: 'weapon', x: h.x, y: h.y, name: WEAPONS[h.weapon].name });
    }
  }
  if (h.hitstop > 0) return void (h.hitstop -= dt);
  if (now - h.staminaAt > HERO.regenDelay) h.stamina = Math.min(HERO.stamina, h.stamina + HERO.staminaRegen * dt);
  h.actT += dt;
  h.moving = false;
  h.blocking = false;
  if (h.act !== 'roll' && h.act !== 'down' && h.act !== 'zip' && slide(h, HERO.radius, dt)) ev.push({ k: 'wallhit', x: h.x, y: h.y });

  if (h.act === 'down') {
    if (h.actT >= h.actDur) Object.assign(h, { act: 'idle', hp: HERO.hp, stamina: HERO.stamina, actT: 0 });
    return;
  }
  if (h.act === 'hurt' || h.act === 'stun') {
    if (h.actT >= h.actDur) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  const w = WEAPONS[h.weapon];
  const wantsRoll = now - h.rollQueuedAt < INPUT_BUFFER && now - h.lastRollAt >= ROLL.cooldown && h.stamina >= 1;
  if (h.act === 'roll') {
    const k = ROLL.distance / ROLL.time;
    h.x += h.rollDx * k * dt;
    h.y += h.rollDy * k * dt;
    collide(h, HERO.radius);
    if (h.actT >= ROLL.time) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'zip') return;
  if (h.act === 'throw') {
    const r = RELICS[h.relic];
    if (h.actT >= r.windup && h.actT - dt < r.windup) {
      fire(h);
      h.relicReady[h.relic] = now + r.cooldown;
      ev.push({ k: h.relic === 'hook' ? 'hookfire' : 'throw', x: h.x, y: h.y, dx: h.fx, dy: h.fy });
    }
    if (h.act === 'throw' && h.actT >= r.windup + r.recover) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'charge') {
    if (wantsRoll) return startRoll(h, inp, now, ev);
    face(h, inp, enemies, false);
    walk(h, inp, w.chargeSpeed, dt);
    collide(h, HERO.radius);
    if (h.actT >= CHARGE.full - CHARGE.start && h.actT - dt < CHARGE.full - CHARGE.start) ev.push({ k: 'charged', x: h.x, y: h.y });
    if (!inp.attack) {
      h.power = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full);
      startSwing(h, -1, inp, enemies, now, ev);
      ev.push({ k: 'heavy', x: h.x, y: h.y });
    }
    return;
  }
  if (h.act === 'attack') {
    const s = currentSwing(h);
    if (h.actT < s.windup) {
      const k = s.lunge / s.windup;
      h.x += h.fx * k * dt;
      h.y += h.fy * k * dt;
      collide(h, HERO.radius);
    } else if (h.actT < s.windup + s.active) {
      for (const e of enemies) hitEnemy(h, s, e, now, ev);
    } else {
      const queued = now - h.attackQueuedAt < INPUT_BUFFER && h.attackQueuedAt > now - h.actT;
      if (queued && !h.heavy && h.combo < w.combo.length - 1) {
        if (!inp.attack) return startSwing(h, h.combo + 1, inp, enemies, now, ev);
        if (now - h.attackQueuedAt >= CHARGE.start) return startCharge(h);
      }
      if (wantsRoll) return startRoll(h, inp, now, ev);
      if (h.actT >= swingTime(s)) (h.act = 'idle'), (h.actT = 0);
    }
    return;
  }
  // Idle or walking.
  if (wantsRoll) return startRoll(h, inp, now, ev);
  if (now - h.relicQueuedAt < INPUT_BUFFER && now >= h.relicReady[h.relic]) {
    face(h, inp, enemies, true, h.relic === 'hook' ? HOOK.range : JAVELIN.range * 0.8);
    Object.assign(h, { act: 'throw', actT: 0, relicQueuedAt: -9 });
    return;
  }
  if (now - h.attackQueuedAt < CHARGE.start + INPUT_BUFFER && h.attackQueuedAt > -9) {
    if (!inp.attack) return startSwing(h, 0, inp, enemies, now, ev);
    if (now - h.attackQueuedAt >= CHARGE.start) return startCharge(h);
  }
  h.blocking = inp.block && h.stamina > 0;
  // Guarding with no aim (a phone) turns to the nearest threat, so a parry faces the right way.
  face(h, inp, enemies, h.blocking || now - h.lastBlockPress < 0.3);
  walk(h, inp, h.blocking ? w.blockSpeed : 1, dt);
  collide(h, HERO.radius);
}

function startCharge(h: Hero): void {
  h.act = 'charge';
  h.actT = 0;
  h.attackQueuedAt = -9;
  h.heavy = false;
}

/** Start combo step `i`, or the heavy when i is -1. */
function startSwing(h: Hero, i: number, inp: Intent, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  face(h, inp, enemies, true);
  h.act = 'attack';
  h.actT = 0;
  h.heavy = i < 0;
  h.combo = Math.max(0, i);
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
  h.kvx = h.kvy = 0;
  h.lastRollAt = now;
  h.rollQueuedAt = -9;
  spend(h, ROLL.stamina, now);
  ev.push({ k: 'roll', x: h.x, y: h.y });
}
