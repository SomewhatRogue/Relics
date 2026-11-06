/**
 * A bout at the Drowned Rat's table, from your side of it: the regular across the table (head, shoulders
 * and a face that strains as you push), the scrubbed table between you with a pad at each end where a
 * hand goes down, your forearm and theirs up from the elbows to the locked hands, tipping one way or the
 * other with the bout. Up the right edge, the bar: the drifting band (the sweet spot, the one the rules
 * judge: shared/armwrestle.ts), red while they're about to heave, and your grip on it. Lit by a candle on
 * the table and the Rat's lamp, at the town's hour (pastimecanvas.ts).
 */
import type { ArmFoeId } from '../shared/armtune';
import { telling, zoneAt, type ArmState } from '../shared/armwrestle';
import { FH, PastimeCanvas, dith, dot } from './pastimecanvas';

/** Each regular's skin, hair, clothes and how they wear it. */
const LOOKS: Record<ArmFoeId, { skin: string; hair: string; coat: string; trim: string; beard: boolean; bald?: boolean }> = {
  drunk: { skin: '#c88a6a', hair: '#6a5a4a', coat: '#5a4a3a', trim: '#3a2e24', beard: true },
  sharp: { skin: '#d8a882', hair: '#1e1a18', coat: '#2a2a34', trim: '#7a2a2a', beard: false },
  watch: { skin: '#b88462', hair: '#4a3020', coat: '#4a4c54', trim: '#7a1d1d', beard: true },
  gannet: { skin: '#c89070', hair: '#8a6a4a', coat: '#6a5034', trim: '#d8d0bc', beard: true, bald: true },
};
/** The pivot the locked hands turn about, your elbow and theirs, the pads, the bar. */
const PIV = [60, 132] as const, ARMLEN = 34, MINE = [50, 152] as const, THEIRS = [70, 108] as const;
const BAR = { x: 108, top: 34, h: 116 } as const;

export class ArmView extends PastimeCanvas {
  constructor(private skin: string) {
    super();
    this.indoor = [0.3, 0.22, 0.19];
  }

  protected paintLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.lw;
    c.height = this.lh;
    const g = c.getContext('2d')!, oy = this.oy;
    // The Rat behind them: dark planks, a shelf of pots, the lamp's bracket.
    for (let y = 0; y < oy + 96; y++) for (let x = 0; x < this.lw; x++) dot(g, x, y, 1, 1, x % 9 === 0 ? '#1e1610' : dith(x, y, 0.4) ? '#2e2218' : '#33261a');
    dot(g, 0, oy + 26, this.lw, 2, '#4a3420');
    for (let x = 4; x < this.lw; x += 7) dot(g, x, oy + 20, 4, 6, ['#5a4a3a', '#3a5a4a', '#6a3a2a'][x % 3]);
    // The table: scrubbed planks from their side to yours, its edge toward you.
    for (let y = oy + 96; y < this.lh; y++) for (let x = 0; x < this.lw; x++) {
      const fy = y - oy, far = Math.max(0, Math.min(1, (130 - fy) / 34));
      dot(g, x, y, 1, 1, (x + Math.floor(fy / 9) * 5) % 23 === 0 ? '#3a2818' : dith(x, y, far * 0.7) ? '#5a3e24' : '#6e4e2e');
    }
    dot(g, 0, oy + 160, this.lw, 3, '#3a2818');
    for (let y = oy + 163; y < this.lh; y++) dot(g, 0, y, this.lw, 1, '#2a1d12');
    // The pads where a hand goes down, one each side.
    for (const px of [16, 96]) dot(g, this.ox + px, oy + 126, 10, 6, '#5a2a22'), dot(g, this.ox + px + 1, oy + 127, 8, 4, '#6a3228');
    return c;
  }

  render(s: ArmState, now: number): void {
    this.begin();
    const { lit, glow } = this;
    this.foe(s, now);
    // The locked hands: lean 1 their hand on their pad (to the right), -1 yours (to the left).
    const a = s.lean * 1.15 + Math.sin(now * 13) * 0.012 * (s.over ? 0 : 1), hx = PIV[0] + Math.sin(a) * ARMLEN, hy = PIV[1] - Math.cos(a) * ARMLEN;
    this.forearm(THEIRS, [hx, hy], LOOKS[s.foe.id].skin, LOOKS[s.foe.id].coat, 3);
    this.forearm(MINE, [hx, hy], this.skin, '#4a4048', 4);
    dot(lit, hx - 3, hy - 3, 7, 6, this.skin), dot(lit, hx - 2, hy - 4, 5, 2, LOOKS[s.foe.id].skin), dot(lit, hx - 1, hy, 3, 1, '#8a5a40');
    // The candle on the table.
    dot(lit, 88, 104, 2, 5, '#e8e0c8'), dot(glow, 88, 102 - (Math.floor(now * 9) % 2), 2, 2, '#ffd27a');
    this.bar(s, now);
    this.finish([[89, 100, 70, 0.95 * (1 + Math.sin(now * 9) * 0.04), [1, 0.66, 0.34]], [22, 4, 110, 0.6, [1, 0.6, 0.3]]]);
  }

  /** The regular across the table: shoulders, head, and a face that strains as it goes against them. */
  private foe(s: ArmState, now: number): void {
    const L = LOOKS[s.foe.id], { lit, glow } = this, sway = Math.round(-s.lean * 3), x = 60 + sway, strain = s.lean > 0.3 || telling(s);
    dot(lit, x - 26, 70, 52, 30, L.coat), dot(lit, x - 26, 70, 52, 2, L.trim), dot(lit, x - 6, 68, 12, 6, L.skin);
    dot(lit, x - 10, 38, 20, 24, L.skin);
    if (!L.bald) dot(lit, x - 10, 36, 20, 6, L.hair);
    else dot(lit, x - 10, 46, 2, 8, L.hair), dot(lit, x + 8, 46, 2, 8, L.hair);
    if (L.beard) dot(lit, x - 9, 54, 18, 9, L.hair), dot(lit, x - 4, 56, 8, 2, '#3a2016');
    else dot(lit, x - 3, 56, 6, 1, '#6a3a2a');
    // The eyes: open and watching, or screwed up with the effort; the brow down when they heave.
    const ey = 46;
    if (strain) dot(lit, x - 6, ey, 4, 1, '#1e1610'), dot(lit, x + 2, ey, 4, 1, '#1e1610'), dot(lit, x - 7, ey - 2, 5, 1, L.hair), dot(lit, x + 2, ey - 2, 5, 1, L.hair);
    else dot(lit, x - 5, ey - 1, 2, 2, '#1e1610'), dot(lit, x + 3, ey - 1, 2, 2, '#1e1610');
    if (s.lean > 0.6 && Math.floor(now * 3) % 2) dot(glow, x + 10, 42, 1, 2, '#b8d0e0');
  }

  /** A forearm from an elbow on the table up to the hands, its sleeve pushed back to the elbow. */
  private forearm(from: readonly [number, number], to: [number, number], skin: string, sleeve: string, w: number): void {
    const [ax, ay] = from, [bx, by] = to, n = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = ax + (bx - ax) * k, y = ay + (by - ay) * k;
      dot(this.lit, x - w / 2, y, w, 1, k < 0.18 ? sleeve : skin);
    }
  }

  /** The bar up the right edge: the band to keep your grip in, and your grip. */
  private bar(s: ArmState, now: number): void {
    const { lit, glow } = this, y = (v: number) => BAR.top + BAR.h * (1 - v);
    dot(lit, BAR.x - 1, BAR.top - 1, 8, BAR.h + 2, '#1a1410');
    dot(lit, BAR.x, BAR.top, 6, BAR.h, '#2e2620');
    const z = zoneAt(s), w = s.foe.width, warn = telling(s) && Math.floor(now * 8) % 2 === 0;
    const col = warn ? '#ff6a4a' : s.inZone ? '#9ad87a' : '#5a8a4a';
    dot(glow, BAR.x, y(z + w), 6, Math.max(1, Math.round(BAR.h * w * 2)), col);
    dot(glow, BAR.x, Math.round(y(z)), 6, 1, s.inZone ? '#e8ffd8' : '#a8c890');
    const gy = Math.round(y(s.grip));
    dot(glow, BAR.x - 3, gy - 1, 12, 3, '#1a1410'), dot(glow, BAR.x - 2, gy, 10, 1, '#f0e8d8');
    // How far the bout has gone: a tally under the bar, gold your way.
    const k = Math.round(((s.lean + 1) / 2) * 20);
    for (let i = 0; i < 20; i++) dot(glow, BAR.x - 3 + Math.floor(i / 2) * 1.2, FH - 18, 1, 2, i < k ? '#ffd27a' : '#5a4a3a');
  }
}
