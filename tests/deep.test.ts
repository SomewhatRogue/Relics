/** The Deep (docs/design/the-deep.md), build steps 1 and 2: a floor, its checkpoint, and the run snapshot. */
import { describe, expect, it, vi } from 'vitest';
import { deepFloor, isDeep } from '../src/shared/deep';
import { endDeep, foundSince, kitNow, markHere, setOut } from '../src/shared/deepkit';
import { TICK } from '../src/shared/tuning';
import type { Item } from '../src/shared/loot';
import type { Profile } from '../src/shared/progress';
import { NO_INTENT } from '../src/sim/types';

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
