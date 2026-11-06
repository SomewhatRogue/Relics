/**
 * Words over a hero that are meant to be read (a scene on the way, a job done), laid out so they never
 * cross: a long one is broken into lines that fit an upright phone, and one said while another is still
 * up goes above it instead of on top of it (Hempen's "There's rope on every branch..." came in over
 * "HEMPEN DONE" and ran off both sides of the phone). Drawn the same in both views. Drawing only.
 */
import { drawText, textWidth } from './pixfont';

/** Letters a line at most: 34 is 135 pixels, inside the 195 an upright phone's scene is across (390 at 3x, scaled by 6: Scene.resize; a laptop's is about 360). */
export const LINE_CHARS = 34;
/** Pixels from one line's top to the next (the letters are 5 tall, with a pixel of outline each side). */
export const LINE_H = 7;
/** Words up at least this long (seconds) are to be read, so they stack; quick calls and numbers don't. */
export const READ_LIFE = 1.5;
/** How fast those rise (pixels a second): all at one pace, so none catches up the one stacked above it. */
export const READ_RISE = 4.8;

/** `s` broken at spaces into lines of at most `max` letters (a word longer than that stands alone). */
export function wrapLine(s: string, max = LINE_CHARS): string[] {
  if (s.length <= max) return [s];
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    if (cur && cur.length + 1 + w.length > max) out.push(cur), (cur = w);
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** A block of words on screen: its middle `x`, its top `y`, its lines. */
export interface SayBlock { x: number; y: number; lines: string[] }
const widthOf = (b: SayBlock) => Math.max(...b.lines.map(textWidth));

/** Do two blocks cross (with a pixel or two between)? */
export function crosses(a: SayBlock, b: SayBlock): boolean {
  const aw = widthOf(a) / 2 + 2, bw = widthOf(b) / 2 + 2;
  if (Math.abs(a.x - b.x) >= aw + bw) return false;
  return a.y < b.y + b.lines.length * LINE_H + 1 && b.y < a.y + a.lines.length * LINE_H + 1;
}

/** The top for `block` so it crosses none of `up`: where it was asked for, or lifted above the ones in its way. */
export function clearTop(block: SayBlock, up: readonly SayBlock[]): number {
  const b = { ...block };
  for (let guard = 0; guard < 12; guard++) {
    const hit = up.find((o) => crosses(b, o));
    if (!hit) break;
    b.y = hit.y - b.lines.length * LINE_H - 1;
  }
  return b.y;
}

/** Draw a block centred on `x` with its top at `y`, kept inside the `w` pixels across the view. */
export function drawBlock(g: CanvasRenderingContext2D, lines: readonly string[], x: number, y: number, col: string, w: number): void {
  lines.forEach((s, i) => {
    const tw = textWidth(s), left = Math.min(Math.max(2, Math.round(x - tw / 2)), Math.max(2, w - tw - 2));
    drawText(g, s, left, Math.round(y) + i * LINE_H, col);
  });
}
