/**
 * The millpond from the bank: you from behind at the foot of the screen with the rod, the pond running
 * up the screen to the far bank, the town's east wall on the right with the mill stream coming in under
 * it, reeds at the edges. The float goes out as far as the cast (a full cast near the far bank), bobs,
 * twitches at a nibble and goes under at the bite; reeling, it comes back in as the fish does, with the
 * fish's shadow under it, and the line's tension on a gauge across the top. Lit by the town's hour, a
 * lantern on the bank and the moon (pastimecanvas.ts).
 */
import { FISH, speciesOf } from '../shared/fishtune';
import { nibbling, type FishState } from '../shared/fishing';
import type { Hero } from '../sim/types';
import { drawHero } from './actors';
import { drawText } from './pixfont';
import { drawFish } from './fishart';
import { FISHW } from './pastimewords';
import { FW, PastimeCanvas, dith, dot } from './pastimecanvas';

/** Where the water is (field pixels), where you stand, the rod's butt in your hands, the lantern. */
const POND = { top: 30, bank: 146 }, ME = [60, 168] as const, HANDS = [64, 156] as const, LANTERN = [18, 152] as const;
/** The far bank's strip at the top of the screen (canvas rows), however tall the screen. */
const FAR = 30;
/** How far up the water the float lands for a cast of `reach` (0 by the bank, 1 by the far bank). */
const floatY = (reach: number) => POND.bank - 10 - reach * (POND.bank - POND.top - 22);

export class FishView extends PastimeCanvas {
  constructor(private hero: Hero) {
    super();
  }

  protected paintLand(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.lw;
    c.height = this.lh;
    const g = c.getContext('2d')!, oy = this.oy, ox = this.ox;
    // Water everywhere the field doesn't cover, darker in stepped bands out toward the middle.
    for (let y = 0; y < this.lh; y++) {
      const fy = y - oy, deep = Math.min(1, Math.max(0, 1 - Math.abs(fy - 90) / 70));
      for (let x = 0; x < this.lw; x++) g.fillStyle = dith(x, y, deep) ? '#14263a' : '#1c3448', g.fillRect(x, y, 1, 1);
    }
    // The far bank across the top of the screen, earth and grass; the wall on the right with the stream's arch.
    const far = Math.min(FAR, oy + POND.top);
    dot(g, 0, 0, this.lw, far, '#2a3020');
    for (let x = 0; x < this.lw; x++) for (let y = far - 6; y < far; y++) if (dith(x, y, (y - far + 6) / 6)) dot(g, x, y, 1, 1, '#3a3a26');
    for (let x = 0; x < ox + 80; x += 7) dot(g, x + ((x * 3) % 5), far - 14 - ((x * 7) % 6), 5, 8, '#1e2a18');
    const wx = ox + 82;
    for (let y = 0; y < far; y++) for (let x = wx; x < this.lw; x++) {
      const row = Math.floor(y / 5), brick = Math.floor((x + (row % 2) * 4) / 8);
      g.fillStyle = y % 5 === 0 || (x + (row % 2) * 4) % 8 === 0 ? '#3a3c44' : (brick + row) % 3 ? '#5a5e68' : '#666a74';
      g.fillRect(x, y, 1, 1);
    }
    dot(g, wx + 10, far - 12, 14, 12, '#0c1014');
    for (let i = 0; i < 14; i++) dot(g, wx + 10 + i, far - 13 - Math.round(Math.sin((i / 13) * Math.PI) * 3), 1, 1, '#7a7e88');
    // The near bank: earth, a grassy lip at the water, and more bank on either side down the screen.
    dot(g, 0, oy + POND.bank, this.lw, this.lh - oy - POND.bank, '#3a3022');
    for (let x = 0; x < this.lw; x++) for (let y = oy + POND.bank; y < oy + POND.bank + 5; y++) if (dith(x, y, 1 - (y - oy - POND.bank) / 5)) dot(g, x, y, 1, 1, '#4a5a2a');
    // Reeds along both edges, near and far.
    for (const [x0, y0, n] of [[ox + 2, oy + 120, 7], [ox + 108, oy + 128, 6], [ox + 6, far + 2, 5], [ox + 70, far, 4]] as const)
      for (let i = 0; i < n; i++) {
        const x = x0 + i * 2 + (i % 2), h = 10 + ((i * 7) % 6);
        dot(g, x, y0 + 26 - h, 1, h, i % 3 ? '#5a6a30' : '#6a7a3a');
        if (i % 3 === 1) dot(g, x, y0 + 26 - h - 3, 1, 3, '#5a3a20');
      }
    // The lantern's post on the bank.
    dot(g, ox + LANTERN[0], oy + LANTERN[1], 1, 14, '#4a3a2a');
    return c;
  }

  render(s: FishState, now: number): void {
    this.begin();
    const { lit, glow } = this;
    // Little ripples drifting on the water.
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + now * (3 + (i % 3))) % (FW + 40) - 20, y = POND.top + 8 + ((i * 53) % (POND.bank - POND.top - 16));
      dot(glow, x, y, 3, 1, '#2a4a62');
    }
    this.lantern(now);
    drawHero({ lit, glow, now, t: now }, { ...this.hero, id: 'pastime-view', noHound: true, fx: 0, fy: -1, act: 'idle', actT: 0, moving: false, blocking: false, hound: null }, ME[0], ME[1], 'bare', now);
    const [fx, fy] = this.float(s, now), tip = this.rod(s, fx, fy);
    this.line(s, tip, fx, fy, now);
    if (s.phase === 'aim') this.meter(s.meter);
    if (s.phase === 'reel') this.gauge(s, now);
    if (s.phase === 'landed' && s.fish) {
      // Held up on the bank.
      const sp = speciesOf(s.fish.sp), len = 12 + Math.min(20, Math.sqrt(s.fish.oz) * 1.1) + (sp.id === 'eel' || sp.id === 'pike' ? 6 : 0);
      drawFish(lit, sp.id, HANDS[0] + 8, HANDS[1] - 18 + Math.round(Math.sin(now * 9) * (s.t < 1.5 ? 1 : 0)), len);
    }
    this.finish([[LANTERN[0], LANTERN[1] - 2, 70, 0.95 * (1 + Math.sin(now * 8) * 0.05), [1, 0.66, 0.34]]]);
  }

  /** Where the float is (field pixels): out where it landed, coming in as the fish does. */
  private float(s: FishState, now: number): [number, number] {
    const x = 52 + ((s.seed >>> 3) % 17), y = floatY(s.reach);
    if (s.phase === 'reel') {
      const max = FISH.dist + FISH.distFar * s.reach, k = Math.min(1.2, s.dist / Math.max(1, max));
      return [x + (s.running ? Math.sin(now * 13) * 3 : 0), POND.bank - 6 - k * (POND.bank - 6 - y)];
    }
    return [x, y];
  }

  /** The rod from your hands, bending toward the float with the line's pull; the tip. */
  private rod(s: FishState, fx: number, fy: number): [number, number] {
    const pull = s.phase === 'reel' ? s.tension : s.phase === 'bite' ? 0.5 : 0.1, swing = s.phase === 'aim' ? -0.6 + s.meter * 0.8 : 0;
    const len = 30;
    let tx: number = HANDS[0], ty: number = HANDS[1];
    for (let i = 1; i <= len; i++) {
      const k = i / len, bend = pull * k * k * 10;
      const x = HANDS[0] + k * (8 + swing * 10) + ((fx - HANDS[0]) / 40) * bend, y = HANDS[1] - k * 34 + bend;
      dot(this.lit, x, y, 1, 1, i < 8 ? '#5a3a20' : '#8a6a3a');
      (tx = x), (ty = y);
    }
    return [tx, ty];
  }

  private line(s: FishState, [tx, ty]: [number, number], fx: number, fy: number, now: number): void {
    const { lit, glow } = this;
    if (s.phase === 'ready' || s.phase === 'aim' || s.phase === 'landed' || s.phase === 'lost') {
      for (let i = 0; i < 8; i++) dot(glow, tx + Math.sin(i * 0.4) * 0.5, ty + i, 1, 1, '#9aa8b0');
      return dot(lit, tx, ty + 8, 1, 2, '#e84a3a');
    }
    // In the air: the float on its arc out.
    const flying = s.phase === 'fly', k = flying ? Math.min(1, s.t / FISH.fly) : 1;
    const x = tx + (fx - tx) * k, y = ty + (fy - ty) * k - (flying ? Math.sin(k * Math.PI) * 30 : 0);
    const sag = s.phase === 'reel' ? Math.max(0, 0.35 - s.tension) * 30 : s.phase === 'bite' ? 0 : 6;
    for (let i = 1; i < 30; i++) {
      const u = i / 30;
      dot(glow, tx + (x - tx) * u, ty + (y - ty) * u + Math.sin(u * Math.PI) * sag, 1, 1, '#9aa8b0');
    }
    if (flying) return dot(lit, x, y, 1, 2, '#e84a3a');
    // The float: bobbing, twitching at a nibble, under at the bite (only rings); reeling, it's dragged.
    const nib = nibbling(s), under = s.phase === 'bite' || s.phase === 'reel';
    const bob = nib ? (Math.floor(now * 20) % 2) : Math.round(Math.sin(now * 2.2) * 0.6);
    if (!under) dot(lit, x, y - 2 + bob, 1, 1, '#e84a3a'), dot(lit, x, y - 1 + bob, 1, 1, '#f0e8d8');
    const r = under ? 2 + Math.floor((now * 6) % 4) : nib ? 2 : -1;
    if (r > 0) for (let a = 0; a < 12; a++) dot(glow, x + Math.cos((a / 12) * Math.PI * 2) * r * 1.6, y + Math.sin((a / 12) * Math.PI * 2) * r * 0.6, 1, 1, '#8ab0c8');
    // The fish under the water while it's on: its shadow, and white water when it runs.
    if (s.phase === 'reel' && s.fish) {
      const len = 8 + Math.min(14, Math.sqrt(s.fish.oz));
      lit.globalAlpha = 0.45;
      dot(lit, x - len / 2, y + 2, len, 2, '#08121c');
      lit.globalAlpha = 1;
      if (s.running) for (let i = 0; i < 4; i++) dot(glow, x - 4 + ((i * 5 + Math.floor(now * 30)) % 9), y - 1 - (i % 2), 1, 1, '#e8f0f0');
    }
  }

  /** The cast meter up the right-hand side: NEAR at the foot, FAR at the top. */
  private meter(m: number): void {
    const { glow } = this, x = FW - 10, y0 = POND.bank - 6, h = 90;
    dot(glow, x - 1, y0 - h - 1, 5, h + 2, '#15171b');
    dot(glow, x, y0 - Math.round(m * h), 3, Math.round(m * h), m > 0.8 ? '#ffd27a' : '#e8e0d0');
    drawText(glow, FISHW.far, x - 2, y0 - h - 8, '#bdb6a8');
    drawText(glow, FISHW.near, x - 4, y0 + 3, '#bdb6a8');
  }

  /** The line's tension across the top: slack at the left, the safe green, SNAP at the right; a warning before a run. */
  private gauge(s: FishState, now: number): void {
    const { glow } = this, x0 = 14, w = FW - 28, y = Math.max(8, 22 - this.oy);
    dot(glow, x0 - 1, y - 1, w + 2, 7, '#15171b');
    dot(glow, x0, y, Math.round(w * FISH.loose), 5, '#3a4a62');
    dot(glow, x0 + Math.round(w * FISH.loose), y, Math.round(w * (0.8 - FISH.loose)), 5, '#2a5a32');
    dot(glow, x0 + Math.round(w * 0.8), y, w - Math.round(w * 0.8), 5, '#7a2a24');
    const at = x0 + Math.round(Math.min(1, s.tension) * (w - 1)), hot = s.tension > 0.8 && Math.floor(now * 8) % 2;
    dot(glow, at - 1, y - 2, 3, 9, hot ? '#ff6a5a' : '#ffffff');
    drawText(glow, FISHW.slack, x0, y + 8, '#9ab0c8');
    drawText(glow, FISHW.snap, x0 + w - FISHW.snap.length * 4, y + 8, '#ff8a6a');
  }

  private lantern(now: number): void {
    const [x, y] = LANTERN, f = Math.floor(now * 6) % 2;
    dot(this.lit, x - 2, y - 4, 5, 4, '#2a2420');
    dot(this.glow, x - 1, y - 3, 3, 2, f ? '#ffd27a' : '#ffb84a');
  }
}

