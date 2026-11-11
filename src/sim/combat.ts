/** Who hits whom: a hero's swing on an enemy, and an enemy's attack on a hero (block, roll, or taken). */
import { wetMult } from './techmage';
import { litMult } from './charge';
import { CENSER, BLESSING, DODGE, WARD, FLINCH, POISE, HORN, OVERKILL, TRAIT, GUARD, HERO, HITSTOP, HURT_STAGGER, STAGGER, VARIANTS, WEAPONS, type Swing, CLASS_DODGES, CRIT, STEALTH, weakOn, SPLAT, BANNER, STORM } from '../shared/tuning';
import { shove } from './bodies';
import { knack, statsOf } from './gearstats';
import { counterWindow, guardArc, rearCos, slipWindow } from './knacks';
import { HUNGRY_FX, wears } from './hungry';
import { damage, frozen, isDead, isDummy, kill, sayWeak, small, snared, stunOf } from './damage';
import { defer } from './latelist';
import { poison } from './poison';
import { shatter } from './elements';
import { fling, hardHit, heavyHit } from './iceslide';
import { has } from './traits';
import { brandyDmg } from './brandy';
import { lunging, shaftMult, warriorHit } from './warrior';
import { manaShield, slipRefills } from './manashield';
import { soak } from './holy';
import { clericHit } from './flail';
import { stun } from './stuns';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';
import { isRound } from './types';
import { landed } from './ownfoes';
import { OWN_KIT } from './enemies';
import { travelTo } from '../shared/sweep';
import { knockDown, rooted, takeShoulder } from './techwarrior';
import { judge } from './techcleric';
import { legStab } from './ladderrogue';
import { blockMend, cover, shelter } from './ladderhealer';
import { braced, ironHeld, ironStance, softer } from './taunt';
import { roundGuard } from './holyguard';
import { stormCut } from './spellbook';
import { wet } from './wet';
import { clanks, plated } from './ironhide';
import { guardFrom, rushBlocked, noteRush } from './rushguard';
import { count, dealt } from './score';
import { chalkTaken } from './chalker';
import { plankFaces } from './meaty';
import { shieldFaces } from './board';
import { addPoise, bracedFor, poiseFromBlow, rebound } from './poise';
import { doorTake } from './doorwall';
import { noteHurt } from './bosskit';
import { graceDefer } from './bossgrace';
import { cutCall } from './hornstate';
import { blockBreath, blockStriped, guardBreak } from './blockhold';

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
  const rearMult = rear ? (WEAPONS[h.weapon].backstab ?? GUARD.rearMult) * (1 + knack(h, 'rear') + statsOf(h).backstab) : heldFast || mound ? 1 : (WEAPONS[h.weapon].front ?? 1);
  const counter = GUARD.counterMult * (has(h, 'riposte') ? TRAIT.riposte : 1) * (1 + knack(h, 'counter')), held = GUARD.stunnedMult * (has(h, 'brutal') ? TRAIT.brutal : 1);
  // TEMPO: the first hit after dodging through a blow lands double.
  const tempo = h.tempoUntil > now ? TRAIT.tempo : 1;
  if (tempo > 1) h.tempoUntil = -9;
  const crit = rollCrit(h), ambush = e.alert === false && !isDummy(e);
  // A shield-bearer's board stops a blow from the front dead, whatever it is (sim/board.ts), unless it's lowered
  // for its own swing, or the goblin is held fast or caught unaware.
  const storm = stormCut(h, s), boarded = !rear && shieldFaces(e, tx, ty, now);
  if (boarded) {
    const stop = HITSTOP.light;
    (h.hitstop = Math.max(h.hitstop, stop)), (e.hitstop = Math.max(e.hitstop, stop));
    ev.push({ k: 'hit', x: e.x, y: e.y, n: 0, heavy: false, on: 'enemy', counter: h.counter, crit: false, ambush: false, boarded: true, backstab: false, src: WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, big: false });
    return 0;
  }
  // A Planker's barn door takes everything from the front, heavy or not (sim/meaty.ts): get round it.
  const door = plankFaces(e, tx, ty, now);
  const weak = weakOn(e), soaked = storm && wet(e) ? wetMult(h, STORM.wet) : 1;
  sayWeak(e, weak, now, ev, 'physical');
  // STAMINA ON COUNTER: a counter's first hit fills your stamina. (The spear's shaft halves a blow up close.)
  if (h.counter && has(h, 'bulwark') && h.hitIds.filter((id) => id > 0).length === 1) h.stamina = Math.max(h.stamina, HERO.stamina);
  const mult = weak * soaked * (h.counter ? counter : heldFast ? held : 1) * shaftMult(h, s, e) * rearMult * blessed * tempo * (crit ? CRIT : 1) * (ambush ? STEALTH.ambush * (1 + knack(h, 'ambush')) : 1) * (door ? 0 : 1) * brandyDmg(h, now) * litMult(h) * (h.snagged ? CENSER.snag : 1) * ((e.routUntil ?? -9) > now ? BANNER.rout.hurt : 1);
  // An ironhide's plates (sim/ironhide.ts): a charged blow or a perfect breaks its guard; else a fifth gets through.
  const plate = clanks(e, now) && !(h.heavy || h.perfect), raw = plated(e, Math.round(s.dmg * mult), now, h.heavy || h.perfect, ev);
  // Mother Rust's Needles: a backstab kills anything short of a butcher.
  const n0 = rear && e.kind === 'scrapper' && wears(h, 'needles') ? Math.max(e.hp, raw) : raw;
  // A boss of the kit: what in the blow fills its POISE (door or no door), then its door (sim/poise.ts, doorwall.ts).
  const n = e.boss ? bossBlow(h, e, n0, rear, ambush, now, ev) : n0;
  if (n < 0) return 0;
  e.hp -= n;
  e.hitAt = now;
  dealt(e, h.id, n);
  const stop = h.counter ? HITSTOP.counter : heavy || WEAPONS[h.weapon]?.ponderous ? HITSTOP.heavy : HITSTOP.light;
  h.hitstop = Math.max(h.hitstop, stop);
  e.hitstop = Math.max(e.hitstop, stop);
  // A blow sweeping all round (the healer's blessing) throws outward; anything else, along the swing.
  const ring = s.arc >= 360, dl = Math.hypot(e.x - h.x, e.y - h.y) || 1;
  const kx = ring ? (e.x - h.x) / dl : h.fx, ky = ring ? (e.y - h.y) / dl : h.fy;
  // (A shield-bearer's board stops a flail's shove: sim/flail.ts.)
  if (e.act !== 'pinned' && e.act !== 'carried' && !door) shove(e, kx, ky, s.knock + (h.counter ? 5 : 0), e.weight);
  if (ambush && e.hp > 0) stun(e, h.id, now, STEALTH.reel, ev);
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy, on: 'enemy', counter: h.counter, crit, ambush, boarded: door, backstab: rear && (rearMult >= 2 || WEAPONS[h.weapon].cls === 'ROGUE'), src: WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, big: e.kind === 'butcher', ...(plate ? { plated: true } : {}) });
  // A Hornblower blowing: a charged blow, a perfect or a counter that gets through cuts it off (sim/hornstate.ts).
  if (n > 0 && (h.heavy || h.perfect || h.counter)) cutCall(e, now, ev);
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
  // Light goblins flinch out of their wind-up on any hit. Anything bigger (Kyle, 2026-11-08: "power attacks
  // and charged attacks shouldn't knock bigger enemies out of attacks, unless it's part of their perfect")
  // only to a big weapon's charged blow let go on the flash (the greatsword, the flail), and to what stuns or
  // freezes it (the perfects' own stuns, a smite, frost: elsewhere). A hexer's spell any blow still breaks.
  const big = h.heavy && h.perfect && !!WEAPONS[h.weapon].breaker;
  const a = e.attack, heavyWind = !!a && (e.kind === 'butcher' || e.variant === 'heavy' || a.kind === 'cleave' || a.kind === 'slam' || (a.unblockable && a.kind !== 'hex'));
  // Nothing stops a charge once it's coming.
  // (A Rogue's head-on blow doesn't knock anything off balance: only from behind.)
  const shakes = !(WEAPONS[h.weapon].front && !rear);
  // Quick blows never break a wind-up (a hexer's spell excepted: any blow breaks it), and knock an idle one off balance only once a while (POISE).
  // In a pack rush, a charged blow or a perfect breaks a small one it hits; a bigger one only `big`, as ever.
  const skilled = h.heavy || h.perfect, breaks = skilled || a?.kind === 'hex' || (!a && now - (e.flinchAt ?? -9) > POISE.relock);
  if (!e.boss && shakes && e.act !== 'stunned' && e.act !== 'pinned' && e.act !== 'carried' && !ice && e.attack?.kind !== 'charge' && (a?.kind === 'hex' || (small(e) ? (a?.rush ? skilled : heavyWind ? big : breaks || big) : big))) {
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: big && e.kind === 'butcher' ? 0.6 : FLINCH });
    if (!skilled) e.flinchAt = now;
  }
  return n;
}

/** A blow on a boss: its POISE filled, then what its door lets by (-1: stopped dead, sparks and a jolt). */
function bossBlow(h: Hero, e: Enemy, n: number, rear: boolean, ambush: boolean, now: number, ev: FightEvent[]): number {
  poiseFromBlow(e, h, rear, ambush, now, ev);
  const got = doorTake(e, n, e.x - h.x, e.y - h.y, now);
  if (got <= 0) {
    h.hitstop = Math.max(h.hitstop, HITSTOP.light);
    e.hitAt = now;
    ev.push({ k: 'deflect', x: e.x, y: e.y });
    return -1;
  }
  noteHurt(e, h.id, got, now);
  return got;
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
function slipped(e: Enemy, a: EnemyAttack, h: Hero, ev: FightEvent[], now = 0): void {
  // (Nothing to stagger in a burst on the floor: a body's, or one standing alight with its fuse lit: sim/blast.ts.)
  if (a.kind === 'shot' || a.kind === 'hex' || a.kind === 'spit' || e.act === 'stunned' || isDead(e)) return;
  // A boss doesn't reel from it: LAST SECOND fills its POISE instead (sim/poise.ts).
  if (e.boss) return void (h.hitstop = Math.max(h.hitstop, HITSTOP.heavy), ev.push({ k: 'slip', x: h.x, y: h.y }), addPoise(e, 'slip', now, ev));
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

/** A blow judged late, by a friend's own screen (sim/lagcomp.ts). */
export type Verdict = 'dodge' | 'out' | 'block' | 'land';
/** A late blow's verdict, and the shove's way and the guard's as it landed (sim/latelist.ts). */
export interface Late { verdict: Verdict; sx: number; sy: number; gx: number; gy: number }

/** An enemy's attack lands on a hero: rolled through, blocked, or taken. `heroes`: the room's,
 *  for the Healer's guard rungs (sim/ladderhealer.ts). `late`: judged now, after waiting on a friend's
 *  word (sim/lagcomp.ts); a blow covering a friend with lag waits for it (sim/latelist.ts). */
export function hitHero(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[], heroes: Hero[] = [], late?: Late): void {
  // Just come into the room: nothing lands yet.
  if (h.safeT) return;
  if (h.act === 'down') return;
  // A boss's blow: a press a moment late still counts (sim/bossgrace.ts); else a friend's lag (sim/latelist.ts).
  if (!late && attackCovers(a, h) && (graceDefer(e, a, h, heroes, now) || defer(e, a, h, now))) return;
  // Dodged by their own screen: through it (the goblin reels, as below), or out from under it.
  if (late?.verdict === 'dodge') return void dodgedThrough(e, a, h, now, ev, true);
  if (late?.verdict === 'out') return void (ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges'));
  if (!late && !attackCovers(a, h)) {
    // Rolled (or jumped) out of it during the wind-up: a dodge all the same. Left to the last moment,
    // so the blow lands where you were a breath ago, it staggers the attacker just as rolling through does.
    if (h.lastRollAt >= now - a.windup && attackCovers(a, { ...h, x: h.rollX, y: h.rollY })) {
      ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
      if (CLASS_DODGES[WEAPONS[h.weapon].cls] && now - h.lastRollAt <= slipWindow(h)) slipped(e, a, h, ev, now), slipRefills(h, now, ev);
    }
    // No dodge (a Warrior, a Healer): walked out of a striped blow meant for you. That's the dodge.
    else if (!CLASS_DODGES[WEAPONS[h.weapon].cls] && a.unblockable && a.aimed === h.id) ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
    return;
  }
  if (h.wardUntil > now && warded(e, a, h, now, ev)) return;
  // IRON STANCE's moment after a block: nothing lands (sim/taunt.ts).
  if (ironHeld(h, now) && !a.unblockable) return void ev.push({ k: 'block', x: h.x, y: h.y, more: true });
  const w = WEAPONS[h.weapon];
  // STAND FAST: a taunted goblin's blow is worth less (sim/taunt.ts).
  const soft = softer(e, now);
  // A blessed hero takes less from everything.
  const g = statsOf(h), taken = (h.blessedUntil > now ? BLESSING.taken : 1) * g.taken * (wears(h, 'apron') ? HUNGRY_FX.apron : 1) * soft * chalkTaken(e, h, now);
  // A spellblade's lightning dash: untouchable while it runs (sim/rush.ts).
  if (h.act === 'bash' && h.rush?.el === 'storm') return void (ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges'));
  // (Judged late, the dodge was their screen's: a roll the leader's room began after the blow doesn't count.)
  if (!late && h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= slipWindow(h)) return dodgedThrough(e, a, h, now, ev, false);
  // COVER: a Healer blocking beside you takes it on the guard for you (sim/ladderhealer.ts).
  // SHARED WARD: a Cleric guarding beside you covers you (sim/ladderhealer.ts).
  if (cover(a, h, heroes, ev)) return;
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
  const tx = e.x - h.x, ty = e.y - h.y;
  // Pushed away from where the blow came from (the slam's centre for a slam). (Judged late: as it landed.)
  const round = isRound(a.kind);
  const sx = late ? late.sx : round ? h.x - a.cx : -tx, sy = late ? late.sy : round ? h.y - a.cy : -ty, sl = Math.hypot(sx, sy) || 1;
  // The kit's guard covers an arc in front: a shield covers nearly everything ahead. (A pack rush is
  // judged from the middle of its fan, so one guard facing it covers every blow: sim/rushguard.ts.)
  const [gx, gy] = late ? [late.gx, late.gy] : guardFrom(e, a, h), gl = Math.hypot(gx, gy) || 1;
  // A Cleric's guard is a holy ward round them (sim/holyguard.ts): it meets a blow from any side.
  const facing = roundGuard(h) || (h.fx * gx + h.fy * gy) / gl > Math.cos(((guardArc(h) / 2) * Math.PI) / 180);
  const canGuard = facing && (h.act === 'idle' || h.act === 'attack' || h.act === 'charge');
  // Held block, no timing to it (Kyle, 2026-11-05: parry is gone, and no perfect block either).
  // (Judged late: held by their own screen as it landed, sim/lagcomp.ts.)
  const held = canGuard && (late ? late.verdict === 'block' : h.blocking);
  // A striped blow on the guard: most of it stopped, dear on stamina, a hard shove (sim/blockhold.ts).
  if (held && a.unblockable) return void (blockStriped(e, a, h, now, ev, taken, soft, sx / sl, sy / sl), downIfDead(h, ev));
  if (held) {
    // A pack rush: the one block takes every blow in it (its first blow's stamina paid for all).
    if (rushBlocked(h, a, now)) return void ev.push({ k: 'block', x: h.x, y: h.y, more: true });
    noteRush(h, a, now);
    // IRON STANCE: a flat burst of stamina, the goblin thrown back, untouchable a moment (sim/taunt.ts).
    // (A boss's blow is BRACED instead, below.)
    if (!a.boss && ironStance(h, e, now, ev)) {
      count(h.id, 'blocks');
      if (h.act !== 'stun') h.counterUntil = now + counterWindow(h);
      return;
    }
    // A held block takes nothing off your health; it costs breath instead (a heavy's crushing blow more,
    // and it shoves you further), a big blow less for each point past GUARD.knee (sim/blockhold.ts).
    h.stamina -= blockBreath(h, a.dmg * soft, !!a.crush);
    h.staminaAt = now;
    // The blow meets the guard: a solid thud, held a beat, and a small push back.
    h.hitstop = Math.max(h.hitstop, a.crush ? HITSTOP.heavy : HITSTOP.light);
    e.hitstop = Math.max(e.hitstop, HITSTOP.light);
    if (!braced(h, now) && !bracedFor(a)) shove(h, sx / sl, sy / sl, a.knock * (a.crush ? GUARD.crushShove : GUARD.shove), HERO.weight);
    count(h.id, 'blocks');
    if (h.stamina <= 0) return guardBreak(h, ev);
    ev.push({ k: 'block', x: h.x, y: h.y });
    // BRACED: a boss's red blow held off rebounds it, and fills its POISE (sim/poise.ts).
    rebound(e, a, h, now, ev);
    // A block that holds opens the counter: the next blow started soon after lands harder (GUARD.counterMult).
    h.counterUntil = now + counterWindow(h);
    // HEALING BLOCK heals friends near (sim/ladderhealer.ts).
    blockMend(h, heroes, ev);
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
  // No stun-lock: a small goblin can't stagger you again within STAGGER.guard of the last (a butcher can).
  const guarded = e.kind !== 'butcher' && !e.boss && now - (h.staggerAt ?? -9) < STAGGER.guard;
  if (!(g.steady && e.kind === 'scrapper') && !feet && !guarded) Object.assign(h, { act: 'hurt', actT: 0, actDur: HURT_STAGGER + a.knock * 0.012, staggerAt: now });
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  if (feet) ev.push({ k: iron ? 'ironfeet' : 'braced', x: h.x, y: h.y });
  else shove(h, sx / sl, sy / sl, a.knock, HERO.weight);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 25, on: 'hero', src: a.kind });
  // A spider's bite (or the brood mother's bite or glob) poisons.
  if (e.kind === 'spider' || e.kind === 'brood') poison(h, now, ev);
  // A net holds, a thief takes, a log knocks down (sim/ownfoes.ts).
  if (!(feet && a.kind === 'charge')) landed(e, a, h, now, ev, OWN_KIT.foes);
  downIfDead(h, ev);
}

/** Through the blow in the dodge's i-frames: the goblin reels (sim/combat.ts slipped). */
function dodgedThrough(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[], late: boolean): void {
  ev.push({ k: 'dodge', x: h.x, y: h.y }), count(h.id, 'dodges');
  // (Judged late, the goblin may have fallen or begun another blow since: only one still on the blow that landed reels.)
  if (!late || (!isDead(e) && (!e.attack || e.attack.done))) slipped(e, a, h, ev, now);
  // A spellblade's dodge through a blow refills its magic, its shield (sim/manashield.ts).
  slipRefills(h, now, ev);
  if (has(h, 'tempo')) (h.tempoUntil = now + TRAIT.tempoTime), ev.push({ k: 'tempo', x: h.x, y: h.y });
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
