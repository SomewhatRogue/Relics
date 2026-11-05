/** A Mage in the arena for the spell tests: (9, 9) facing up, in `el`, goblins at each (x, y). */
import { TICK, type Element, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';

/** Goblins are held in place each tick unless `free`; `kind` for all of them (scrappers). */
export function mageArena(weapon: WeaponId, at: [number, number][] = [[9, 7.6]], el: Element = 'fire', free = false, kind: Enemy['kind'] = 'scrapper') {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1, relics: ['grasp'], relic: 'grasp' });
  h.augments.channel = el;
  const es = at.map(([x, y], i) => Object.assign(newEnemy(10 + i, kind, x, y), { cooldown: 99, hp: 4000, maxHp: 4000, alert: true, fx: 0, fy: 1, respawns: false }));
  room.enemies = es;
  let seq = 0;
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      if (!free) es.forEach((e, j) => Object.assign(e, { x: at[j][0], y: at[j][1], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  const tap = (after = 0.8, i: Partial<Intent> = {}) => (seq++, run(after, { attackSeq: seq, ...i }));
  const loose = (hold: number, after: number, i: Partial<Intent> = {}) => (seq++, [...run(hold, { attackSeq: seq, attack: true, ...i }), ...run(after, { attackSeq: seq, attack: false, ...i })]);
  return { room, h, es, e: es[0], run, tap, loose };
}

export const lost = (e: Enemy) => e.maxHp - e.hp;
