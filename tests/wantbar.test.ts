// The Want's bar and the town's side of being corrupt (docs/design/holy-and-hungry.md sections 1 and 2).
import { describe, expect, it } from 'vitest';
import { CORRUPT, corruptPrice } from '../src/shared/corrupt';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { hunted } from '../src/sim/bites';
import { wantBar, wantLines } from '../src/client/wantbar';
import { AGNEW, WANTW } from '../src/client/corruptwords';
import type { Hero } from '../src/sim/types';

const ring = { ...rollHungry(new Rng(9), 'MAGE'), slot: 'ring' as const };
const who = (want: number, hungry = false) => ({ weapon: 'wand', arms: {}, armor: null, legs: null, rings: hungry ? [ring] : [], want });

describe('the town and the corrupt', () => {
  it('a corrupt hero pays a quarter more; a clean one the price', () => {
    expect(corruptPrice(who(0), 100)).toBe(100);
    expect(corruptPrice(who(30), 100)).toBe(125);
    expect(corruptPrice(who(0, true), 7)).toBe(9);
  });
  it('named butchers come for the corrupt first, other goblins no differently', () => {
    expect(hunted({ name: 'SKARN' }, who(30) as unknown as Hero)).toBe(CORRUPT.pull);
    expect(hunted({ name: 'SKARN' }, who(10) as unknown as Hero)).toBe(0);
    expect(hunted({}, who(60) as unknown as Hero)).toBe(0);
  });
  it('the bar says what it costs now, never a number', () => {
    expect(wantLines(who(0))).toEqual([WANTW.none]);
    expect(wantLines(who(20))).toEqual([WANTW.seen]);
    expect(wantLines(who(20, true))).toEqual([WANTW.gift(10), WANTW.seen, WANTW.corrupt]);
    expect(wantLines(who(70))).toEqual([WANTW.seen, WANTW.corrupt, WANTW.half]);
    const html = wantBar(who(40));
    expect(html).toContain('width:50.0%');
    expect(html).not.toContain('40');
    expect(wantBar(who(500))).toContain('width:100.0%');
  });
  it("Agne's words for gear and for the hunger alone differ", () => {
    expect(AGNEW.refuse(true)).not.toBe(AGNEW.refuse(false));
  });
});
