/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, parry, roll). */
import { BLESSING, DODGE, WARD, FLINCH, HORN, OVERKILL, PERK, TRAIT, GUARD, HERO, HITSTOP, HURT_STAGGER, VARIANTS, WEAPONS, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { statsOf } from './gearstats';
import { HUNGRY_FX, wears } from './hungry';
import { damage, frozen, isDummy, kill, snared, stunOf } from './damage';
import { shatter } from './elements';
import { has } from './traits';
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
  const rear = !isDummy(e) && (e.fx * tx + e.fy * ty) / tl < GUARD.rearCos;
  const ice = frozen(e, now), blessed = h.blessedUntil > now ? BLESSING.dmgMult : 1;
  const heldFast = e.act === 'stunned' || e.act === 'pinned' || ice || snared(e, now);
  // A Rogue's knives are weak head on (unless it's held fast): keep moving and get behind.
  const rearMult = rear ? (WEAPONS[h.weapon].backstab ?? GUARD.rearMult) + (h.perks.includes('shadowed') ? PERK.shadowed : 0) : heldFast ? 1 : (WEAPONS[h.weapon].front ?? 1);
  const counter = GUARD.counterMult * (has(h, 'riposte') ? TRAIT.riposte : 1), held = GUARD.stunnedMult * (has(h, 'brutal') ? TRAIT.brutal : 1);
  // TEMPO: the first hit after dodging through a blow lands double.
  const tempo = h.tempoUntil > now ? TRAIT.tempo : 1;
  if (tempo > 1) h.tempoUntil = -9;
  const mult = (h.counter ? counter : heldFast ? held : 1) * rearMult * blessed * tempo;
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
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter, backstab: rear && rearMult >= 2, src: WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, big: e.kind === 'butcher' });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    if (ice && heavy) shatter(e, now, ev);
    return n;
  }
  if (e.hp <= 0) {
    // Maces and big overkills burst, thrusts drop them; a blade cuts them down, in two at the waist, or
    // (now and then) takes the head. Heavy blows cut in two more often. Which one is fixed by the moment.
    const roll = (e.id * 7 + Math.floor(now * 30)) % 8;
    const cut = heavy ? (roll < 4 ? 'halve' : roll < 6 ? 'behead' : 'opened') : roll < 4 ? 'opened' : roll < 6 ? 'halve' : 'behead';
    const how = -e.hp >= OVERKILL || h.weapon === 'mace' ? 'burst' : s.thrust ? 'fall' : cut;
    return kill(e, ev, how, h.fx, h.fy), n;
  }
  // A heavy blow breaks the frozen.
  if (ice && heavy) return shatter(e, now, ev), n;
  // Light goblins flinch out of their wind-up on any hit; the butcher only to a strong heavy.
  const big = h.heavy && h.power >= 0.7;
  // Nothing stops a charge once it's coming.
  // (A Rogue's head-on blow doesn't knock anything off balance: only from behind.)
  const shakes = !(WEAPONS[h.weapon].front && !rear);
  if (shakes && e.act !== 'stunned' && e.act !== 'pinned' && e.act !== 'carried' && !ice && e.attack?.kind !== 'charge' && (e.kind === 'scrapper' || big)) {
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: big && e.kind === 'butcher' ? 0.6 : FLINCH });
  }
  return n;
}

/** Is this hero inside the attack's shape? */
export function attackCovers(a: EnemyAttack, h: Hero): boolean {
  if (a.kind === 'slam' || a.kind === 'charge') return Math.hypot(h.x - a.cx, h.y - a.cy) <= a.radius + HERO.radius;
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

/** An enemy's attack lands on a hero: rolled through, parried, blocked, or taken. */
export function hitHero(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  if (h.act === 'down') return;
  if (!attackCovers(a, h)) {
    // Rolled out of it during the wind-up: a dodge all the same, just no bonus.
    if (h.lastRollAt >= now - a.windup && attackCovers(a, { ...h, x: h.rollX, y: h.rollY })) ev.push({ k: 'dodge', x: h.x, y: h.y });
    return;
  }
  if (h.wardUntil > now && warded(e, a, h, now, ev)) return;
  const w = WEAPONS[h.weapon];
  // A blessed hero takes less from everything.
  const g = statsOf(h), taken = (h.blessedUntil > now ? BLESSING.taken : 1) * g.taken * (wears(h, 'apron') ? HUNGRY_FX.apron : 1);
  if (h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= w.dodge.iTo + h.lenience) {
    ev.push({ k: 'dodge', x: h.x, y: h.y });
    // Through the blow at the last moment: the attacker staggers (a close one; not an archer).
    if (a.kind !== 'shot' && e.act !== 'stunned') {
      h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
      e.hitstop = HITSTOP.heavy;
      Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: stunOf(e) * DODGE.stun });
      ev.push({ k: 'slip', x: h.x, y: h.y }, { k: 'stunned', x: e.x, y: e.y });
    }
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
  const sx = a.kind === 'slam' ? h.x - a.cx : -tx, sy = a.kind === 'slam' ? h.y - a.cy : -ty, sl = Math.hypot(sx, sy) || 1;
  // The kit's guard covers an arc in front: a shield covers nearly everything ahead.
  const facing = (h.fx * tx + h.fy * ty) / tl > Math.cos(((w.guardArc / 2) * Math.PI) / 180);
  const canGuard = !a.unblockable && facing && (h.act === 'idle' || h.act === 'attack' || h.act === 'charge');
  if (canGuard && now - h.parryOpenAt <= w.parryWindow + g.parry + h.lenience + (h.perks.includes('guard') ? PERK.guard : 0)) {
    h.counterUntil = now + GUARD.counterWindow;
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
    const chip = Math.round(a.dmg * w.chip * (1 - g.guard) * taken);
    h.hp -= chip;
    h.stamina -= a.dmg * GUARD.staminaPerDmg * w.guardCost * (1 - g.guard) * (h.rallyUntil > now ? HORN.guard : 1) * (h.perks.includes('ironhide') ? PERK.ironhide : 1);
    h.staminaAt = now;
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    shove(h, sx / sl, sy / sl, a.knock * 0.4, HERO.weight);
    if (h.stamina <= 0) {
      Object.assign(h, { stamina: 0, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
      ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    } else ev.push({ k: 'block', x: h.x, y: h.y });
    return downIfDead(h, ev);
  }
  const n = Math.round(a.dmg * taken);
  h.hp -= n;
  // Heavy armor: a small goblin's blow doesn't stagger you.
  if (!(g.steady && e.kind === 'scrapper')) Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER + a.knock * 0.012 });
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  shove(h, sx / sl, sy / sl, a.knock, HERO.weight);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 25, on: 'hero', src: a.kind });
  downIfDead(h, ev);
}

function downIfDead(h: Hero, ev: FightEvent[]): void {
  if (h.hp > 0) return;
  // The Ransom Coat: once a room, a killing blow takes 50 gold instead.
  if (wears(h, 'ransom') && !h.ransomed && h.purse >= HUNGRY_FX.ransom) {
    Object.assign(h, { hp: 1, ransomed: true, purse: h.purse - HUNGRY_FX.ransom });
    ev.push({ k: 'spend', id: h.id, x: h.x, y: h.y, n: HUNGRY_FX.ransom }, { k: 'ransom', x: h.x, y: h.y });
    return;
  }
  Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn * (h.perks.includes('secondwind') ? PERK.secondwind : 1), kvx: 0, kvy: 0 });
  ev.push({ k: 'down', x: h.x, y: h.y });
}
