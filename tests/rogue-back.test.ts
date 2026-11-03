import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { fromBehind, backstabOf } from '../src/sim/backshot';
import { WEAPONS } from '../src/shared/tuning';

describe('a Rogue backstabs with every weapon', () => {
  it('every Rogue kit lands at least twice as hard from behind', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    const h = room.join('r');
    for (const k of ['daggers', 'rapier', 'handbow'] as const) {
      h.weapon = k;
      expect(WEAPONS[k].cls).toBe('ROGUE');
      expect(backstabOf(h)).toBeGreaterThanOrEqual(2);
    }
  });
  it("a shot travelling the way the goblin faces takes it in the back; one into its face doesn't", () => {
    const e = { fx: 1, fy: 0 } as Parameters<typeof fromBehind>[0];
    expect(fromBehind(e, 1, 0)).toBe(true);
    expect(fromBehind(e, -1, 0)).toBe(false);
  });
});
