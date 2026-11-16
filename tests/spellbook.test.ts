/** The Mage's spellbook (shared/spellbook.ts, sim/holds.ts and friends): each element's tap and hold on each kit, and their balance. */
import { describe, expect, it } from 'vitest';
import { COLD_BLAST, DASH, HERO, LUNGE, MAGE_KITS, SHATTER_BLOW, SKY_STRIKE, STAFF_SIZE, TICK, type Element, type MageKit } from '../src/shared/tuning';
import { frozen } from '../src/sim/damage';
import { burning, chilled } from '../src/sim/elements';
import type { FightEvent, Zone } from '../src/sim/types';
import { lost, mageArena } from './magearena';

const spell = (ev: FightEvent[]) => ev.find((x): x is Extract<FightEvent, { k: 'spell' }> => x.k === 'spell');
const zone = (z: Zone[], kind: Zone['kind']) => z.find((x) => x.kind === kind)!;
/** Held a little past the flash: not a perfect. */
const PLAIN: Record<MageKit, number> = { wand: 0.9, staff: 1.2, spellblade: 0.9 };

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

  it('storm held: lightning called down where you aim, a gold mark first, no bolt loosed', () => {
    const a = mageArena('wand', [[9, 6], [9, 3]], 'storm');
    const ev = a.loose(PLAIN.wand, 0.1, { ay: -3 });
    expect(spell(ev)).toMatchObject({ what: 'strike', big: false, x: 9, y: 6 });
    expect(a.room.bolts.length).toBe(0);
    expect(zone(a.room.zones, 'skystrike')).toBeDefined();
    expect(lost(a.e)).toBe(0);
    a.run(0.4, { ay: -3 });
    expect(lost(a.es[0])).toBeGreaterThan(0);
    expect(lost(a.es[1])).toBe(0);
    expect(a.e.act).toBe('stunned');
  });
});

describe('the staff: the wand, much harder, standing still (Kyle, 2026-11-16)', () => {
  it('a tap does far more than the wand\'s and bursts round what it hits', () => {
    const w = mageArena('wand', [[9, 5], [9.8, 5]], 'fire'), st = mageArena('staff', [[9, 5], [9.8, 5]], 'fire');
    w.tap(0.6), st.tap(0.8);
    expect(lost(st.e)).toBeGreaterThanOrEqual(lost(w.e) * 2);
    expect(lost(st.es[1])).toBeGreaterThan(0);
    expect(lost(w.es[1])).toBe(0);
  });

  it('rooted: no step while it casts a tap or gathers a hold (the wand walks as it casts)', () => {
    const w = mageArena('wand', [[2, 2]], 'fire'), st = mageArena('staff', [[2, 2]], 'fire');
    for (const a of [w, st]) a.run(0.3, { attackSeq: 1, attack: false, mx: 1 });
    expect(w.h.x).toBeGreaterThan(9.05);
    expect(st.h.x).toBeCloseTo(9, 3);
    const h = mageArena('staff', [[2, 2]], 'fire');
    h.run(0.25, { attackSeq: 1, attack: true, mx: 1 });
    const x = h.h.x;
    h.run(0.5, { attackSeq: 1, attack: true, mx: 1 });
    expect(h.h.act).toBe('charge');
    expect(h.h.x).toBeCloseTo(x, 3);
  });

  it('the holds are the wand\'s, bigger: the fireball burns further out, the cold blast reaches further', () => {
    const at: [number, number][] = [[9, 5], [11.2, 5]];
    const w = mageArena('wand', at, 'fire'), st = mageArena('staff', at, 'fire');
    w.loose(PLAIN.wand, 0.6), st.loose(PLAIN.staff, 0.6);
    expect(burning(w.es[1], w.room.time)).toBe(false);
    expect(burning(st.es[1], st.room.time)).toBe(true);
    const far: [number, number][] = [[9, 9 - COLD_BLAST.range - 0.8]];
    const b = mageArena('staff', far, 'frost'), ev = b.loose(PLAIN.staff, 0.3);
    expect(spell(ev)).toMatchObject({ what: 'coldblast', r: COLD_BLAST.range * STAFF_SIZE });
    expect(frozen(b.e, b.room.time)).toBe(true);
  });

  it('storm: a lightning bolt, no stream; held, a bigger strike where you aim', () => {
    const a = mageArena('staff', [[9, 6]], 'storm');
    const ev = a.tap(0.6);
    expect(ev.some((x) => x.k === 'shoot')).toBe(true);
    expect(a.h.stream).toBeUndefined();
    expect(lost(a.e)).toBeGreaterThan(0);
    const b = mageArena('staff', [[9, 6]], 'storm'), ev2 = b.loose(PLAIN.staff, 0.3, { ay: -3 });
    expect(spell(ev2)?.r).toBeCloseTo(SKY_STRIKE.r * STAFF_SIZE, 5);
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
  const at: [number, number] = kit === 'spellblade' ? [9, 7.7] : [9, 5.5];
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

  it('the staff hits about twice as hard a second as the wand, for standing still', () => {
    const w = tapDps('wand', 'fire'), st = tapDps('staff', 'fire');
    expect(st / w, `${w.toFixed(1)} / ${st.toFixed(1)}`).toBeGreaterThan(1.6);
    expect(st / w).toBeLessThan(2.8);
  });

  it('a hold costs magic in any element; the bar waits and refills as before', () => {
    expect(HERO.magicDelay).toBe(2);
    expect(HERO.magicRegen).toBe(14);
  });
});
