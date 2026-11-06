/**
 * Halvard's anvil, close: the forge's mouth behind it banked and glowing, the anvil's horn and face, the
 * piece laid on it in Halvard's tongs (his sleeve and his hand from the left), and your hammer from the
 * right, up and waiting or coming down. The piece glows up and fades exactly as the rules have it
 * (shared/forgestrike.ts `glowAt`), dull red to near white, so the brightest you see is the moment that's
 * judged. Sparks off a strike; notches up top for the strikes made. Lit by the forge's fire.
 */
import { glowAt, STRIKE, type StrikeMark, type StrikeState } from '../shared/forgestrike';
import { drawText } from './pixfont';
import { ANVILW } from './pastimewords';
import { PastimeCanvas, dith, dot } from './pastimecanvas';

const FACE = { x: 34, y: 112, w: 50 } as const, PIECE = { x: 44, y: 108, w: 30 } as const;
/** The steel's colour by how bright it is. */
const HEAT = ['#3a1a14', '#6a2418', '#a83a1e', '#d8602a', '#f0a040', '#ffd27a', '#fff4d0'];
const MARK: Record<StrikeMark, string> = { clean: ANVILW.clean, fair: ANVILW.fair, cold: ANVILW.cold };
const MARK_COL: Record<StrikeMark, string> = { clean: '#ffd27a', fair: '#e8e0d0', cold: '#8a8478' };

export class AnvilView extends PastimeCanvas {
  constructor(private skin: string) {
    super();
    this.indoor = [0.36, 0.27, 0.25];
  }

  protected paintLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.lw;
    c.height = this.lh;
    const g = c.getContext('2d')!, oy = this.oy, ox = this.ox;
    // Soot-black stone behind, the forge's arch and its banked coals up the screen.
    for (let y = 0; y < this.lh; y++) for (let x = 0; x < this.lw; x++) {
      const fy = y - oy, row = Math.floor((fy + 400) / 7), brick = (x - ox + (row % 2) * 6 + 400) % 12 === 0 || (fy + 400) % 7 === 0;
      dot(g, x, y, 1, 1, fy > 120 ? (dith(x, y, 0.35) ? '#2a2420' : '#332c26') : brick ? '#16121a' : dith(x, y, 0.5) ? '#24202a' : '#2c2830');
    }
    dot(g, ox + 22, oy + 22, 76, 44, '#100c0c');
    for (let i = 0; i < 76; i++) dot(g, ox + 22 + i, oy + 22 - Math.round(Math.sin((i / 76) * Math.PI) * 10), 1, 10, '#3a3238');
    // The anvil: its face, horn to the left, waist and foot on the stump.
    dot(g, ox + FACE.x, oy + FACE.y, FACE.w, 6, '#5a5660'), dot(g, ox + FACE.x, oy + FACE.y, FACE.w, 1, '#8a8494');
    for (let i = 0; i < 14; i++) dot(g, ox + FACE.x - 14 + i, oy + FACE.y + 1 + Math.round((14 - i) / 6), 1, Math.max(1, 4 - Math.round((14 - i) / 5)), '#5a5660');
    dot(g, ox + FACE.x + 12, oy + FACE.y + 6, 26, 10, '#3a3640'), dot(g, ox + FACE.x + 6, oy + FACE.y + 16, 38, 6, '#4a4652');
    dot(g, ox + FACE.x + 2, oy + FACE.y + 22, 46, 18, '#4a3420'), dot(g, ox + FACE.x + 2, oy + FACE.y + 22, 46, 2, '#5a3d22');
    return c;
  }

  render(s: StrikeState, now: number, swing: number, last: { mark: StrikeMark; t0: number } | null): void {
    this.begin();
    const { lit, glow } = this, b = glowAt(s), heat = HEAT[Math.min(HEAT.length - 1, Math.round(b * (HEAT.length - 1)))];
    // The coals in the forge's mouth, breathing.
    for (let i = 0; i < 18; i++) dot(glow, 26 + i * 4, 58 - (i * 7) % 5, 3, 2, (Math.floor(now * 3 + i) % 3) ? '#a83a1e' : '#f0a040');
    // Halvard's tongs and the piece in them.
    dot(lit, 2, PIECE.y - 6, 22, 7, '#3a3440'), dot(lit, 20, PIECE.y - 4, 5, 4, '#c89070');
    dot(lit, 24, PIECE.y - 2, PIECE.x - 22, 1, '#2a2630'), dot(lit, 24, PIECE.y + 1, PIECE.x - 22, 1, '#2a2630');
    dot(glow, PIECE.x, PIECE.y, PIECE.w, 3, heat), dot(glow, PIECE.x + 2, PIECE.y, PIECE.w - 6, 1, b > 0.7 ? '#ffffff' : heat);
    // Your hammer: up and waiting, or coming down (swing 1 just struck, easing back up).
    const hy = PIECE.y - 6 - Math.round((1 - swing) * 34), hx = PIECE.x + PIECE.w / 2 + 6;
    dot(lit, hx + 4, hy + 2, 30, 3, '#6a4a2a'), dot(lit, hx - 4, hy - 3, 10, 9, '#5a5660'), dot(lit, hx - 4, hy - 3, 10, 2, '#9a94a0');
    dot(lit, hx + 20, hy, 6, 6, this.skin), dot(lit, hx + 22, hy + 6, 10, 20, '#4a4048');
    if (last && now - last.t0 < 0.45) this.sparks(PIECE.x + PIECE.w / 2, PIECE.y, now - last.t0, last.mark);
    if (last && now - last.t0 < 1) drawText(glow, MARK[last.mark], 60 - MARK[last.mark].length * 2, 90 - Math.round((now - last.t0) * 8), MARK_COL[last.mark]);
    for (let i = 0; i < STRIKE.strikes; i++) {
      const m = s.struck[i]?.mark;
      dot(glow, 48 + i * 9, 14, 6, 3, m ? MARK_COL[m] : '#3a3238');
    }
    this.finish([[60, 50, 140, 1.2 + Math.sin(now * 5) * 0.05, [1, 0.5, 0.25]], [PIECE.x + PIECE.w / 2, PIECE.y, 30 + b * 50, 0.3 + b * 0.9, [1, 0.6 + b * 0.3, 0.3 + b * 0.3]]]);
  }

  private sparks(x: number, y: number, k: number, mark: StrikeMark): void {
    const n = mark === 'clean' ? 12 : mark === 'fair' ? 7 : 3;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.05 + (i / n) * 0.9), d = 6 + k * (40 + (i % 3) * 12);
      dot(this.glow, x + Math.cos(a) * d, y + Math.sin(a) * d + k * k * 60, 1, 1, i % 2 ? '#ffd27a' : '#ffffff');
    }
  }
}

