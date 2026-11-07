/**
 * A Warrior or Healer standing in front of a butcher holding block (not a test on its own:
 * tests/blockholds.test.ts uses it). The hero faces it, holds the guard and never swings; with `walk`
 * it steps sideways out of a striped blow as a player who reads the edge would. The room decides the rest.
 * `harm`: the butcher hits that much harder (a bigger party, a BIG ONE, a named one's kit).
 */
import { TICK, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { attackCovers } from '../src/sim/combat';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

export interface Stand { lost: number; downs: number; breaks: number; blocks: number; hits: number; striped: number; secs: number; firstBreak: number }

export function standBlock(weapon: WeaponId, secs = 40, harm = 1, walk = false): Stand {
  const room = new ArenaRoom(3, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1, safeT: 0 });
  const e = Object.assign(newEnemy(10, 'butcher', 9, 7.2), { cooldown: 0.5, alert: true, fx: 0, fy: 1, respawns: false, harm });
  room.enemies = [e];
  const out: Stand = { lost: 0, downs: 0, breaks: 0, blocks: 0, hits: 0, striped: 0, secs, firstBreak: -1 };
  let hp = h.hp;
  for (let t = 0; t < secs; t += TICK) {
    const ux = e.x - h.x, uy = e.y - h.y, l = Math.hypot(ux, uy) || 1, a = e.attack;
    const out1 = walk && a && a.unblockable && !a.done && a.t < a.windup && attackCovers(a, h);
    room.setIntent('me', { ...NO_INTENT, block: !out1, ax: ux / l, ay: uy / l, ...(out1 ? { mx: -uy / l, my: ux / l } : {}) });
    room.step();
    const ev = room.events as FightEvent[];
    if (h.hp < hp) out.lost += hp - h.hp;
    hp = h.hp;
    for (const x of ev) {
      if (x.k === 'block') out.blocks++;
      if (x.k === 'guardbreak') (out.breaks++, out.firstBreak < 0 && (out.firstBreak = +t.toFixed(1)));
      if (x.k === 'hit' && x.on === 'hero') out.hits++;
      if (x.k === 'down') out.downs++;
      if (x.k === 'block' && x.striped) out.striped++;
    }
    // Down, it's up again where it stood (a room keeps going).
    if (h.act === 'down') Object.assign(h, { act: 'idle', hp: h.maxHp, stamina: 100, x: 9, y: 9 }), (hp = h.maxHp);
  }
  return out;
}
