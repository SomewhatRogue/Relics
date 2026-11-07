/** A button just given is ringed till it's first pressed (Kyle, 2026-11-06; client/firstuse.ts), and the
 *  laptop's keys and the wood's goal pips are the game's own (client/keycaps.ts, client/goalpulse.ts). */
import { describe, expect, it } from 'vitest';
import { FirstUse } from '../src/client/firstuse';
import { KEYCAP, KEYLONG } from '../src/client/keycaps';
import { SIGN_KEY } from '../src/shared/signs';
import { NO_INTENT, type Intent } from '../src/sim/types';

const press = (i: Intent, k: keyof Intent, extra: Partial<Intent> = {}): Intent => ({ ...i, ...extra, [k]: ((i[k] as number) ?? 0) + 1 });

describe('a button just given', () => {
  it('waits, ringed, until its first press; the ring clears then and stays cleared', () => {
    const u = new FirstUse();
    let i: Intent = { ...NO_INTENT };
    u.pressed(i);
    u.give('block');
    u.give('sign');
    expect(u.waits('block')).toBe(true);
    // Other presses don't clear it.
    i = press(i, 'attackSeq');
    expect(u.pressed(i)).toEqual(['attack']);
    expect(u.waits('block')).toBe(true);
    // Frames go by with nothing pressed: still waiting.
    for (let f = 0; f < 30; f++) u.pressed(i);
    expect(u.waits('block')).toBe(true);
    i = press(i, 'blockSeq');
    expect(u.pressed(i)).toContain('block');
    expect(u.waits('block')).toBe(false);
    expect(u.waits('sign')).toBe(true);
    i = press(i, 'signSeq');
    u.pressed(i);
    expect(u.waits('sign')).toBe(false);
    expect(u.list).toEqual([]);
  });

  it('tells the skill from the relic by the slot pressed', () => {
    const u = new FirstUse();
    let i: Intent = { ...NO_INTENT };
    u.pressed(i);
    u.give('skill');
    u.give('relic');
    i = press(i, 'relicSeq', { relicPick: 1 });
    u.pressed(i);
    expect(u.waits('relic')).toBe(false);
    expect(u.waits('skill')).toBe(true);
    i = press(i, 'relicSeq', { relicPick: 0 });
    u.pressed(i);
    expect(u.waits('skill')).toBe(false);
  });

  it('a press counted before it was given does not clear it', () => {
    const u = new FirstUse();
    let i: Intent = { ...NO_INTENT };
    u.pressed(i);
    i = press(i, 'rollSeq');
    u.pressed(i);
    u.give('roll');
    u.pressed(i);
    expect(u.waits('roll')).toBe(true);
  });
});

describe('the laptop keys on the buttons', () => {
  it("are the keys input.ts reads, the class's own on V", () => {
    expect(KEYCAP).toMatchObject({ roll: 'SPACE', skill: 'E', relic: 'R', potion: 'Q', grab: 'G', element: 'X', sign: SIGN_KEY });
    expect(KEYLONG.block).toBe('HOLD RIGHT CLICK');
  });
});
