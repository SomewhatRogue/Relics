/**
 * RAISE, finished off (Kyle, 2026-11-06): the Cleric kneels by the friend while raising them (kneel.ts,
 * idlepose.ts; drawing only, read from the friend's `riseBy` and `riseAt`), and the recap's callout for
 * the one who raised the most friends (recapcalls.ts). The laptop's BUTTONS row's words are RAISEW.legend.
 */
import { describe, expect, it, vi } from 'vitest';
import { RAISE } from '../src/shared/tuning';
import { blankScore, type Score } from '../src/sim/score';

vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });

const { newHero } = await import('../src/sim/hero');
const { noteKneels, kneelOf, KNEEL_IN } = await import('../src/client/kneel');
const { idlePose } = await import('../src/client/idlepose');
const { newPose } = await import('../src/client/motion');
const { callouts } = await import('../src/client/recapcalls');
const { RECAPW } = await import('../src/client/recapwords');
const { RAISEW } = await import('../src/client/raisewords');

/** A Cleric at (5, 5) and a friend out at `fx` on the same row, the raise begun at room time `at` (or not). */
function pair(fx: number, at: number | null) {
  const c = Object.assign(newHero('cleric', 5, 5), { weapon: 'mace' as const, act: 'idle' as const, moving: false });
  const o = Object.assign(newHero('friend', fx, 5), { act: 'down' as const, out: true, riseBy: at === null ? '' : 'cleric', riseAt: at ?? -9 });
  return { c, o, all: [c, o] };
}

describe('the Cleric kneels while raising', () => {
  it('down on a knee by the friend, toward them, going down over KNEEL_IN s; the share of the raise with it', () => {
    const { c, all } = pair(6, 10);
    noteKneels(all, 10 + KNEEL_IN / 2);
    expect(kneelOf(c)?.side).toBe(1);
    expect(kneelOf(c)?.down).toBeCloseTo(0.5, 5);
    noteKneels(all, 10 + RAISE.time / 2);
    const k = kneelOf(c)!;
    expect([k.side, k.down]).toEqual([1, 1]);
    expect(k.share).toBeCloseTo(0.5, 5);
    const pz = newPose(), out = idlePose(c, pz, 0);
    expect(out?.kneel).toBeCloseTo(0.5, 5);
    expect(out?.flip).toBe(false);
    expect(pz.crouch).toBeGreaterThan(0.5);
    expect(pz.reach).toBe(1);
  });

  it('turns to a friend on the left; nobody kneels with no raise going on, or once it ends', () => {
    const left = pair(4, 0);
    noteKneels(left.all, 1);
    expect(kneelOf(left.c)?.side).toBe(-1);
    expect(idlePose(left.c, newPose(), 0)?.flip).toBe(true);
    // The raise broken off or done: '' and -9 (sim/raise.ts), and they stand.
    Object.assign(left.o, { riseBy: '', riseAt: -9 });
    noteKneels(left.all, 2);
    expect(kneelOf(left.c)).toBeNull();
    expect(idlePose(left.c, newPose(), 0)?.kneel ?? -1).toBe(-1);
    const none = pair(6, null);
    noteKneels(none.all, 1);
    expect(kneelOf(none.c)).toBeNull();
  });

  it('drawing only: nothing on either hero changes', () => {
    const { c, o, all } = pair(6, 3);
    const was = JSON.stringify(all);
    noteKneels(all, 4);
    idlePose(c, newPose(), 0);
    expect(JSON.stringify([c, o])).toBe(was);
  });
});

describe('RAISE in the recap and the BUTTONS box', () => {
  const s = (o: Partial<Score>): Score => ({ ...blankScore(), ...o });

  it('the one who raised the most friends gets RAISED FRIENDS, ahead of MOST HEALING', () => {
    const c = callouts([s({ kills: 9 }), s({ kills: 2, healed: 300, rose: 2 }), s({ kills: 1, dodges: 4 })]);
    expect(c).toEqual(['kills', 'rose', 'dodges']);
    expect(RECAPW.call[c[1]!]).toBe(RAISEW.call);
  });

  it('only a real lead, and a board from before RAISE (no `rose`) reads 0', () => {
    expect(callouts([s({ rose: 1 }), s({ rose: 1 })])).toEqual([undefined, undefined]);
    const old = { ...blankScore() } as Partial<Score>;
    delete old.rose;
    expect(callouts([s({ rose: 1 }), old as Score])).toEqual(['rose', undefined]);
    expect(callouts([old as Score, { ...(old as Score), healed: 5 }])).toEqual([undefined, 'healed']);
  });

  it("the laptop's row says how long to keep still", () => {
    expect(RAISEW.legend(RAISE.time)).toContain(`${RAISE.time} seconds`);
  });
});
