/** The Ranger's rework (shared/ranger.ts, sim/crossbow.ts, sim/rangershots.ts): the longbow, the shortbow, the crossbow. */
import { describe, expect, it } from 'vitest';
import { BLIND, CHARGE, CRIT, TICK, WEAPONS, XBOW, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { blind } from '../src/sim/rangershots';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Intent } from '../src/sim/types';

/** A Ranger with `weapon` at (9, hy) facing up, goblins at (9, y) for each y, kept in place unless `free`. */
function arena(weapon: WeaponId, ys: number[] = [7.6], free = false, hy = 9) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: hy, fx: 0, fy: -1, noHound: true });
  const es = ys.map((y, i) => Object.assign(newEnemy(10 + i, 'scrapper', 9, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false }));
  room.enemies = es;
  let seq = 0;
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      es.forEach((e, j) => Object.assign(e, free ? { cooldown: 99 } : { x: 9, y: ys[j], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  const tap = (after = 0.7) => (seq++, run(after, { attackSeq: seq }));
  /** Hold attack `hold` s (the stick at `mx`), let go and wait `after` s. */
  const loose = (hold: number, after: number, mx = 0) => (seq++, [...run(hold, { attackSeq: seq, attack: true, mx }), ...run(after, { attackSeq: seq, attack: false })]);
  return { room, h, es, e: es[0], run, tap, loose };
}
const lost = (e: Enemy) => e.maxHp - e.hp;
const shots = (ev: FightEvent[]) => ev.filter((x) => x.k === 'shoot').length;

describe('the longbow', () => {
  it('a tap is the short sword, a hold draws the bow', () => {
    const a = arena('longbow');
    expect(shots(a.tap())).toBe(0);
    expect(lost(a.e)).toBeGreaterThan(0);
    expect(lost(a.e)).toBeLessThanOrEqual(10);
    const b = arena('longbow', [4]);
    expect(shots(b.loose(0.8, 0.8))).toBe(1);
    expect(lost(b.e)).toBeGreaterThan(10);
  });

  it('hits harder the longer it is drawn, up to the full draw', () => {
    const short = arena('longbow', [4]), long = arena('longbow', [4]);
    short.loose(0.4, 0.8);
    long.loose(1.2, 0.8);
    expect(lost(long.e)).toBeGreaterThan(lost(short.e) * 1.5);
    expect(long.e.blindUntil).toBeUndefined();
  });

  it('let go on the white flash: a sure crit, and the goblin is blinded and goes for nobody', () => {
    const a = arena('longbow', [4]);
    const ev = a.loose(WEAPONS.longbow.draw! + 0.08, 0.6);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'blinded')).toBe(true);
    expect(lost(a.e)).toBe(Math.round(WEAPONS.longbow.heavy.dmgFull * CRIT));
    expect(a.e.blindUntil! - a.room.time).toBeGreaterThan(BLIND.time - 0.8);
    // Right next to the Ranger and free to swing, it still never starts a blow while blind.
    Object.assign(a.e, { x: 9, y: 8.2, cooldown: 0 });
    let swung = false;
    a.room.setIntent('me', { ...NO_INTENT });
    while (a.room.time < a.e.blindUntil! - TICK) (a.room.step(), (swung ||= !!a.e.attack));
    expect(swung).toBe(false);
    // Once it can see again, it goes for you.
    for (let k = 0; k < 90 && !a.e.attack; k++) a.room.step();
    expect(a.e.attack).toBeTruthy();
  });

  it('blinding stops a blow mid swing', () => {
    const e = Object.assign(newEnemy(1, 'scrapper', 5, 5), { act: 'attack', attack: { kind: 'swing' } as EnemyAttack });
    blind(e, 'me', 10, []);
    expect(e.attack).toBeNull();
    expect(e.act).toBe('chase');
    const big = newEnemy(2, 'butcher', 5, 5);
    blind(big, 'me', 10, []);
    expect(big.blindUntil).toBeCloseTo(10 + BLIND.time * BLIND.big);
  });
});

describe('the shortbow', () => {
  it('a quicker draw (0.4 s, Kyle 2026-11-08), light arrows, walk while drawing', () => {
    const w = WEAPONS.shortbow;
    expect([w.draw, w.chargeSpeed, w.speed, w.heavy.dmg, w.heavy.dmgFull, w.heavy.range, !!w.heavy.pierce, !!w.heavy.blinds, !!w.reloads]).toEqual([0.4, 0.7, 1.04, 10, 22, 9, false, false, false]);
  });

  it('a perfect arrow strikes clean and does not blind', () => {
    const a = arena('shortbow', [4]);
    expect(shots(a.tap())).toBe(0);
    const ev = a.loose(WEAPONS.shortbow.draw! + 0.08, 0.6);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'trueshot')).toBe(true);
    expect(ev.some((x) => x.k === 'blinded')).toBe(false);
    expect(a.e.blindUntil).toBeUndefined();
  });
});

/** How far one goblin, stood still (stunned), is shoved by a bolt, glinted or not. */
function shoved(glint: boolean): number {
  const a = arena('crossbow', [12], true, 14);
  Object.assign(a.e, { act: 'stunned', actT: 0, actDur: 99 });
  Object.assign(a.h, { xbowGlint: glint });
  a.loose(0.75, 0.6);
  return 12 - a.e.y;
}

describe('the crossbow', () => {
  const line = [12.4, 10.8, 9.2, 7.6];
  // (Goblins shoved into each other take a knock as well, so each is checked against the bolt's own damage at least.)

  it('a tap is the short sword; a hold with a bolt on aims, and letting go looses it through three that are shoved back', () => {
    const a = arena('crossbow', line, false, 14);
    expect(shots(a.tap())).toBe(0);
    expect(a.h.xbowEmpty).toBeFalsy();
    a.es.forEach((e) => (e.hp = 400));
    const ev = a.loose(0.75, 0.6);
    expect(shots(ev)).toBe(1);
    expect(a.h.xbowEmpty).toBe(true);
    expect(a.es.slice(0, XBOW.pierce).every((e) => lost(e) >= WEAPONS.crossbow.heavy.dmg)).toBe(true);
    expect(lost(a.es[3])).toBeLessThan(WEAPONS.crossbow.heavy.dmg);
    const one = shoved(false);
    expect(one).toBeGreaterThan(0.5);
    expect(ev.some((x) => x.k === 'boltline')).toBe(false);
  });

  it('empty, ATTACK held looses nothing (the room says it is winding); a tap is still the short sword', () => {
    const a = arena('crossbow', [7.6]);
    a.loose(0.75, 0.1);
    expect(a.h.xbowEmpty).toBe(true);
    const ev = a.loose(0.6, 0.05);
    expect(shots(ev)).toBe(0);
    a.e.hp = 400;
    expect(shots(a.tap(0.3))).toBe(0);
    expect(lost(a.e)).toBeGreaterThan(0);
  });

  it('it winds itself when you are not attacking, walking or not (Kyle, 2026-11-04); walking spoils the glint', () => {
    const a = arena('crossbow', [4]);
    a.loose(0.75, 0.1);
    expect(a.h.xbowEmpty).toBe(true);
    // (A run without the last attack press reads as a tap first: the short sword, then it winds.)
    const ev = a.run(XBOW.reload + 1.2, { mx: 1 });
    expect(ev.some((x) => x.k === 'loaded')).toBe(true);
    expect(a.h.xbowEmpty).toBe(false);
    expect(a.h.xbowGlint).toBe(false);
  });

  it('standing still while it winds, the bolt glints; the glinted bolt is perfect, hits half as hard again, shoves harder and runs through the whole line', () => {
    const a = arena('crossbow', line, false, 14);
    const shot = a.loose(0.75, 0.05);
    const wound = [...shot, ...a.run(XBOW.reload + 0.6)];
    expect(wound.some((x) => x.k === 'glint')).toBe(true);
    expect(a.h.xbowGlint).toBe(true);
    a.es.forEach((e) => (e.hp = 400));
    const ev = a.loose(0.75, 0.6);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.filter((x) => x.k === 'boltline').length).toBe(line.length);
    expect(a.es.every((e) => lost(e) >= Math.round(WEAPONS.crossbow.heavy.dmg * XBOW.glint))).toBe(true);
    // Shoved harder: one goblin, a plain bolt against a glinted one.
    expect(shoved(true)).toBeGreaterThan(shoved(false) * 1.2);
    expect(a.h.xbowGlint).toBe(false);
    expect(a.h.xbowEmpty).toBe(true);
  });
});

describe('let go before the full draw (Kyle, 2026-11-08)', () => {
  it('the crossbow looses no bolt and keeps it on; a Mage fizzles and pays nothing; the smite falls on nothing; the shortbow flies full; the longbow flies weaker', () => {
    const x = arena('crossbow', [12], true, 14);
    const ev = x.loose(0.35, 0.3);
    expect(shots(ev)).toBe(0);
    expect(ev.some((e) => e.k === 'early')).toBe(true);
    expect(x.h.xbowEmpty).toBeFalsy();
    const s = arena('shortbow', [6]);
    s.loose(0.25, 0.4);
    expect(s.h.power).toBe(1);
    const l = arena('longbow', [6]);
    l.loose(0.8, 0.4);
    expect(l.h.power).toBeGreaterThan(0.3);
    expect(l.h.power).toBeLessThan(0.6);
    for (const w of ['wand', 'staff', 'spellblade', 'mace', 'flail', 'censer'] as const) expect(WEAPONS[w].early).toBe('fizzle');
    const f = arena('flail', [7]), fe = f.loose(0.5, 0.4);
    expect(fe.some((e) => e.k === 'early')).toBe(true);
    expect(f.e.hp).toBe(f.e.maxHp);
  });
});
