// The walkable Keeping Room (docs/design/keeping-room.md): a town interior through the grate's arch.
import { describe, expect, it } from 'vitest';
import { KEEPING_DOOR, keepingRoom } from '../src/shared/keepingroom';
import { townInterior } from '../src/shared/interiors';
import { ArenaRoom } from '../src/sim/room';
import { newWorld } from '../src/shared/story';

describe('the Keeping Room, walkable', () => {
  it('is the interior behind the arch', () => {
    expect(townInterior(KEEPING_DOOR, newWorld()).name).toBe('THE KEEPING ROOM');
  });
  it('Dorcas is in it to talk to, the way out at the bottom, no torches, the brazier lit', () => {
    const m = keepingRoom(), d = m.npcs?.find((x) => x.name === 'DORCAS');
    expect(d?.talk).toBe(KEEPING_DOOR);
    expect(m.exit!.y).toBeGreaterThan(m.h - 1);
    expect(m.torches).toEqual([]);
    expect(m.braziers).toHaveLength(1);
    for (const b of m.blocks) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(m.w);
      expect(b.y + b.h).toBeLessThanOrEqual(m.h);
    }
  });
  it('a room runs in it, the hero standing clear of the furniture', () => {
    const map = keepingRoom(), room = new ArenaRoom(1, { map, foes: [], furniture: [] });
    for (let i = 0; i < 30; i++) room.step();
    const { x, y } = map.hero;
    expect(map.blocks.some((b) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h)).toBe(false);
    expect(room).toBeTruthy();
  });
});
