import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { fromBehind, backstabOf } from '../src/sim/backshot';
import { WEAPONS } from '../src/shared/tuning';

describe('a Rogue backstabs with every weapon', () => {
  it('every Rogue kit lands harder from behind, the daggers hardest (Kyle, 2026-11-04)', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    const h = room.join('r');
    for (const k of ['daggers', 'rapier', 'poisoner'] as const) {
      h.weapon = k;
      expect(WEAPONS[k].cls).toBe('ROGUE');
      expect(backstabOf(h)).toBeGreaterThanOrEqual(1.75);
    }
    h.weapon = 'daggers';
    const dag = backstabOf(h);
    for (const k of ['rapier', 'poisoner'] as const) (h.weapon = k), expect(backstabOf(h)).toBeLessThan(dag);
  });
  it("a shot travelling the way the goblin faces takes it in the back; one into its face doesn't", () => {
    const e = { fx: 1, fy: 0 } as Parameters<typeof fromBehind>[0];
    expect(fromBehind(e, 1, 0)).toBe(true);
    expect(fromBehind(e, -1, 0)).toBe(false);
  });
});
