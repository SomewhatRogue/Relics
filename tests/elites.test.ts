/**
 * Elites (shared/elites.ts, shared/eliteroll.ts, sim/elite.ts): how often a meaty goblin comes as one and
 * how many a room may have, what each affix does and its counter, what one costs in the room's threat
 * budget, the small bump to what it drops, and that it's all on the room's seeded streams.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { board, type Job } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { ELITE, IRONHIDE, MEAL, THREAT, VARIANTS, quickWind } from '../src/shared/tuning';
import { eliteChance } from '../src/shared/eliteroll';
import { foeThreat, meaty, roomBudget, threatIn } from '../src/shared/roombudget';
import { Rng } from '../src/shared/rng';
import { damage, kill } from '../src/sim/damage';
import { begin } from '../src/sim/enemies';
import { jolt } from '../src/sim/rods';
import { dropFrom } from '../src/sim/loot';
import { toAsh } from '../src/sim/meal';
import { NO_INTENT, type Drop, type Enemy, type FightEvent } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { field, run } from './foeyard';

afterEach(() => void (ELITE.on = true));

const jobs = (days: number[]) => days.flatMap((d) => board(d));
const plans = (j: Job) => Array.from({ length: j.rooms }, (_, i) => ({ i, foes: planRoom(j, i).foes }));
/** A meaty goblin that can come as an elite (not a BIG ONE, not the log-carriers, not a staged one). */
const can = (f: Foe) => meaty(f) && !f.big && f.role !== 'log' && f.kind === 'scrapper' && !f.name && (f.pack ?? 0) < 80;

describe('how often, and how many', () => {
  it('none in the first room; about 10% of meaty goblins from the second, 5% more a point of ruin; one a room, two on a deep job', () => {
    let first = 0, seen = 0, want = 0, most = 0, deepMost = 0, rooms = 0;
    for (const j of jobs(Array.from({ length: 40 }, (_, d) => d + 1))) for (const { i, foes } of plans(j)) {
      const el = foes.filter((f) => f.elite?.length);
      if (i === 0) first += el.length;
      else {
        rooms++;
        seen += el.length;
        want += foes.filter(can).length * eliteChance(j, i);
        if (j.deep) deepMost = Math.max(deepMost, el.length);
        else most = Math.max(most, el.length);
      }
      for (const f of el) expect(f.elite!.length).toBeGreaterThanOrEqual(1), expect(f.elite!.length).toBeLessThanOrEqual(j.deep ? 3 : 2), expect(new Set(f.elite).size).toBe(f.elite!.length);
    }
    expect(first).toBe(0);
    expect(most).toBe(1);
    expect(deepMost).toBeLessThanOrEqual(2);
    // Fewer land than the chance alone: one a room, and one is laid only when the room can pay for it (a shield
    // wall, or a brute with an ironhide, already fills a lone hero's screen; about three rolls in ten don't fit).
    expect(seen).toBeGreaterThan(want * 0.4);
    expect(seen).toBeLessThan(want * 1.25);
    expect(rooms).toBeGreaterThan(200);
    expect(eliteChance({ ...board(1)[0], place: { ...board(1)[0].place, ruin: 2 } }, 1)).toBeCloseTo(0.2, 5);
  });

  it('switched off, the very same rooms come with none and nothing else in them moves but the small ones an elite paid for', () => {
    for (const j of jobs([3, 9])) for (let i = 1; i < j.rooms; i++) {
      const on = planRoom(j, i);
      ELITE.on = false;
      const off = planRoom(j, i);
      ELITE.on = true;
      expect(off.foes.some((f) => f.elite)).toBe(false);
      if (!on.foes.some((f) => f.elite)) expect(JSON.stringify(on)).toBe(JSON.stringify(off));
      expect(JSON.stringify(on.map)).toBe(JSON.stringify(off.map));
    }
  });
});

describe('threat', () => {
  it('an elite costs its sort times 1.5, plus 1 an affix', () => {
    expect(foeThreat({ role: 'heavy', elite: ['quick'] })).toBe(THREAT.meaty * 1.5 + 1);
    expect(foeThreat({ role: 'shield', elite: ['quick', 'plated'] })).toBe(THREAT.meaty * 1.5 + 2);
    expect(foeThreat({ role: 'heavy' })).toBe(THREAT.meaty);
  });

  it("a room with an elite plans for it: the same budget, the elite's extra coming off what the room lays after it", () => {
    let rooms = 0;
    for (const j of jobs(Array.from({ length: 30 }, (_, d) => d + 1))) for (let i = 1; i < j.rooms; i++) {
      const on = planRoom(j, i).foes;
      if (!on.some((f) => f.elite)) continue;
      ELITE.on = false;
      const off = planRoom(j, i).foes;
      ELITE.on = true;
      rooms++;
      // Planned in as its template is picked: the room spends the same budget, the elite's share coming off what follows.
      const packs = (fs: Foe[]) => threatIn(fs.filter((f) => f.pack !== undefined && f.pack < 80 && (f.kind === 'scrapper' || f.kind === 'butcher')));
      expect(packs(on)).toBeLessThanOrEqual(roomBudget(j, i) + 1e-9);
      expect(Math.abs(packs(on) - packs(off))).toBeLessThanOrEqual(ELITE.mult * THREAT.meaty);
    }
    expect(rooms).toBeGreaterThan(5);
  });
});

/** One brute at (15, 6) with `affixes`, and the hero at (15, 14). */
const brute = (affixes: Foe['elite'], more: Foe[] = []) => {
  const f = field([{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 15, y: 6, elite: affixes }, ...more]);
  return { ...f, e: f.room.enemies[0] };
};

describe('each affix and its counter', () => {
  it('Plated: a fifth of anything, until a charged blow, a perfect or storm breaks the plates', () => {
    const { room, e } = brute(['plated']), plain = brute([]).e;
    expect(e.elite).toEqual(['plated']);
    // What the same blow does to a brute without plates (a brute shrugs off a little of anything).
    damage(plain, 50, 0, []);
    const full = VARIANTS.heavy.hp - plain.hp;
    damage(e, 50, room.time, room.events);
    expect(e.hp).toBe(VARIANTS.heavy.hp - Math.round(full * IRONHIDE.armour));
    const hp = e.hp;
    damage(e, 50, room.time, room.events, { heavy: true });
    expect(e.cracked).toBe(true);
    expect(hp - e.hp).toBe(full);
    run(room, IRONHIDE.broken + 0.1);
    expect(e.cracked).toBe(false);
    jolt(e, room.time, room.events);
    expect(e.cracked).toBe(true);
  });

  it('Quick: wind-ups 0.85 as long but never under the floors, and 1.25 times the pace; keep a guard up', () => {
    const { room, h, e } = brute(['quick']);
    begin(e, 'cleave', VARIANTS.heavy.swing, h, []);
    expect(e.attack!.windup).toBeCloseTo(quickWind(VARIANTS.heavy.swing.windup, false), 5);
    expect(e.attack!.windup).toBeGreaterThanOrEqual(ELITE.quick.red);
    expect(e.attack!.windup).toBeLessThan(VARIANTS.heavy.swing.windup);
    expect(quickWind(1.3, true)).toBeCloseTo(Math.max(1.3 * 0.85, ELITE.quick.striped), 5);
    expect(quickWind(0.55, false)).toBe(0.55);
    Object.assign(e, { attack: null, act: 'chase' });
    const walked = (affixes: Foe['elite']) => {
      const b = brute(affixes), y0 = b.e.y;
      Object.assign(b.h, { x: 15, y: 22 });
      run(b.room, 0.8);
      return b.e.y - y0;
    };
    expect(walked(['quick']) / walked([])).toBeCloseTo(ELITE.quick.pace, 1);
    // Blocked as any blow is.
    room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    Object.assign(h, { x: 15, y: 7.3, weapon: 'sword' });
    const ev = run(room, 3, () => h.hp < 100);
    expect(ev.some((x) => x.k === 'block')).toBe(true);
    expect(h.hp).toBe(100);
  });

  it('Gorging: with nobody on it, it eats a body in 2 s and heals 30%; burn the dead and it has nothing', () => {
    const meal = (burn: boolean) => {
      const { room, h, e } = brute(['gorging'], [{ kind: 'scrapper', x: 16, y: 6.5 }]);
      const body = room.enemies[1];
      // (Hit first, as anything killed in a fight is: a body never hit counts as dying alight.)
      body.hitAt = room.time;
      kill(body, room.events, 'fall');
      if (burn) toAsh(body, room.events);
      Object.assign(h, { x: 15, y: 22 });
      e.hp = Math.round(e.maxHp * 0.4);
      const hp = e.hp, ev: FightEvent[] = run(room, ELITE.gorging.time + 0.8);
      return { e, hp, ev, body };
    };
    const ate = meal(false);
    expect(ate.ev.some((x) => x.k === 'meal')).toBe(true);
    expect(ate.ev.some((x) => x.k === 'fed')).toBe(true);
    expect(ate.e.hp - ate.hp).toBe(Math.round(ate.e.maxHp * ELITE.gorging.heal));
    expect(ate.body.eaten).toBe(true);
    expect(ate.e.fed).toBeFalsy();
    const burned = meal(true);
    expect(burned.ev.some((x) => x.k === 'meal')).toBe(false);
    expect(burned.e.hp).toBe(burned.hp);
    // Not gorging: a brute never eats.
    expect(ELITE.gorging.time).toBe(MEAL.time);
  });
});

describe('what it drops', () => {
  it('more often than a small goblin, a little better, by the level curve', () => {
    const drops = (elite: boolean, lv: number) => {
      const out: Drop[] = [], rng = new Rng(9), h = { id: 'me', x: 0, y: 0, weapon: 'sword' } as never;
      for (let i = 0; i < 4000; i++) dropFrom({ kind: 'scrapper', x: 0, y: 0, ...(elite ? { elite: ['quick'] } : {}) } as Enemy, [h], out, rng, [], lv);
      return out;
    };
    const plain = drops(false, 1), el = drops(true, 1), el5 = drops(true, 5);
    expect(el.length / 4000).toBeCloseTo(ELITE.loot.chance, 1);
    expect(plain.length / 4000).toBeLessThan(0.05);
    const good = (ds: Drop[]) => ds.filter((d) => d.item.quality !== 'plain').length / ds.length;
    expect(good(el)).toBeGreaterThan(good(plain) - 0.02);
    expect(good(el5)).toBeGreaterThanOrEqual(good(el) - 0.02);
  });
});

describe('online and determinism', () => {
  it('its affixes go out once: never again in a patch while nothing changes them', () => {
    const { room } = brute(['quick', 'gorging']);
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    let got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    for (let i = 0; i < 60; i++) {
      room.step();
      const p = enc.encode(stateOf(room));
      for (const [, u] of (p.enemies?.u ?? []) as [unknown, Record<string, unknown>][]) expect(Object.keys(u)).not.toContain('elite');
      got = dec.apply(JSON.parse(JSON.stringify(p)));
    }
    expect(got.enemies[0].elite).toEqual(['quick', 'gorging']);
  });

  it('the same rooms and the same fight twice', () => {
    const j = board(11)[2];
    for (let i = 0; i < j.rooms; i++) expect(JSON.stringify(planRoom(j, i))).toBe(JSON.stringify(planRoom({ ...j }, i)));
    const play = () => {
      const { room } = brute(['quick', 'plated'], [{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 18, y: 6, elite: ['gorging'] }]);
      const log: string[] = [];
      for (let i = 0; i < 240; i++) {
        room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 17), my: -0.3, attack: i % 8 < 2, attackSeq: Math.floor(i / 8) });
        room.step();
        for (const ev of room.events) if (ev.k === 'hit' || ev.k === 'windup') log.push(`${i}:${ev.k}:${ev.x.toFixed(3)}`);
      }
      return log.join('|');
    };
    expect(play()).toBe(play());
  });
});
