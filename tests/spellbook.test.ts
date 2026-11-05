/** The Mage's spellbook (shared/spellbook.ts, sim/holds.ts and friends): each element's tap and hold on each kit, and their balance. */
import { describe, expect, it } from 'vitest';
import { COLD_BLAST, DASH, FIRE_PIT, HERO, LUNGE, MAGE_KITS, SHATTER_BLOW, STAFF_RING, STORM_RING, TICK, type Element, type MageKit } from '../src/shared/tuning';
import { frozen } from '../src/sim/damage';
import { burning, chilled } from '../src/sim/elements';
import type { FightEvent, Zone } from '../src/sim/types';
import { lost, mageArena } from './magearena';

const spell = (ev: FightEvent[]) => ev.find((x): x is Extract<FightEvent, { k: 'spell' }> => x.k === 'spell');
const zone = (z: Zone[], kind: Zone['kind']) => z.find((x) => x.kind === kind)!;
/** Held a little past the flash: not a perfect. */
const PLAIN: Record<MageKit, number> = { wand: 0.9, staff: 1.4, spellblade: 0.9 };

describe('the wand', () => {
  it('fire: a firebolt that sets alight; held, a fireball that bursts and sets all of it alight', () => {
    const a = mageArena('wand', [[9, 5]], 'fire');
    a.tap(0.6);
    expect(lost(a.e)).toBeGreaterThan(0);
    expect(burning(a.e, a.room.time)).toBe(true);
    const b = mageArena('wand', [[9, 5], [10.4, 5], [13, 5]], 'fire');
    const ev = b.loose(PLAIN.wand, 0.6);
    expect(ev.some((x) => x.k === 'burst')).toBe(true);
    expect(b.es.map((e) => burning(e, b.room.time))).toEqual([true, true, false]);
  });

  it('frost: three icicles that slow, never freeze; held, a cold blast in a cone that freezes', () => {
    const a = mageArena('wand', [[9, 6]], 'frost');
    const ev = a.tap(0.6);
    expect(ev.filter((x) => x.k === 'hit').length).toBe(3);
    expect(chilled(a.e, a.room.time)).toBe(true);
    expect(frozen(a.e, a.room.time)).toBe(false);
    const b = mageArena('wand', [[9, 6], [10.5, 7], [9, 11]], 'frost');
    const ev2 = b.loose(PLAIN.wand, 0.1);
    expect(spell(ev2)).toMatchObject({ what: 'coldblast', r: COLD_BLAST.range });
    expect(b.es.map((e) => frozen(e, b.room.time))).toEqual([true, true, false]);
  });

  it('frost on the flash: a longer cone', () => {
    const a = mageArena('wand', [[9, 9 - COLD_BLAST.range - 0.8]], 'frost');
    a.loose(0.62, 0.1);
    expect(frozen(a.e, a.room.time)).toBe(true);
    const b = mageArena('wand', [[9, 9 - COLD_BLAST.range - 0.8]], 'frost');
    b.loose(PLAIN.wand, 0.1);
    expect(lost(b.e)).toBe(0);
  });

  it('storm: a stream on the goblin in front, no bolt; dry, it jumps nowhere', () => {
    const a = mageArena('wand', [[9, 6], [10, 5.5], [8, 5.5]], 'storm');
    const ev = a.tap(0.3);
    expect(a.room.bolts.length).toBe(0);
    expect(ev.some((x) => x.k === 'shoot')).toBe(false);
    expect(a.h.stream?.id).toBe(a.e.id);
    expect(lost(a.e)).toBeGreaterThan(0);
    expect(a.es.slice(1).every((e) => lost(e) === 0)).toBe(true);
  });

  it('storm held: a lightning bolt from the hand, at once, into the first goblin; no mark, no stun', () => {
    const a = mageArena('wand', [[9, 6], [9, 4]], 'storm');
    const ev = a.loose(PLAIN.wand, 0.12);
    expect(spell(ev)).toMatchObject({ what: 'thunderbolt', big: false });
    expect(spell(ev)!.r).toBeCloseTo(3, 0);
    expect(a.room.bolts.length).toBe(0);
    expect(lost(a.es[0])).toBeGreaterThan(0);
    expect(lost(a.es[1])).toBe(0);
    expect(a.e.act).not.toBe('stunned');
  });
});

describe('the staff', () => {
  it('fire: a flame sweep; held, a fire pit dropped on the goblin in front that burns it (sim/firepit.ts: firepit.test.ts)', () => {
    const a = mageArena('staff', [[9, 7.6]], 'fire');
    a.tap(0.8);
    expect(burning(a.e, a.room.time)).toBe(true);
    const b = mageArena('staff', [[9, 5], [9, 10]], 'fire');
    b.loose(PLAIN.staff, 0.2 + FIRE_PIT.catch);
    const z = zone(b.room.zones, 'firepit');
    expect([z.x, z.y, z.r]).toEqual([9, 5, FIRE_PIT.r]);
    expect(burning(b.es[0], b.room.time)).toBe(true);
    expect(lost(b.es[0])).toBeGreaterThanOrEqual(FIRE_PIT.dmg);
    expect(lost(b.es[1])).toBe(0);
    expect(z.until - z.at!).toBeCloseTo(FIRE_PIT.life, 5);
  });

  it('frost: a slash that slows wind-ups; held, a frost nova that freezes all round you', () => {
    const a = mageArena('staff', [[9, 7.6]], 'frost');
    a.tap(0.8);
    expect(chilled(a.e, a.room.time)).toBe(true);
    const b = mageArena('staff', [[9, 7.2], [10.5, 9.5], [9, 9 + STAFF_RING.rFull + 1]], 'frost');
    const ev = b.loose(PLAIN.staff, 0.2);
    expect(spell(ev)).toMatchObject({ what: 'nova' });
    expect(b.es.map((e) => frozen(e, b.room.time))).toEqual([true, true, false]);
  });

  it('storm: a crackling sweep that jumps nowhere dry; held, a charged ring that zaps what is in it', () => {
    const a = mageArena('staff', [[9, 7.6], [11, 7], [7, 7]], 'storm');
    a.tap(0.8);
    expect(lost(a.es[0])).toBeGreaterThan(0);
    expect(a.es.slice(1).filter((e) => lost(e) > 0).length).toBe(0);
    const b = mageArena('staff', [[9, 7.5]], 'storm');
    b.loose(PLAIN.staff, 0.2);
    const was = lost(b.e);
    b.run(2);
    expect(lost(b.e) - was).toBeGreaterThanOrEqual(STORM_RING.zap * 3);
    expect(zone(b.room.zones, 'stormring').until - b.room.time).toBeGreaterThan(0);
  });
});

describe('the spellblade', () => {
  it('fire: cuts set alight; held, a burning lunge that runs through and sets alight', () => {
    const a = mageArena('spellblade', [[9, 7.9]], 'fire');
    a.tap(0.5);
    expect(burning(a.e, a.room.time)).toBe(true);
    const b = mageArena('spellblade', [[9, 7.5], [9.3, 6.2]], 'fire');
    const ev = b.loose(PLAIN.spellblade, 0.5);
    expect(spell(ev)).toMatchObject({ what: 'lunge', r: LUNGE.len });
    expect(9 - b.h.y).toBeGreaterThan(LUNGE.len * 0.8);
    expect(b.es.every((e) => burning(e, b.room.time))).toBe(true);
  });

  it('frost: cuts chill; held, a shatter that smashes the frozen and the chilled near you', () => {
    const a = mageArena('spellblade', [[9, 7.9]], 'frost');
    a.tap(0.5);
    expect(chilled(a.e, a.room.time)).toBe(true);
    const b = mageArena('spellblade', [[9, 7.6], [10.2, 9], [7.8, 9]], 'frost');
    b.es[0].frozenUntil = 99;
    b.es[1].chillUntil = 99;
    const ev = b.loose(PLAIN.spellblade, 0.2);
    expect(spell(ev)).toMatchObject({ what: 'shatter', r: SHATTER_BLOW.r });
    expect(lost(b.es[0])).toBeGreaterThanOrEqual(SHATTER_BLOW.frozen);
    expect(lost(b.es[1])).toBeGreaterThanOrEqual(SHATTER_BLOW.chilled);
    expect(lost(b.es[2])).toBeLessThan(SHATTER_BLOW.chilled);
    expect(chilled(b.es[2], b.room.time)).toBe(true);
  });

  it('storm: cuts jump nowhere dry; held, a dash through a line, zapping each, untouchable', () => {
    const a = mageArena('spellblade', [[9, 7.9], [10.5, 7.5]], 'storm');
    a.tap(0.5);
    expect(lost(a.es[0])).toBeGreaterThan(0);
    expect(lost(a.es[1])).toBe(0);
    const b = mageArena('spellblade', [[9, 7.6], [9.4, 6.4], [9, 5.6]], 'storm');
    b.run(PLAIN.spellblade, { attackSeq: 1, attack: true });
    const ev = b.run(0.12, { attackSeq: 1, attack: false });
    expect(spell(ev)).toMatchObject({ what: 'dash', r: DASH.len });
    expect(b.h.act).toBe('bash');
    ev.push(...b.run(0.4));
    expect(b.es.every((e) => lost(e) > 0)).toBe(true);
    expect(9 - b.h.y).toBeGreaterThan(DASH.len * 0.8);
  });

  it('on the flash each goes further: the lunge and the dash longer', () => {
    for (const [el, len] of [['fire', LUNGE.bigLen], ['storm', DASH.bigLen]] as const) {
      const a = mageArena('spellblade', [[2, 2]], el);
      const ev = a.loose(0.6, 0.5);
      expect(spell(ev)).toMatchObject({ big: true, r: len });
      expect(9 - a.h.y).toBeGreaterThan(len * 0.8);
    }
  });
});

/** What one goblin loses to taps alone over `secs` (fire's burn counted), pressing as fast as the kit lets you. */
function tapDps(kit: MageKit, el: Element, secs = 6): number {
  const at: [number, number] = kit === 'wand' ? [9, 5.5] : [9, 7.7];
  const a = mageArena(kit, [at], el);
  for (let t = 0; t < secs; t += 0.1) a.tap(0.1);
  return lost(a.e) / secs;
}

describe('balance', () => {
  it("each element's tap does about the same a second to one goblin, on every kit", () => {
    for (const kit of MAGE_KITS) {
      const d = (['fire', 'frost', 'storm'] as Element[]).map((el) => tapDps(kit, el)), mean = (d[0] + d[1] + d[2]) / 3;
      for (const x of d) expect(Math.abs(x - mean) / mean, `${kit}: ${d.map((v) => v.toFixed(1)).join(' / ')}`).toBeLessThan(0.15);
    }
  });

  it("the staff's holds, one each (30 magic): the fire pit does about what the charged ring does, frost trades damage for freezing", () => {
    // One hold, everything it does over the 4 s after the release (fire's burn counted), on one goblin in
    // it and on a pack of four: the pit dropped on them, the rings round the Mage.
    const held = (el: Element, at: [number, number][], secs = 4) => {
      const a = mageArena('staff', at, el);
      a.run(PLAIN.staff, { attackSeq: 1, attack: true });
      a.run(secs, { attackSeq: 1, attack: false });
      return a.es.reduce((n, e) => n + lost(e), 0);
    };
    const near: [number, number][] = [[9, 7.5], [10.2, 8.2], [7.8, 8.2], [9, 10.4]], far: [number, number][] = [[9, 6], [9.8, 6], [8.2, 6], [9, 5.2]];
    const one = { fire: held('fire', far.slice(0, 1)), frost: held('frost', near.slice(0, 1)), storm: held('storm', near.slice(0, 1)) };
    const pack = { fire: held('fire', far), frost: held('frost', near), storm: held('storm', near) };
    const say = `one ${JSON.stringify(one)} pack ${JSON.stringify(pack)}`;
    expect(Math.abs(one.fire - one.storm) / one.storm, say).toBeLessThan(0.15);
    expect(Math.abs(pack.fire - pack.storm) / pack.storm, say).toBeLessThan(0.15);
    expect(one.frost, say).toBeLessThan(one.storm / 2);
  });

  it('a hold costs magic in any element; the bar waits and refills as before', () => {
    expect(HERO.magicDelay).toBe(2);
    expect(HERO.magicRegen).toBe(14);
  });
});
