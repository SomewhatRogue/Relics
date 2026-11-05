import { describe, expect, it } from 'vitest';
import { RATS, Rats } from '../src/client/rats';
import { blocked, bloody, bolthole } from '../src/client/ratspots';
import { ArenaRoom } from '../src/sim/room';
import { newHero } from '../src/sim/hero';
import { townMap } from '../src/shared/town';
import { newWorld } from '../src/shared/story';
import { OX, OY, PX } from '../src/client/world';

/** A pool of blood (as gore leaves it) at tile (x, y). */
const pool = (x: number, y: number) => Array.from({ length: 60 }, (_, i) => ({ x: OX + x * PX + (i % 8), y: OY + y * PX + Math.floor(i / 8), col: i % 2 ? '#7a1d1d' : '#5a1414' }));

function run(r: Rats, room: ArenaRoom, stains: ReturnType<typeof pool>, secs: number, t0: number): number {
  let t = t0;
  for (; t < t0 + secs; t += 0.05) r.frame(room, stains, room.heroes, 'me', t);
  return t;
}

describe('rats on the blood', () => {
  it('come to blood once nobody is near, scatter from a hero at 2.5 tiles (1.2 creeping), and come back one at a time', () => {
    const room = new ArenaRoom(1, {}), me = newHero('me', 1.5, 1.5), stains = pool(8, 7), r = new Rats();
    room.heroes = [me];
    let scattered = 0;
    r.onScatter = (n) => (scattered += n);
    let t = run(r, room, stains, 1.2, 0);
    expect(r.rats.length).toBeGreaterThan(0);
    expect(r.rats.every((x) => x.state === 'gone')).toBe(true);
    t = run(r, room, stains, 30, t);
    const back = r.rats.filter((x) => x.state !== 'gone');
    expect(back.length).toBe(r.rats.length);
    // Walk up: still at 3 tiles, scattered by 2.4.
    const rat = r.rats[0];
    Object.assign(me, { x: rat.x - 3, y: rat.y });
    t = run(r, room, stains, 0.1, t);
    expect(rat.state).not.toBe('flee');
    Object.assign(me, { x: rat.x - 2.4, y: rat.y });
    t = run(r, room, stains, 0.1, t);
    expect(rat.state).toBe('flee');
    expect(scattered).toBeGreaterThan(0);
    expect(rat.tx).toBeGreaterThan(me.x);
    // Stand on the pool so every rat on it goes (they spread a little), then give the runs time.
    Object.assign(me, { x: 8.5, y: 7.5 });
    t = run(r, room, stains, 5, t);
    expect(r.rats.every((x) => x.state === 'gone')).toBe(true);
    // Away again: nothing for 15 s, then the first, then the rest a beat apart.
    Object.assign(me, { x: 1.5, y: 1.5 });
    t = run(r, room, stains, 14, t);
    expect(r.rats.every((x) => x.state === 'gone')).toBe(true);
    let first = -1, seen = 0;
    for (; t < 80 && seen < r.rats.length; t += 0.05) {
      r.frame(room, stains, room.heroes, 'me', t);
      const n = r.rats.filter((x) => x.state !== 'gone').length;
      if (n > seen) {
        expect(n).toBe(seen + 1);
        if (first < 0) first = t;
        seen = n;
      }
    }
    expect(seen).toBe(r.rats.length);
    // Creeping: closer before they go.
    const near = r.rats[0];
    run(r, room, stains, 8, t);
    Object.assign(me, { x: near.x - 1.5, y: near.y, sneaking: true });
    r.frame(room, stains, room.heroes, 'me', t + 8.05);
    expect(near.state).not.toBe('flee');
  });

  it('stay few, and never touch the room', () => {
    const room = new ArenaRoom(1, {}), stains = [...pool(4, 4), ...pool(8, 4), ...pool(12, 4), ...pool(4, 8), ...pool(8, 8), ...pool(12, 8)], r = new Rats();
    room.heroes = [newHero('me', 8, 6)];
    const before = JSON.stringify(room.heroes) + room.enemies.length;
    run(r, room, stains, 2, 0);
    expect(r.rats.length).toBeLessThanOrEqual(RATS.cap);
    expect(r.rats.length).toBeGreaterThan(3);
    expect(JSON.stringify(room.heroes) + room.enemies.length).toBe(before);
  });

  it('wait in Wickhold\'s alleys and by the grate, clear of every wall, and bolt for cover', () => {
    const m = townMap(newWorld()), room = new ArenaRoom(1, { map: m }), r = new Rats();
    room.heroes = [newHero('me', 22, 30)];
    r.frame(room, [], room.heroes, 'me', 0);
    expect(r.rats.length).toBeGreaterThan(3);
    for (const x of r.rats) expect(blocked(m, x.hx, x.hy)).toBe(false);
    expect(r.rats.filter((x) => x.state === 'idle').length).toBeGreaterThan(0);
    const hole = bolthole(m, 23, 35.4, 0, 1, 6);
    expect(hole.y).toBeGreaterThan(35.4);
    expect(bloody('#7a1d1d')).toBe(true);
    expect(bloody('#5b6b2a')).toBe(false);
  });
});
