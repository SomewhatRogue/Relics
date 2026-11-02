import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { rebase } from '../src/sim/rebase';

describe('a hero carried into another room', () => {
  it("doesn't swing again on the doorstep, and keeps its cooldowns on the new clock", () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    const h = room.join('sam');
    Object.assign(h, { attackQueuedAt: 120, rollQueuedAt: 120 });
    h.relicReady[h.relic] = 125;
    h.blessedUntil = 130;
    rebase(h, 120, 0);
    expect(h.attackQueuedAt).toBe(-9);
    expect(h.rollQueuedAt).toBe(-9);
    expect(h.relicReady[h.relic]).toBe(5);
    expect(h.blessedUntil).toBe(10);
  });
});
