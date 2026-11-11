/** The Deep (docs/design/the-deep.md), build steps 1 and 2: a floor, its checkpoint, and the run snapshot. */
import { describe, expect, it, vi } from 'vitest';
import { deepFloor, isDeep } from '../src/shared/deep';
import { endDeep, foundSince, kitNow, markHere, setOut } from '../src/shared/deepkit';
import { TICK } from '../src/shared/tuning';
import type { Item } from '../src/shared/loot';
import type { Profile } from '../src/shared/progress';
import { NO_INTENT } from '../src/sim/types';
import { roomBudget } from '../src/shared/roombudget';
import { eliteChance } from '../src/shared/eliteroll';
import { deepOdds } from '../src/shared/deeploot';
import { DROP_ODDS } from '../src/shared/gear';
import { roomAt } from '../src/shared/deepbands';
import { bigRooms } from '../src/shared/roombudget';
import { ELITE } from '../src/shared/elites';
import { quickPause } from '../src/sim/elite';

// The checkpoint is reached by walking into a finished floor's way out: the floor's goal is taken as done here.
const done = { on: false };
vi.mock('../src/sim/run', async (orig) => {
  const m = await orig<typeof import('../src/sim/run')>();
  return { ...m, goal: (...a: Parameters<typeof m.goal>) => (done.on ? { text: '', done: true } : m.goal(...a)) };
});
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
const { Game } = await import('../src/client/game');
const { DEEP_WORDS } = await import('../src/client/deepwords');
const { newRun, runRoom, goal } = await vi.importActual<typeof import('../src/sim/run')>('../src/sim/run');

const axe: Item = { slot: 'weapon', kit: 'greatsword', quality: 'fine', traits: [] };
const ring: Item = { slot: 'ring', quality: 'fine', traits: [] };
const hero = () => {
  store.clear();
  const g = new Game();
  g.create('WARRIOR', 'BRAM');
  if (g.mode === 'wood') g.skipWood();
  g.profile.gold = 100;
  return g;
};
/** Walk into the floor's way out (the goal taken as done). */
function toCheckpoint(g: InstanceType<typeof Game>): void {
  done.on = true;
  const e = g.room.map.exit!;
  Object.assign(g.hero, { x: e.x + e.w / 2, y: e.y + e.h / 2 });
  g.step(TICK, NO_INTENT);
  done.on = false;
}

describe('a Deep floor', () => {
  it('is one room under Wickhold from the ordinary generator, the same for the same seed, a fresh one each floor', () => {
    const a = deepFloor(1, 777, 'x'), b = deepFloor(1, 777, 'x'), c = deepFloor(2, 777, 'x');
    expect(isDeep(a) && a.rooms === 1 && a.place.region === 'Wickhold').toBe(true);
    expect(a.seed).toBe(b.seed);
    expect(c.seed).not.toBe(a.seed);
    expect(c.objective).not.toBe(a.objective);
    for (let n = 1; n <= 6; n++) {
      const run = newRun(deepFloor(n, 31, 'x')), room = runRoom(run);
      expect(room.enemies.length).toBeGreaterThan(0);
      expect(room.map.exit).toBeTruthy();
      expect(goal(run, room).done).toBe(false);
    }
  });
});

describe('the run snapshot', () => {
  const p = () => ({ weapon: 'sword', arms: { sword: { slot: 'weapon', kit: 'sword', quality: 'plain', traits: [] } }, bag: [], armor: null, rings: [] }) as unknown as Profile;

  it('dead: the kit taken down comes back whole, even a sword swapped out for a find; finds and gold are lost', () => {
    const h = p(), d = setOut(h, 1), sword = h.arms.sword!;
    // Equip a found axe, the old sword in the pack, and pick up a ring.
    Object.assign(h, { weapon: 'greatsword', arms: { sword, greatsword: axe }, bag: [ring] });
    const end = endDeep(d, h, 'dead', 80);
    expect(end.gold).toBe(0);
    expect(kitNow(h)).toEqual(d.entry);
    expect(end.lost).toEqual(expect.arrayContaining([axe, ring]));
    expect(end.lost).toHaveLength(2);
  });

  it('out at a checkpoint: everything found is banked with the run gold', () => {
    const h = p(), d = setOut(h, 1);
    h.bag.push(axe);
    const end = endDeep(d, h, 'out', 80);
    expect(end).toMatchObject({ gold: 80, lost: [] });
    expect(h.bag).toEqual([axe]);
  });

  it('gone early: as at the last checkpoint passed, or as at the way down if none', () => {
    const h = p(), d = setOut(h, 1);
    h.bag.push(axe);
    expect(endDeep(structuredClone(d), structuredClone(h), 'early', 50)).toMatchObject({ gold: 0, floor: 0 });
    markHere(d, h, 30);
    d.floor = 2;
    h.rings.push(ring);
    const end = endDeep(d, h, 'early', 50);
    expect(end).toMatchObject({ gold: 30, floor: 1, lost: [ring] });
    expect(h.bag).toEqual([axe]);
    expect(h.rings).toEqual([]);
  });

  it('counts finds piece by piece (a second of the same is a find)', () => {
    const h = p(), d = setOut(h, 1);
    h.bag.push(structuredClone(h.arms.sword!));
    expect(foundSince(d.entry, kitNow(h))).toHaveLength(1);
  });
});

describe('the Deep in the game', () => {
  it('the way down, a floor, the checkpoint, GO DEEPER, then LEAVE banks it all', () => {
    const g = hero(), p = g.profile, gold0 = p.gold;
    g.enterDeep();
    expect(g.mode).toBe('run');
    expect(g.run?.job.floor).toBe(1);
    expect(p.deep?.floor).toBe(1);
    g.run!.gold = 40;
    p.bag.push(axe), g.hero.bag.push(axe);
    toCheckpoint(g);
    expect(g.deepAsk).toBe(true);
    expect(p.deep?.mark).toMatchObject({ floor: 1, gold: 40 });
    // Asked once: standing there doesn't ask again.
    g.deepAsk = false;
    g.step(TICK, NO_INTENT);
    expect(g.deepAsk).toBe(false);
    const first = g.run!.job.seed;
    g.deeper();
    expect(g.run?.job.floor).toBe(2);
    expect(g.run?.job.seed).not.toBe(first);
    expect(g.run?.gold).toBe(40);
    expect(g.mode).toBe('run');
    toCheckpoint(g);
    g.leaveDeep();
    expect(g.result?.deep).toMatchObject({ end: 'out', floor: 2, lost: [] });
    expect(p.gold).toBe(gold0 + 40);
    expect(p.bag).toContainEqual(axe);
    expect(p.deep).toBeUndefined();
    expect(g.mode).toBe('town');
  });

  it('die below: the kit taken down comes back, finds and the run gold are gone', () => {
    const g = hero(), p = g.profile, gold0 = p.gold, entry = kitNow(p);
    g.enterDeep();
    g.run!.gold = 60;
    p.bag.push(axe);
    g.endForTest(false);
    expect(g.result?.deep).toMatchObject({ end: 'dead', floor: 1, lost: [axe] });
    expect(g.result?.gold).toBe(0);
    expect(p.gold).toBe(gold0);
    expect(kitNow(p)).toEqual(entry);
    expect(p.deep).toBeUndefined();
  });

  it('leave mid-floor: as at the last checkpoint passed', () => {
    const g = hero(), p = g.profile, gold0 = p.gold;
    g.enterDeep();
    g.run!.gold = 25;
    p.bag.push(axe), g.hero.bag.push(axe);
    toCheckpoint(g);
    g.deeper();
    g.run!.gold = 90;
    p.rings.push(ring);
    g.leaveJob();
    expect(g.result?.deep).toMatchObject({ end: 'early', floor: 1, lost: [ring] });
    expect(p.gold).toBe(gold0 + 25);
    expect(p.bag).toContainEqual(axe);
    expect(p.rings).not.toContainEqual(ring);
  });
});

describe('floors by band (step 3)', () => {
  const share = (o: [string, number][], ts: string[]) => o.filter(([t]) => ts.includes(t)).reduce((s, [, p]) => s + p, 0);
  const RARE = ['touched', 'turning', 'hungry'];

  it('each band is a harder place and a deeper room, with named butchers to hunt from floor 6', () => {
    const f = (n: number) => deepFloor(n, 99, 'x');
    expect(f(1)).toMatchObject({ place: { ruin: 2 } });
    expect(f(1).deep).toBeUndefined();
    expect(f(6)).toMatchObject({ deep: true, place: { ruin: 3 }, objective: 'hunt' });
    expect(f(6).boss).toBeTruthy();
    expect([7, 8].map((n) => f(n).objective)).not.toContain('hunt');
    expect(f(12).objective).toBe('hunt');
    // (A boss floor, every fifth, is its own: docs/design/deep-bosses.md.)
    const named = (n: number) => f(n).objective === 'hunt' && !f(n).arena;
    for (let n = 2; n < 30; n++) expect(named(n) && named(n - 1)).toBe(false);
    const b = [1, 6, 11, 16, 20, 30].map((n) => roomBudget(f(n), roomAt(f(n), 0)));
    for (let i = 1; i < b.length; i++) expect(b[i]).toBeGreaterThanOrEqual(b[i - 1]);
    expect(b[5]).toBeGreaterThan(b[3]);
    // An ordinary job's first room has no elites; every Deep floor can.
    expect(eliteChance({ ...f(1), floor: undefined }, 0)).toBe(0);
    expect(eliteChance(f(1), roomAt(f(1), 0))).toBeGreaterThan(0);
    expect(eliteChance(f(11), roomAt(f(11), 0))).toBeGreaterThan(eliteChance(f(1), roomAt(f(1), 0)));
  });

  it('a hunt floor has its named butcher; floors past fifteen keep getting tougher', () => {
    const run = newRun(deepFloor(6, 99, 'x')), room = runRoom(run);
    expect(room.enemies.some((e) => e.name)).toBe(true);
    expect(goal(run, room).text).toContain(run.job.boss!);
    const lv = (n: number) => runRoom(newRun(deepFloor(n, 99, 'x'))).level;
    expect(lv(1)).toBe(1);
    expect(lv(11)).toBeGreaterThan(lv(6));
    // The same goblin a floor on, past fifteen: more health (the room's own map aside).
    const a = runRoom(newRun({ ...deepFloor(17, 5, 'x'), floor: 16 })), z = runRoom(newRun({ ...deepFloor(17, 5, 'x'), floor: 26 }));
    const top = (r: typeof a) => Math.max(...r.enemies.map((e) => e.maxHp));
    expect(top(z)).toBeGreaterThan(top(a));
    expect(z.floor).toBe(26);
  });

  it('loot: PRE-WAR then the rare three lean up band by band, and rare keeps rising past fifteen', () => {
    const o = DROP_ODDS.chest, at = (n: number) => deepOdds(o, n);
    expect(at(0)).toBe(o);
    for (const n of [1, 6, 11, 16, 25]) expect(share(at(n), ['plain', 'fine', 'forged', 'tolmouth', ...RARE])).toBeCloseTo(share(o, ['plain', 'fine', 'forged', 'tolmouth', ...RARE]));
    expect(share(at(1), ['tolmouth'])).toBeGreaterThan(share(o, ['tolmouth']));
    expect(share(at(6), ['tolmouth'])).toBeGreaterThan(share(at(1), ['tolmouth']));
    const r = [1, 6, 11, 16, 25, 40].map((n) => share(at(n), RARE));
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1]);
  });
});

describe('harder goblins, BIG ONEs and elites below (Kyle, 2026-11-11)', () => {
  const rooms = (n: number, seeds = 12) => Array.from({ length: seeds }, (_, i) => runRoom(newRun(deepFloor(n, 300 + i, 'x'))));
  const count = (rs: ReturnType<typeof rooms>, p: (e: (typeof rs)[number]['enemies'][number]) => boolean) => rs.reduce((s, r) => s + r.enemies.filter(p).length, 0);

  it('a BIG ONE closes floor 4, then every other floor that is not a hunt, then every one (a boss floor aside)', () => {
    const big = (n: number) => bigRooms(deepFloor(n, 9, 'x')).length > 0;
    expect([1, 2, 3, 4, 5].map(big)).toEqual([false, false, false, true, false]);
    expect([6, 7, 8, 9, 10].map(big)).toEqual([false, false, true, false, false]);
    expect([11, 12, 13, 14, 15].map(big)).toEqual([true, false, true, false, false]);
    expect(count(rooms(4), (e) => !!e.big)).toBeGreaterThan(0);
  });

  it('deeper floors draw more of the harder sorts and more elites, with two affixes from floor 11', () => {
    const hard = (n: number) => count(rooms(n), (e) => !!e.role && e.role !== 'fodder' && e.role !== 'wolf' && e.role !== 'blind');
    expect(hard(12)).toBeGreaterThan(hard(1));
    const el = rooms(13).flatMap((r) => r.enemies.filter((e) => e.elite?.length));
    expect(el.length).toBeGreaterThan(0);
    expect(el.every((e) => e.elite!.length >= 2)).toBe(true);
  });

  it('a Quick elite rests less between blows', () => {
    expect(quickPause({ elite: ['quick'] } as never)).toBe(ELITE.quick.pause);
    expect(quickPause({ elite: ['plated'] } as never)).toBe(1);
    expect(ELITE.quick.pause).toBeLessThan(1);
  });
});

describe('the Deep with a party (step 4)', () => {
  type Friend = { name: string; profile: object | null; intent: typeof NO_INTENT & { deep?: number }; heard: number; fresh: boolean; gone: boolean };
  /** A leader's game with one friend standing in (the relay itself is the online scripts' job). */
  function withFriend() {
    const g = hero();
    g.enterDeep();
    const ann: Friend = { name: 'ANN', profile: { ...structuredClone(g.profile), id: 'ann-00001', name: 'ANN' }, intent: { ...NO_INTENT }, heard: 0, fresh: false, gone: false };
    const friends = new Map([['ann-00001', ann]]);
    (g as unknown as { coop: object }).coop = { friends, company: true, members: [['me', 'BRAM'], ['ann-00001', 'ANN']], away: () => false, end() {}, close() {}, handOver() {}, frame() {}, onRefused() {} };
    return { g, ann };
  }

  it('GO DEEPER is a vote: the leader takes everyone down once every friend still in has chosen it', () => {
    const { g, ann } = withFriend();
    toCheckpoint(g);
    g.deeper();
    expect(g.run?.job.floor).toBe(1);
    expect(g.hostNote).toBe(DEEP_WORDS.waiting);
    done.on = true;
    g.step(TICK, NO_INTENT);
    expect(g.run?.job.floor).toBe(1);
    ann.intent = { ...NO_INTENT, deep: 1 };
    g.step(TICK, NO_INTENT);
    done.on = false;
    expect(g.run?.job.floor).toBe(2);
    expect(g.deepVote).toBe(0);
  });

  it('a friend gone home does not hold the party up', () => {
    const { g, ann } = withFriend();
    toCheckpoint(g);
    ann.gone = true;
    g.deeper();
    done.on = true;
    g.step(TICK, NO_INTENT);
    done.on = false;
    expect(g.run?.job.floor).toBe(2);
  });

  it('my vote rides on my input to the leader, and is gone once down', () => {
    const g = hero();
    expect(g.own(NO_INTENT).deep).toBeUndefined();
    g.deepVote = 3;
    expect(g.own(NO_INTENT).deep).toBe(3);
  });

  it('LEAVE in a party: up with everything, the job counted done, the rest carry on (handed over)', () => {
    const { g } = withFriend();
    const gold0 = g.profile.gold;
    g.run!.gold = 30;
    g.profile.bag.push(axe), g.hero.bag.push(axe);
    toCheckpoint(g);
    g.leaveDeep();
    expect(g.result?.deep).toMatchObject({ end: 'out', floor: 1, lost: [] });
    expect(g.result?.won).toBe(true);
    expect(g.profile.gold).toBe(gold0 + 30);
    expect(g.profile.bag).toContainEqual(axe);
  });

  it("a follower's game takes its own snapshot on arriving, and settles an older run first", () => {
    const g = hero(), p = g.profile;
    const job = deepFloor(1, 4242, 'x');
    (g as unknown as { deepJoin(j: typeof job): void }).deepJoin(job);
    expect(p.deep?.seed).toBe(4242);
    p.bag.push(axe);
    (g as unknown as { deepJoin(j: typeof job): void }).deepJoin(deepFloor(1, 777, 'x'));
    expect(p.deep?.seed).toBe(777);
    expect(p.bag).not.toContainEqual(axe);
  });
});
