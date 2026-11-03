/**
 * Who stands in the 2.5D view as a flat figure (figs3d.ts), each drawn by the very code the flat view
 * draws them with (scene.ts): heroes and their hounds, a Mage's blink image, other players in town,
 * goblins of every kind and the butcher and the Stoker (with what's on them, status.ts), spiders and
 * nests, the freed, and the map's people (Wickhold's folk, Hew, the dead). Positions eased between
 * the room's ticks as everywhere else. Only draws.
 */
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import { GRAB } from '../../shared/tuning';
import { npcAt } from '../../shared/arena';
import { SPOT_REACH } from '../../shared/town';
import { drawHero } from '../actors';
import { asleep, drawEnemy, drawHeld } from '../foes';
import { drawHound } from '../hound';
import { drawNpc } from '../npcs';
import { drawSurvivor } from '../captives';
import { drawStatus } from '../status';
import type { Lerp } from './actors3d';
import type { Figs } from './figs3d';
import { LEDGE_H } from './ground';

const lift = (z?: number) => (z ?? 0) * LEDGE_H;

/** Every figure this frame, onto its card. */
export function putCards(f: Figs, room: ArenaRoom, meId: string, others: Hero[], lerp: Lerp): void {
  const t = room.time, map = room.map, me = room.heroes.find((h) => h.id === meId);
  for (const h of room.heroes) {
    const [x, y] = lerp('h:' + h.id, h.x, h.y);
    f.put('h' + h.id, x, lift(h.z), y, (c, px, py) => drawHero(c, h, px, py, h.id === meId, t), { xray: true, pool: h.act === 'roll' || h.act === 'down' ? 0.22 : 0.3 });
    if (h.hound) {
      const d = h.hound, [dx, dy] = lerp('d:' + h.id, d.x, d.y);
      f.put('d' + h.id, dx, 0, dy, (c, px, py) => drawHound(c, d, px, py), { pool: d.state === 'fled' && d.t > 2 ? 0 : 0.28 });
    }
    // A Mage's blink image, flickering where they stood until it goes.
    if (h.decoyUntil > t) f.put('v' + h.id, h.decoyX, 0, h.decoyY, (c, px, py) => {
      const a = (0.35 + Math.sin(t * 18) * 0.12) * Math.min(1, (h.decoyUntil - t) / 0.5);
      c.lit.globalAlpha = c.glow.globalAlpha = a;
      drawHero(c, { ...h, act: 'idle', actT: 0 }, px, py, false, t);
    });
  }
  for (const h of others) f.put('o' + h.id, h.x, 0, h.y, (c, px, py) => drawHero(c, h, px, py, false, t), { pool: 0.3 });
  for (const e of room.enemies) {
    const carrier = room.heroes.find((h) => h.carrying === e.id);
    if (carrier) {
      // Held overhead by a hero: drawn with them, just in front.
      const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
      f.put('e' + e.id, hx, lift(carrier.z), hy, (c, px, py) => (drawHeld(c, e, px, py, carrier.fx, carrier.fy, slam), drawStatus(c, e, px, py - 20, t)), { bias: 0.05 });
      continue;
    }
    const [x, y] = lerp('e:' + e.id, e.x, e.y), dead = e.act === 'dead', big = e.kind === 'butcher' || e.kind === 'brood';
    f.put('e' + e.id, x, lift(e.z), y, (c, px, py) => (drawEnemy(c, e, px, py, asleep(map, e)), drawStatus(c, e, px, py, t)), { pool: dead || e.kind === 'nest' ? 0 : big ? 0.55 : 0.28, bias: dead ? -0.3 : 0 });
  }
  // The freed (the dead lie under everyone; the gone are gone).
  for (const s of room.survivors ?? []) {
    if (s.gone) continue;
    const [x, y] = lerp('s:' + s.id, s.x, s.y);
    f.put('s' + s.id, x, lift(s.z), y, (c, px, py) => drawSurvivor(c, s, px, py, t), { pool: s.dead ? 0 : 0.2, bias: s.dead ? -0.3 : 0 });
  }
  (map.npcs ?? []).forEach((n, i) => {
    const at = npcAt(n, t), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
    f.put('n' + i + n.name, at.x, 0, at.y, (c, px, py) => drawNpc(c, n, px, py, near && !n.mute, at.fx, !!n.path, at.x), { pool: n.pose ? 0 : 0.3, bias: n.pose ? -0.3 : 0 });
  });
}
