/** The Deep's boards (docs/design/the-deep.md, step 5; shared/deepboard.ts). */
import { describe, expect, it, vi } from 'vitest';
import { DEEP_BOARD, addDeepLine, cleanDeepClaim, deepClaimOk, startDeep, type DeepLine } from '../src/shared/deepboard';
import { contribute } from '../src/shared/worldsync';
import { newWorld } from '../src/shared/story';
import { clean } from '../api/_world';

vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
const { Game } = await import('../src/client/game');

const hero = { id: 'habc12345', name: 'BRAM', cls: 'WARRIOR' as const };
const line = (id: string, n: number, gold: number): DeepLine => ({ id, name: id.toUpperCase(), cls: 'WARRIOR', n, gold });
const T0 = 1_800_000_000_000, secs = (f: number) => f * DEEP_BOARD.floorSecs * 1000;

describe('a claim', () => {
  it('is whole numbers in range, or nothing', () => {
    expect(cleanDeepClaim({ s: 5, f: 3, g: 120, p: 1 })).toEqual({ s: 5, f: 3, g: 120, p: true });
    for (const bad of [null, { s: 5, f: 0, g: 0 }, { s: 5, f: 2.5, g: 0 }, { s: -1, f: 1, g: 0 }, { s: 5, f: 1, g: -3 }, { f: 1, g: 0 }]) expect(cleanDeepClaim(bad)).toBeNull();
  });

  it("holds only against the world's own stamp: the same run, time enough for its floors, gold its floors could hold", () => {
    const stamp = { s: 9, at: T0 }, c = { s: 9, f: 4, g: 300, p: false };
    expect(deepClaimOk(undefined, c, T0 + secs(10))).toBe(false);
    expect(deepClaimOk({ ...stamp, s: 8 }, c, T0 + secs(10))).toBe(false);
    expect(deepClaimOk(stamp, c, T0 + secs(4) - 1)).toBe(false);
    expect(deepClaimOk(stamp, c, T0 + secs(4))).toBe(true);
    expect(deepClaimOk(stamp, { ...c, g: 4 * DEEP_BOARD.goldFloor + 1 }, T0 + secs(10))).toBe(false);
    expect(deepClaimOk(stamp, c, T0 + DEEP_BOARD.stampHours * 3600e3 + 1)).toBe(false);
  });

  it('stamps are kept per hero, the newest, the stale dropped', () => {
    let runs = startDeep(undefined, 'a', 1, T0);
    runs = startDeep(runs, 'b', 2, T0 + 1000);
    runs = startDeep(runs, 'a', 3, T0 + 2000);
    expect(runs.a).toEqual({ s: 3, at: T0 + 2000 });
    runs = startDeep(runs, 'c', 4, T0 + DEEP_BOARD.stampHours * 3600e3 + 1500);
    expect(Object.keys(runs).sort()).toEqual(['a', 'c']);
  });
});

describe('a board', () => {
  it('deepest first, gold the tiebreak, each hero once at their best', () => {
    let b = addDeepLine(undefined, line('a', 3, 50));
    b = addDeepLine(b, line('b', 5, 10));
    b = addDeepLine(b, line('c', 3, 90));
    expect(b.map((l) => l.id)).toEqual(['b', 'c', 'a']);
    b = addDeepLine(b, line('b', 4, 999));
    expect(b.find((l) => l.id === 'b')!.n).toBe(5);
    b = addDeepLine(b, line('a', 3, 120));
    expect(b.map((l) => l.id)).toEqual(['b', 'a', 'c']);
    for (let i = 0; i < 20; i++) b = addDeepLine(b, line('z' + i, 1, i));
    expect(b).toHaveLength(DEEP_BOARD.size);
  });

  it('a world takes the start, then the end onto the right board, and lets the stamp go', () => {
    const w = newWorld();
    contribute(w, { hero, deepStart: 77 }, T0, false);
    contribute(w, { hero, deep: { s: 77, f: 2, g: 40, p: false } }, T0 + secs(1), false);
    expect(w.deepSolo ?? []).toHaveLength(0);
    contribute(w, { hero, deep: { s: 77, f: 2, g: 40, p: false } }, T0 + secs(2), false);
    expect(w.deepSolo).toEqual([line('habc12345', 2, 40)].map((l) => ({ ...l, name: 'BRAM' })));
    expect(w.deepRuns?.habc12345).toBeUndefined();
    contribute(w, { hero, deepStart: 78 }, T0 + secs(3), false);
    contribute(w, { hero, deep: { s: 78, f: 1, g: 5, p: true } }, T0 + secs(5), false);
    expect(w.deepParty?.[0]).toMatchObject({ id: 'habc12345', n: 1, gold: 5 });
  });
});

describe('the world server', () => {
  it('passes a start and a claim through, and drops a bad one', () => {
    const h = { id: 'hdeep0001', name: 'bram', cls: 'WARRIOR' };
    expect(clean({ hero: h, deepStart: 42, deep: { s: 42, f: 3, g: 90, p: false } })).toMatchObject({ deepStart: 42, deep: { s: 42, f: 3, g: 90, p: false } });
    const bad = clean({ hero: h, deepStart: -5, deep: { s: 42, f: 0, g: 90 } })!;
    expect(bad.deepStart).toBeUndefined();
    expect(bad.deep).toBeUndefined();
  });
});

describe('in the game', () => {
  it('going down stamps the run; dying below still puts the deepest floor on the board', () => {
    store.clear();
    const now = vi.spyOn(Date, 'now').mockReturnValue(T0);
    const g = new Game();
    g.create('WARRIOR', 'BRAM');
    if (g.mode === 'wood') g.skipWood();
    g.enterDeep();
    const seed = g.profile.deep!.seed;
    expect(g.world.deepRuns?.[g.profile.id]?.s).toBe(seed);
    now.mockReturnValue(T0 + secs(3));
    g.endForTest(false);
    expect(g.world.deepSolo?.[0]).toMatchObject({ id: g.profile.id, n: 1, gold: 0 });
    now.mockRestore();
  });
});
