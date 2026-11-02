/**
 * Goblins that have seen you follow you through a door: go into a cottage with the hungry on your
 * heels and, a moment later, in they come after you; come out with them after you, and out they
 * come. Only ones that are after you (awake, close, on their feet), a few at most, and never the
 * named ones (they hold their ground). They keep their wounds; they take new ids in the room they
 * come into (each room counts its own).
 */
import { isDead } from '../sim/damage';
import type { ArenaRoom } from '../sim/room';
import type { Enemy, Hero } from '../sim/types';

export const FOLLOW = { reach: 7, most: 4, after: 1.1, gap: 0.45 };

interface Coming { e: Enemy; into: ArenaRoom; x: number; y: number; at: number }

export class Followers {
  private coming: Coming[] = [];

  /** You've gone through a door from `from` into `into`, coming out at (x, y): who follows. */
  through(from: ArenaRoom, into: ArenaRoom, h: Hero, x: number, y: number): void {
    const after = from.enemies
      .filter((e) => !isDead(e) && !e.name && e.alert !== false && !e.feeding && e.act !== 'carried' && (e.z ?? 0) === 0 && Math.hypot(e.x - h.x, e.y - h.y) < FOLLOW.reach)
      .sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))
      .slice(0, FOLLOW.most);
    after.forEach((e, i) => {
      from.enemies.splice(from.enemies.indexOf(e), 1);
      this.coming.push({ e, into, x, y, at: into.time + FOLLOW.after + i * FOLLOW.gap });
    });
  }

  /** Each frame: anyone due through the door comes in (if you're still in that room). */
  step(room: ArenaRoom): void {
    for (const c of [...this.coming]) {
      if (c.into !== room || room.time < c.at) continue;
      this.coming.splice(this.coming.indexOf(c), 1);
      const id = Math.max(0, ...room.enemies.map((o) => o.id)) + 1;
      Object.assign(c.e, { id, x: c.x + ((id % 3) - 1) * 0.5, y: c.y, kvx: 0, kvy: 0, attack: null, act: 'chase', actT: 0, cooldown: 0.6, alert: true, home: { x: c.x, y: c.y } });
      room.enemies.push(c.e);
      room.prev.set('e:' + id, [c.e.x, c.e.y]);
    }
  }

  /** A new job or home: nobody's coming. */
  clear(): void {
    this.coming = [];
  }
}
