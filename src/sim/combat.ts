/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, parry, roll). */
import { wetMult } from './techmage';
import { litMult } from './charge';
import { CENSER, BLESSING, DODGE, WARD, FLINCH, POISE, HORN, OVERKILL, TRAIT, GUARD, HERO, HITSTOP, HURT_STAGGER, VARIANTS, WEAPONS, type Swing, CLASS_DODGES, RIPOSTE, CRIT, STEALTH, weakOn, SPLAT, BANNER, STORM, MANA_SHIELD } from '../shared/tuning';
import { shove } from './bodies';
import { knack, statsOf } from './gearstats';
import { counterWindow, parryWindow, rearCos, slipWindow } from './knacks';
import { HUNGRY_FX, wears } from './hungry';
import { damage, frozen, isDummy, kill, sayWeak, small, snared, stunOf } from './damage';
import { poison } from './poison';
import { shatter } from './elements';
import { fling, hardHit, heavyHit } from './iceslide';
import { has } from './traits';
import { brandyDmg } from './brandy';
import { lunging, riposteNow, shaftMult, warriorHit } from './warrior';
import { manaShield, parryRefills } from './manashield';
import { soak } from './holy';
import { clericHit } from './flail';
import { stun } from './stuns';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';
import { isRound } from './types';
import { landed } from './ownfoes';
import { travelTo } from '../shared/sweep';
import { knockDown, rooted, takeShoulder } from './techwarrior';
import { judge } from './techcleric';
import { legStab } from './ladderrogue';
import { cover, parryMend, shelter } from './ladderhealer';
import { braced, softer } from './taunt';
import { stormCut } from './spellbook';
import { wet } from './wet';
import { clanks, crack, plated } from './ironhide';
import { guardFrom, rushBlocked, rushParried, noteRush, rushStun } from './rushguard';
import { count, dealt } from './score';

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
  const wasLunging = lunging(e), shoulder = takeShoulder(h);
  const heavy = h.counter || h.heavy || s.knock >= 7;
  // From behind: the hero stands where the enemy's facing points away (dummies have no back).
  const tx = h.x - e.x, ty = h.y - e.y, tl = Math.hypot(tx, ty) || 1;
  // A nest is a mound of web: no back to stab and no front to glance off (Kyle: too hard for a Rogue).
  // (THROUGH THE LEGS: a hit just after dashing through a goblin counts as from behind: sim/ladderrogue.ts.)
  const mound = e.kind === 'nest', rear = !isDummy(e) && !mound && ((e.fx * tx + e.fy * ty) / tl < rearCos(h) || legStab(h, e, now, ev));
  const ice = frozen(e, now), blessed = h.blessedUntil > now ? BLESSING.dmgMult : 1;
  const heldFast = e.act === 'stunned' || e.act === 'pinned' || ice || snared(e, now);
  // A Rogue's knives are weak head on (unless it's held fast): keep moving and get behind.
  const rearMult = rear ? (WEAPONS[h.weapon].backstab ?? GUARD.rearMult) * (1 + knack(h, 'rear')) : heldFast || mound ? 1 : (WEAPONS[h.weapon].front ?? 1);
  const counter = GUARD.counterMult * (has(h, 'riposte') ? TRAIT.riposte : 1) * (1 + knack(h, 'counter')), held = GUARD.stunnedMult * (has(h, 'brutal') ? TRAIT.brutal : 1);
  // TEMPO: the first hit after dodging through a blow lands double.
  const tempo = h.tempoUntil > now ? TRAIT.tempo : 1;
  if (tempo > 1) h.tempoUntil = -9;
  const crit = rollCrit(h), ambush = e.alert === false && !isDummy(e);
  // A shield-bearer takes a blow from the front on its board (unless it's heavy, held fast, caught unaware,
  // or a Mage's storm, which ignores shields and lands harder on the wet: sim/wet.ts).
  const storm = stormCut(h, s), boarded = e.variant === 'shield' && !rear && !heavy && !heldFast && !ambush && !storm;
  const weak = weakOn(e), soaked = storm && wet(e) ? wetMult(h, STORM.wet) : 1;
  sayWeak(e, weak, now, ev, 'physical');
  // The sword's riposte (a counter straight off the parry; a bonus, not its perfect) doubles the counter; the spear's shaft halves a blow up close.
  const riposte = riposteNow(h, now);
  if (riposte && h.hitIds.filter((id) => id > 0).length === 1) ev.push({ k: 'riposte', x: e.x, y: e.y });
  const mult = weak * soaked * (h.counter ? counter * (riposte ? RIPOSTE.mult : 1) : heldFast ? held : 1) * shaftMult(h, s, e) * rearMult * blessed * tempo * (crit ? CRIT : 1) * (ambush ? STEALTH.ambush * (1 + knack(h, 'ambush')) : 1) * (boarded ? VARIANTS.shield.front : 1) * brandyDmg(h, now) * litMult(h) * (h.snagged ? CENSER.snag : 1) * ((e.routUntil ?? -9) > now ? BANNER.rout.hurt : 1);
  // An ironhide's plates (sim/ironhide.ts): a charged blow or a perfect breaks its guard; else a fifth gets through.
  const plate = clanks(e, now) && !(h.heavy || h.perfect), raw = plated(e, Math.round(s.dmg * mult), now, h.heavy || h.perfect, ev);
  // Mother Rust's Needles: a backstab kills anything short of a butcher.
  const n = rear && e.kind === 'scrapper' && wears(h, 'needles') ? Math.max(e.hp, raw) : raw;
  e.hp -= n;
  e.hitAt = now;
  dealt(e, h.id, n);
  const stop = h.counter ? HITSTOP.parry : heavy || WEAPONS[h.weapon]?.ponderous ? HITSTOP.heavy : HITSTOP.light;
  h.hitstop = Math.max(h.hitstop, stop);
  e.hitstop = Math.max(e.hitstop, stop);
  // A blow sweeping all round (the healer's blessing) throws outward; anything else, along the swing.
  const ring = s.arc >= 360, dl = Math.hypot(e.x - h.x, e.y - h.y) || 1;
  const kx = ring ? (e.x - h.x) / dl : h.fx, ky = ring ? (e.y - h.y) / dl : h.fy;
  // (A shield-bearer's board stops a flail's shove: sim/flail.ts.)
  if (e.act !== 'pinned' && e.act !== 'carried' && !(boarded && WEAPONS[h.weapon].shoves)) shove(e, kx, ky, s.knock + (h.counter ? 5 : 0), e.weight);
  if (ambush && e.hp > 0) stun(e, h.id, now, STEALTH.reel, ev);
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter, crit, ambush, boarded, backstab: rear && (rearMult >= 2 || WEAPONS[h.weapon].cls === 'ROGUE'), src: WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, big: e.kind === 'butcher', ...(plate ? { plated: true } : {}) });
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
    kill(e, ev, how, h.fx, h.fy);
    splat(h, e, now);
    return n;
  }
  // A frozen small goblin under a heavy hit skids off away from you, to crash into what it meets (sim/iceslide.ts).
  if (ice && heavyHit(h, s) && fling(e, h.id, (e.x - h.x) / dl + h.fx * 0.5, (e.y - h.y) / dl + h.fy * 0.5, hardHit(h), now, ev)) return n;
  // A heavy blow breaks the frozen.
  if (ice && heavy) return shatter(e, now, ev), n;
  // (Techniques: SHOULDER CHARGE knocks it down, JUDGEMENT stuns it off a friend: sim/techwarrior.ts, techcleric.ts.)
  if (warriorHit(h, s, e, wasLunging, now, ev) || (shoulder && knockDown(h, e, now, ev)) || clericHit(h, s, e, now, ev) || judge(h, e, now, ev)) return n;
  // Light goblins flinch out of their wind-up on any hit. A heavy wind-up (a butcher's, a heavy's, a cleave
  // or slam, a striped blow; never a hexer's spell, which any blow breaks) only to a strong charged blow
  // from a big weapon (the greatsword, the flail).
  const big = h.heavy && h.power >= 0.7 && !!WEAPONS[h.weapon].breaker;
  const a = e.attack, heavyWind = !!a && (e.kind === 'butcher' || e.variant === 'heavy' || a.kind === 'cleave' || a.kind === 'slam' || (a.unblockable && a.kind !== 'hex'));
  // Nothing stops a charge once it's coming.
  // (A Rogue's head-on blow doesn't knock anything off balance: only from behind.)
  const shakes = !(WEAPONS[h.weapon].front && !rear);
  // Quick blows never break a wind-up (a hexer's spell excepted: any blow breaks it), and knock an idle one off balance only once a while (POISE).
  // In a pack rush, a charged blow or a perfect breaks the one it hits, whatever it is; the rest still come.
  const skilled = h.heavy || h.perfect, breaks = skilled || a?.kind === 'hex' || (!a && now - (e.flinchAt ?? -9) > POISE.relock);
  if (shakes && e.act !== 'stunned' && e.act !== 'pinned' && e.act !== 'carried' && !ice && e.attack?.kind !== 'charge' && (a?.rush ? skilled : heavyWind ? big : (small(e) && breaks) || big)) {
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: big && e.kind === 'butcher' ? 0.6 : FLINCH });
    if (!skilled) e.flinchAt = now;
  }
  return n;
}

/**
 * A small goblin killed by a blow (SPLAT): the body slides on along the blow, and the blow holds a beat
 * longer, longer again for each more the same swing has killed.
 */
function splat(h: Hero, e: Enemy, now: number): void {
  if (!small(e)) return;
  (e.kvx = h.fx * SPLAT.knock), (e.kvy = h.fy * SPLAT.knock);
  // Kills a moment apart are one swing's.
  h.splats = now - (h.splatAt ?? -9) < 0.3 ? (h.splats ?? 0) + 1 : 1;
  h.splatAt = now;
  h.hitstop = Math.max(h.hitstop, Math.min(SPLAT.most, SPLAT.stop + SPLAT.more * (h.splats - 1)));
}

/** Is this hero inside the attack's shape? */
export function attackCovers(a: EnemyAttack, h: Hero): boolean {
  if (isRound(a.kind) || a.kind === 'charge' || a.kind === 'pounce') return Math.hypot(h.x - a.cx, h.y - a.cy) <= a.radius + HERO.radius;
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
    if (!damage(e, Math.round(a.dmg * WARD.reflect), now, ev, { heavy: true, src: 'smite' })) stun(e, h.id, now, WARD.stun, ev);
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

/** An enemy's attack lands on a hero: rolled through, parried, blocked, or taken. `heroes`: the room's,
 *  for the Healer's guard rungs (sim/ladderhealer.ts). */
export function hitHero(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[], heroes: Hero[] = []): void {
  // Just come into the room: nothing lands yet.
  if (h.safeT) return;
  if (h.act === 'down') return;
  if (!attackCovers(a, h)) {
    // Rolled (or jumped) out of it during the wind-up: a dodge all the same. Left to the last moment,
    // so the blow lands where you were a breath ago, it staggers the attacker just as rolling through does.
    if (h.lastRollAt >= now - a.windup && attackCovers(a, { ...h, x: h.rollX, y: h.rollY })) {
      ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
      if (CLASS_DODGES[WEAPONS[h.weapon].cls] && now - h.lastRollAt <= slipWindow(h)) slipped(e, a, h, ev);
    }
    // No dodge (a Warrior, a Healer): walked out of a striped blow meant for you. That's the dodge.
    else if (!CLASS_DODGES[WEAPONS[h.weapon].cls] && a.unblockable && a.aimed === h.id) ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
    return;
  }
  if (h.wardUntil > now && warded(e, a, h, now, ev)) return;
  const w = WEAPONS[h.weapon];
  // STAND FAST: a taunted goblin's blow is worth less (sim/taunt.ts).
  const soft = softer(e, now);
  // A blessed hero takes less from everything.
  const g = statsOf(h), taken = (h.blessedUntil > now ? BLESSING.taken : 1) * g.taken * (wears(h, 'apron') ? HUNGRY_FX.apron : 1) * soft;
  // A spellblade's lightning dash: untouchable while it runs (sim/rush.ts).
  if (h.act === 'bash' && h.rush?.el === 'storm') return void (ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges'));
  if (h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= slipWindow(h)) {
    ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
    slipped(e, a, h, ev);
    if (has(h, 'tempo')) (h.tempoUntil = now + TRAIT.tempoTime), ev.push({ k: 'tempo', x: h.x, y: h.y });
    return;
  }
  // COVER: a Healer blocking beside you takes it on the guard for you (sim/ladderhealer.ts).
  if (cover(e, a, h, heroes, soft, now, ev)) return;
  // The Stoker's draw: hooked along the line and hauled to its feet, stunned for a free sweep.
  if (a.kind === 'draw') {
    const l = Math.hypot(e.x - h.x, e.y - h.y) || 1, to = VARIANTS.stoker.pullTo;
    travelTo(h, e.x - ((e.x - h.x) / l) * to, e.y - ((e.y - h.y) / l) * to, HERO.radius);
    Object.assign(h, { kvx: 0, kvy: 0, act: 'stun', actT: 0, actDur: VARIANTS.stoker.pullStun });
    h.hp -= soak(h, a.dmg, now, ev);
    count(h.id, 'taken', a.dmg);
    e.cooldown = 0;
    ev.push({ k: 'hit', x: h.x, y: h.y, n: a.dmg, heavy: true, on: 'hero', src: 'draw' });
    return downIfDead(h, ev);
  }
  const tx = e.x - h.x, ty = e.y - h.y, tl = Math.hypot(tx, ty) || 1;
  // Pushed away from where the blow came from (the slam's centre for a slam).
  const round = isRound(a.kind);
  const sx = round ? h.x - a.cx : -tx, sy = round ? h.y - a.cy : -ty, sl = Math.hypot(sx, sy) || 1;
  // The kit's guard covers an arc in front: a shield covers nearly everything ahead. (A pack rush is
  // judged from the middle of its fan, so one guard facing it covers every blow: sim/rushguard.ts.)
  const [gx, gy] = guardFrom(e, a, h), gl = Math.hypot(gx, gy) || 1;
  const facing = (h.fx * gx + h.fy * gy) / gl > Math.cos(((w.guardArc / 2) * Math.PI) / 180);
  const canGuard = !a.unblockable && facing && (h.act === 'idle' || h.act === 'attack' || h.act === 'charge');
  const again = rushParried(h, a, now);
  if (canGuard && (now - h.parryOpenAt <= parryWindow(h) || again)) {
    // A spellblade's perfect parry: the blow lands just after the press (one rush's later blows aren't).
    const tight = !again && now - h.parryOpenAt <= MANA_SHIELD.perfectIn;
    h.counterUntil = now + counterWindow(h);
    h.parriedAt = now;
    h.parryOpenAt = -9;
    if (has(h, 'bulwark')) h.stamina = HERO.stamina;
    h.hitstop = Math.max(h.hitstop, HITSTOP.parry);
    e.hitstop = HITSTOP.parry;
    // A parried ironhide's guard is broken; every goblin in a parried rush is held through the counter.
    crack(e, now, ev);
    noteRush(h, a, now, 'parry');
    Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: rushStun(a, stunOf(e)) });
    shove(e, tx / tl, ty / tl, 4, e.weight);
    ev.push({ k: 'parry', x: (h.x + e.x) / 2, y: (h.y + e.y) / 2, ...(again ? { more: true } : {}) });
    // (The recap's: one parry a blow, a rush's later blows not again; perfect on the very press.)
    if (!again) count(h.id, 'parries'), tight && count(h.id, 'perfect');
    ev.push({ k: 'stunned', x: e.x, y: e.y, ...(again ? { more: true } : {}) });
    // A spellblade's parry refills its magic, its shield (sim/manashield.ts; once a rush); MENDING PARRY heals friends near (sim/ladderhealer.ts).
    if (!again) parryRefills(h, tight, ev);
    parryMend(h, heroes, ev);
    return;
  }
  if (canGuard && h.blocking) {
    // A pack rush: the one block takes every blow in it (its first blow's stamina paid for all).
    if (rushBlocked(h, a, now)) return void ev.push({ k: 'block', x: h.x, y: h.y, more: true });
    noteRush(h, a, now, 'block');
    // Too heavy to block: the guard breaks (it should have been parried).
    if (a.crush) h.stamina = 0;
    // A held block takes nothing off your health; it costs breath instead, and plenty of it.
    h.stamina -= a.dmg * soft * GUARD.staminaPerDmg * w.guardCost * (1 - g.guard) * (1 - knack(h, 'block'));
    h.staminaAt = now;
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    if (!braced(h, now)) shove(h, sx / sl, sy / sl, a.knock * 0.4, HERO.weight);
    count(h.id, 'blocks');
    if (h.stamina <= 0) {
      Object.assign(h, { stamina: 0, winded: true, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
      ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    } else ev.push({ k: 'block', x: h.x, y: h.y });
    return;
  }
  // A Cleric's holy shield soaks what it can (sim/holy.ts), then a spellblade's magic, unless the blow is
  // striped (sim/manashield.ts); a blow they take whole doesn't stagger (a shield hit shoves a little).
  // IRON FEET: holding an attack, the blow lands but doesn't shove, stagger or knock down (sim/techwarrior.ts);
  // STAND FAST, while a taunt lasts, the same (sim/taunt.ts). SHELTER: a Healer blocking near takes some off.
  const iron = rooted(h), brace = !iron && braced(h, now), feet = iron || brace;
  const soaked = soak(h, Math.round(a.dmg * taken * shelter(h, heroes, ev)), now, ev);
  const n = a.unblockable ? soaked : manaShield(h, soaked, now, ev);
  if (n < soaked && n <= 0 && !feet) shove(h, sx / sl, sy / sl, a.knock * 0.4, HERO.weight);
  if (n <= 0) return void (h.hitstop = Math.max(h.hitstop, HITSTOP.light));
  h.hp -= n;
  count(h.id, 'taken', n);
  // Heavy armor: a small goblin's blow doesn't stagger you.
  if (!(g.steady && e.kind === 'scrapper') && !feet) Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER + a.knock * 0.012 });
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  if (feet) ev.push({ k: iron ? 'ironfeet' : 'braced', x: h.x, y: h.y });
  else shove(h, sx / sl, sy / sl, a.knock, HERO.weight);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 25, on: 'hero', src: a.kind });
  // A spider's bite (or the brood mother's bite or glob) poisons.
  if (e.kind === 'spider' || e.kind === 'brood') poison(h, now, ev);
  // A net holds, a thief takes, a log knocks down (sim/ownfoes.ts).
  if (!(feet && a.kind === 'charge')) landed(e, a, h, now, ev);
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
