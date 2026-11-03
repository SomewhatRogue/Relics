/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, parry, roll). */
import { litMult } from './charge';
import { BLESSING, DODGE, WARD, FLINCH, HORN, OVERKILL, TRAIT, GUARD, HERO, HITSTOP, HURT_STAGGER, VARIANTS, WEAPONS, type Swing, CLASS_DODGES, CRIT, STEALTH, technique, weakOn } from '../shared/tuning';
import { shove } from './bodies';
import { knack, statsOf } from './gearstats';
import { counterWindow, parryWindow, rearCos, slipWindow } from './knacks';
import { HUNGRY_FX, wears } from './hungry';
import { damage, frozen, isDummy, kill, sayWeak, small, snared, stunOf } from './damage';
import { poison } from './poison';
import { shatter } from './elements';
import { has } from './traits';
import { brandyDmg } from './brandy';
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

/** The hero's swing during its active frames: each enemy is hit at most once per swing. Returns the damage (0: missed). */
export function hitEnemy(h: Hero, s: Swing, e: Enemy, now: number, ev: FightEvent[]): number {
  if (e.act === 'dead' || h.hitIds.includes(e.id)) return 0;
  // A blade reaches only your own level (up on a ledge, you're out of reach of the ground).
  if ((h.z ?? 0) !== (e.z ?? 0) || !inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, s.range, s.arc, e.radius)) return 0;
  h.hitIds.push(e.id);
  e.lastBy = h.id;
  const heavy = h.counter || h.heavy || s.knock >= 7;
  // From behind: the hero stands where the enemy's facing points away (dummies have no back).
  const tx = h.x - e.x, ty = h.y - e.y, tl = Math.hypot(tx, ty) || 1;
  // A nest is a mound of web: no back to stab and no front to glance off (Kyle: too hard for a Rogue).
  const mound = e.kind === 'nest', rear = !isDummy(e) && !mound && (e.fx * tx + e.fy * ty) / tl < rearCos(h);
  const ice = frozen(e, now), blessed = h.blessedUntil > now ? BLESSING.dmgMult : 1;
  const heldFast = e.act === 'stunned' || e.act === 'pinned' || ice || snared(e, now);
  // A Rogue's knives are weak head on (unless it's held fast): keep moving and get behind.
  const rearMult = rear ? (WEAPONS[h.weapon].backstab ?? GUARD.rearMult) * (1 + knack(h, 'rear')) * (1 + (WEAPONS[h.weapon].cls === 'ROGUE' ? technique(h.drills, 'ROGUE') : 0)) : heldFast || mound ? 1 : (WEAPONS[h.weapon].front ?? 1);
  const counter = GUARD.counterMult * (has(h, 'riposte') ? TRAIT.riposte : 1) * (1 + knack(h, 'counter')), held = GUARD.stunnedMult * (has(h, 'brutal') ? TRAIT.brutal : 1);
  // TEMPO: the first hit after dodging through a blow lands double.
  const tempo = h.tempoUntil > now ? TRAIT.tempo : 1;
  if (tempo > 1) h.tempoUntil = -9;
  const crit = rollCrit(h), ambush = e.alert === false && !isDummy(e);
  // A shield-bearer takes a blow from the front on its board (unless it's heavy, held fast, or caught unaware).
  const boarded = e.variant === 'shield' && !rear && !heavy && !heldFast && !ambush && !WEAPONS[h.weapon].overShield;
  const weak = weakOn(e);
  sayWeak(e, weak, now, ev, 'physical');
  const mult = weak * (h.counter ? counter : heldFast ? held : 1) * rearMult * blessed * tempo * (crit ? CRIT : 1) * (ambush ? STEALTH.ambush * (1 + knack(h, 'ambush')) : 1) * (boarded ? VARIANTS.shield.front : 1) * brandyDmg(h, now) * litMult(h);
  // Mother Rust's Needles: a backstab kills anything short of a butcher.
  const n = rear && e.kind === 'scrapper' && wears(h, 'needles') ? Math.max(e.hp, Math.round(s.dmg * mult)) : Math.round(s.dmg * mult);
  e.hp -= n;
  e.hitAt = now;
  const stop = h.counter ? HITSTOP.parry : heavy ? HITSTOP.heavy : HITSTOP.light;
  h.hitstop = Math.max(h.hitstop, stop);
  e.hitstop = Math.max(e.hitstop, stop);
  // A blow sweeping all round (the healer's blessing) throws outward; anything else, along the swing.
  const ring = s.arc >= 360, dl = Math.hypot(e.x - h.x, e.y - h.y) || 1;
  const kx = ring ? (e.x - h.x) / dl : h.fx, ky = ring ? (e.y - h.y) / dl : h.fy;
  if (e.act !== 'pinned' && e.act !== 'carried') shove(e, kx, ky, s.knock + (h.counter ? 5 : 0), e.weight);
  if (ambush && e.hp > 0) Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: STEALTH.reel });
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter, crit, ambush, boarded, backstab: rear && (rearMult >= 2 || WEAPONS[h.weapon].cls === 'ROGUE'), src: WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, big: e.kind === 'butcher' });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    if (ice && heavy) shatter(e, now, ev);
    return n;
  }
  if (e.hp <= 0) {
    // Maces, flails and big overkills burst, thrusts drop them; a blade cuts them down, in two at the waist, or
    // (now and then) takes the head. Heavy blows cut in two more often. Which one is fixed by the moment.
    const roll = (e.id * 7 + Math.floor(now * 30)) % 8;
    const cut = heavy ? (roll < 4 ? 'halve' : roll < 6 ? 'behead' : 'opened') : roll < 4 ? 'opened' : roll < 6 ? 'halve' : 'behead';
    const how = -e.hp >= OVERKILL || WEAPONS[h.weapon].blunt ? 'burst' : s.thrust ? 'fall' : cut;
    return kill(e, ev, how, h.fx, h.fy), n;
  }
  // A heavy blow breaks the frozen.
  if (ice && heavy) return shatter(e, now, ev), n;
  // Light goblins flinch out of their wind-up on any hit; the butcher only to a strong heavy.
  const big = h.heavy && h.power >= 0.7;
  // Nothing stops a charge once it's coming.
  // (A Rogue's head-on blow doesn't knock anything off balance: only from behind.)
  const shakes = !(WEAPONS[h.weapon].front && !rear);
  if (shakes && e.act !== 'stunned' && e.act !== 'pinned' && e.act !== 'carried' && !ice && e.attack?.kind !== 'charge' && (small(e) || big)) {
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: big && e.kind === 'butcher' ? 0.6 : FLINCH });
  }
  return n;
}

/** Is this hero inside the attack's shape? */
export function attackCovers(a: EnemyAttack, h: Hero): boolean {
  if (a.kind === 'slam' || a.kind === 'hex' || a.kind === 'charge' || a.kind === 'pounce' || a.kind === 'spit') return Math.hypot(h.x - a.cx, h.y - a.cy) <= a.radius + HERO.radius;
  return inArc(a.ox, a.oy, a.dx, a.dy, h.x, h.y, a.range, a.arc, HERO.radius);
}

/**
 * A ward takes it: an arrow goes straight back at the archer (hurt and stunned where it stands); a
 * blow is soaked up until the ward breaks (the blow that breaks it is soaked too). Returns true when
 * nothing reached the hero.
 */
function warded(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): boolean {
  if (a.kind === 'shot') {
    ev.push({ k: 'reflect', x: h.x, y: h.y });
    ev.push({ k: 'beam', x: h.x, y: h.y, x2: e.x, y2: e.y });
    if (!damage(e, Math.round(a.dmg * WARD.reflect), now, ev, { heavy: true, src: 'smite' })) Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: WARD.stun });
    return true;
  }
  h.wardHp -= a.dmg;
  ev.push({ k: 'warded', x: h.x, y: h.y });
  if (h.wardHp <= 0) (h.wardUntil = -9), ev.push({ k: 'wardbreak', x: h.x, y: h.y });
  return true;
}

/** Out from under the blow at the last moment: the attacker staggers (a close one; not an archer or a hexer). */
function slipped(e: Enemy, a: EnemyAttack, h: Hero, ev: FightEvent[]): void {
  if (a.kind === 'shot' || a.kind === 'hex' || a.kind === 'spit' || e.act === 'stunned') return;
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  e.hitstop = HITSTOP.heavy;
  Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: stunOf(e) * DODGE.stun });
  ev.push({ k: 'slip', x: h.x, y: h.y }, { k: 'stunned', x: e.x, y: e.y });
}

/**
 * A crit, by the hero's own dice (seeded from their name, stepped each roll: the room's dice never
 * shift, and the same fight plays the same way).
 */
export function rollCrit(h: Hero): boolean {
  const chance = statsOf(h).crit;
  if (chance <= 0) return false;
  let x = h.critSeed ?? [...h.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  x = (Math.imul(x, 1103515245) + 12345) >>> 0;
  h.critSeed = x;
  return x / 4294967296 < chance;
}

/** An enemy's attack lands on a hero: rolled through, parried, blocked, or taken. */
export function hitHero(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  // Just come into the room: nothing lands yet.
  if (h.safeT) return;
  if (h.act === 'down') return;
  if (!attackCovers(a, h)) {
    // Rolled (or jumped) out of it during the wind-up: a dodge all the same. Left to the last moment,
    // so the blow lands where you were a breath ago, it staggers the attacker just as rolling through does.
    if (h.lastRollAt >= now - a.windup && attackCovers(a, { ...h, x: h.rollX, y: h.rollY })) {
      ev.push({ k: 'dodge', x: h.x, y: h.y });
      if (now - h.lastRollAt <= slipWindow(h)) slipped(e, a, h, ev);
    }
    // No dodge (a Warrior, a Healer): walked out of a striped blow meant for you. That's the dodge.
    else if (!CLASS_DODGES[WEAPONS[h.weapon].cls] && a.unblockable && a.aimed === h.id) ev.push({ k: 'dodge', x: h.x, y: h.y });
    return;
  }
  if (h.wardUntil > now && warded(e, a, h, now, ev)) return;
  const w = WEAPONS[h.weapon];
  // A blessed hero takes less from everything.
  const g = statsOf(h), taken = (h.blessedUntil > now ? BLESSING.taken : 1) * g.taken * (wears(h, 'apron') ? HUNGRY_FX.apron : 1);
  if (h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= slipWindow(h)) {
    ev.push({ k: 'dodge', x: h.x, y: h.y });
    slipped(e, a, h, ev);
    if (has(h, 'tempo')) (h.tempoUntil = now + TRAIT.tempoTime), ev.push({ k: 'tempo', x: h.x, y: h.y });
    return;
  }
  // The Stoker's draw: hooked along the line and hauled to its feet, stunned for a free sweep.
  if (a.kind === 'draw') {
    const l = Math.hypot(e.x - h.x, e.y - h.y) || 1, to = VARIANTS.stoker.pullTo;
    Object.assign(h, { x: e.x - ((e.x - h.x) / l) * to, y: e.y - ((e.y - h.y) / l) * to, kvx: 0, kvy: 0, act: 'stun', actT: 0, actDur: VARIANTS.stoker.pullStun });
    h.hp -= a.dmg;
    e.cooldown = 0;
    ev.push({ k: 'hit', x: h.x, y: h.y, n: a.dmg, heavy: true, on: 'hero', src: 'draw' });
    return downIfDead(h, ev);
  }
  const tx = e.x - h.x, ty = e.y - h.y, tl = Math.hypot(tx, ty) || 1;
  // Pushed away from where the blow came from (the slam's centre for a slam).
  const round = a.kind === 'slam' || a.kind === 'hex' || a.kind === 'spit';
  const sx = round ? h.x - a.cx : -tx, sy = round ? h.y - a.cy : -ty, sl = Math.hypot(sx, sy) || 1;
  // The kit's guard covers an arc in front: a shield covers nearly everything ahead.
  const facing = (h.fx * tx + h.fy * ty) / tl > Math.cos(((w.guardArc / 2) * Math.PI) / 180);
  const canGuard = !a.unblockable && facing && (h.act === 'idle' || h.act === 'attack' || h.act === 'charge');
  if (canGuard && now - h.parryOpenAt <= parryWindow(h)) {
    h.counterUntil = now + counterWindow(h);
    h.parryOpenAt = -9;
    if (has(h, 'bulwark')) h.stamina = HERO.stamina;
    h.hitstop = Math.max(h.hitstop, HITSTOP.parry);
    e.hitstop = HITSTOP.parry;
    Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: stunOf(e) });
    shove(e, tx / tl, ty / tl, 4, e.weight);
    ev.push({ k: 'parry', x: (h.x + e.x) / 2, y: (h.y + e.y) / 2 });
    ev.push({ k: 'stunned', x: e.x, y: e.y });
    return;
  }
  if (canGuard && h.blocking) {
    // Too heavy to block: the guard breaks (it should have been parried).
    if (a.crush) h.stamina = 0;
    // A held block takes nothing off your health; it costs breath instead, and plenty of it.
    h.stamina -= a.dmg * GUARD.staminaPerDmg * w.guardCost * (1 - g.guard) * (1 - knack(h, 'block'));
    h.staminaAt = now;
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    shove(h, sx / sl, sy / sl, a.knock * 0.4, HERO.weight);
    if (h.stamina <= 0) {
      Object.assign(h, { stamina: 0, winded: true, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
      ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    } else ev.push({ k: 'block', x: h.x, y: h.y });
    return;
  }
  const n = Math.round(a.dmg * taken);
  h.hp -= n;
  // Heavy armor: a small goblin's blow doesn't stagger you.
  if (!(g.steady && e.kind === 'scrapper')) Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER + a.knock * 0.012 });
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  shove(h, sx / sl, sy / sl, a.knock, HERO.weight);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 25, on: 'hero', src: a.kind });
  // A spider's bite (or the brood mother's bite or glob) poisons.
  if (e.kind === 'spider' || e.kind === 'brood') poison(h, now, ev);
  downIfDead(h, ev);
}

/** Down at no health (the Ransom Coat may buy you off once a room). */
export function downIfDead(h: Hero, ev: FightEvent[]): void {
  if (h.hp > 0) return;
  // The Ransom Coat: once a room, a killing blow takes 50 gold instead.
  if (wears(h, 'ransom') && !h.ransomed && h.purse >= HUNGRY_FX.ransom) {
    Object.assign(h, { hp: 1, ransomed: true, purse: h.purse - HUNGRY_FX.ransom });
    ev.push({ k: 'spend', id: h.id, x: h.x, y: h.y, n: HUNGRY_FX.ransom }, { k: 'ransom', x: h.x, y: h.y });
    return;
  }
  Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn * (1 - knack(h, 'down')), kvx: 0, kvy: 0 });
  ev.push({ k: 'down', x: h.x, y: h.y, id: h.id });
}
