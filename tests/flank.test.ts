// Flanking (sim/flank.ts; docs/design/foe-patterns.md slice 2): a pack round a hero sends all but the front one round.
import { describe, expect, it } from 'vitest';
import { TICK } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { flankSpot } from '../src/sim/flank';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

function yard(n: number) {
  const room = new ArenaRoom(5, { scrappers: false, props: false }), h = room.join('me');
  Object.assign(h, { x: 10, y: 12, fx: 0, fy: -1, hp: 99999, maxHp: 99999 });
  room.enemies.length = 0;
  for (let i = 0; i < n; i++) room.enemies.push(Object.assign(newEnemy(i + 1, 'scrapper', 9.4 + i * 1.2, 9.5), { respawns: false, alert: true, cooldown: 0 }));
  return { room, h };
}

describe('a pack goes round you', () => {
  it('alone, a scrapper comes straight at you', () => {
    const { room, h } = yard(1);
    expect(flankSpot(room.enemies[0], h, 2.5, 1.2, room.enemies)).toBeNull();
  });

  it('two in front: one keeps you busy, the other walks round behind you and strikes from there', () => {
    const { room, h } = yard(2);
    const spots = room.enemies.map((e) => flankSpot(e, h, Math.hypot(e.x - h.x, e.y - h.y), 1.2, room.enemies));
    expect(spots.filter((s) => s === null).length).toBe(1);
    const goer = room.enemies[spots.findIndex((s) => s !== null)];
    // The hero stands facing north, the block up, the whole time.
    room.setIntent('me', { ...NO_INTENT, block: true });
    let behind = false, struck = false;
    for (let i = 0; i < Math.round(8 / TICK); i++) {
      Object.assign(h, { x: 10, y: 12, fx: 0, fy: -1 });
      room.step();
      if (goer.y > h.y + 0.3) behind = true;
      if (behind && goer.attack) struck = true;
    }
    expect(behind).toBe(true);
    expect(struck).toBe(true);
  });
});
