/**
 * The archery butts from the shooting line: you from behind at the foot of the screen with the range's
 * bow, the mown range running up the screen in three lanes to the lodge's back wall, a turf bank behind
 * each lane and a beam over it for the swinging ones. Targets are straw bosses with painted rings (gold,
 * red, blue, black, white), drawn from the same numbers the rules judge (shared/range.ts): they come up,
 * stand, slide along a rail or swing on a rope, and drop when hit or when their time's up, with the
 * arrows that hit them stuck in. The sight wanders as the rules say it does.
 */
import { LANES, RANGE } from '../shared/rangetune';
import { sway, targetAt, upness, type RangeState, type Target } from '../shared/range';
import type { Hero } from '../sim/types';
import { drawHero } from './actors';
import { drawText } from './pixfont';
import { FW, PastimeCanvas, dith, dot } from './pastimecanvas';

export interface RangeSay { s: string; x: number; y: number; col: string; t0: number }
const RINGS = ['#ffd23a', '#d83a2a', '#3a6ad8', '#2a2a30', '#e8e4d8'];
const [AX, AY] = RANGE.archer, BOW: [number, number] = [AX + 2, AY - 16];
const TORCHES: [number, number][] = [[6, 26], [114, 26]];

export class RangeView extends PastimeCanvas {
  constructor(private hero: Hero) {
    super();
  }

  protected paintLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.lw;
    c.height = this.lh;
    const g = c.getContext('2d')!, oy = this.oy;
    // The mown range: stripes across, darker in steps toward the back.
    for (let y = 0; y < this.lh; y++) for (let x = 0; x < this.lw; x++) {
      const fy = y - oy, stripe = Math.floor((fy + 400) / 9) % 2, back = Math.min(1, Math.max(0, (90 - fy) / 90));
      g.fillStyle = dith(x, y, back * 0.8) ? (stripe ? '#2a3a20' : '#2e4022') : stripe ? '#3a5028' : '#40582c';
      g.fillRect(x, y, 1, 1);
    }
    // The lodge's back wall across the top: planks on a stone footing, its thatch above, pelts hung out.
    const eave = Math.max(0, oy - 14);
    for (let y = 0; y < eave; y++) for (let x = 0; x < this.lw; x++) g.fillStyle = (x + y * 2) % 6 < 2 ? '#5a4626' : (x - y) % 9 === 0 ? '#3a2c18' : '#6a5430', g.fillRect(x, y, 1, 1);
    dot(g, 0, eave, this.lw, 2, '#2a1e12');
    dot(g, 0, eave + 2, this.lw, oy + 22 - eave, '#3a2a1c');
    for (let x = 0; x < this.lw; x += 5) dot(g, x, eave + 2, 1, oy + 22 - eave, '#2a1e14');
    for (const px of [this.ox + 22, this.ox + 84]) dot(g, px, eave + 6, 12, 9, '#7a5a3a'), dot(g, px + 2, eave + 15, 8, 2, '#6a4a2a');
    dot(g, this.ox + 54, eave + 5, 12, oy + 17 - eave, '#22180e');
    dot(g, 0, oy + 24, this.lw, 6, '#4a4c54');
    for (let x = 0; x < this.lw; x += 7) dot(g, x, oy + 24, 1, 6, '#34363c');
    // A turf bank behind each lane, a beam over it on two posts, a chalk line in front.
    for (const L of LANES) {
      const y = oy + L.y, top = y - L.hang - 2;
      for (let x = 0; x < this.lw; x++) for (let k = 0; k < Math.round(10 * L.k); k++) if (dith(x, y - k - 2, 1 - k / (10 * L.k))) dot(g, x, y - k - Math.round(L.r * 0.6), 1, 1, '#4a3a24');
      dot(g, 0, top, this.lw, Math.max(1, Math.round(2 * L.k)), '#5a4028');
      dot(g, this.ox + 4, top, 2, L.hang + 6, '#4a3420'), dot(g, this.ox + FW - 6, top, 2, L.hang + 6, '#4a3420');
      for (let x = 0; x < this.lw; x += 3) dot(g, x, y + Math.round(L.r + 3 * L.k), 2, 1, '#9a9a80');
    }
    for (const [x, y] of TORCHES) dot(g, this.ox + x, oy + y, 1, 8, '#4a3a2a');
    return c;
  }

  render(s: RangeState, aim: [number, number], says: RangeSay[], now: number, big: boolean): void {
    this.begin();
    const { lit, glow } = this;
    for (const [x, y] of TORCHES) dot(glow, x - 1, y - 2, 3, 2, Math.floor(now * 7 + x) % 2 ? '#ffd27a' : '#ffb84a');
    // Far lanes first, so the near ones stand in front.
    for (const g of [...s.targets].sort((a, b) => a.lane - b.lane)) this.target(s, g, now);
    for (const a of s.stuck) if (a.target < 0) this.arrow(lit, a.x, a.y, 0.6);
    for (const f of s.flights) {
      const k = 1 - Math.max(0, f.land - s.t) / RANGE.fly, x = BOW[0] + (f.x - BOW[0]) * k, y = BOW[1] + (f.y - BOW[1]) * k - Math.sin(k * Math.PI) * 6;
      dot(glow, x, y, 1, 2, '#e8e0d0');
    }
    drawHero({ lit, glow, now, t: now }, { ...this.hero, id: 'pastime-view', noHound: true, fx: 0, fy: -1, act: 'idle', actT: 0, moving: false, blocking: false, hound: null }, AX, AY, 'bare', now);
    this.bow(s, aim);
    this.sight(s, aim, big);
    for (const w of says) {
      const k = now - w.t0;
      drawText(glow, w.s, Math.round(w.x - w.s.length * 2), Math.round(w.y - 8 - k * 10), w.col);
    }
    this.finish([...TORCHES.map(([x, y]): [number, number, number, number, [number, number, number]] => [x, y - 2, 90, 0.9 * (1 + Math.sin(now * 8 + x) * 0.05), [1, 0.62, 0.3]]), [AX, AY - 30, 80, 0.5, [1, 0.7, 0.4]]]);
  }

  /** A straw boss and its rings (squashed while it comes up or goes down), its stand, rail or rope, its arrows. */
  private target(s: RangeState, g: Target, now: number): void {
    const L = LANES[g.lane], [x, y] = targetAt(g, s.t), up = upness(g, s.t), r = L.r, { lit } = this;
    if (up <= 0) return;
    if (g.kind === 'swing') {
      const px = g.cx, py = L.y - L.hang;
      for (let i = 0; i <= 12; i++) dot(lit, px + ((x - px) * i) / 12, py + ((y - r * up - py) * i) / 12, 1, 1, '#a8946a');
    } else if (g.kind === 'slide') {
      dot(lit, g.cx - g.amp - r, L.y + r + 1, g.amp * 2 + r * 2, 1, '#6a5030');
      dot(lit, x - 2, y + r * up, 4, 2, '#4a3420');
    } else {
      dot(lit, x - Math.round(r * 0.6), y + r * up - 1, 1, Math.round(r * 0.8) + 2, '#5a4028');
      dot(lit, x + Math.round(r * 0.6), y + r * up - 1, 1, Math.round(r * 0.8) + 2, '#5a4028');
    }
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      const ring = Math.min(4, Math.floor((d / r) * 5));
      dot(lit, x + dx, y + dy * up, 1, 1, d > r - 0.7 ? '#8a7a4a' : RINGS[ring]);
    }
    if (g.hit && Math.floor(now * 12) % 2) dot(this.glow, x - 1, y - 1, 3, 3, '#ffffff');
    for (const a of s.stuck) if (a.target === g.id) this.arrow(lit, x + a.x, y + a.y * up, L.k);
  }

  /** An arrow stuck in, seen from behind: the shaft's end and its fletching. */
  private arrow(g: CanvasRenderingContext2D, x: number, y: number, k: number): void {
    dot(g, x, y, 1, 1, '#d8c48a');
    dot(g, x, y + 1, 1, Math.max(1, Math.round(2 * k)), '#e8e0d0');
    if (k > 0.7) dot(g, x - 1, y + 1, 1, 1, '#c84a3a'), dot(g, x + 1, y + 1, 1, 1, '#c84a3a');
  }

  /** The range's bow, held up ahead of you, the arrow on it pointing at the sight while it's nocked. */
  private bow(s: RangeState, [ax, ay]: [number, number]): void {
    const { lit } = this, ready = s.t >= s.nockAt;
    for (let i = -7; i <= 7; i++) dot(lit, BOW[0] - Math.round(2 - (i * i) / 25), BOW[1] + i, 1, 1, '#8a5a30');
    dot(lit, BOW[0] + 1, BOW[1] - 7, 1, 15, '#c8c0b0');
    if (!ready) return;
    const dx = ax - BOW[0], dy = ay - BOW[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
    for (let i = 0; i < 6; i++) dot(lit, BOW[0] + (dx / d) * i, BOW[1] + 4 + (dy / d) * i, 1, 1, i === 5 ? '#b8bcc8' : '#d8c48a');
  }

  /** The sight where the arrow would go (the aim and the wander): a cross, gold once the next arrow's nocked. */
  private sight(s: RangeState, [ax, ay]: [number, number], big: boolean): void {
    if (s.over) return;
    const [wx, wy] = sway(s, s.t), x = Math.round(ax + wx), y = Math.round(ay + wy), col = s.t >= s.nockAt ? '#ffd27a' : '#8a8478', arm = big ? 3 : 2, gap = 2;
    const g = this.glow;
    dot(g, x - gap - arm, y, arm, 1, col), dot(g, x + gap + 1, y, arm, 1, col), dot(g, x, y - gap - arm, 1, arm, col), dot(g, x, y + gap + 1, 1, arm, col);
    dot(g, x, y, 1, 1, '#ffffff');
  }
}
