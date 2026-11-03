/**
 * Test players for the big map's load test (scripts/bigmap/, `?bigmap=1&bots=1`): each one sends the
 * room an Intent like a real player would, walking between seeded waypoints round its own patch of the
 * map and swinging at any goblin that comes close. Nothing here decides anything: the room does.
 */
import { Rng } from '../shared/rng';
import { NO_INTENT, type Intent } from './types';
import type { ArenaRoom } from './room';

export interface Bot { id: string; home: { x: number; y: number }; to: { x: number; y: number }; rng: Rng; swingAt: number; seq: number }

/** The four corners' middles of a map: where four bots start, well apart. */
export const spreadOut = (w: number, h: number) => [{ x: w * 0.19, y: h * 0.25 }, { x: w * 0.81, y: h * 0.25 }, { x: w * 0.19, y: h * 0.75 }, { x: w * 0.81, y: h * 0.75 }];

export function newBot(id: string, home: { x: number; y: number }, seed: number): Bot {
  return { id, home, to: { ...home }, rng: new Rng(seed), swingAt: 0, seq: 0 };
}

/** This tick's intent for a bot: toward its waypoint, or at the goblin in its face. */
export function drive(b: Bot, room: ArenaRoom, roam = 14): Intent {
  const h = room.heroes.find((x) => x.id === b.id);
  if (!h) return NO_INTENT;
  if (Math.hypot(b.to.x - h.x, b.to.y - h.y) < 1) {
    const m = room.map, r = roam;
    b.to = { x: Math.max(1, Math.min(m.w - 1, b.home.x + b.rng.range(-r, r))), y: Math.max(1, Math.min(m.h - 1, b.home.y + b.rng.range(-r, r))) };
  }
  let near = null as null | { x: number; y: number }, nd = 1.9;
  for (const e of room.enemies) {
    if (e.act === 'dead' || e.dozing) continue;
    const d = Math.hypot(e.x - h.x, e.y - h.y);
    if (d < nd) (nd = d), (near = e);
  }
  const dx = b.to.x - h.x, dy = b.to.y - h.y, l = Math.hypot(dx, dy) || 1;
  const i: Intent = { ...NO_INTENT, mx: dx / l, my: dy / l, attackSeq: b.seq };
  if (near && room.time - b.swingAt > 0.5) (b.swingAt = room.time), (b.seq++);
  if (near) {
    const ax = near.x - h.x, ay = near.y - h.y, al = Math.hypot(ax, ay) || 1;
    Object.assign(i, { mx: 0, my: 0, ax: ax / al, ay: ay / al, attackSeq: b.seq });
  }
  return i;
}
