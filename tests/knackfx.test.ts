/**
 * Every knack on every class's tree changes what it says, read where the fight reads it: each probe
 * below is the number the room judges (or the room's own function run), with and without the knack.
 */
import { describe, expect, it } from 'vitest';
import { CLASS_KITS, CLASS_ORDER, PERKS, WEAPONS, classPerks, perkFx, type FxKey, type HeroClass, type PerkId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { chargeFull, currentSwing } from '../src/sim/hero';
import { statsOf } from '../src/sim/gearstats';
import { healMult } from '../src/sim/lantern';
import { hitEnemy, hitHero } from '../src/sim/combat';
import { spendPrimed, turnElement } from '../src/sim/channel';
import { laySnare } from '../src/sim/ranger';
import { hallow, rally, ward } from '../src/sim/relics';
import * as K from '../src/sim/knacks';
import type { EnemyAttack, FightEvent, Hero } from '../src/sim/types';

/** A hero of the class (its first kit) in a room with a butcher, and the knacks given. */
function scene(cls: HeroClass, perks: string[]) {
  const room = new ArenaRoom(3, { scrappers: false });
  const h = room.join('me'), e = room.enemies[0];
  Object.assign(h, { weapon: CLASS_KITS[cls][0], perks, x: 9, y: 8, fx: 0, fy: -1, act: 'idle' });
  Object.assign(e, { x: 9, y: 6.9, fx: 0, fy: 1, alert: true, act: 'chase', attack: null });
  return { room, h, e, ev: [] as FightEvent[] };
}

const melee = (h: Hero) => WEAPONS[h.weapon].combo[0];
/** A blow on the hero from the butcher in front. */
const blow = (h: Hero, e: { x: number; y: number }): EnemyAttack => ({ kind: 'cleave', t: 1, windup: 1, active: 0.1, recover: 1, dmg: 20, knock: 4, unblockable: false, dx: 0, dy: 1, ox: e.x, oy: e.y, range: 3, arc: 90, cx: h.x, cy: h.y } as EnemyAttack);

/** What each knack moves, measured; +1 it should go up, -1 down. */
const PROBES: Partial<Record<FxKey, [(c: HeroClass, perks: string[]) => number, 1 | -1]>> = {
  parry: [(c, p) => K.parryWindow(scene(c, p).h), 1],
  block: [(c, p) => {
    const { h, e, ev } = scene(c, p);
    Object.assign(h, { blocking: true, stamina: 100 });
    hitHero(e, blow(h, e), h, 5, ev);
    return 100 - h.stamina;
  }, -1],
  counter: [(c, p) => {
    const { h, e, ev } = scene(c, p);
    h.counter = true;
    return hitEnemy(h, melee(h), e, 5, ev);
  }, 1],
  counterTime: [(c, p) => K.counterWindow(scene(c, p).h), 1],
  health: [(_c, p) => perkFx(p).health ?? 0, 1],
  tough: [(c, p) => statsOf(scene(c, p).h).taken, -1],
  foot: [(c, p) => statsOf(scene(c, p).h).speed, 1],
  draw: [(c, p) => chargeFull(WEAPONS[CLASS_KITS[c][0]], scene(c, p).h), -1],
  full: [(c, p) => {
    const { h } = scene(c, p);
    Object.assign(h, { heavy: true, power: 1 });
    return currentSwing(h).dmg;
  }, 1],
  knock: [(c, p) => currentSwing(scene(c, p).h).knock, 1],
  damage: [(c, p) => currentSwing(Object.assign(scene(c, p).h, { heavy: true, power: 1 })).dmg, 1],
  quick: [(c, p) => currentSwing(scene(c, p).h).windup, -1],
  focus: [(c, p) => statsOf(scene(c, p).h).focus, 1],
  skillFar: [(c, p) => K.bashReach(scene(c, p).h) + K.hornReach(scene(c, p).h), 1],
  skillHold: [(c, p) => {
    const { h, room, ev } = scene(c, p);
    rally(h, room.enemies, 0, ev);
    return h.rallyUntil + K.bashStun(h);
  }, 1],
  perfect: [(c, p) => K.perfectMult(scene(c, p).h), 1],
  flash: [(c, p) => K.releaseWindow(scene(c, p).h), 1],
  dodge: [(c, p) => statsOf(scene(c, p).h).dodge, 1],
  leap: [(c, p) => K.dodgeReach(scene(c, p).h), 1],
  light: [(c, p) => K.dodgeBreath(scene(c, p).h), -1],
  snareCd: [(c, p) => K.snareWait(scene(c, p).h), -1],
  snareHold: [(c, p) => K.snareHold(scene(c, p).h), 1],
  snares: [(c, p) => {
    const { h } = scene(c, p), snares: never[] = [];
    for (let t = 0; t < 4; t++) laySnare(h, snares, t * 10, []);
    return snares.length;
  }, 1],
  houndEvery: [(c, p) => K.houndWait(scene(c, p).h), -1],
  houndBite: [(c, p) => K.houndBite(scene(c, p).h), 1],
  houndBites: [(c, p) => K.houndBites(scene(c, p).h), 1],
  slip: [(c, p) => K.slipWindow(scene(c, p).h), 1],
  angle: [(c, p) => {
    // A goblin turned a little past side-on from you: behind only with the wider angle.
    const { h, e, ev } = scene(c, p), dot = -0.27;
    Object.assign(e, { fx: Math.sqrt(1 - dot * dot), fy: dot });
    return hitEnemy(h, melee(h), e, 5, ev);
  }, 1],
  rear: [(c, p) => {
    const { h, e, ev } = scene(c, p);
    Object.assign(e, { fx: 0, fy: -1 });
    return hitEnemy(h, melee(h), e, 5, ev);
  }, 1],
  ambush: [(c, p) => {
    const { h, e, ev } = scene(c, p);
    e.alert = false;
    return hitEnemy(h, melee(h), e, 5, ev);
  }, 1],
  quiet: [(c, p) => K.sneakSight(scene(c, p).h), -1],
  image: [(c, p) => K.decoyTime(scene(c, p).h), 1],
  primed: [(c, p) => {
    const { h } = scene(c, p);
    turnElement(h, []);
    return spendPrimed(h);
  }, 1],
  clear: [(c, p) => {
    const { h } = scene(c, p);
    h.stamina = 20;
    turnElement(h, []);
    return h.stamina;
  }, 1],
  twice: [(c, p) => {
    const { h } = scene(c, p);
    turnElement(h, []);
    spendPrimed(h);
    return spendPrimed(h);
  }, 1],
  burst: [(c, p) => K.burstMult(scene(c, p).h), 1],
  breath: [(c, p) => statsOf(scene(c, p).h).breath, 1],
  mending: [(c, p) => healMult(scene(c, p).h), 1],
  mercyReach: [(c, p) => K.healReach(scene(c, p).h), 1],
  mercy: [(c, p) => {
    const { h } = scene(c, p);
    h.combo = 1;
    return K.healOf(h, WEAPONS[h.weapon].combo[1]);
  }, 1],
  smiteStun: [(c, p) => K.smiteStun(scene(c, p).h, WEAPONS[CLASS_KITS[c][0]].heavy), 1],
  bless: [(c, p) => {
    const { h, room, ev } = scene(c, p);
    ward(h, room.heroes, undefined, 0, ev);
    return hallow(h, undefined, 0, '', ev).r + h.wardHp;
  }, 1],
  blessTime: [(c, p) => {
    const { h, room, ev } = scene(c, p);
    ward(h, room.heroes, undefined, 0, ev);
    return hallow(h, undefined, 0, '', ev).until + h.wardUntil;
  }, 1],
};

describe('every knack does what it says, in the fight', () => {
  for (const c of CLASS_ORDER) for (const id of classPerks(c)) {
    it(`${c} ${PERKS[id].name} (${id})`, () => {
      const keys = Object.keys(PERKS[id].fx) as FxKey[];
      expect(keys).toHaveLength(1);
      const probe = PROBES[keys[0]];
      expect(probe, `no probe for ${keys[0]}`).toBeTruthy();
      const [measure, way] = probe!, before = measure(c, []), after = measure(c, [id as PerkId]);
      expect(Math.sign(after - before), `${before} -> ${after}`).toBe(way);
    });
  }
});

describe('modest', () => {
  it('a whole class tree moves no share past a third, and adds no more than 20 health', () => {
    for (const c of CLASS_ORDER) {
      const fx = perkFx(classPerks(c));
      for (const k of ['damage', 'quick', 'draw', 'foot', 'tough', 'full', 'rear', 'leap', 'light', 'dodge', 'focus', 'perfect', 'mending', 'burst'] as FxKey[]) expect(fx[k] ?? 0, `${c} ${k}`).toBeLessThanOrEqual(0.34);
      expect(fx.health ?? 0).toBeLessThanOrEqual(20);
    }
  });
});
