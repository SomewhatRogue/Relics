/** Enemies' turns: the goblin butcher, goblin scrappers, and the two training dummies. */
import { collide } from '../shared/arena';
import { BUTCHER, FROST, KNOCK, NET, SCRAPPER, SWING_DUMMY, TRAIT, type EnemyAttackSpec, type EnemySpec } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { slide } from './bodies';
import { hitHero } from './combat';
import { frozen, isDead, kill, snared } from './damage';
import { shatter } from './elements';
import { has } from './traits';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

const SPECS: Partial<Record<Enemy['kind'], EnemySpec>> = { butcher: BUTCHER, scrapper: SCRAPPER };

export function newEnemy(id: number, kind: Enemy['kind'], x: number, y: number): Enemy {
  const s = SPECS[kind];
  const hp = s ? s.hp : 999;
  return {
    id, kind, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, hp, maxHp: hp, radius: s ? s.radius : 0.4, weight: s ? s.weight : Infinity,
    act: s ? 'chase' : 'idle', actT: 0, actDur: 0, attack: null, cooldown: 1 + id * 0.4, hitstop: 0, hitAt: -9, moving: false, home: { x, y }, corpse: '',
    burnUntil: 0, burnNext: 0, chillUntil: 0, frozenUntil: 0, snareUntil: 0, lastBy: '', death: '',
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

function begin(e: Enemy, kind: EnemyAttack['kind'], s: EnemyAttackSpec, target: Hero, ev: FightEvent[]): void {
  const dx = target.x - e.x, dy = target.y - e.y, l = Math.hypot(dx, dy) || 1;
  e.fx = dx / l;
  e.fy = dy / l;
  const ahead = s.ahead ?? 0;
  e.attack = {
    kind, t: 0, windup: s.windup, active: s.active, recover: s.recover, dmg: s.dmg, knock: s.knock, unblockable: s.unblockable,
    dx: e.fx, dy: e.fy, ox: e.x, oy: e.y, range: s.range ?? 0, arc: s.arc ?? 0,
    cx: e.x + e.fx * ahead, cy: e.y + e.fy * ahead, radius: s.radius ?? 0, done: false,
  };
  e.act = 'attack';
  e.actT = 0;
  ev.push({ k: 'windup', x: e.x, y: e.y, kind });
}

/** Run an attack in progress; true when it has finished (or was parried away). */
function runAttack(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[]): boolean {
  const a = e.attack!;
  a.t += dt;
  if (!a.done && a.t >= a.windup) {
    a.done = true;
    ev.push({ k: 'impact', x: a.kind === 'slam' ? a.cx : e.x, y: a.kind === 'slam' ? a.cy : e.y, kind: a.kind });
    for (const h of heroes) hitHero(e, a, h, now, ev);
    if (e.attack === null) return true;
  }
  return a.t >= a.windup + a.active + a.recover;
}

const after = (e: Enemy) => (e.kind === 'swingDummy' || e.kind === 'dummy' ? 'idle' : 'chase');

export function stepEnemy(e: Enemy, heroes: Hero[], rng: Rng, now: number, dt: number, ev: FightEvent[]): void {
  if (e.hitstop > 0) return void (e.hitstop -= dt);
  e.actT += dt;
  e.moving = false;
  e.cooldown -= dt;
  const spec = SPECS[e.kind];
  if (e.act === 'carried') return;
  if (e.act === 'pinned') {
    if (e.actT >= e.actDur) Object.assign(e, { act: 'flinch', actT: 0, actDur: 0.4 });
    return;
  }
  if (e.act === 'dead') {
    if (e.actT >= e.actDur) Object.assign(e, { act: 'chase', hp: e.maxHp, x: e.home.x, y: e.home.y, kvx: 0, kvy: 0, actT: 0, cooldown: 1.5, corpse: '', death: '' });
    return;
  }
  if (spec) {
    const hit = slide(e, e.radius, dt);
    if (hit) {
      const ice = frozen(e, now), by = heroes.find((h) => h.id === e.lastBy);
      // CRUSHING: whoever threw it there makes the wall hurt more.
      const n = KNOCK.wallDmg * (by && has(by, 'crushing') ? TRAIT.crushing : 1);
      e.hp -= n;
      e.hitAt = now;
      ev.push({ k: 'wallhit', x: e.x, y: e.y });
      ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: n > KNOCK.wallDmg, on: 'enemy' });
      if (e.hp <= 0) return kill(e, ev, 'burst', e.kvx, e.kvy);
      // Thrown frozen into a wall: it breaks.
      if (ice) shatter(e, now, ev);
      if (isDead(e)) return;
    }
  }
  // Frozen solid, or a small goblin under a net: slides if thrown, does nothing else.
  if (frozen(e, now) || snared(e, now)) return;
  if (e.act === 'stunned' || e.act === 'flinch') {
    if (e.actT >= e.actDur) Object.assign(e, { act: after(e), actT: 0, cooldown: e.act === 'stunned' ? 0.6 : 0.3 });
    return;
  }
  if (e.act === 'attack') {
    if (runAttack(e, heroes, now, dt, ev) && e.act === 'attack') {
      Object.assign(e, { attack: null, act: after(e), actT: 0, cooldown: spec ? spec.pauseBetween : SWING_DUMMY.every });
    }
    return;
  }
  const t = nearest(e, heroes);
  if (!t || e.kind === 'dummy') return;
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  if (e.kind === 'swingDummy') {
    if (d <= SWING_DUMMY.reach && e.cooldown <= 0) begin(e, 'swing', SWING_DUMMY.swing, t, ev);
    return;
  }
  if (!spec) return;
  // Turn toward the target at this enemy's own pace; it only attacks once it faces you.
  const ux = (t.x - e.x) / d, uy = (t.y - e.y) / d;
  const want = Math.atan2(uy, ux), have = Math.atan2(e.fy, e.fx);
  let diff = want - have;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const slow = (e.chillUntil > now ? FROST.slow : 1) * (e.snareUntil > now ? NET.slow : 1);
  const turn = Math.max(-spec.turn * slow * dt, Math.min(spec.turn * slow * dt, diff)), na = have + turn;
  e.fx = Math.cos(na);
  e.fy = Math.sin(na);
  const facing = e.fx * ux + e.fy * uy;
  if (d <= spec.reach && e.cooldown <= 0 && facing > 0.75) {
    if (e.kind === 'butcher') {
      const slam = rng.next() < BUTCHER.slamChance;
      begin(e, slam ? 'slam' : 'cleave', slam ? BUTCHER.slam : BUTCHER.cleave, t, ev);
    } else begin(e, 'stab', SCRAPPER.stab, t, ev);
    return;
  }
  if (d > spec.reach * 0.8) {
    // Scrappers sidle a little rather than queueing straight in.
    const side = e.kind === 'scrapper' ? Math.sin(now * 1.3 + e.id * 2) * 0.5 : 0;
    const mx = ux - uy * side, my = uy + ux * side, ml = Math.hypot(mx, my);
    // Walks where it faces: something turning round is slow to come after you.
    const k = spec.speed * slow * Math.max(0.2, facing);
    e.x += (mx / ml) * k * dt;
    e.y += (my / ml) * k * dt;
    e.moving = true;
    collide(e, e.radius);
  }
}

