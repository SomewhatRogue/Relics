/**
 * The Drowned Rat's knife board from the chalk line: the back wall's planks with the board pegged on
 * them (a round of elm, its rings painted on: the bull gold, then red, bone, dark, bone), the knives that
 * have stuck in it this round, a chalked tally beside it, the sawdust floor, and your hand at the foot
 * with the next knife up. The point's sway is drawn where the rules have it (shared/knives.ts `aimAt`),
 * so where the little cross is when you throw is where the knife goes, give or take its wobble. Lit by
 * the lamps either side of the board at the town's hour (pastimecanvas.ts).
 */
import { KNIVES } from '../shared/knifetune';
import { aimAt, ready, type KnifeState } from '../shared/knives';
import { drawText } from './pixfont';
import { PastimeCanvas, dith, dot } from './pastimecanvas';

export interface KnifeSay { s: string; x: number; y: number; col: string; t0: number }
const RINGS = ['#d8a83a', '#9a2a22', '#d8d0bc', '#3a2a1c', '#d8d0bc'];
const [BX, BY] = KNIVES.board, [HX, HY] = KNIVES.hand;
const LAMPS: [number, number][] = [[18, 40], [102, 40]];

export class KnifeView extends PastimeCanvas {
  constructor(private skin: string) {
    super();
    this.indoor = [0.32, 0.24, 0.2];
  }

  protected paintLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.lw;
    c.height = this.lh;
    const g = c.getContext('2d')!, oy = this.oy, ox = this.ox;
    // The back wall's planks, darker toward the corners; the floor's sawdust from a little below the board.
    for (let y = 0; y < this.lh; y++) for (let x = 0; x < this.lw; x++) {
      const fy = y - oy, wall = fy < 112, edge = Math.min(1, Math.abs(x - ox - 60) / 70);
      if (wall) dot(g, x, y, 1, 1, (x - ox + 400) % 11 === 0 ? '#1e1610' : dith(x, y, edge * 0.8) ? '#2a1e14' : '#3a2a1c');
      else dot(g, x, y, 1, 1, dith(x, y, 0.3) ? '#5a4a34' : (x * 7 + y * 3) % 17 === 0 ? '#7a6a4a' : '#4a3c2a');
    }
    dot(g, 0, oy + 112, this.lw, 2, '#2a1d12');
    // The chalk line on the floor.
    for (let x = ox + 20; x < ox + 100; x += 3) dot(g, x, oy + 150, 2, 1, '#c8c0b0');
    // The board: a round of elm, its rings, its peg; the chalked tally to its right.
    const R = KNIVES.r;
    dot(g, ox + BX - 1, oy + BY - R - 4, 2, 4, '#2a1d12');
    for (let dy = -R - 2; dy <= R + 2; dy++) for (let dx = -R - 2; dx <= R + 2; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 2) continue;
      const ring = Math.min(4, Math.floor((d / R) * 5)), chip = ((dx * 31 + dy * 17) & 31) === 0;
      dot(g, ox + BX + dx, oy + BY + dy, 1, 1, d > R ? '#4a3420' : d > R - 0.8 ? '#2a1d12' : chip ? '#6a5034' : RINGS[ring]);
    }
    for (let i = 0; i < 6; i++) dot(g, ox + BX + R + 10, oy + BY - 12 + i * 3, 5, 1, '#c8c0b0');
    for (const [x, y] of LAMPS) dot(g, ox + x - 1, oy + y, 3, 6, '#4a3a2a'), dot(g, ox + x - 2, oy + y + 6, 5, 1, '#2a1d12');
    return c;
  }

  render(s: KnifeState, says: KnifeSay[], now: number, big: boolean): void {
    this.begin();
    const { lit, glow } = this;
    for (const [x, y] of LAMPS) dot(glow, x - 1, y - 3, 3, 3, Math.floor(now * 7 + x) % 2 ? '#ffd27a' : '#ffb84a');
    for (const k of s.stuck) this.stuckKnife(BX + k.x, BY + k.y);
    for (const f of s.flights) {
      const k = 1 - Math.max(0, f.land - s.t) / KNIVES.fly, x = HX + (BX + f.x - HX) * k, y = HY - 12 + (BY + f.y - HY + 12) * k;
      for (let i = 0; i < 3; i++) dot(glow, x, y + i, 1, 1, i === 0 ? '#ffffff' : '#b8bcc8');
    }
    this.hand(s, now);
    if (ready(s)) this.sight(s, big);
    for (let i = 0; i < KNIVES.knives - s.thrown - (ready(s) ? 1 : 0); i++) dot(lit, 6 + i * 4, 170, 1, 6, '#9aa3ad'), dot(lit, 6 + i * 4, 174, 1, 3, '#3a2818');
    for (const w of says) drawText(glow, w.s, Math.round(w.x - w.s.length * 2), Math.round(w.y - 10 - (now - w.t0) * 10), w.col);
    this.finish([...LAMPS.map(([x, y]): [number, number, number, number, [number, number, number]] => [x, y - 2, 80, 0.9 * (1 + Math.sin(now * 8 + x) * 0.05), [1, 0.62, 0.3]]), [HX, HY - 10, 70, 0.75, [1, 0.7, 0.45]]]);
  }

  /** A knife in the board, its handle out toward you. */
  private stuckKnife(x: number, y: number): void {
    dot(this.lit, x, y, 1, 1, '#9aa3ad'), dot(this.lit, x, y + 1, 1, 3, '#3a2818'), dot(this.lit, x, y + 4, 1, 1, '#5a3d22');
  }

  /** Your hand at the foot, the knife up by the ear while it's in hand, and down after a throw. */
  private hand(s: KnifeState, now: number): void {
    const up = ready(s), y = HY + (up ? 0 : 4) + Math.round(Math.sin(now * 2.1) * 0.6), { lit } = this;
    for (let i = 0; i < 14; i++) dot(lit, HX + 6 + Math.round(i * 0.15), y + i, 4, 1, i < 8 ? '#4a4048' : '#3a3440');
    dot(lit, HX + 5, y - 3, 5, 4, this.skin);
    if (up) for (let i = 0; i < 7; i++) dot(lit, HX + 7, y - 4 - i, 1, 1, i < 3 ? '#3a2818' : i === 6 ? '#ffffff' : '#c8d0d8');
  }

  /** Where the point would go now: a small cross on the board. */
  private sight(s: KnifeState, big: boolean): void {
    const [ax, ay] = aimAt(s), x = Math.round(BX + ax), y = Math.round(BY + ay), arm = big ? 3 : 2, g = this.glow, col = '#ffd27a';
    dot(g, x - 2 - arm, y, arm, 1, col), dot(g, x + 3, y, arm, 1, col), dot(g, x, y - 2 - arm, 1, arm, col), dot(g, x, y + 3, 1, arm, col);
    dot(g, x, y, 1, 1, '#ffffff');
  }
}
