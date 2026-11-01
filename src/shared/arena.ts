/**
 * The training room: what the client draws and what the rules collide against, in one place.
 * Tile units. The floor runs from (0, 0) to (W, H); the back wall's face is drawn above y = 0.
 */
export const ARENA = {
  w: 18,
  h: 16,
  /** Height of the back wall's face, in tiles (three-quarter view). */
  wallFace: 3,
  pillars: [
    { x: 4, y: 4.5, r: 0.55 },
    { x: 14, y: 4.5, r: 0.55 },
  ],
  torches: [
    { x: 4.5, y: -1.6 },
    { x: 13.5, y: -1.6 },
  ],
  braziers: [
    { x: 1.4, y: 14.6, r: 0.35 },
    { x: 16.6, y: 14.6, r: 0.35 },
  ],
  spawn: { hero: { x: 9, y: 12 }, butcher: { x: 9, y: 5 }, dummy: { x: 3.5, y: 11 }, swingDummy: { x: 14.5, y: 11 } },
  cage: { x: 15.5, y: 0.9 },
};

export type Circle = { x: number; y: number; r: number };

/** Keep a circle inside the room and outside the pillars. */
export function collide(p: { x: number; y: number }, r: number): void {
  p.x = Math.max(r, Math.min(ARENA.w - r, p.x));
  p.y = Math.max(r * 0.6, Math.min(ARENA.h - r, p.y));
  for (const c of [...ARENA.pillars, ...ARENA.braziers]) {
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), min = c.r + r;
    if (d < min && d > 1e-6) {
      p.x = c.x + (dx / d) * min;
      p.y = c.y + (dy / d) * min;
    }
  }
}
