/**
 * The new look's characters (docs/decisions/new-look-characters.md): which frame of a character's sheet to show. A
 * sheet (scripts/charprep.py) has three rows, facing you, side-on facing right, walking away, and seven columns: idle,
 * a four-frame walk, the attack drawn back, the attack through. The row comes from the facing as the camera sees it
 * (the chase camera's swing turns it); the column from the pose code's phase (heropose.ts, foepose.ts), so the frames
 * keep the room's timing. Pure.
 */

export const ROW = { front: 0, side: 1, back: 2 } as const;
export const COL = { idle: 0, walk: 1, draw: 5, strike: 6 } as const;
/** Walk frames a second (actors.ts walks the flat figures at 9 too). */
export const CADENCE = 9;

/** The row for a facing (room: +x east, +y south) seen by a camera swung `yaw` from north; `flip` mirrors the side row to face left. */
export function rowFor(fx: number, fy: number, yaw: number, out: { row: number; flip: boolean }): { row: number; flip: boolean } {
  const c = Math.cos(yaw), s = Math.sin(yaw), sx = fx * c + fy * s, sy = -fx * s + fy * c;
  out.row = sy > 0.5 ? ROW.front : sy < -0.5 ? ROW.back : ROW.side;
  out.flip = out.row === ROW.side && sx < 0;
  return out;
}

/** The column for a pose phase (motion.ts): drawn back through the windup and the charge, through on the blow and for
 *  the first half of the recovery, walking when moving at rest, else standing. */
export function colFor(phase: string, k: number, moving: boolean, now: number): number {
  if (phase === 'windup' || phase === 'charge') return COL.draw;
  if (phase === 'release' || phase === 'contact') return COL.strike;
  if (phase === 'recover') return k < 0.5 ? COL.strike : COL.idle;
  if (moving && phase === 'rest') return COL.walk + (Math.floor(now * CADENCE) % 4);
  return COL.idle;
}
