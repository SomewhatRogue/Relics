/**
 * Town presence by dead reckoning (townfolk.ts): each word about where you stand carries how fast
 * you're going, and everyone else carries your figure on along it (for at most RECKON.ahead seconds).
 * So you only need to speak when you start, stop, turn, or drift RECKON.err tiles from where they
 * think you are: a walk in a straight line is a word or two, not three a second (each word may be a
 * Redis command when the town is split over instances: docs/DECISIONS.md 2026-11-04).
 */
export const RECKON = { err: 0.5, ahead: 3, gap: 0.2, vmax: 12 };

/** What the others last heard: where, how fast, and when. */
export interface Sent { x: number; y: number; vx: number; vy: number; t: number }

/** Where the others have you now. */
export function reckoned(s: Sent, now: number): [number, number] {
  const k = Math.min(RECKON.ahead, Math.max(0, now - s.t));
  return [s.x + s.vx * k, s.y + s.vy * k];
}

/** A velocity heard from someone, made safe (finite, and no faster than anyone runs). */
export function heardV(v: unknown): [number, number] {
  if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number' && Number.isFinite(n))) return [0, 0];
  const [x, y] = v as [number, number], s = Math.hypot(x, y);
  return s > RECKON.vmax ? [(x / s) * RECKON.vmax, (y / s) * RECKON.vmax] : [x, y];
}

/**
 * Your own velocity while you move, over the last tenth of a second or so; in a walk's first
 * moments, before there's that much to go on, `start` (which way you face, at a walking pace), so
 * the first word of a walk already carries you the right way.
 */
export class Pace {
  private trail: [number, number, number][] = [];

  at(now: number, x: number, y: number, start: [number, number]): [number, number] {
    this.trail.push([now, x, y]);
    while (this.trail.length > 2 && now - this.trail[1][0] >= 0.1) this.trail.shift();
    const [t0, x0, y0] = this.trail[0], dt = now - t0;
    return dt >= 0.05 ? heardV([(x - x0) / dt, (y - y0) / dt]) : heardV(start);
  }

  /** Standing still: the next walk starts afresh. */
  stop(): void {
    this.trail.length = 0;
  }
}
