/**
 * A hero's turn each tick: presses, movement, the weapon's combo, the charged heavy, the roll.
 * A tap of attack swings on release; holding past CHARGE.start charges a heavy instead.
 */
import { collide, wadeAt } from '../shared/arena';
import { DODGE, CLASS_DODGES, CLASS_GUARD, DECOY, AUGMENTS, CHARGE, GRAB, HORN, RELEASE, CLASS_KITS, CLASS_ORDER, abilitiesOf, ELEMENT_NAME, GUARD, HERO, INPUT_BUFFER, RELICS, WEAPONS, type Swing, type Weapon, drilled, STEALTH, dodgeOf } from '../shared/tuning';
import { slide } from './bodies';
import { BAG } from '../shared/bags';
import { applyGear, turnBelt } from './pack';
import { knack, statsOf } from './gearstats';
import { decoyTime, dodgeBreath, dodgeReach, releaseWindow } from './knacks';
import { fedMult, jealousBlocks, jealousCooldown, needlesBreath, wears } from './hungry';
import { hitEnemy } from './combat';
import { quake } from './warrior';
import { beginHold, looseBolt, stepWind } from './crossbow';
import { brandySpeed, breathCap } from './brandy';
import { quickMult, relicDark, spendCharge } from './charge';
import { paySpell, refuseSpell } from './spells';
import { knows, type Enemy, type FightEvent, type Hero, type Intent } from './types';

export function newHero(id: string, x: number, y: number): Hero {
  return {
    id, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, moving: false, hp: HERO.hp, maxHp: HERO.hp, perks: [], stamina: HERO.stamina, staminaAt: -9, weapon: 'sword',
    act: 'idle', actT: 0, actDur: 0, combo: 0, heavy: false, power: 0, counter: false, hitIds: [], blocking: false,
    parryOpenAt: -9, lastBlockPress: -9, rollDx: 0, rollDy: 1, lastRollAt: -9, rollX: -99, rollY: -99, decoyX: 0, decoyY: 0, decoyUntil: -9, toldAt: -9, snareReady: 0, hound: null, counterUntil: -9,
    attackQueuedAt: -9, rollQueuedAt: -9, relic: 'bash', relics: abilitiesOf('WARRIOR'), relicQueuedAt: -9,
    relicReady: { javelin: 0, hook: 0, horn: 0, bash: 0, net: 0, shadow: 0, channel: 0, lodestone: 0, blessing: 0, ward: 0, sanctuary: 0, stamp: 0, volley: 0, sic: 0, vanish: 0, knives: 0, firering: 0, tether: 0, chain: 0, light: 0, bomb: 0, sentry: 0, bell: 0, knuckle: 0 },
    augments: { javelin: '', hook: '', horn: '', bash: '', net: '', shadow: '', channel: '', lodestone: '', blessing: '', ward: '', sanctuary: '', stamp: '', volley: '', sic: '', vanish: '', knives: '', firering: '', tether: '', chain: '', light: '', bomb: '', sentry: '', bell: '', knuckle: '' }, blessedUntil: -9, wardUntil: -9, wardHp: 0, rallyUntil: -9, arms: {}, bag: [], bagSize: BAG.start, armor: null, rings: [], baseHp: HERO.hp, purse: 0, fed: 0, lastKill: 0, biteAt: 0, ransomed: false, want: 0, cold: false, found: [], relicItem: '', glow: 0, belt: [], potionReady: 0, mendLeft: 0, brandyUntil: -9, hiddenUntil: -9, perfect: false, tempoUntil: -9, carrying: 0, lifting: 0, grabQueuedAt: -9, z: 0, hitstop: 0, lenience: 0,
    seen: { attack: 0, block: 0, roll: 0, weapon: 0, relic: 0, relicSwap: 0, relicPick: 0, augment: 0, cls: 0, take: 0, grab: 0, gear: 0, potion: 0, belt: 0, open: 0 },
  };
}

/** The swing in progress: a combo step, or the heavy scaled by its charge. */
export function currentSwing(h: Hero): Swing {
  const w = WEAPONS[h.weapon], g = statsOf(h);
  const k = h.power, hv = w.heavy;
  // A drawn shot only pierces at a full draw.
  const s = !h.heavy ? w.combo[h.combo] : { ...hv, dmg: Math.round(hv.dmg + (hv.dmgFull * (1 + (g.fx.full ?? 0)) - hv.dmg) * k), knock: hv.knock + (hv.knockFull - hv.knock) * k, pierce: hv.pierce && k >= 1 };
  // Modifiers: how well (shared/gear.ts).
  if (!g.damage && !g.quick && !g.reach && !g.knock && fedMult(h) === 1) return s;
  const fed = fedMult(h);
  return { ...s, dmg: Math.round(s.dmg * (1 + g.damage) * fed), windup: s.windup * (1 - g.quick), recover: s.recover * (1 - g.quick), range: s.range * (1 + g.reach), knock: s.knock * (1 + g.knock) };
}

const swingTime = (s: Swing) => s.windup + s.active + s.recover;

export function spend(h: Hero, n: number, now: number): void {
  h.stamina = Math.max(0, h.stamina - n);
  h.staminaAt = now;
  if (h.stamina <= 0) h.winded = true;
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

function walk(h: Hero, inp: Intent, k: number, dt: number, now: number): void {
  const m = Math.min(1, Math.hypot(inp.mx, inp.my));
  // Creeping: harder to see (STEALTH). (Standing in plain sight isn't.)
  h.sneaking = m >= 0.05 && m < STEALTH.slow;
  if (m < 0.05) return;
  const l = Math.hypot(inp.mx, inp.my), sp = HERO.speed * WEAPONS[h.weapon].speed * statsOf(h).speed * k * m * wadeAt(h.x, h.y) * brandySpeed(h, now) * quickMult(h, now);
  h.x += (inp.mx / l) * sp * dt;
  h.y += (inp.my / l) * sp * dt;
  h.moving = true;
}

/** Room callbacks: `fire` a relic; `loose` a swing's moment of release (a shot, a blessing). */
export interface HeroActs {
  fire: (h: Hero) => void;
  loose: (h: Hero, s: Swing) => void;
  /** A melee blow landed for `n` (forged elements, REAPER). */
  struck: (h: Hero, e: Enemy, n: number) => void;
  /** A melee swing's active frames also smash props. */
  sweep: (h: Hero, s: Swing) => void;
  /** Grab a goblin (or lift a prop, if strong); false if there's nothing to take hold of. */
  grab: (h: Hero) => boolean;
  /** Carrying something overhead, each tick. */
  carry: (h: Hero, inp: Intent, walk: (k: number) => void) => void;
  /** Let go of whatever is held. */
  drop: (h: Hero) => void;
  /** A shield charge in progress, each tick. */
  bash: (h: Hero) => void;
}

/** How a relic and its augment are named on screen: "JAVELIN FIRE". */
/** A relic's name and its element; the Mage's channel shows just the element its spells are in now. */
export const relicLabel = (h: Hero, r = h.relic) => r === 'channel' ? ELEMENT_NAME[(h.augments.channel || 'fire') as keyof typeof ELEMENT_NAME] : RELICS[r].short + (h.augments[r] ? ' ' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] : '');

function gear(h: Hero, inp: Intent, ev: FightEvent[]): void {
  turnBelt(h, inp, ev);
  // A change from the pack waits until your hands are free (never lost, never mid-swing).
  if (inp.gearSeq !== h.seen.gear && (h.act === 'idle' || inp.gearOp === 2 || inp.gearOp >= 4)) (h.seen.gear = inp.gearSeq), applyGear(h, inp.gearOp, inp.gearArg, ev);
  if (inp.augmentSeq !== h.seen.augment) {
    h.seen.augment = inp.augmentSeq;
    if (h.relic === h.relics[1] && h.relicItem) return;
    h.augments[h.relic] = AUGMENTS[(AUGMENTS.indexOf(h.augments[h.relic]) + 1) % AUGMENTS.length];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: relicLabel(h) });
  }
}

/** Seconds to a full draw or charge for this kit. */
export const chargeFull = (w: Weapon, h?: Hero) => (w.draw ?? CHARGE.full) * (h ? 1 - statsOf(h).draw : 1);

export function stepHero(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], acts: HeroActs): void {
  gear(h, inp, ev);
  if (inp.relicSeq !== h.seen.relic) (h.seen.relic = inp.relicSeq), (h.relicQueuedAt = now);
  if (inp.relicSwapSeq !== h.seen.relicSwap) {
    h.seen.relicSwap = inp.relicSwapSeq;
    const usable = h.relics.filter((r, i) => i > 0 || knows(h, 'skill'));
    if (usable.length) h.relic = usable[(usable.indexOf(h.relic) + 1) % usable.length];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: RELICS[h.relic].name });
  }
  if (inp.relicPickSeq !== h.seen.relicPick) {
    h.seen.relicPick = inp.relicPickSeq;
    const r = h.relics[inp.relicPick];
    if (r && r !== h.relic && (r !== h.relics[0] || knows(h, 'skill'))) {
      h.relic = r;
      ev.push({ k: 'relic', x: h.x, y: h.y, name: RELICS[r].name });
    }
  }
  if (inp.attackSeq !== h.seen.attack) (h.seen.attack = inp.attackSeq), (h.attackQueuedAt = now);
  if (inp.grabSeq !== h.seen.grab) (h.seen.grab = inp.grabSeq), (h.grabQueuedAt = now);
  // Hit, stunned or downed while carrying: you drop it.
  if ((h.carrying || h.lifting) && h.act !== 'carry' && h.act !== 'slam') acts.drop(h);
  if (inp.rollSeq !== h.seen.roll) (h.seen.roll = inp.rollSeq), (h.rollQueuedAt = now);
  if (inp.blockSeq !== h.seen.block) {
    h.seen.block = inp.blockSeq;
    // A Mage has no guard at all; the rest can at least tap a parry.
    // (A spellblade has no guard either, but a press catches a blow on the blade: sim/spellblade.ts.)
    const guard = CLASS_GUARD[WEAPONS[h.weapon].cls], catches = !!WEAPONS[h.weapon].catches;
    if ((guard !== 'none' || catches) && !h.winded && now - h.lastBlockPress >= GUARD.parryRepress) h.parryOpenAt = now;
    if (guard === 'none' && !catches && now - h.toldAt > 2) (h.toldAt = now), ev.push({ k: 'noguard', x: h.x, y: h.y, dodge: WEAPONS[h.weapon].dodge.kind });
    h.lastBlockPress = now;
  }
  if (inp.classSeq !== h.seen.cls) {
    h.seen.cls = inp.classSeq;
    if (h.act === 'idle') {
      const cls = CLASS_ORDER[(CLASS_ORDER.indexOf(WEAPONS[h.weapon].cls) + 1) % CLASS_ORDER.length];
      h.weapon = CLASS_KITS[cls][0];
      h.relics = abilitiesOf(cls, h.relics[1]);
      h.relic = h.relics[0];
      ev.push({ k: 'weapon', x: h.x, y: h.y, name: cls === 'HEALER' ? 'CLERIC' : cls });
    }
  }
  if (inp.weaponSeq !== h.seen.weapon) {
    h.seen.weapon = inp.weaponSeq;
    const kits = CLASS_KITS[WEAPONS[h.weapon].cls];
    if (h.act === 'idle' && kits.length > 1) {
      h.weapon = kits[(kits.indexOf(h.weapon) + 1) % kits.length];
      ev.push({ k: 'weapon', x: h.x, y: h.y, name: WEAPONS[h.weapon].name });
    }
  }
  if (h.hitstop > 0) return void (h.hitstop -= dt);
  if (h.stamina <= 0 && !h.winded) (h.winded = true), ev.push({ k: 'winded', x: h.x, y: h.y });
  // Wall Brandy halves the most breath you can have while it lasts (sim/brandy.ts).
  const most = breathCap(h, now);
  if (h.stamina > most) h.stamina = most;
  if (now - h.staminaAt > (h.winded ? HERO.windedDelay * (1 - knack(h, 'winded')) : HERO.regenDelay)) h.stamina = Math.min(most, h.stamina + HERO.staminaRegen * (1 + statsOf(h).breath) * needlesBreath(h, enemies) * dt);
  if (h.winded && h.stamina >= most) (h.winded = false), ev.push({ k: 'breath', x: h.x, y: h.y });
  h.actT += dt;
  h.moving = false;
  h.blocking = false;
  if (h.act !== 'roll' && h.act !== 'step' && h.act !== 'down' && h.act !== 'zip' && h.act !== 'bash' && slide(h, HERO.radius, dt)) ev.push({ k: 'wallhit', x: h.x, y: h.y });

  if (h.act === 'down') {
    if (h.actT >= h.actDur) Object.assign(h, { act: 'idle', hp: h.maxHp, stamina: HERO.stamina, actT: 0 });
    return;
  }
  if (h.act === 'hurt' || h.act === 'stun') {
    if (h.actT >= h.actDur) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  const w = WEAPONS[h.weapon];
  // A Warrior's dodge button is a short step (shared/warrior.ts); a Healer's does nothing.
  const dodge = dodgeOf(w) ?? w.dodge;
  const wantsRoll = !!dodgeOf(w) && now - h.rollQueuedAt < INPUT_BUFFER && now - h.lastRollAt >= dodge.cooldown * (1 - statsOf(h).dodge) && h.stamina >= 1 && !h.winded;
  if (h.act === 'roll' || h.act === 'step') {
    const k = (h.act === 'step' ? dodge.distance : dodgeReach(h)) / dodge.time;
    h.x += h.rollDx * k * dt;
    h.y += h.rollDy * k * dt;
    collide(h, HERO.radius);
    if (h.actT >= dodge.time) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'bash') return acts.bash(h);
  if (h.act === 'zip') return;
  if (h.act === 'carry' || h.act === 'slam') {
    if (h.act === 'slam' && h.actT >= GRAB.slamWindup + GRAB.slamRecover) return void Object.assign(h, { act: 'idle', actT: 0 });
    face(h, inp, enemies, false);
    if (wantsRoll) return acts.drop(h), startRoll(h, inp, now, ev);
    return acts.carry(h, inp, (k) => walk(h, inp, k, dt, now));
  }
  if (h.act === 'throw') {
    const r = RELICS[h.relic];
    if (h.actT >= r.windup && h.actT - dt < r.windup) {
      acts.fire(h);
      spendCharge(h);
      h.relicReady[h.relic] = now + r.cooldown * jealousCooldown(h) * (1 - statsOf(h).focus) * (h.relic === h.relics[0] ? 1 - drilled(h.drills, 'skill') : 1);
      if (h.relic === 'hook' || h.relic === 'javelin' || h.relic === 'net' || h.relic === 'lodestone') ev.push({ k: h.relic === 'hook' ? 'hookfire' : 'throw', x: h.x, y: h.y, dx: h.fx, dy: h.fy });
    }
    if (h.act === 'throw' && h.actT >= r.windup + r.recover) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'charge') {
    if (wantsRoll) return startRoll(h, inp, now, ev);
    // An empty crossbow's hold winds a reload instead of aiming (sim/crossbow.ts).
    if (stepWind(h, inp, dt, ev)) return;
    face(h, inp, enemies, false);
    walk(h, inp, w.chargeSpeed, dt, now);
    collide(h, HERO.radius);
    const full = chargeFull(w, h) - CHARGE.start;
    if (h.actT >= full && h.actT - dt < full) ev.push({ k: 'charged', x: h.x, y: h.y });
    if (!inp.attack) {
      // A draw (a shot on the hold) wants a clean release: on the white flash is perfect; held too long, it shakes and weakens.
      const held = h.actT + CHARGE.start, full = chargeFull(w, h), drawn = !!w.heavy.shot;
      h.power = Math.min(1, held / full);
      // (A rapier's lunge has its flash too: on it, the thrust skewers.)
      h.perfect = (drawn || !!w.heavy.skewer || !!w.heavy.quake || !!w.heavy.wall) && held >= full && held <= full + releaseWindow(h);
      if (drawn && held > full + RELEASE.overdraw) h.power = RELEASE.overdrawn;
      // A crossbow's perfect is its glint, not the flash.
      looseBolt(h);
      // A big spell is paid for now; short of magic, it fizzles and nothing is cast (sim/spells.ts).
      if (!paySpell(h, now, ev)) return void Object.assign(h, { act: 'idle', actT: 0, perfect: false });
      if (h.perfect) ev.push({ k: 'perfect', x: h.x, y: h.y });
      startSwing(h, -1, inp, enemies, now, ev);
      ev.push({ k: 'heavy', x: h.x, y: h.y });
    }
    return;
  }
  if (h.act === 'attack') {
    const s = currentSwing(h), cast = !h.heavy ? w.castWalk ?? 0 : 0;
    // A wand's quick spell is cast walking, turning to the aim as it comes up.
    if (cast) {
      if (h.actT < s.windup) face(h, inp, enemies, true, (s.range ?? 3.2) * 0.9);
      walk(h, inp, cast, dt, now);
      collide(h, HERO.radius);
    }
    if (h.actT < s.windup) {
      const k = s.lunge / s.windup;
      h.x += h.fx * k * dt;
      h.y += h.fy * k * dt;
      collide(h, HERO.radius);
    } else if (h.actT < s.windup + s.active) {
      if (h.actT - dt < s.windup) acts.loose(h, s);
      // The greatsword's overhead loosed on the white flash: a shockwave (sim/warrior.ts).
      if (h.actT - dt < s.windup && h.heavy && h.perfect && s.quake) quake(h, enemies, now, ev);
      if (!s.shot && !s.wall) {
        // A Rogue's knives find one goblin a blow (the nearest in reach), a rapier's lunge two; everything else cuts through all.
        const most = s.hits ?? (w.single ? 1 : 0), near = most ? [...enemies].sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y)) : enemies;
        for (const e of near) {
          if (most && h.hitIds.filter((id) => id > 0).length >= most) break;
          const n = hitEnemy(h, s, e, now, ev);
          if (n) acts.struck(h, e, n);
        }
        acts.sweep(h, s);
      }
    } else {
      const queued = now - h.attackQueuedAt < INPUT_BUFFER && h.attackQueuedAt > now - h.actT;
      if (queued && !h.heavy && h.combo < w.combo.length - 1) {
        if (!inp.attack) return startSwing(h, h.combo + 1, inp, enemies, now, ev);
        if (now - h.attackQueuedAt >= CHARGE.start) return refuseSpell(h, now, ev) ? undefined : startCharge(h);
      }
      if (wantsRoll) return startRoll(h, inp, now, ev);
      if (h.actT >= swingTime(s)) (h.act = 'idle'), (h.actT = 0);
    }
    return;
  }
  // Idle or walking.
  if (wantsRoll) return startRoll(h, inp, now, ev);
  if (now - h.grabQueuedAt < INPUT_BUFFER && acts.grab(h)) return;
  // The class skill, not yet taught, does nothing (the press is spent).
  if (now - h.relicQueuedAt < INPUT_BUFFER && h.relic === h.relics[0] && !knows(h, 'skill')) h.relicQueuedAt = -9;
  // A dark relic does nothing (the press is spent): it wants recharging at the church.
  if (now - h.relicQueuedAt < INPUT_BUFFER && relicDark(h)) (h.relicQueuedAt = -9), ev.push({ k: 'dark', x: h.x, y: h.y });
  if (now - h.relicQueuedAt < INPUT_BUFFER && now >= h.relicReady[h.relic] && !jealousBlocks(h)) {
    // A blessing turns to nobody: the room picks the ally.
    if (h.relic !== 'blessing' && h.relic !== 'horn' && h.relic !== 'bash') face(h, inp, enemies, true, RELICS[h.relic].range);
    Object.assign(h, { act: 'throw', actT: 0, relicQueuedAt: -9 });
    return;
  }
  // Spendthrift won't draw with an empty purse.
  if (wears(h, 'spendthrift') && h.purse <= 0) h.attackQueuedAt = -9;
  if (now - h.attackQueuedAt < CHARGE.start + INPUT_BUFFER && h.attackQueuedAt > -9) {
    // The crossbow looses on the press; everything else waits to see if it's a tap or a hold.
    if (!inp.attack || w.noCharge) return startSwing(h, 0, inp, enemies, now, ev);
    if (now - h.attackQueuedAt >= CHARGE.start) return refuseSpell(h, now, ev) ? undefined : startCharge(h);
  }
  // Only a Warrior's or Healer's kit holds a block.
  h.blocking = inp.block && h.stamina > 0 && !h.winded && CLASS_GUARD[w.cls] === 'full' && !w.parryOnly;
  // Holding block as a Ranger or Rogue does nothing: say so, once a press.
  if (inp.block && (CLASS_GUARD[w.cls] === 'parry' || w.parryOnly) && now - h.lastBlockPress > 0.35 && h.toldAt < h.lastBlockPress) (h.toldAt = now), ev.push({ k: 'noblock', x: h.x, y: h.y });
  // Guarding with no aim (a phone) turns to the nearest threat, so a parry faces the right way.
  face(h, inp, enemies, h.blocking || now - h.lastBlockPress < 0.3);
  walk(h, inp, h.blocking ? w.blockSpeed : 1, dt, now);
  collide(h, HERO.radius);
}

function startCharge(h: Hero): void {
  h.act = 'charge';
  h.actT = 0;
  h.attackQueuedAt = -9;
  h.heavy = false;
  beginHold(h);
}

/** Start combo step `i`, or the heavy when i is -1. */
function startSwing(h: Hero, i: number, inp: Intent, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  // Bows and staffs look for a goblin as far as they shoot.
  const shot = i < 0 ? WEAPONS[h.weapon].heavy : WEAPONS[h.weapon].combo[0];
  face(h, inp, enemies, true, shot.shot ? shot.range * 0.9 : 3.2);
  h.act = 'attack';
  h.actT = 0;
  h.heavy = i < 0;
  if (!h.heavy) h.perfect = false;
  h.combo = Math.max(0, i);
  h.hitIds = [];
  h.hitAllies = [];
  h.attackQueuedAt = -9;
  h.counter = now < h.counterUntil;
  if (h.counter) h.counterUntil = -9;
  // (A Ranger's tap is the short sword: it sounds like one.)
  ev.push({ k: 'swing', x: h.x, y: h.y, src: !currentSwing(h).shot && WEAPONS[h.weapon].cls === 'RANGER' ? 'sword' : h.weapon, heavy: h.heavy });
}

function startRoll(h: Hero, inp: Intent, now: number, ev: FightEvent[]): void {
  const dodge = dodgeOf(WEAPONS[h.weapon]) ?? WEAPONS[h.weapon].dodge, kind = dodge.kind;
  let x = inp.mx, y = inp.my;
  // A Warrior's step: where you push (back from where you face, with no push), still facing; no protection.
  if (kind === 'step') {
    if (Math.hypot(x, y) < 0.1) (x = -h.fx), (y = -h.fy);
    const l = Math.hypot(x, y);
    Object.assign(h, { rollDx: x / l, rollDy: y / l, act: 'step', actT: 0, kvx: 0, kvy: 0, lastRollAt: now, rollX: h.x, rollY: h.y, rollQueuedAt: -9 });
    spend(h, dodge.stamina, now);
    return void ev.push({ k: 'step', x: h.x, y: h.y });
  }
  // A backstep always hops away from where you face, and you keep facing the threat.
  if (kind === 'backstep') (x = -h.fx), (y = -h.fy);
  if (Math.hypot(x, y) < 0.1) (x = h.fx), (y = h.fy);
  const l = Math.hypot(x, y);
  h.rollDx = x / l;
  h.rollDy = y / l;
  if (kind !== 'backstep') (h.fx = h.rollDx), (h.fy = h.rollDy);
  h.act = 'roll';
  h.actT = 0;
  h.kvx = h.kvy = 0;
  h.lastRollAt = now;
  h.rollX = h.x;
  h.rollY = h.y;
  // A blink leaves an image of you where you stood, and the goblins near it go for that.
  if (kind === 'blink' && knows(h, 'leave')) Object.assign(h, { decoyX: h.x, decoyY: h.y, decoyUntil: now + decoyTime(h) });
  h.rollQueuedAt = -9;
  spend(h, WEAPONS[h.weapon].dodge.stamina * DODGE.cost * dodgeBreath(h), now);
  ev.push({ k: kind === 'blink' ? 'blink' : 'roll', x: h.x, y: h.y });
}
