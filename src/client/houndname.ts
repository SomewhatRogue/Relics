/**
 * When a hound's name shows over it (Kyle, 2026-11-05): like other names, when you're near it (stood
 * within reach of it, it at heel), when the mouse is over it, and all through a game of fetch, a ruffle
 * or a pet. Maeve's hound has no name to show. Drawing only.
 */
import type { Hero, Hound } from '../sim/types';
import { SPOT_REACH } from '../shared/town';

const hover: { at: [number, number] | null } = { at: null };

/** Where the mouse points on the floor (tiles), or null (a phone, or no mouse yet): main.ts, each frame. */
export function pointAt(at: [number, number] | null): void {
  hover.at = at;
}

/** The name to draw over `owner`'s hound `d`, drawn at (x, y) tiles ('' for none); `playing`: in an idle or a pet with it. */
export function houndTag(owner: Hero, d: Hound, x: number, y: number, me: Hero | undefined, playing: boolean): string {
  const name = owner.houndLook?.name ?? '';
  if (!name || (d.state === 'fled' && d.t > 2)) return '';
  if (playing) return name;
  // (The mouse on its body, a little above its feet.)
  if (hover.at && Math.hypot(hover.at[0] - x, hover.at[1] - (y - 0.35)) < 0.7) return name;
  return d.state === 'heel' && me && !me.moving && Math.hypot(me.x - x, me.y - y) <= SPOT_REACH ? name : '';
}
