/** Weather that changes the fight (Kyle, 2026-11-04): shared/sky.ts, shared/weather.ts, sim/storm.ts, shared/expedsky.ts. */
import { describe, expect, it } from 'vitest';
import { useMap, type Theme } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedSky, skyNow } from '../src/shared/expedsky';
import { PLACES, type Job } from '../src/shared/jobs';
import type { Sky } from '../src/shared/sky';
import { planRoom } from '../src/shared/terrain';
import { ALERT, ARCHER, BURN, HERO, LIGHTNING, TICK, TORCH, WEATHER } from '../src/shared/tuning';
import { skyOfJob } from '../src/shared/weather';
import { afflict, stepElements } from '../src/sim/elements';
import { expedRoom } from '../src/sim/expedroom';
import { newHero } from '../src/sim/hero';
import { newEnemy } from '../src/sim/enemies';
import { stepSlicks, type Slick } from '../src/sim/oil';
import { stepStorm, type StormRoom } from '../src/sim/storm';
import { inStrike, strikeShape } from '../src/sim/stormshape';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { Rng } from '../src/shared/rng';
import { field, run } from './foeyard';

const job = (place = PLACES[0], seed = 11, extra: Partial<Job> = {}): Job => ({ id: 'w' + seed, place, objective: 'clear', twist: 'none', rooms: 5, reward: 100, seed, title: '', text: '', layout: 3, ...extra } as Job);
const under = (room: { map: { theme: Theme } }, sky: Sky) => (room.map.theme = { ...room.map.theme, sky: sky === 'clear' ? undefined : sky });

describe('weather comes with the posting', () => {
  it('is rolled from the seed: the same job, the same sky, on any screen', () => {
    for (let s = 1; s < 60; s++) {
      const j = job(PLACES[s % PLACES.length], s * 31);
      expect(skyOfJob(JSON.parse(JSON.stringify(j)))).toBe(skyOfJob(j));
    }
  });

  it('fits the country: the fen and the river foggier than the fields, rain on fields and wood, storms rarer, more fog at night', () => {
    const count = (kinds: string[], night = false) => {
      const n: Record<Sky, number> = { clear: 0, rain: 0, fog: 0, storm: 0 };
      for (const p of PLACES.filter((q) => kinds.includes(q.kind))) for (let s = 1; s <= 400; s++) n[skyOfJob(job(p, s * 7 + 3, night ? { twist: 'night', time: 'night' } : {}))]++;
      return n;
    };
    const wet = count(['marsh', 'river']), open = count(['field', 'farm']), wood = count(['forest']), dark = count(['field', 'farm'], true);
    expect(wet.fog / (wet.fog + wet.rain + wet.clear + wet.storm)).toBeGreaterThan(open.fog / (open.fog + open.rain + open.clear + open.storm));
    expect(open.rain).toBeGreaterThan(open.fog);
    expect(wood.rain).toBeGreaterThan(wood.fog);
    for (const n of [wet, open, wood]) expect(n.storm).toBeLessThan(Math.max(n.clear, n.rain, n.fog));
    expect(dark.fog).toBeGreaterThan(open.fog);
  });

  it('every outdoor room carries the job sky as a rule; none underground', () => {
    for (const p of PLACES) for (let s = 1; s <= 12; s++) {
      const j = job(p, s * 13), sky = skyOfJob(j);
      for (let i = 0; i < j.rooms; i++) {
        const t = planRoom(j, i).map.theme;
        if (t.sky) expect(t.sky, p.name).toBe(sky);
        if (sky === 'clear') expect(t.sky).toBeUndefined();
      }
    }
  });

  it('a party sees the same weather: the rooms built from the job, and the strikes in the patch', () => {
    const j = job(PLACES[3], 99);
    for (let i = 0; i < 5; i++) expect(planRoom(JSON.parse(JSON.stringify(j)), i).map.theme).toEqual(planRoom(j, i).map.theme);
    const { room } = field([]);
    room.strikes.push({ id: 7, x: 10, y: 9, r: LIGHTNING.r, at: 3, on: 'tree' });
    const got = new Decoder().apply(new Encoder().encode(stateOf(room), true), true);
    expect(got.strikes).toEqual([{ id: 7, x: 10, y: 9, r: LIGHTNING.r, at: 3, on: 'tree' }]);
  });
});

describe('rain', () => {
  it("shortens a goblin's burn, a lit slick's, and how far fire jumps", () => {
    for (const sky of ['clear', 'rain', 'storm'] as Sky[]) {
      const { room } = field([]);
      under(room, sky);
      useMap(room.map);
      const k = sky === 'clear' ? 1 : WEATHER.rain.burn, a = newEnemy(1, 'scrapper', 10, 10), b = newEnemy(2, 'scrapper', 10 + a.radius * 2 + BURN.spread * 0.6, 10);
      const w = { heroes: [], enemies: [a, b], javelins: [], props: [], now: 2, ev: [] as FightEvent[] };
      afflict(w, a, 'fire', 10);
      expect(a.burnUntil - 2).toBeCloseTo(BURN.time * k);
      (w.now = 2.01), stepElements(w);
      expect(b.burnUntil > 2, sky).toBe(sky === 'clear');
      const s: Slick = { id: 1, x: 5, y: 5, r: 1, until: 99, lit: -1 };
      stepSlicks([s], { ...w, enemies: [], ev: [{ k: 'oilfire', x: 5, y: 5 }] }, TICK);
      expect(s.burn).toBeCloseTo(TORCH.burn * (sky === 'clear' ? 1 : WEATHER.rain.slick));
    }
  });

  it('covers your feet: a goblin at rest notices you from less far', () => {
    const d = ALERT.sight * WEATHER.rain.hush + 0.5;
    const woke = (sky: Sky) => {
      const { room } = field([{ kind: 'scrapper', x: 15, y: 8, awake: false }], [['me', 15, 8 + d]]);
      under(room, sky);
      run(room, 0.5);
      return room.enemies[0].alert;
    };
    expect(woke('clear')).toBe(true);
    expect(woke('rain')).toBe(false);
  });
});

describe('fog', () => {
  it('goblins see and wake at about 60% of the distance', () => {
    const d = ALERT.sight * WEATHER.fog.sight + 0.5;
    const woke = (sky: Sky) => {
      const { room } = field([{ kind: 'scrapper', x: 15, y: 8, awake: false }], [['me', 15, 8 + d]]);
      under(room, sky);
      run(room, 0.5);
      return room.enemies[0].alert;
    };
    expect(woke('clear')).toBe(true);
    expect(woke('fog')).toBe(false);
  });

  it("an archer's reach drops to match, and its telegraph with it", () => {
    const shot = (sky: Sky) => {
      const { room, h } = field([{ kind: 'scrapper', x: 15, y: 8, bow: true }], [['me', 15, 8 + ARCHER.reach - 0.5]]);
      under(room, sky);
      const e = room.enemies[0];
      e.cooldown = 0;
      let range = 0, from = 0;
      run(room, 3, () => !!(e.attack && ((range = e.attack.range), (from = Math.hypot(h.x - e.x, h.y - e.y)))));
      return { range, from };
    };
    const clear = shot('clear'), fog = shot('fog');
    expect(clear.range).toBeCloseTo(ARCHER.shot.range ?? 0);
    expect(clear.from).toBeGreaterThan(ARCHER.reach * WEATHER.fog.reach);
    expect(fog.range).toBeCloseTo((ARCHER.shot.range ?? 0) * WEATHER.fog.reach);
    expect(fog.from).toBeLessThanOrEqual(ARCHER.reach * WEATHER.fog.reach + 0.01);
  });
});

describe('storm', () => {
  it('a strike shows its circle a second ahead, every 8 to 14 s, and never indoors', () => {
    const { room } = field([{ kind: 'scrapper', x: 15, y: 10 }]);
    under(room, 'storm');
    room.heroes[0].hp = room.heroes[0].maxHp = 1e6;
    const warns: number[] = [], lands: number[] = [];
    for (let i = 0; i < Math.round(60 / TICK); i++) {
      room.step();
      for (const e of room.events) if (e.k === 'strikewarn') warns.push(room.time);
      else if (e.k === 'strike') lands.push(room.time);
      for (const s of room.strikes) {
        const a = strikeShape(s, room.time);
        if (a) expect([a.cx, a.cy, a.radius, a.windup, a.unblockable]).toEqual([s.x, s.y, s.r, LIGHTNING.warn, true]);
      }
    }
    expect(warns.length).toBeGreaterThanOrEqual(3);
    lands.forEach((t, i) => expect(t - warns[i]).toBeCloseTo(LIGHTNING.warn, 1));
    for (let i = 1; i < warns.length; i++) expect(warns[i] - warns[i - 1]).toBeGreaterThanOrEqual(LIGHTNING.every[0] - TICK), expect(warns[i] - warns[i - 1]).toBeLessThanOrEqual(LIGHTNING.every[1] + TICK);
    const inside = field([]).room;
    under(inside, 'storm');
    inside.indoors = true;
    expect(run(inside, 40).some((e) => e.k === 'strikewarn')).toBe(false);
  });

  it('lands on whoever is in the circle it showed, goblins and heroes alike, and stuns the small ones', () => {
    const s = { id: 1, x: 10, y: 10, r: LIGHTNING.r, at: 1, on: 'goblin' as const };
    const inH = Object.assign(newHero('a', 10 + LIGHTNING.r + HERO.radius - 0.05, 10), { safeT: 0 }), outH = Object.assign(newHero('b', 10 - LIGHTNING.r - HERO.radius - 0.05, 10), { safeT: 0 });
    const g = newEnemy(1, 'scrapper', 10, 10 + LIGHTNING.r), far = newEnemy(2, 'scrapper', 14, 14);
    Object.assign(g, { hp: 100, maxHp: 100, respawns: false });
    const r: StormRoom = { map: field([]).room.map, heroes: [inH, outH], enemies: [g, far], survivors: [], time: 1, events: [], indoors: false, strikes: [s], nextStrike: 99 };
    expect(inStrike(s, inH)).toBe(true);
    expect(inStrike(s, outH)).toBe(false);
    stepStorm(r, new Rng(1));
    expect(inH.hp).toBe(inH.maxHp - LIGHTNING.heroDmg);
    expect(outH.hp).toBe(outH.maxHp);
    expect(g.hp).toBe(100 - LIGHTNING.dmg);
    expect(g.act).toBe('stunned');
    expect(g.actDur).toBe(LIGHTNING.stun);
    expect(far.hp).toBe(far.maxHp);
  });

  it("picks what's tall in the open: a lone tree over bare ground", () => {
    const { room } = field([]);
    room.map.rounds = [{ kind: 'tree', x: 20, y: 10, r: 0.5 }];
    under(room, 'storm');
    room.heroes[0].hp = 1e6;
    const ev = run(room, 30).filter((e) => e.k === 'strikewarn');
    expect(ev.some((e) => e.x === 20 && e.y === 10)).toBe(true);
  });
});

describe('no hero slowdown', () => {
  it('walks exactly as far in rain, fog and a storm as on a clear day', () => {
    const walked = (sky: Sky) => {
      const { room, h } = field([], [['me', 15, 20]]);
      under(room, sky);
      room.setIntent('me', { ...NO_INTENT, my: -1 });
      run(room, 1.5);
      return 20 - h.y;
    };
    const clear = walked('clear');
    expect(clear).toBeGreaterThan(2);
    for (const s of ['rain', 'fog', 'storm'] as Sky[]) expect(walked(s), s).toBeCloseTo(clear, 6);
  });
});

describe("the Barrowfields' turn", () => {
  it('is seeded, only ever clear to rain, rain to storm or the fog lifting, and the room makes it for everyone', () => {
    let turned = 0;
    for (let day = 1; day <= 40; day++) {
      const j = expedition(day), x = expedSky(j);
      expect(expedSky(JSON.parse(JSON.stringify(j)))).toEqual(x);
      expect(x.from).toBe(skyOfJob(j));
      if (!x.to) continue;
      turned++;
      expect(`${x.from}>${x.to}`).toMatch(/^(clear>rain|rain>storm|fog>clear)$/);
    }
    expect(turned).toBeGreaterThan(5);
    const day = Array.from({ length: 40 }, (_, i) => i + 1).find((d) => expedSky(expedition(d)).to)!, room = expedRoom(expedition(day));
    const wx = room.exped!.wx!;
    expect(room.map.theme.sky ?? 'clear').toBe(wx.from);
    room.join('me');
    room.time = wx.at! - TICK / 2;
    room.step();
    expect(room.events.some((e) => e.k === 'exped' && e.what === 'weather')).toBe(true);
    expect(room.map.theme.sky ?? 'clear').toBe(wx.to);
    expect(skyNow(wx, room.time)).toBe(wx.to);
    room.step();
    expect(room.events.some((e) => e.k === 'exped' && e.what === 'weather')).toBe(false);
  });
});
