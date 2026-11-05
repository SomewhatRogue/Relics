/**
 * Storm and fire reworked (Kyle, 2026-11-04): fire passes on only when a burning goblin dies; storm
 * ignores shields, jumps only between wet goblins (in water, or out in the rain), lands harder on them;
 * the wand's storm tap is a stream that runs by itself and builds with each tap (Kyle, 2026-11-05), its
 * hold lightning called down where you aim (sim/skystrike.ts).
 */
import { describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { BURN, SKY_STRIKE, STORM, STREAM, TICK } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { burning, stepElements, type World } from '../src/sim/elements';
import { newEnemy } from '../src/sim/enemies';
import { wet } from '../src/sim/wet';
import type { FightEvent, Zone } from '../src/sim/types';
import { inSkyStrike } from '../src/sim/skystrike';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { lost, mageArena } from './magearena';

/** The arena with a pool over (8.5..12, 2..8). */
const POOL: GameMap = { ...ARENA, water: [{ x: 8.5, y: 2, w: 3.5, h: 6 }] };
/** Aimed 3 tiles up, at (9, 6). */
const AIM = { ay: -3 };
/** The arena under rain. */
const RAIN: GameMap = { ...ARENA, theme: { ...ARENA.theme, rain: 0.4 } };

describe('fire passes on only when a burning goblin dies', () => {
  it('touching, a burning goblin sets nothing alight while it lives; dying, it sets those near it alight', () => {
    const a = Object.assign(newEnemy(1, 'scrapper', 5, 5), { hp: 999, maxHp: 999 }), b = newEnemy(2, 'scrapper', 5 + a.radius * 2 + BURN.spread - 0.05, 5);
    const far = newEnemy(3, 'scrapper', 5, 5 + a.radius * 2 + BURN.spread + 0.4);
    const ev: FightEvent[] = [], w: World = { heroes: [], enemies: [a, b, far], javelins: [], props: [], now: 0, ev };
    Object.assign(a, { burnUntil: BURN.time, burnNext: 0.01 });
    for (let t = 0; t < 1; t += TICK) (w.now = t), stepElements(w);
    expect(burning(b, w.now)).toBe(false);
    a.hitAt = w.now;
    expect(damage(a, 9999, w.now, ev)).toBe(true);
    w.now += TICK;
    stepElements(w);
    expect(burning(b, w.now)).toBe(true);
    expect(burning(far, w.now)).toBe(false);
  });

  it('a fire spell still sets alight what it hits', () => {
    const a = mageArena('wand', [[9, 5], [9.4, 4.4]], 'fire');
    a.loose(0.9, 0.6);
    expect(a.es.every((e) => burning(e, a.room.time))).toBe(true);
  });
});

describe('storm ignores shields', () => {
  /** A shield-bearer facing the Mage takes a spellblade's cut in `el`. */
  const cut = (el: 'frost' | 'storm') => {
    const a = mageArena('spellblade', [[9, 7.9]], el);
    a.e.variant = 'shield';
    const ev = a.tap(0.5);
    return { n: lost(a.e), boarded: ev.some((x) => x.k === 'hit' && !!x.boarded) };
  };

  it("a storm cut isn't stopped by the board from the front; a frost cut is", () => {
    const storm = cut('storm'), frost = cut('frost');
    expect(frost.boarded).toBe(true);
    expect(storm.boarded).toBe(false);
    expect(storm.n).toBeGreaterThan(frost.n);
  });

  it('the lightning strike hits a shield wall from the front as hard as anything', () => {
    const plain = mageArena('wand', [[9, 6]], 'storm');
    plain.loose(0.9, 0.5, AIM);
    const wall = mageArena('wand', [[9, 6], [10, 6]], 'storm');
    wall.es.forEach((e) => (e.variant = 'shield'));
    wall.loose(0.9, 0.5, AIM);
    expect(lost(plain.e)).toBeGreaterThan(0);
    expect(lost(wall.e)).toBeGreaterThanOrEqual(lost(plain.e));
  });
});

describe('storm jumps only between wet goblins', () => {
  // The strike's goblin, a wet one 2.6 off (outside the circle), a wet one beyond STORM.reach, and one
  // 2.8 off on dry ground.
  const spots: [number, number][] = [[9, 6], [11.6, 6], [9, 6 - STORM.reach - 0.8], [6.2, 6]];
  const bolt = (map?: GameMap) => {
    const a = mageArena('wand', spots, 'storm', false, 'scrapper', map);
    a.loose(0.9, 0.5, AIM);
    return a.es.map(lost);
  };

  it('wet is in the water, or anywhere in the rain', () => {
    expect(wet({ x: 9, y: 6 }, POOL)).toBe(true);
    expect(wet({ x: 7.4, y: 6 }, POOL)).toBe(false);
    expect(wet({ x: 7.4, y: 6 }, RAIN)).toBe(true);
    expect(wet({ x: 9, y: 6 }, ARENA)).toBe(false);
  });

  it('dry, it jumps nowhere', () => {
    const [hit, ...rest] = bolt();
    expect(hit).toBeGreaterThan(0);
    expect(rest).toEqual([0, 0, 0]);
  });

  it('in water, it lands 1.5x and jumps to every wet goblin within reach, never the dry one', () => {
    const dry = bolt()[0], [hit, near, far, onDry] = bolt(POOL);
    expect(hit).toBe(Math.round(dry * STORM.wet));
    expect(near).toBeGreaterThan(0);
    expect(far).toBe(0);
    expect(onDry).toBe(0);
  });

  it('in the rain, everything is wet', () => {
    const [hit, near, far, onDry] = bolt(RAIN);
    expect(hit).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(0);
    expect(onDry).toBeGreaterThan(0);
    expect(far).toBe(0);
  });

  it('a wet goblin is jumped to once a cast, and never one the strike itself reached', () => {
    const a = mageArena('wand', [[9, 6], [9, 5.2], [11, 6], [11, 5.2]], 'storm', false, 'scrapper', POOL);
    const ev = a.loose(0.9, 0.5, AIM);
    // Two struck in the circle; each of the two wet ones outside it jumped to once.
    expect(ev.filter((x) => x.k === 'shock').map((x) => Math.round((x as { x2: number }).x2))).toEqual([11, 11]);
    expect(a.es.every((e) => lost(e) > 0)).toBe(true);
  });
});

describe("the wand's storm stream", () => {
  // (A press is a change of `attackSeq`: after `taps`, running on with LAST is no new tap.)
  const LAST = 89;
  /** Damage a second over `secs` with no new tap. */
  const rate = (a: ReturnType<typeof mageArena>, secs: number) => {
    const was = lost(a.e);
    a.run(secs, { attackSeq: LAST });
    return (lost(a.e) - was) / secs;
  };
  /** `n` taps, 0.3 s apart, the last of them LAST. */
  const taps = (a: ReturnType<typeof mageArena>, n: number) => {
    for (let i = n - 1; i >= 0; i--) a.tap(0.3, { attackSeq: LAST - i });
  };

  it('one tap runs it about 1.5 s by itself, then it goes off', () => {
    const a = mageArena('wand', [[9, 6]], 'storm');
    a.tap(0.1, { attackSeq: 1 });
    const was = lost(a.e);
    a.run(STREAM.keep - 0.2, { attackSeq: 1 });
    expect(a.h.stream).toBeDefined();
    expect(lost(a.e) - was).toBeGreaterThan(8);
    a.run(0.35, { attackSeq: 1 });
    expect(a.h.stream).toBeUndefined();
    const after = lost(a.e);
    a.run(0.5, { attackSeq: 1 });
    expect(lost(a.e)).toBe(after);
  });

  it('three taps build it to 2.5x, and a fourth or fifth go no further (each starts the 1.5 s again)', () => {
    expect(STREAM.steps).toEqual([1, 1.75, 2.5]);
    const one = mageArena('wand', [[9, 6]], 'storm');
    one.h.primed = false;
    taps(one, 1);
    const r1 = rate(one, 1);
    const three = mageArena('wand', [[9, 6]], 'storm');
    three.h.primed = false;
    taps(three, 3);
    expect(three.h.stream?.step).toBe(3);
    const r3 = rate(three, 1);
    expect(r3 / r1).toBeGreaterThan(2.3);
    expect(r3 / r1).toBeLessThan(2.7);
    const five = mageArena('wand', [[9, 6]], 'storm');
    five.h.primed = false;
    taps(five, 5);
    expect(five.h.stream?.step).toBe(3);
    expect(five.h.stream!.until - five.room.time).toBeGreaterThan(STREAM.keep - 0.35);
    expect(Math.abs(rate(five, 1) - r3)).toBeLessThan(1.5);
  });

  it('takes the nearest goblin behind you too, so you can run and keep it on (Kyle, 2026-11-05)', () => {
    const a = mageArena('wand', [[9, 11.5]], 'storm');
    const was = lost(a.e);
    taps(a, 1);
    a.run(0.6, { attackSeq: LAST });
    expect(a.h.stream?.id).toBe(a.e.id);
    expect(lost(a.e)).toBeGreaterThan(was);
  });

  it('fully built, it hops a low pulse on to the nearest other goblin; below that, never', () => {
    const one = mageArena('wand', [[9, 6], [10.6, 6]], 'storm');
    taps(one, 2);
    one.run(1, { attackSeq: LAST });
    expect(lost(one.es[1])).toBe(0);
    const top = mageArena('wand', [[9, 6], [10.6, 6]], 'storm');
    taps(top, 3);
    const h0 = lost(top.e), o0 = lost(top.es[1]);
    top.run(1, { attackSeq: LAST });
    const held = lost(top.e) - h0, hopped = lost(top.es[1]) - o0;
    expect(hopped).toBeGreaterThan(0);
    expect(hopped).toBeLessThan(held * 0.5);
  });

  it('keeps its build on the next goblin when its goblin dies', () => {
    const a = mageArena('wand', [[9, 6], [9.6, 5]], 'storm');
    taps(a, 3);
    a.e.hp = 1;
    a.run(0.3, { attackSeq: LAST });
    expect(a.e.act).toBe('dead');
    expect(a.h.stream?.id).toBe(a.es[1].id);
    expect(a.h.stream?.step).toBe(3);
  });

  it('walking with it on is no slower than with a fire or frost wand tap', () => {
    /** How far the Mage walks in 1.5 s right, tapping every 0.3 s in `el` (or not at all). */
    const walked = (el: 'fire' | 'frost' | 'storm' | '', every = 0.3) => {
      const a = mageArena('wand', [[9, 3]], el || 'storm');
      const x = a.h.x;
      for (let t = 0; t < 1.5 - 1e-6; t += every) el ? a.tap(every, { mx: 1 }) : a.run(every, { mx: 1 });
      return a.h.x - x;
    };
    const storm = walked('storm'), fire = walked('fire'), frost = walked('frost'), free = walked('');
    expect(storm).toBeGreaterThanOrEqual(Math.max(fire, frost) - 0.01);
    expect(storm / free).toBeGreaterThan(0.89);
    // On by itself between taps: your own pace.
    const a = mageArena('wand', [[9, 3]], 'storm');
    taps(a, 3);
    const x = a.h.x;
    a.run(1, { mx: 1, attackSeq: LAST });
    expect(a.h.stream).toBeDefined();
    expect((a.h.x - x) / (free / 1.5)).toBeGreaterThan(0.98);
  });

  it('kept at three steps it sits a little over the other wand taps, not by a mile', () => {
    const dps = (el: 'fire' | 'frost') => {
      const a = mageArena('wand', [[9, 5.5]], el);
      a.h.primed = false;
      for (let t = 0; t < 6; t += 0.1) a.tap(0.1);
      return lost(a.e) / 6;
    };
    const a = mageArena('wand', [[9, 5.5]], 'storm');
    a.h.primed = false;
    taps(a, 3);
    const was = lost(a.e);
    // Kept built with a tap a second.
    for (let t = 0; t < 6; t += 1) a.tap(1, { attackSeq: 200 + t });
    const kept = (lost(a.e) - was) / 6, others = (dps('fire') + dps('frost')) / 2;
    expect(kept / others).toBeGreaterThan(1.02);
    expect(kept / others).toBeLessThan(1.25);
  });
});

describe("the wand's storm hold: lightning from the sky", () => {
  /** The strike called by `a`, if any. */
  const strikeOf = (a: ReturnType<typeof mageArena>) => a.room.zones.find((z) => z.kind === 'skystrike');
  const edge = SKY_STRIKE.r + 0.34;

  it('marks a circle where you aim, and falls on just that circle after its delay', () => {
    // Its goblin, one just inside the edge, one just outside.
    const a = mageArena('wand', [[9, 6], [9 + edge - 0.05, 6], [9 - edge - 0.1, 6]], 'storm');
    a.loose(0.9, 0.1, AIM);
    const z = strikeOf(a)!;
    expect(z).toMatchObject({ x: 9, y: 6, r: SKY_STRIKE.r, big: false });
    expect(z.at! - a.room.time).toBeGreaterThan(SKY_STRIKE.delay - 0.15);
    expect(SKY_STRIKE.delay).toBeLessThan(0.35);
    a.run(z.at! - a.room.time - TICK * 1.5, AIM);
    expect(a.es.map(lost)).toEqual([0, 0, 0]);
    const ev = a.run(TICK * 3, AIM);
    expect(ev.find((x) => x.k === 'skystrike')).toMatchObject({ x: 9, y: 6, r: SKY_STRIKE.r, big: false });
    expect(a.es.map((e) => lost(e) > 0)).toEqual([true, true, false]);
  });

  it('with no goblin near the aim, it falls on the aim point', () => {
    const a = mageArena('wand', [[14, 14]], 'storm');
    a.loose(0.9, 0.1, { ay: -5 });
    expect(strikeOf(a)).toMatchObject({ x: 9, y: 4 });
    const b = mageArena('wand', [[9, 5.3]], 'storm');
    b.loose(0.9, 0.1, { ay: -4.5 });
    // Onto the goblin nearest the aim point.
    expect(strikeOf(b)).toMatchObject({ x: 9, y: 5.3 });
  });

  it('spares friends, stuns small goblins briefly, and hurts but never stuns a butcher', () => {
    const a = mageArena('wand', [[9, 6], [10, 6.3]], 'storm');
    a.es[1] = Object.assign(a.es[1], { kind: 'butcher', radius: 0.62, weight: 3.5 });
    const pal = a.room.join('pal');
    Object.assign(pal, { x: 8.3, y: 6.4 });
    const hp = pal.hp;
    const ev = a.loose(0.9, 0.5, AIM);
    expect(pal.hp).toBe(hp);
    expect(ev.some((x) => x.k === 'spared')).toBe(true);
    expect(a.e.act).toBe('stunned');
    expect(a.e.actDur).toBe(SKY_STRIKE.stun);
    expect(lost(a.es[1])).toBeGreaterThan(0);
    expect(a.es[1].act).not.toBe('stunned');
  });

  it('let go on the flash, it is bigger and stuns longer', () => {
    const at: [number, number][] = [[9, 6], [9 + edge + 0.25, 6]];
    const plain = mageArena('wand', at, 'storm');
    plain.loose(0.9, 0.5, AIM);
    expect(lost(plain.es[1])).toBe(0);
    const big = mageArena('wand', at, 'storm');
    const ev = big.loose(0.62, 0.5, AIM);
    expect(ev.find((x) => x.k === 'spell')).toMatchObject({ what: 'strike', big: true, r: SKY_STRIKE.bigR });
    expect(lost(big.es[1])).toBeGreaterThan(0);
    expect(big.e.actDur).toBe(SKY_STRIKE.bigStun);
    expect(SKY_STRIKE.bigStun).toBeLessThanOrEqual(6);
  });

  it('a guest is sent the same circle at the same second, and it is the one judged', () => {
    const a = mageArena('wand', [[9, 6], [9 + edge - 0.05, 6], [9 - edge - 0.1, 6]], 'storm');
    a.loose(0.9, 0.1, AIM);
    const got = new Decoder().apply(new Encoder().encode(stateOf(a.room), true), true);
    const z = strikeOf(a)!, theirs = (got.zones as unknown as Zone[]).find((o) => o.kind === 'skystrike')!;
    expect(theirs).toMatchObject({ x: z.x, y: z.y, r: z.r, at: Math.round(z.at! * 100) / 100, big: false });
    a.run(0.5, AIM);
    expect(a.es.map((e) => lost(e) > 0)).toEqual(a.es.map((e) => inSkyStrike(theirs, e, e.radius)));
  });
});
