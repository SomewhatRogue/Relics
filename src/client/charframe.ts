/**
 * The new look's characters (docs/decisions/new-look-characters.md): which frame of a character's kit to show. A kit
 * (scripts/charprep.py, three/charkit/chars.json) has, for each facing (side-on facing right, walking away, facing
 * you), the same named rows: a walk of eight frames, then the attacks of five (drawn back, halfway, through, drawing
 * back, guard), then a row of reactions. The facing comes from the camera (the chase camera's swing turns it); the
 * frame from the pose code's phase (heropose.ts, foepose.ts), so the room's timing is kept to the frame; the walk
 * from the ground covered, so the feet don't slide. Pure.
 */

export type Facing = 'side' | 'back' | 'front';
export interface KitMeta { w: number; h: number; fx: number; fy: number; tall: number; facings: string[]; rows: [string, number][] }
export interface Shown { row: string; col: number }

/** The facing for a direction (room: +x east, +y south) seen by a camera swung `yaw` from north; `flip` mirrors the side-on frames to face left. */
export function facingFor(fx: number, fy: number, yaw: number, out: { facing: Facing; flip: boolean }): { facing: Facing; flip: boolean } {
  const c = Math.cos(yaw), s = Math.sin(yaw), sx = fx * c + fy * s, sy = -fx * s + fy * c;
  out.facing = sy > 0.5 ? 'front' : sy < -0.5 ? 'back' : 'side';
  out.flip = out.facing === 'side' && sx < 0;
  return out;
}

/** The kit's grid row for a facing's named row. */
export function rowOf(m: KitMeta, facing: Facing, row: string): number {
  return m.facings.indexOf(facing) * m.rows.length + Math.max(0, m.rows.findIndex((r) => r[0] === row));
}

/** A blow by its phase. Seven frames (raise, cocked, halfway, through, follow-through, recovering, guard): pulled
 *  back over the windup (a tenth of a second for the sword, so two frames), halfway then through as it snaps out,
 *  held through on the hit, then carried on, drawn back and to guard over the recovery. Five frames (cocked, halfway,
 *  through, recovering, guard): the same without the raise and the follow-through. */
export function blowCol(phase: string, k: number, n = 5): number {
  const seven = n >= 7;
  if (phase === 'windup' || phase === 'charge') return seven ? (k < 0.4 && phase === 'windup' ? 0 : 1) : 0;
  const o = seven ? 1 : 0;
  if (phase === 'release') return o + (k < 0.4 ? 1 : 2);
  if (phase === 'contact') return o + 2;
  if (phase === 'recover') return seven ? (k < 0.22 ? 4 : k < 0.6 ? 5 : 6) : k < 0.3 ? 2 : k < 0.65 ? 3 : 4;
  return n - 1;
}

/** How many frames a kit's blows have. */
export const blowFrames = (m: KitMeta): number => m.rows[1][1];

/** The walk's frame for the ground covered (`cycle`: tiles a full stride of both feet takes). */
export function walkCol(dist: number, cycle: number): number {
  return Math.floor(((dist / cycle) % 1) * 8) % 8;
}

/** What the knight (a Warrior with the sword and shield) shows. */
export function knightShows(o: { act: string; heavy: boolean; combo: number; blocking: boolean; phase: string; k: number; moving: boolean; walk: number }, out: Shown, n = 5): Shown {
  if (o.act === 'attack' && o.heavy) return set(out, 'misc', o.phase === 'windup' ? 0 : o.phase === 'recover' && o.k > 0.5 ? 2 : 1);
  if (o.act === 'charge') return set(out, 'misc', 0);
  if (o.act === 'attack') return set(out, 'slash' + Math.min(3, o.combo + 1), blowCol(o.phase, o.k, n));
  if (o.act === 'hurt') return set(out, 'misc', o.phase === 'hit' ? 4 : 5);
  if (o.act === 'stun') return set(out, 'misc', 5);
  if (o.blocking) return set(out, 'misc', 3);
  if (o.moving || o.act === 'roll') return set(out, 'walk', o.walk);
  return set(out, 'slash1', n - 1);
}

/** What the knife goblin shows; `dead`: seconds since it died, or -1. */
export function goblinShows(o: { attack: string; phase: string; k: number; moving: boolean; walk: number; dead: number }, out: Shown): Shown {
  if (o.dead >= 0) return set(out, 'misc', o.dead < 0.12 ? 3 : o.dead < 0.26 ? 4 : 5);
  if (o.phase === 'hit' || o.phase === 'stagger') return set(out, 'misc', o.phase === 'hit' || o.k < 0.5 ? 0 : 1);
  if (o.phase === 'stun' || o.phase === 'tumble') return set(out, 'misc', 2);
  if (o.attack) return set(out, o.attack === 'stab' ? 'stab' : o.attack === 'pounce' || o.attack === 'charge' ? 'lunge' : 'slash', blowCol(o.phase, o.k));
  if (o.moving) return set(out, 'walk', o.walk);
  return set(out, 'stab', 4);
}

const set = (o: Shown, row: string, col: number) => ((o.row = row), (o.col = col), o);
