/**
 * The Haulier's tracks (shared/haultune.ts `track`, shared/sumparena.ts `map.tracks`): which one a cart comes
 * down next, and the striped lane shown along it for the last `track.lane` s of its warning, the shape the room
 * judges (sim/haulcarts.ts) and both views draw (client/scene.ts, client/three/actors3d.ts), the same as
 * sim/sparkshape.ts. The warning itself (`boss.track`) is the boss's own note, sent with it. Pure.
 */
import { HAULIER as H } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import type { Enemy, EnemyAttack } from './types';

export type Track = { x0: number; y0: number; x1: number; y1: number };
/** The warning on a track: which, which way (0 from its first end, 1 from its second), when it began, when the lane shows, when the cart goes. */
export interface TrackWarn { i: number; from: 0 | 1; at: number; lane: number; go: number }

export const tracksOf = (): Track[] => currentMap().tracks ?? [];
export const trackLen = (t: Track) => Math.hypot(t.x1 - t.x0, t.y1 - t.y0);

/** The mouth a cart comes out of, the mouth it goes into, and its way (a unit vector). */
export function trackWay(t: Track, from: 0 | 1): { ax: number; ay: number; bx: number; by: number; dx: number; dy: number } {
  const [ax, ay, bx, by] = from ? [t.x1, t.y1, t.x0, t.y0] : [t.x0, t.y0, t.x1, t.y1], l = Math.hypot(bx - ax, by - ay) || 1;
  return { ax, ay, bx, by, dx: (bx - ax) / l, dy: (by - ay) / l };
}

/** How far (x, y) is from the track's line (the nearest point of it). */
export function offTrack(t: Track, x: number, y: number): number {
  const dx = t.x1 - t.x0, dy = t.y1 - t.y0, l2 = dx * dx + dy * dy || 1, k = Math.max(0, Math.min(1, ((x - t.x0) * dx + (y - t.y0) * dy) / l2));
  return Math.hypot(x - (t.x0 + dx * k), y - (t.y0 + dy * k));
}

/**
 * The track a cart comes down next. Each is worth 1, plus `track.lean` times how near the Haulier stands to it
 * (nothing at `track.near` off, all of it on it): lure it onto one and it is the likelier. The one just run is
 * worth a third. `roll` is a draw from the room's seeded Rng, 0 up to 1.
 */
export function trackWeights(tracks: Track[], at: { x: number; y: number }, last: number): number[] {
  return tracks.map((t, i) => (1 + H.track.lean * Math.max(0, 1 - offTrack(t, at.x, at.y) / H.track.near)) * (i === last ? 1 / 3 : 1));
}
export function pickTrack(tracks: Track[], at: { x: number; y: number }, last: number, roll: number): number {
  const w = trackWeights(tracks, at, last);
  let r = roll * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return i;
  return w.length - 1;
}

/** The lane along the track for the last `track.lane` s before the cart goes (striped: only stepping off it saves you); none before or after. */
export function trackShapes(e: Enemy, now: number): EnemyAttack[] {
  const w = e.boss?.track, t = w && tracksOf()[w.i];
  if (!w || !t || now < w.lane || now >= w.go) return [];
  const m = trackWay(t, w.from);
  return [{
    kind: 'charge', t: now - w.lane, windup: w.go - w.lane, active: 0.05, recover: 0, dmg: H.cart.dmg, knock: H.cart.knock, unblockable: true,
    dx: m.dx, dy: m.dy, ox: m.ax, oy: m.ay, range: trackLen(t), arc: 0, cx: m.bx, cy: m.by, radius: H.cart.width / 2, done: false,
  }];
}
