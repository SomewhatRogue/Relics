import { describe, expect, it } from 'vitest';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT } from '../src/sim/types';

/**
 * Kyle (2026-11-23): "sometimes goblins just sort of glitch out while walking". A goblin at rest strolled to the edge
 * of its patch and then stepped out and back every tick, its facing flipping each time.
 */
describe('a goblin at rest', () => {
  it('never turns right round from one tick to the next as it wanders', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { x: 2, y: 2 });
    const far = { x: room.map.w - 4, y: room.map.h - 4 };
    room.enemies = [0, 1, 2, 3].map((i) => Object.assign(newEnemy(10 + i, 'scrapper', far.x - i * 2.5, far.y - (i % 2) * 2.5), { alert: false, respawns: false }));
    room.setIntent('me', { ...NO_INTENT });
    let about = 0, moved = 0;
    const last = room.enemies.map((e) => ({ fx: e.fx, fy: e.fy }));
    for (let k = 0; k < Math.round(60 / TICK); k++) {
      room.step();
      Object.assign(h, { x: 2, y: 2 });
      room.enemies.forEach((e, i) => {
        if (e.fx * last[i].fx + e.fy * last[i].fy < -0.5) about++;
        if (e.moving) moved++;
        (last[i].fx = e.fx), (last[i].fy = e.fy);
      });
    }
    expect(room.enemies.every((e) => e.alert === false)).toBe(true);
    expect(moved).toBeGreaterThan(100);
    // A new stroll may set off the other way; that is a turn every couple of seconds, not every tick.
    expect(about).toBeLessThan(60);
  });
});
