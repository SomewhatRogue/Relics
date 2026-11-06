/**
 * The Night Watch held upright (Kyle 2026-11-05): from behind and above the hero on the wall walk, the
 * parapet across the bottom, the fields running away up the screen to a horizon near the top. A thing
 * `d` metres out is drawn at scale f / (d + EYE.back), so goblins come in small and grow as they run at
 * you. Painted flat at low resolution, lit by the game's own pass (light.ts), scaled by a whole number.
 */
import { DEEP, EYE } from '../shared/deeptune';
import { moonlight } from '../sim/watchnight';
import { deepAt } from '../sim/deepzones';
import type { WatchState } from '../sim/watchtypes';
import type { Hero } from '../sim/types';
import { Lighting, type Light } from './light';
import type { ShiftView } from './watchscreen';
import { drawSays, type Say } from './watchfx';
import { drawSky } from './watchsky';
import { paintDeep } from './deepland';
import { drawDeepGob } from './deepgobs';
import { drawDeepArrows, drawDeepBits, drawDeepFog, drawDeepHero, drawDeepSight, drawParapetTorches } from './deepfx';

const FIRE: [number, number, number] = [1, 0.62, 0.3];
/** About this many low-resolution pixels across a phone (the main game's own size on one). */
const ACROSS = 195;

export { proj, type Lens } from '../shared/deeptune';
import { proj, type Lens } from '../shared/deeptune';

export class DeepView implements ShiftView {
  readonly out = document.createElement('canvas');
  private base = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private lit = this.base.getContext('2d')!;
  private glow = this.glowC.getContext('2d')!;
  private light = new Lighting(this.out);
  private land: HTMLCanvasElement | null = null;
  lens: Lens = { cx: 0, hz: 0, par: 0, f: 1, lw: 1, lh: 1 };
  k = 1;
  private dpr = 1;

  constructor(private hero: Hero) {
    this.out.className = 'watch-canvas';
  }

  /** The horizon near the top, the parapet near the bottom; f set so the ground at DEEP.reach meets the parapet. */
  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr;
    this.k = Math.max(2, Math.round(Math.min(W, H * 0.75) / ACROSS));
    const lw = Math.ceil(W / this.k), lh = Math.ceil(H / this.k), hz = Math.round(lh * 0.17), par = Math.round(lh * 0.83);
    this.lens = { cx: Math.floor(lw / 2), hz, par, f: ((par - hz) * (DEEP.reach + EYE.back)) / EYE.up, lw, lh };
    for (const c of [this.out, this.base, this.glowC]) (c.width = lw), (c.height = lh);
    this.out.style.width = (lw * this.k) / this.dpr + 'px';
    this.out.style.height = (lh * this.k) / this.dpr + 'px';
    this.lit.imageSmoothingEnabled = this.glow.imageSmoothingEnabled = false;
    this.land = paintDeep(this.lens);
  }

  /** A point on screen as the sight's tangents: across, and down from the level. */
  toAim(cssX: number, cssY: number): [number, number] {
    const l = this.lens, per = this.k / this.dpr;
    return [(cssX / per - l.cx) / l.f, (cssY / per - l.hz) / l.f];
  }
  get perCss(): number {
    return this.dpr / this.k / this.lens.f;
  }
  clampAim(x: number, y: number): [number, number] {
    return [Math.max(-DEEP.aimU, Math.min(DEEP.aimU, x)), Math.max(DEEP.aimUp, Math.min(DEEP.aimDown, y))];
  }
  sayAt(x: number, y: number, d = 0): [number, number] {
    const [sx, sy] = proj(this.lens, x, y, d);
    return [sx, Math.min(sy, this.lens.par - 8)];
  }

  render(s: WatchState, says: Say[], now: number): void {
    if (!this.land) this.resize();
    const { lit, glow, lens: l } = this;
    lit.drawImage(this.land!, 0, 0);
    glow.clearRect(0, 0, l.lw, l.lh);
    drawSky(glow, s, 0, 0, Math.round(l.lw * 0.27), Math.round(l.hz * 0.5), now, (_x, y) => y < l.hz - 6);
    // Far first; the fallen under the standing.
    const gobs = [...s.gobs].sort((a, b) => deepAt(b).d - deepAt(a).d);
    for (const g of gobs) drawDeepGob(lit, glow, s, g, l, now);
    drawDeepBits(lit, glow, s, l, now);
    drawDeepArrows(lit, s, l);
    drawDeepFog(lit, s, l);
    drawParapetTorches(lit, glow, l, now);
    drawDeepHero(lit, glow, this.hero, s, l, now);
    drawDeepSight(glow, s, l);
    drawSays(glow, says, now);
    const m = moonlight(s.clouds, s.t);
    this.light.render(this.base, this.glowC, this.lights(s, m, now), [0.07 + 0.2 * m, 0.075 + 0.21 * m, 0.11 + 0.3 * m]);
  }

  private lights(s: WatchState, m: number, now: number): Light[] {
    const l = this.lens, flick = (k: number) => 1 + Math.sin(now * 9 + k) * 0.06;
    const out: Light[] = [{ x: l.lw * 0.27, y: l.hz, r: l.lh * 0.9, i: 0.3 * m, c: [0.55, 0.6, 0.85] }];
    for (const x of TORCH_AT) out.push({ x: l.lw * x, y: l.par - 6, r: l.lw * 0.5, i: 0.85 * flick(x * 10), c: FIRE });
    for (const g of s.gobs) {
      if (g.state === 'dead' || g.state === 'gone' || (!g.torch && g.burning < 0)) continue;
      const { u, d } = deepAt(g), [x, y, sc] = proj(l, u + 0.3, 1.4, d);
      out.push({ x, y, r: Math.max(10, sc * 4), i: 0.95 * flick(g.id), c: FIRE });
    }
    for (const b of s.bits) {
      if (b.kind !== 'torch' || s.t - b.t >= 6) continue;
      const [x, y, sc] = proj(l, b.x, b.y, b.d ?? 0);
      out.push({ x, y, r: Math.max(8, sc * 3), i: 0.7 * flick(b.t), c: FIRE });
    }
    return out;
  }
}

/** The parapet's torches, across the screen (as a share of its width). */
export const TORCH_AT = [0.1, 0.9];
