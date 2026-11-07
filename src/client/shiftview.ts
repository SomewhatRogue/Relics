/**
 * A shift at Halvard's anvil drawn: the anvil's own scene (anvilview.ts: the forge, Halvard's tongs, your
 * hammer, the sparks and the strike's word), with the piece he's holding drawn as what it is (a nail, a
 * horseshoe, a hinge, a blade blank) and glowing exactly as the rules say (shared/forgeshift.ts
 * `shiftGlow`). Up top, a notch for each strike the piece wants and its name; under it the streak; a
 * finished piece's points rise off the anvil, a spoiled one's word in red.
 */
import { shiftGlow, type ShiftState } from '../shared/forgeshift';
import type { PieceKind } from '../shared/shifttune';
import type { StrikeMark } from '../shared/forgestrike';
import { drawText, textWidth } from './pixfont';
import { AnvilView } from './anvilview';
import { dot } from './pastimecanvas';
import { SHIFTW } from './shiftwords';

type Shape = (g: CanvasRenderingContext2D, x: number, y: number, heat: string, hot: boolean) => void;
const HOT = '#ffffff';
/** Each piece, laid on the anvil's face at (x, y), the end in the tongs at the left. */
const SHAPES: Record<PieceKind, Shape> = {
  nail: (g, x, y, h, hot) => (dot(g, x, y - 1, 2, 5, h), dot(g, x + 2, y + 1, 14, 2, h), dot(g, x + 16, y + 1, 2, 1, h), hot && dot(g, x + 3, y + 1, 10, 1, HOT)),
  shoe: (g, x, y, h, hot) => {
    // Its two arms out from the tongs and the round toe at the right, nail holes dark along it.
    dot(g, x, y - 2, 20, 2, h), dot(g, x, y + 2, 20, 2, h), dot(g, x + 20, y - 1, 2, 4, h), dot(g, x + 19, y - 2, 1, 6, h);
    for (let i = 0; i < 3; i++) dot(g, x + 6 + i * 5, y - 2, 1, 1, '#3a1a14'), dot(g, x + 6 + i * 5, y + 3, 1, 1, '#3a1a14');
    if (hot) dot(g, x + 3, y - 2, 14, 1, HOT), dot(g, x + 3, y + 2, 14, 1, HOT);
  },
  hinge: (g, x, y, h, hot) => {
    // Two leaves and the knuckle between them.
    dot(g, x, y - 1, 11, 4, h), dot(g, x + 11, y - 3, 4, 7, h), dot(g, x + 15, y - 1, 11, 4, h);
    dot(g, x + 4, y, 1, 1, '#3a1a14'), dot(g, x + 21, y, 1, 1, '#3a1a14');
    if (hot) dot(g, x + 12, y - 2, 2, 5, HOT), dot(g, x + 2, y - 1, 7, 1, HOT), dot(g, x + 17, y - 1, 7, 1, HOT);
  },
  blank: (g, x, y, h, hot) => {
    // The tang in the tongs, the long blade, tapering to its point.
    dot(g, x, y, 6, 2, h), dot(g, x + 6, y - 1, 30, 4, h), dot(g, x + 36, y, 3, 2, h), dot(g, x + 39, y + 1, 2, 1, h);
    if (hot) dot(g, x + 8, y, 26, 1, HOT);
  },
};

export interface ShiftSay { s: string; col: string; t0: number }

export class ShiftView extends AnvilView {
  draw(s: ShiftState, now: number, swing: number, last: { mark: StrikeMark; t0: number } | null, says: ShiftSay[]): void {
    const b = shiftGlow(s), p = s.piece;
    const notches = p ? Array.from({ length: p.need }, (_, i) => p.marks.filter((m) => m !== 'cold')[i]) : [];
    this.paint(b, now, swing, last, notches, p ? SHAPES[p.kind] : () => {});
    const g = this.glow, mid = (w: string) => Math.round(60 - (textWidth(w) + 1) / 2);
    if (p) drawText(g, SHIFTW.names[p.kind], mid(SHIFTW.names[p.kind]), 22, '#c8bca8');
    if (s.streak >= 2) {
      const w = SHIFTW.streak(s.streak);
      drawText(g, w, mid(w), 32, s.streak > 5 ? '#ffd27a' : '#e8e0d0');
    }
    for (const w of says) drawText(g, w.s, mid(w.s), 78 - Math.round((now - w.t0) * 14), w.col);
    this.finishScene(b, now);
  }
}
