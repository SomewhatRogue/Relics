/**
 * Being out of bounds, on screen (sim/dread.ts decides it; this only draws it), the same over the flat
 * and the 2.5D view: a low-resolution canvas laid over the game and under the HUD, and a grey layer that
 * drains the colour. For your own hero: the edges darken and close in (stepped and dithered, like the
 * lighting), the colour goes, a plain warning over you; worse at the late stage, with something vast
 * moving in the dark at the edge (wild places) or the hungry's eyes gathering there (settled ones). For
 * anyone taken, on every screen: a hand out of the dark crushing them, or the hungry pouring in and
 * pulling them down, where they stood. In town: a dark flicker and a word. Cosmetic: Math.random is fine.
 */
import { DREAD } from '../shared/tuning';
import { dreadStage } from '../sim/dread';
import type { FightEvent, Hero } from '../sim/types';
import { BAYER, eyes, hand, pool, runner, vast } from './dreadart';
import { DreadSound } from './dreadsound';
import { DREADW } from './dreadwords';
import type { Fx } from './fx';

/** CSS pixels to one of the overlay's. */
const K = 3;
type Take = { by: string; x: number; y: number; t0: number; hit: number };
interface Where { tileScreen(x: number, y: number, up?: number): [number, number]; heroScreen(): [number, number, number, number?] | null }

export class DreadView {
  private c = document.createElement('canvas');
  private g = this.c.getContext('2d')!;
  private grey = document.createElement('div');
  private line = document.createElement('div');
  private sound = new DreadSound();
  private level = 0;
  private takes: Take[] = [];
  private flick = -9;
  private black = -9;
  private lineUntil = 0;
  private lateAt = -9;
  private side = 1;
  private shown = false;
  /** The vignette's middle and the edge of the light, last drawn (the hungry's eyes stay out past it). */
  private cx = 0;
  private cy = 0;
  private open = 0;
  private feather = 1;

  constructor() {
    Object.assign(this.c.style, { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', zIndex: '1', pointerEvents: 'none', imageRendering: 'pixelated' });
    Object.assign(this.grey.style, { position: 'fixed', inset: '0', zIndex: '1', pointerEvents: 'none', background: '#7a7a7a', mixBlendMode: 'saturation', opacity: '0' });
    Object.assign(this.line.style, { position: 'fixed', zIndex: '2', pointerEvents: 'none', transform: 'translate(-50%, -100%)', maxWidth: 'min(300px, 80vw)', textAlign: 'center', font: '400 var(--fs-text, 14px)/1.3 var(--font-body, monospace)', color: '#d8d0c4', textShadow: '0 0 2px #000, 1px 1px 0 #000', opacity: '0', transition: 'opacity 0.5s steps(4)' });
    this.line.id = 'dreadline';
    // First in the page, so the HUD and the touch buttons (later, same layer) stay over the dark.
    document.body.prepend(this.grey, this.c, this.line);
  }

  frame(me: Hero | undefined, heroes: Hero[], evs: FightEvent[], at: Where, fx: Fx, now: number, dt: number): void {
    for (const e of evs) if (e.k === 'dread') this.on(e, me, at, fx, now);
    const d = me?.dread ?? 0, taken = (me?.takenT ?? -1) >= 0, stage = taken ? 3 : dreadStage(d), by = me?.dreadBy ?? 'shadow';
    const want = taken ? 0.86 : !d ? 0 : by === 'setback' ? 0.35 : d < DREAD.late ? 0.3 + (0.2 * d) / DREAD.late : 0.5 + (0.35 * (d - DREAD.late)) / (DREAD.take - DREAD.late);
    this.level += (want - this.level) * Math.min(1, dt * (want > this.level ? 3 : 2.2));
    if (this.level < 0.004) this.level = 0;
    this.sound.frame(this.level, stage, now);
    this.takes = this.takes.filter((t) => now - t.t0 < DREAD.crush + 1.6);
    const busy = this.level > 0 || this.takes.length > 0 || now - this.flick < 0.6 || now - this.black < 0.5;
    this.grey.style.opacity = String(Math.min(0.92, this.level * 1.05));
    this.line.style.opacity = now < this.lineUntil ? '1' : '0';
    if (me && now < this.lineUntil + 0.6) {
      const [x, y] = at.tileScreen(me.x, me.y, 2.4);
      Object.assign(this.line.style, { left: x + 'px', top: y + 'px' });
    }
    if (!busy) return void (this.shown && (this.g.clearRect(0, 0, this.c.width, this.c.height), (this.shown = false)));
    this.shown = true;
    const W = Math.ceil(innerWidth / K), H = Math.ceil(innerHeight / K);
    if (this.c.width !== W || this.c.height !== H) (this.c.width = W), (this.c.height = H);
    const g = this.g;
    g.clearRect(0, 0, W, H);
    const tile = (at.heroScreen()?.[2] ?? 48) / K, hs = me ? at.tileScreen(me.x, me.y, 0.5) : [innerWidth / 2, innerHeight / 2];
    const sh = fx.shake > 0 ? [(Math.random() - 0.5) * fx.shake * 0.5, (Math.random() - 0.5) * fx.shake * 0.5] : [0, 0];
    if (this.level > 0) this.vignette(W, H, hs[0] / K + sh[0], hs[1] / K + sh[1], now);
    if (stage === 2 && by !== 'setback') this.lurk(by, W, H, tile, now);
    for (const t of this.takes) this.take(t, at, tile, now, sh);
    // In town: the dark flickers on and off as you're put back.
    const f = now - this.flick;
    if (f < 0.6 && (f < 0.18 || Math.floor(f * 14) % 2 === 0)) (g.fillStyle = '#020104'), g.fillRect(0, 0, W, H);
    // The crush, on your own screen: black for a moment.
    if (now - this.black < 0.5) (g.globalAlpha = 1 - (now - this.black) / 0.5), (g.fillStyle = '#000'), g.fillRect(0, 0, W, H), (g.globalAlpha = 1);
  }

  private on(e: Extract<FightEvent, { k: 'dread' }>, me: Hero | undefined, at: Where, fx: Fx, now: number): void {
    const mine = !!me && e.id === me.id, w = e.by === 'shadow' ? DREADW.wild : DREADW.settled;
    this.sound.event(e.n, e.by, mine);
    if (mine && e.n === 1 && e.by !== 'setback') this.say(w.warn, '#d8d0c4', now);
    if (mine && e.n === 2) (this.say(w.worse, '#e0a8a0', now), (this.lateAt = now), (this.side = -this.side));
    if (e.n === 3) this.takes.push({ by: e.by, x: e.x, y: e.y, t0: now, hit: -1 });
    if (e.n === 4) {
      const t = this.takes.find((q) => q.hit < 0 && Math.hypot(q.x - e.x, q.y - e.y) < 0.5) ?? (this.takes.push({ by: e.by, x: e.x, y: e.y, t0: now - DREAD.crush, hit: -1 }), this.takes[this.takes.length - 1]);
      t.hit = now;
      fx.shake = Math.max(fx.shake, e.by === 'shadow' ? 16 : 8);
      if (mine) this.black = now;
    }
    if (mine && e.n === 5) (this.flick = now), this.say(DREADW.town.back, '#c8c0b4', now);
    void at;
  }

  private say(s: string, col: string, now: number): void {
    this.line.textContent = s;
    this.line.style.color = col;
    this.lineUntil = now + 3.2;
  }

  /** The edges darken and close in round the hero, in dithered steps, breathing with the heartbeat. */
  private vignette(W: number, H: number, cx: number, cy: number, now: number): void {
    const img = this.g.createImageData(W, H), px = img.data, L = this.level, beat = Math.max(0, Math.sin(now * (L > 0.6 ? 10 : 6.5))) ** 6;
    const diag = Math.hypot(W, H) / 2, open = diag * (0.95 - L * 0.78) * (1 - beat * 0.04), feather = diag * (0.3 + 0.1 * (1 - L));
    Object.assign(this, { cx, cy, open, feather });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dd = Math.hypot(x - cx, (y - cy) * 1.15);
      let a = (dd - open) / feather;
      a = a <= 0 ? L * 0.12 : Math.min(1, Math.round(Math.min(1, a) * 4) / 4 + L * 0.12);
      if (a * 16 <= BAYER[(x & 3) + (y & 3) * 4]) continue;
      const i = (y * W + x) * 4;
      px[i] = 2;
      px[i + 1] = 1;
      px[i + 2] = 5;
      px[i + 3] = 255;
    }
    this.g.putImageData(img, 0, 0);
  }

  /** The late stage: something vast drifting through the dark at the edge, or the hungry's eyes gathering there. */
  private lurk(by: string, W: number, H: number, tile: number, now: number): void {
    const t = now - this.lateAt, g = this.g;
    if (by === 'shadow') {
      // Many times a hero's height, rising slowly at the edge and leaning in, then sinking away.
      const h = Math.min(H * 0.62, W * 0.95, tile * 16), rise = Math.min(1, t / 2.5), lean = Math.min(0.18, t * 0.04) * h;
      const x = this.side > 0 ? -h * 0.32 + lean : W + h * 0.32 - lean;
      vast(g, x, H * 0.82 + (1 - rise) * h * 0.6, h, Math.sin(t * 0.9) > -0.85 ? 1 : 0.1, this.side);
      return;
    }
    // The hungry: pairs of eyes in the dark round the edge, more of them as it goes on, blinking.
    const n = Math.min(26, 6 + Math.floor(t * 4));
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + 0.3, r = 0.47 + 0.035 * Math.sin(i * 7.1 + t * 0.6) - Math.min(0.06, t * 0.008);
      const x = W / 2 + Math.cos(a) * W * r * 1.05, y = H / 2 + Math.sin(a) * H * r;
      // Only out in the dark, never in the light round you.
      if (Math.sin(now * 1.7 + i * 3.3) > 0.93 || Math.hypot(x - this.cx, (y - this.cy) * 1.15) < this.open + this.feather * 0.5) continue;
      eyes(g, x, y, 3 + (i % 3), 1, '#c8f060', '#24360f');
    }
  }

  /** Someone taken where they stood: the hand, or the hungry. */
  private take(t: Take, at: Where, tile: number, now: number, sh: number[]): void {
    const g = this.g, [sx, sy] = at.tileScreen(t.x, t.y, 0), x = sx / K + sh[0], y = sy / K + sh[1], u = now - t.t0, k = Math.min(1, u / DREAD.crush);
    const after = t.hit >= 0 ? now - t.hit : 0, fade = Math.max(0, 1 - after / 1.2);
    g.globalAlpha = fade;
    pool(g, x, y, tile * (1.2 + k * 2.2), 0.5 + k * 0.5);
    if (t.by === 'shadow') {
      const s = tile * 6.5, ease = k * k * (3 - 2 * k), lift = t.hit >= 0 ? Math.max(0, after - 0.35) * tile * 9 : 0;
      eyes(g, x, y - s * 2.3 - lift * 0.5, s * 1.3, Math.min(1, u * 2));
      // Fingers spread round the hero as it comes down, closing on them at the crush.
      hand(g, x, y - s * 0.62 - (1 - ease) * (s * 2.4) - lift, s, t.hit >= 0 ? 0.9 : Math.max(0, k - 0.8) * 2.5);
    } else {
      for (let i = 0; i < 18; i++) {
        const a = i * 2.39996, r0 = tile * (7 + (i % 4) * 1.5), k2 = Math.min(1, Math.max(0, (u - (i % 5) * 0.05) / DREAD.crush)), out = t.hit >= 0 ? Math.max(0, after - 0.5) * 1.4 : 0;
        const r = r0 * (1 - k2 * k2 * 0.94) + out * r0 * 0.8, jx = t.hit >= 0 && out === 0 ? (Math.random() - 0.5) * 3 : 0;
        runner(g, x + Math.cos(a) * r + jx, y + Math.sin(a) * r * 0.6, tile * 0.9, now * 14 + i, Math.cos(a) > 0);
      }
    }
    g.globalAlpha = 1;
  }
}
