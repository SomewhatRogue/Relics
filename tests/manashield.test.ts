/** The spellblade's mana shield (sim/manashield.ts, Kyle 2026-11-05): hits drain magic before health, a
 *  parry refills it, holds cost their magic, and a guest's screen gets the same ward. */
import { describe, expect, it } from 'vitest';
import { HERO, HOUSEFIRE, MANA_SHIELD, SPELL, TICK, type WeaponId } from '../src/shared/tuning';
import { hitHero } from '../src/sim/combat';
import { stepBlaze, type Burning } from '../src/sim/blaze';
import { newHero } from '../src/sim/hero';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import type { EnemyAttack, FightEvent, Hero } from '../src/sim/types';
import { mageArena } from './magearena';

/** A plain blow (or a striped one, or a shot) from the goblin at (9, 7.6) down onto the hero at (9, 9). */
const blow = (dmg: number, more: Partial<EnemyAttack> = {}): EnemyAttack => ({ kind: 'swing', t: 0.5, windup: 0.5, active: 0.1, recover: 0.3, dmg, knock: 2, unblockable: false, dx: 0, dy: 1, ox: 9, oy: 7.6, range: 2, arc: 90, cx: 0, cy: 0, radius: 0, done: false, ...more });

function hit(weapon: WeaponId, dmg: number, more: Partial<EnemyAttack> = {}, magic = HERO.stamina) {
  const a = mageArena(weapon);
  Object.assign(a.h, { stamina: magic, parryOpenAt: -9 });
  const ev: FightEvent[] = [], now = a.room.time;
  hitHero(a.e, blow(dmg, more), a.h, now, ev);
  return { ...a, ev, now };
}

describe('hits drain magic first', () => {
  it('a blow or a shot comes off MAGIC, a point a point, and health is untouched', () => {
    for (const kind of ['swing', 'shot'] as const) {
      const a = hit('spellblade', 12, { kind });
      expect(a.h.hp).toBe(HERO.hp);
      expect(HERO.stamina - a.h.stamina).toBeCloseTo(12 * MANA_SHIELD.perDmg, 5);
      expect(a.ev.find((x) => x.k === 'manaward')).toMatchObject({ n: 12 * MANA_SHIELD.perDmg });
      expect(a.ev.some((x) => x.k === 'hit')).toBe(false);
      expect(a.h.wardAt).toBe(a.now);
    }
  });

  it('a shield hit starts the refill wait over, as a cast does', () => {
    const a = hit('spellblade', 20);
    const after = a.h.stamina;
    a.run(HERO.magicDelay - 0.3);
    expect(a.h.stamina).toBeCloseTo(after, 5);
    a.run(1);
    expect(a.h.stamina).toBeGreaterThan(after);
  });

  it('an empty shield passes the rest to health, breaks, and does not wind you', () => {
    const a = hit('spellblade', 12, {}, 5);
    // 5 magic covers 5 / perDmg of the 12; the rest, rounded up, reaches health.
    expect(a.h.hp).toBe(HERO.hp - Math.ceil(12 - 5 / MANA_SHIELD.perDmg));
    expect(a.h.stamina).toBeLessThan(1);
    expect(a.ev.some((x) => x.k === 'manabreak')).toBe(true);
    expect(a.h.wardBrokeAt).toBe(a.now);
    a.run(TICK * 2);
    expect(a.h.winded).toBeFalsy();
    // Nothing left: the next blow goes whole to health, no ward.
    const ev: FightEvent[] = [];
    Object.assign(a.h, { act: 'idle', hp: HERO.hp, stamina: 0.5 });
    hitHero(a.e, blow(10), a.h, a.room.time, ev);
    expect(a.h.hp).toBe(HERO.hp - 10);
    expect(ev.some((x) => x.k === 'manaward')).toBe(false);
  });

  it('striped (unblockable) blows go straight to health', () => {
    const a = hit('spellblade', 14, { unblockable: true });
    expect(a.h.hp).toBe(HERO.hp - 14);
    expect(a.h.stamina).toBe(HERO.stamina);
    expect(a.ev.some((x) => x.k === 'manaward')).toBe(false);
  });

  it('fire underfoot burns magic first', () => {
    const h: Hero = Object.assign(newHero('me', 2, 2), { weapon: 'spellblade' as WeaponId });
    const r: Burning = { map: { w: 10, h: 10, blaze: { patches: [{ x: 1, y: 1, w: 2, h: 2, at: 0 }], beams: [], fall: 99 } }, heroes: [h], props: [], survivors: [], time: 0, events: [] };
    for (let t = 0; t < 2; t += TICK) (r.time = t), stepBlaze(r, TICK);
    expect(h.hp).toBe(HERO.hp);
    expect(HERO.stamina - h.stamina).toBeGreaterThan(HOUSEFIRE.dps);
  });

  it("the other Mage weapons are unaffected: a hit is health's", () => {
    for (const w of ['wand', 'staff'] as WeaponId[]) {
      const a = hit(w, 12);
      expect(a.h.hp, w).toBe(HERO.hp - 12);
      expect(a.h.stamina, w).toBe(HERO.stamina);
      expect(a.ev.some((x) => x.k === 'manaward')).toBe(false);
    }
  });
});

describe('a parry refills it', () => {
  it('a parry gives back MAGIC.parry, a perfect one (late, tight) more', () => {
    for (const [since, n] of [[0.18, MANA_SHIELD.parry], [0.05, MANA_SHIELD.perfect]] as const) {
      const a = mageArena('spellblade');
      Object.assign(a.h, { stamina: 30, parryOpenAt: a.room.time - since });
      const ev: FightEvent[] = [];
      hitHero(a.e, blow(15), a.h, a.room.time, ev);
      expect(ev.some((x) => x.k === 'parry')).toBe(true);
      expect(a.h.hp).toBe(HERO.hp);
      expect(a.h.stamina).toBe(30 + n);
      expect(ev.find((x) => x.k === 'manaup')).toMatchObject({ n, ...(n === MANA_SHIELD.perfect ? { big: true } : {}) });
    }
  });

  it('never past a full bar', () => {
    const a = mageArena('spellblade');
    Object.assign(a.h, { stamina: 90, parryOpenAt: a.room.time - 0.05 });
    hitHero(a.e, blow(15), a.h, a.room.time, []);
    expect(a.h.stamina).toBe(HERO.stamina);
  });
});

describe('spells cost magic as normal', () => {
  it('a hold below its cost fizzles, nothing spent', () => {
    const a = mageArena('spellblade', [[2, 2]], 'frost');
    Object.assign(a.h, { stamina: SPELL.spellblade - 5, staminaAt: 1e9 });
    const ev = a.loose(0.9, 0.3);
    expect(ev.some((x) => x.k === 'fizzle')).toBe(true);
    expect(ev.some((x) => x.k === 'spell')).toBe(false);
    expect(a.h.stamina).toBe(SPELL.spellblade - 5);
  });

  it("an old snapshot's or save's blade charge is ignored: a hold costs its magic", () => {
    const a = mageArena('spellblade', [[2, 2]], 'frost');
    Object.assign(a.h, { bladeCharge: 1 });
    const ev = a.loose(0.9, 0.3);
    expect(ev.find((x) => x.k === 'magic')).toMatchObject({ n: SPELL.spellblade });
    const p = { ...newProfile('MAGE', 'OLD'), weapon: 'spellblade', bladeCharge: 0.7 };
    const s = fromJson({ heroes: [p as never], current: 0, world: newWorld() });
    expect(s!.heroes[0].weapon).toBe('spellblade');
  });
});

describe('online', () => {
  it("a guest's screen gets the leader's shield: the magic, the crack and the break", () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    room.join('me');
    const f = Object.assign(room.join('h2friend000'), { weapon: 'spellblade' as WeaponId, x: 9, y: 9, fx: 0, fy: -1, stamina: 8, parryOpenAt: -9 });
    const e = Object.assign(newEnemy(10, 'scrapper', 9, 7.6), { cooldown: 99, alert: true });
    room.enemies = [e];
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    hitHero(e, blow(12), f, room.time, room.events);
    const got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room))))).heroes.find((h) => h.id === f.id)!;
    expect(f.hp).toBe(HERO.hp - Math.ceil(12 - 8 / MANA_SHIELD.perDmg));
    expect(got.hp).toBe(f.hp);
    expect(got.stamina).toBeCloseTo(f.stamina, 1);
    expect(got.wardAt).toBeCloseTo(room.time, 1);
    expect(got.wardBrokeAt).toBeCloseTo(room.time, 1);
  });
});
