/**
 * A Rogue climbs (docs/design/elevation.md, "Raised areas"; Kyle, 2026-11-18: "maybe rogue can climb up those areas
 * because... rogue"). Anyone else goes round by the steps. No button: a Rogue who keeps walking into an earth face
 * for HEIGHT.climb seconds goes up it and stands on the lip. Not while rolling, hurt, carrying or down, and only
 * where there is room to stand on top.
 *
 * How long each has been at a face is the running room's own note (it is not sent: a face climbed is the hero's
 * place and level, which are).
 */
import { collide, FACE_FOOT, inRamp, levelAt, type GameMap } from '../shared/arena';
import { HEIGHT, HERO, WEAPONS } from '../shared/tuning';
import type { FightEvent, Hero, Intent } from './types';

const at = new WeakMap<Hero, number>();

/** Whether this hero is one who climbs. */
export const climbs = (h: Hero) => WEAPONS[h.weapon].cls === 'ROGUE';

export function stepClimb(m: GameMap, h: Hero, i: Intent | undefined, dt: number, ev: FightEvent[]): void {
  const len = Math.hypot(i?.mx ?? 0, i?.my ?? 0);
  if (!m.ledges || !i || len < 0.5 || !climbs(h) || !(h.act === 'idle' || h.act === 'charge') || h.hp <= 0) return void at.delete(h);
  const dx = i.mx / len, dy = i.my / len, z = h.z ?? 0, r = HERO.radius;
  // The top, just past the lip in the way they're walking: higher ground, earth, not a ramp (a ramp is walked).
  const reach = r + FACE_FOOT + 0.3, lx = h.x + dx * reach, ly = h.y + dy * reach, up = levelAt(m, lx, ly);
  const face = up > z && !inRamp(m, lx, ly) && m.ledges.some((l) => l.kind === 'earth' && (l.lv ?? 1) === up && lx >= l.x && lx <= l.x + l.w && ly >= l.y && ly <= l.y + l.h);
  if (!face) return void at.delete(h);
  const t = (at.get(h) ?? 0) + dt;
  if (t < HEIGHT.climb) return void at.set(h, t);
  at.delete(h);
  // Room to stand a little in from the lip: set down there on the top's level and let the map have its say.
  const top = { x: h.x + dx * (reach + r + 0.25), y: h.y + dy * (reach + r + 0.25), z: up };
  const want = { ...top };
  collide(top, r);
  if (top.z !== up || Math.hypot(top.x - want.x, top.y - want.y) > 0.6) return;
  ev.push({ k: 'land', x: h.x, y: h.y, dx, dy, how: 'climb' });
  Object.assign(h, { x: top.x, y: top.y, z: up });
}
