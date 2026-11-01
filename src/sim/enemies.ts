/** Enemies' turns: the goblin butcher, and the two training dummies. */
import { ARENA, collide } from '../shared/arena';
import { BUTCHER, SWING_DUMMY } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { hitHero } from './combat';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

export function newEnemy(id: number, kind: Enemy['kind'], x: number, y: number): Enemy {
  const hp = kind === 'butcher' ? BUTCHER.hp : 999;
  return {
    id, kind, x, y, fx: 0, fy: 1, hp, maxHp: hp, radius: kind === 'butcher' ? BUTCHER.radius : 0.4,
    act: kind === 'butcher' ? 'chase' : 'idle', actT: 0, actDur: 0, attack: null, cooldown: 1, hitstop: 0, hitAt: -9, moving: false,
  };
}

function nearest(e: Enemy, heroes: Hero[]): Hero | null {
  let best: Hero | null = null, bd = Infinity;
  for (const h of heroes) {
    if (h.act === 'down') continue;
    const d = Math.hypot(h.x - e.x, h.y - e.y);
    if (d < bd) (bd = d), (best = h);
  }
  return best;
}

type Spec = { windup: number; active: number; recover: number; dmg: number; unblockable: boolean; range?: number; arc?: number; radius?: number; ahead?: number };

function begin(e: Enemy, kind: EnemyAttack['kind'], s: Spec, target: Hero, ev: FightEvent[]): void {
  const dx = target.x - e.x, dy = target.y - e.y, l = Math.hypot(dx, dy) || 1;
  e.fx = dx / l;
  e.fy = dy / l;
  const ahead = s.ahead ?? 0;
  e.attack = {
    kind, t: 0, windup: s.windup, active: s.active, recover: s.recover, dmg: s.dmg, unblockable: s.unblockable,
    dx: e.fx, dy: e.fy, ox: e.x, oy: e.y, range: s.range ?? 0, arc: s.arc ?? 0,
    cx: e.x + e.fx * ahead, cy: e.y + e.fy * ahead, radius: s.radius ?? 0, done: false,
  };
  e.act = 'attack';
  e.actT = 0;
  ev.push({ k: 'windup', x: e.x, y: e.y, kind });
}

/** Run an attack in progress; true when it has finished. */
function runAttack(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[]): boolean {
  const a = e.attack!;
  a.t += dt;
  if (!a.done && a.t >= a.windup) {
    a.done = true;
    for (const h of heroes) hitHero(e, a, h, now, ev);
    for (const h of heroes) collide(h, 0.32);
    if (e.attack === null) return true;
  }
  return a.t >= a.windup + a.active + a.recover;
}

export function stepEnemy(e: Enemy, heroes: Hero[], rng: Rng, now: number, dt: number, ev: FightEvent[]): void {
  if (e.hitstop > 0) return void (e.hitstop -= dt);
  e.actT += dt;
  e.moving = false;
  e.cooldown -= dt;
  if (e.act === 'dead') {
    if (e.actT >= e.actDur) Object.assign(e, { act: 'chase', hp: e.maxHp, x: ARENA.spawn.butcher.x, y: ARENA.spawn.butcher.y, actT: 0, cooldown: 1.5 });
    return;
  }
  if (e.act === 'stagger') {
    if (e.actT >= e.actDur) (e.act = e.kind === 'butcher' ? 'chase' : 'idle'), (e.actT = 0), (e.cooldown = 0.4);
    return;
  }
  if (e.act === 'attack') {
    if (runAttack(e, heroes, now, dt, ev) && e.act === 'attack') {
      e.attack = null;
      e.act = e.kind === 'butcher' ? 'chase' : 'idle';
      e.actT = 0;
      e.cooldown = e.kind === 'butcher' ? BUTCHER.pauseBetween : SWING_DUMMY.every;
    }
    return;
  }
  const t = nearest(e, heroes);
  if (!t) return;
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  if (e.kind === 'dummy') return;
  if (e.kind === 'swingDummy') {
    if (d <= SWING_DUMMY.reach && e.cooldown <= 0) begin(e, 'swing', SWING_DUMMY.swing, t, ev);
    return;
  }
  if (d <= BUTCHER.reach && e.cooldown <= 0) {
    if (rng.next() < BUTCHER.slamChance) begin(e, 'slam', BUTCHER.slam, t, ev);
    else begin(e, 'cleave', BUTCHER.cleave, t, ev);
    return;
  }
  if (d > BUTCHER.reach * 0.8) {
    const k = (BUTCHER.speed * dt) / d;
    e.fx = (t.x - e.x) / d;
    e.fy = (t.y - e.y) / d;
    e.x += (t.x - e.x) * k;
    e.y += (t.y - e.y) * k;
    e.moving = true;
    collide(e, e.radius);
  }
}
