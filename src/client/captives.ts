/**
 * The caged, drawn so you know them: someone in a cage waves and calls out when you're near (a
 * glowing mark over the cage says it's someone to save), and once the cage breaks they don't just
 * vanish: they stand up where it was, say their thanks, and stay there till you move on.
 * Drawing only; the room decides who's freed.
 */
import { SPRITES } from './sprites';
import { blit, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';

/** What the caged call out (lore keeper and line editor), and what the freed say. */
export const BEG = ['Please! Over here!', "Don't leave us in here!", "They'll be back. Please!"];
export const THANKS = ['Lantern keep you.', 'Thank you. Thank you.', "I can walk, I can, I'll keep up."];

interface Freed { x: number; y: number; at: number; line: string }

export class Captives {
  private freed = new Map<object, Freed[]>();

  /** A cage broke in this room. */
  free(room: object, x: number, y: number, now: number): void {
    const list = this.freed.get(room) ?? (this.freed.set(room, []), this.freed.get(room)!);
    list.push({ x, y, at: now, line: THANKS[list.length % THANKS.length] });
  }

  /** Over a cage: the mark, and their call when you're close. */
  caged(c: Ctx, x: number, y: number, now: number, near: boolean, k: number): void {
    const bob = Math.round(Math.sin(now * 5 + k) * 1.5);
    c.glow.fillStyle = '#ffe070';
    c.glow.fillRect(Math.round(x), Math.round(y - 26 + bob), 2, 5);
    c.glow.fillRect(Math.round(x), Math.round(y - 19 + bob), 2, 2);
    // An arm out through the bars, waving.
    c.lit.fillStyle = '#c79c78';
    c.lit.fillRect(Math.round(x + 7), Math.round(y - 8 - (Math.floor(now * 4 + k) % 2)), 3, 1);
    if (!near || (now + k) % 4 > 2.6) return;
    const s = BEG[Math.floor((now + k) / 4) % BEG.length];
    drawText(c.glow, s, Math.round(x - textWidth(s) / 2), Math.round(y - 36), '#f0e0b0');
  }

  /** The freed of this room, where their cages were. */
  each(room: object, f: (x: number, y: number, draw: (c: Ctx, sx: number, sy: number, now: number) => void) => void): void {
    for (const p of this.freed.get(room) ?? []) {
      f(p.x, p.y, (c, sx, sy, now) => {
        const t = now - p.at, up = t < 1.5 && Math.floor(t * 6) % 2 === 0 ? -1 : 0;
        blit(c, SPRITES.survivor, sx, sy + 2 + up);
        if (t < 1.2) (c.lit.fillStyle = '#c79c78'), c.lit.fillRect(Math.round(sx - 4), Math.round(sy - 11 + up), 1, 3), c.lit.fillRect(Math.round(sx + 3), Math.round(sy - 11 + up), 1, 3);
        if (t < 3.5) drawText(c.glow, p.line, Math.round(sx - textWidth(p.line) / 2), Math.round(sy - 22), '#c8f0c0');
      });
    }
  }
}
