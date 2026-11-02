/**
 * A hero's turn each tick: presses, movement, the weapon's combo, the charged heavy, the roll.
 * A tap of attack swings on release; holding past CHARGE.start charges a heavy instead.
 */
import { collide, wadeAt } from '../shared/arena';
import { CHANNEL, DODGE, CLASS_GUARD, DECOY, POTION, AUGMENTS, CHARGE, GRAB, HORN, PERK, RELEASE, CLASS_KITS, CLASS_ORDER, abilitiesOf, ELEMENT_NAME, GUARD, HERO, INPUT_BUFFER, RELICS, WEAPONS, type Swing, type Weapon, drilled } from '../shared/tuning';
import { slide } from './bodies';
import { applyGear } from './pack';
import { statsOf } from './gearstats';
import { fedMult, jealousBlocks, jealousCooldown, needlesBreath, wears } from './hungry';
import { hitEnemy } from './combat';
import type { Enemy, FightEvent, Hero, Intent } from './types';

export function newHero(id: string, x: number, y: number): Hero {
  return {
    id, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, moving: false, hp: HERO.hp, maxHp: HERO.hp, perks: [], stamina: HERO.stamina, staminaAt: -9, weapon: 'sword',
    act: 'idle', actT: 0, actDur: 0, combo: 0, heavy: false, power: 0, counter: false, hitIds: [], blocking: false,
    parryOpenAt: -9, lastBlockPress: -9, rollDx: 0, rollDy: 1, lastRollAt: -9, rollX: -99, rollY: -99, decoyX: 0, decoyY: 0, decoyUntil: -9, toldAt: -9, snareReady: 0, hound: null, counterUntil: -9,
    attackQueuedAt: -9, rollQueuedAt: -9, relic: 'horn', relics: abilitiesOf('WARRIOR'), relicQueuedAt: -9,
    relicReady: { javelin: 0, hook: 0, horn: 0, net: 0, shadow: 0, channel: 0, lodestone: 0, blessing: 0, ward: 0, sanctuary: 0 },
    augments: { javelin: '', hook: '', horn: '', net: '', shadow: '', channel: '', lodestone: '', blessing: '', ward: '', sanctuary: '' }, blessedUntil: -9, wardUntil: -9, wardHp: 0, rallyUntil: -9, arms: {}, bag: [], armor: null, rings: [], baseHp: HERO.hp, purse: 0, fed: 0, lastKill: 0, biteAt: 0, ransomed: false, want: 0, cold: false, found: [], glow: 0, belt: [], potionReady: 0, mendLeft: 0, brandyUntil: -9, hiddenUntil: -9, perfect: false, tempoUntil: -9, carrying: 0, lifting: 0, grabQueuedAt: -9, z: 0, hitstop: 0, lenience: 0,
    seen: { attack: 0, block: 0, roll: 0, weapon: 0, relic: 0, relicSwap: 0, relicPick: 0, augment: 0, cls: 0, take: 0, grab: 0, gear: 0, potion: 0, open: 0 },
  };
}

/** The swing in progress: a combo step, or the heavy scaled by its charge. */
export function currentSwing(h: Hero): Swing {
  const w = WEAPONS[h.weapon], g = statsOf(h);
  const k = h.power, hv = w.heavy;
  // A drawn shot only pierces at a full draw.
  const s = !h.heavy ? w.combo[h.combo] : { ...hv, dmg: Math.round(hv.dmg + (hv.dmgFull - hv.dmg) * k), knock: hv.knock + (hv.knockFull - hv.knock) * k, pierce: hv.pierce && k >= 1 };
  // Modifiers: how well (shared/gear.ts).
  if (!g.damage && !g.quick && !g.reach && !g.knock && fedMult(h) === 1) return s;
  const fed = fedMult(h);
  return { ...s, dmg: Math.round(s.dmg * (1 + g.damage) * fed), windup: s.windup * (1 - g.quick), recover: s.recover * (1 - g.quick), range: s.range * (1 + g.reach), knock: s.knock * (1 + g.knock) };
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
  const l = Math.hypot(inp.mx, inp.my), sp = HERO.speed * WEAPONS[h.weapon].speed * statsOf(h).speed * k * m * wadeAt(h.x, h.y);
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
}

/** How a relic and its augment are named on screen: "JAVELIN FIRE". */
export const relicLabel = (h: Hero, r = h.relic) => RELICS[r].short + (h.augments[r] ? ' ' + ELEMENT_NAME[h.augments[r] as keyof typeof ELEMENT_NAME] : '');

function gear(h: Hero, inp: Intent, ev: FightEvent[]): void {
  // A change from the pack waits until your hands are free (never lost, never mid-swing).
  if (inp.gearSeq !== h.seen.gear && (h.act === 'idle' || inp.gearOp === 2 || inp.gearOp >= 4)) (h.seen.gear = inp.gearSeq), applyGear(h, inp.gearOp, inp.gearArg, ev);
  if (inp.augmentSeq !== h.seen.augment) {
    h.seen.augment = inp.augmentSeq;
    h.augments[h.relic] = AUGMENTS[(AUGMENTS.indexOf(h.augments[h.relic]) + 1) % AUGMENTS.length];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: relicLabel(h) });
  }
}

/** Seconds to a full draw or charge for this kit. */
export const chargeFull = (w: Weapon, h?: Hero) => (w.draw ?? CHARGE.full) * (h?.perks.includes('steadyhand') && w.heavy.shot === 'arrow' ? PERK.steadyhand : 1) * (h ? 1 - statsOf(h).draw : 1);

export function stepHero(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], acts: HeroActs): void {
  gear(h, inp, ev);
  if (inp.relicSeq !== h.seen.relic) (h.seen.relic = inp.relicSeq), (h.relicQueuedAt = now);
  if (inp.relicSwapSeq !== h.seen.relicSwap) {
    h.seen.relicSwap = inp.relicSwapSeq;
    h.relic = h.relics[(h.relics.indexOf(h.relic) + 1) % h.relics.length];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: RELICS[h.relic].name });
  }
  if (inp.relicPickSeq !== h.seen.relicPick) {
    h.seen.relicPick = inp.relicPickSeq;
    const r = h.relics[inp.relicPick];
    if (r && r !== h.relic) {
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
    const guard = CLASS_GUARD[WEAPONS[h.weapon].cls];
    if (guard !== 'none' && now - h.lastBlockPress >= GUARD.parryRepress) h.parryOpenAt = now;
    if (guard === 'none' && now - h.toldAt > 2) (h.toldAt = now), ev.push({ k: 'noguard', x: h.x, y: h.y });
    h.lastBlockPress = now;
  }
  if (inp.classSeq !== h.seen.cls) {
    h.seen.cls = inp.classSeq;
    if (h.act === 'idle') {
      const cls = CLASS_ORDER[(CLASS_ORDER.indexOf(WEAPONS[h.weapon].cls) + 1) % CLASS_ORDER.length];
      h.weapon = CLASS_KITS[cls][0];
      h.relics = abilitiesOf(cls, h.relics[1]);
      h.relic = h.relics[0];
      ev.push({ k: 'weapon', x: h.x, y: h.y, name: cls });
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
  if (now - h.staminaAt > HERO.regenDelay) h.stamina = Math.min(HERO.stamina, h.stamina + HERO.staminaRegen * (h.rallyUntil > now ? HORN.regen : 1) * (h.perks.includes('endurance') ? PERK.endurance : 1) * (h.brandyUntil > now ? POTION.brandyRegen : 1) * (1 + statsOf(h).breath) * needlesBreath(h, enemies) * dt);
  h.actT += dt;
  h.moving = false;
  h.blocking = false;
  if (h.act !== 'roll' && h.act !== 'down' && h.act !== 'zip' && slide(h, HERO.radius, dt)) ev.push({ k: 'wallhit', x: h.x, y: h.y });

  if (h.act === 'down') {
    if (h.actT >= h.actDur) Object.assign(h, { act: 'idle', hp: h.maxHp, stamina: HERO.stamina, actT: 0 });
    return;
  }
  if (h.act === 'hurt' || h.act === 'stun') {
    if (h.actT >= h.actDur) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  // The Mage's channel: stood still, and at the end its spells turn to the next element.
  if (h.act === 'channel') {
    if (h.actT < h.actDur) return;
    const order = CHANNEL.order, next = order[(order.indexOf((h.augments.channel || 'fire') as (typeof order)[number]) + 1) % order.length];
    h.augments.channel = next;
    Object.assign(h, { act: 'idle', actT: 0 });
    return void ev.push({ k: 'channeled', x: h.x, y: h.y, el: next });
  }
  const w = WEAPONS[h.weapon];
  const dodge = w.dodge;
  const wantsRoll = now - h.rollQueuedAt < INPUT_BUFFER && now - h.lastRollAt >= dodge.cooldown * (1 - statsOf(h).dodge) * (h.perks.includes('footwork') ? PERK.footwork : 1) * (dodge.kind === 'blink' && h.perks.includes('focus') ? PERK.focus : 1) && h.stamina >= 1;
  if (h.act === 'roll') {
    const k = (dodge.distance * statsOf(h).dodgeDist) / dodge.time;
    h.x += h.rollDx * k * dt;
    h.y += h.rollDy * k * dt;
    collide(h, HERO.radius);
    if (h.actT >= dodge.time) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'zip') return;
  if (h.act === 'carry' || h.act === 'slam') {
    if (h.act === 'slam' && h.actT >= GRAB.slamWindup + GRAB.slamRecover) return void Object.assign(h, { act: 'idle', actT: 0 });
    face(h, inp, enemies, false);
    if (wantsRoll) return acts.drop(h), startRoll(h, inp, now, ev);
    return acts.carry(h, inp, (k) => walk(h, inp, k, dt));
  }
  if (h.act === 'throw') {
    const r = RELICS[h.relic];
    if (h.actT >= r.windup && h.actT - dt < r.windup) {
      acts.fire(h);
      h.relicReady[h.relic] = now + r.cooldown * jealousCooldown(h) * (1 - statsOf(h).focus) * (h.perks.includes('relicsworn') ? PERK.relicsworn : 1) * (h.relic === h.relics[0] ? 1 - drilled(h.drills, 'skill') : 1);
      if (h.relic === 'hook' || h.relic === 'javelin' || h.relic === 'net' || h.relic === 'lodestone') ev.push({ k: h.relic === 'hook' ? 'hookfire' : 'throw', x: h.x, y: h.y, dx: h.fx, dy: h.fy });
    }
    if (h.act === 'throw' && h.actT >= r.windup + r.recover) (h.act = 'idle'), (h.actT = 0);
    return;
  }
  if (h.act === 'charge') {
    if (wantsRoll) return startRoll(h, inp, now, ev);
    face(h, inp, enemies, false);
    walk(h, inp, w.chargeSpeed, dt);
    collide(h, HERO.radius);
    const full = chargeFull(w, h) - CHARGE.start;
    if (h.actT >= full && h.actT - dt < full) ev.push({ k: 'charged', x: h.x, y: h.y });
    if (!inp.attack) {
      // A draw (a shot on the hold) wants a clean release: on the white flash is perfect; held too long, it shakes and weakens.
      const held = h.actT + CHARGE.start, full = chargeFull(w, h), drawn = !!w.heavy.shot;
      h.power = Math.min(1, held / full);
      h.perfect = drawn && held >= full && held <= full + RELEASE.perfect;
      if (drawn && held > full + RELEASE.overdraw) h.power = RELEASE.overdrawn;
      if (h.perfect) ev.push({ k: 'perfect', x: h.x, y: h.y });
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
      if (h.actT - dt < s.windup) acts.loose(h, s);
      if (!s.shot) {
        // A Rogue's knives find one goblin a blow (the nearest in reach); everything else cuts through all.
        const one = !!w.single, near = one ? [...enemies].sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y)) : enemies;
        for (const e of near) {
          if (one && h.hitIds.some((id) => id > 0)) break;
          const n = hitEnemy(h, s, e, now, ev);
          if (n) acts.struck(h, e, n);
        }
        acts.sweep(h, s);
      }
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
  if (now - h.grabQueuedAt < INPUT_BUFFER && acts.grab(h)) return;
  if (now - h.relicQueuedAt < INPUT_BUFFER && now >= h.relicReady[h.relic] && !jealousBlocks(h)) {
    // A blessing turns to nobody: the room picks the ally.
    if (h.relic !== 'blessing' && h.relic !== 'horn') face(h, inp, enemies, true, RELICS[h.relic].range);
    Object.assign(h, { act: 'throw', actT: 0, relicQueuedAt: -9 });
    return;
  }
  // Spendthrift won't draw with an empty purse.
  if (wears(h, 'spendthrift') && h.purse <= 0) h.attackQueuedAt = -9;
  if (now - h.attackQueuedAt < CHARGE.start + INPUT_BUFFER && h.attackQueuedAt > -9) {
    // The crossbow looses on the press; everything else waits to see if it's a tap or a hold.
    if (!inp.attack || w.noCharge) return startSwing(h, 0, inp, enemies, now, ev);
    if (now - h.attackQueuedAt >= CHARGE.start) return startCharge(h);
  }
  // Only a Warrior's or Healer's kit holds a block.
  h.blocking = inp.block && h.stamina > 0 && CLASS_GUARD[w.cls] === 'full';
  // Holding block as a Ranger or Rogue does nothing: say so, once a press.
  if (inp.block && CLASS_GUARD[w.cls] === 'parry' && now - h.lastBlockPress > 0.35 && h.toldAt < h.lastBlockPress) (h.toldAt = now), ev.push({ k: 'noblock', x: h.x, y: h.y });
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
  const kind = WEAPONS[h.weapon].dodge.kind;
  let x = inp.mx, y = inp.my;
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
  if (kind === 'blink') Object.assign(h, { decoyX: h.x, decoyY: h.y, decoyUntil: now + DECOY.time });
  h.rollQueuedAt = -9;
  spend(h, WEAPONS[h.weapon].dodge.stamina * DODGE.cost * statsOf(h).dodgeCost, now);
  ev.push({ k: kind === 'blink' ? 'blink' : 'roll', x: h.x, y: h.y });
}
