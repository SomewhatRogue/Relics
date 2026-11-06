/**
 * What the millpond's and the butts' pictures share (fishview.ts, rangeview.ts): a field RANGE.w by
 * RANGE.h pixels, painted flat at low resolution on two layers (`lit`, shaded by the game's lighting
 * pass, light.ts, and `glow` on top), scaled up by the biggest whole number that fits the screen's width
 * (and height, on a wide screen), with the scenery carried on round it. Upright on a phone the field sits
 * at the foot of the screen with more sky above. It also answers the sight's questions (watchinput.ts).
 */
import { RANGE } from '../shared/rangetune';
import { daylight, townLight } from '../shared/daylight';
import { townPhase } from './townclock';
import { Lighting, type Light } from './light';
import type { ShiftView } from './watchscreen';

export const FW = RANGE.w, FH = RANGE.h;

export abstract class PastimeCanvas implements Pick<ShiftView, 'out' | 'resize' | 'toAim' | 'perCss' | 'clampAim'> {
  readonly out = document.createElement('canvas');
  protected base = document.createElement('canvas');
  protected glowC = document.createElement('canvas');
  protected lit = this.base.getContext('2d')!;
  protected glow = this.glowC.getContext('2d')!;
  private light = new Lighting(this.out);
  lw = 0;
  lh = 0;
  k = 1;
  ox = 0;
  oy = 0;
  private dpr = 1;
  /** Indoors (the Rat, the forge): the hall's own ambient, a little brighter by day through the door and shutters. */
  protected indoor: [number, number, number] | null = null;
  /** The scenery painted once a size (fishview's pond, rangeview's butts). */
  protected land: HTMLCanvasElement | null = null;

  constructor() {
    this.out.className = 'watch-canvas';
  }

  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr;
    this.k = Math.max(1, Math.min(Math.floor(W / FW), Math.floor(H / (FH * 0.8))));
    this.lw = Math.ceil(W / this.k);
    this.lh = Math.ceil(H / this.k);
    this.ox = Math.floor((this.lw - FW) / 2);
    // Upright: the field a little below the middle, the scenery carried on above and below it.
    this.oy = Math.floor((this.lh - FH) * 0.6);
    for (const c of [this.out, this.base, this.glowC]) (c.width = this.lw), (c.height = this.lh);
    this.out.style.width = (this.lw * this.k) / this.dpr + 'px';
    this.out.style.height = (this.lh * this.k) / this.dpr + 'px';
    this.lit.imageSmoothingEnabled = this.glow.imageSmoothingEnabled = false;
    this.land = this.paintLand();
  }
  protected abstract paintLand(): HTMLCanvasElement;

  toAim(cssX: number, cssY: number): [number, number] {
    const per = this.k / this.dpr;
    return [cssX / per - this.ox, cssY / per - this.oy];
  }
  get perCss(): number {
    return this.dpr / this.k;
  }
  clampAim(x: number, y: number): [number, number] {
    return [Math.max(0, Math.min(FW, x)), Math.max(-20, Math.min(FH - 20, y))];
  }
  /** Where a point of the field is on the canvas (CSS pixels from its corner). */
  toCss(x: number, y: number): [number, number] {
    const per = this.k / this.dpr;
    return [(x + this.ox) * per, (y + this.oy) * per];
  }

  /** Start a frame: the scenery down, both layers set to the field's corner. */
  protected begin(): void {
    if (!this.land) this.resize();
    const { lit, glow } = this;
    lit.setTransform(1, 0, 0, 1, 0, 0);
    glow.setTransform(1, 0, 0, 1, 0, 0);
    lit.drawImage(this.land!, 0, 0);
    glow.clearRect(0, 0, this.lw, this.lh);
    lit.setTransform(1, 0, 0, 1, this.ox, this.oy);
    glow.setTransform(1, 0, 0, 1, this.ox, this.oy);
  }
  /** End a frame: lit by the town's hour (day, dusk, night) and the given lights (field pixels). */
  protected finish(lights: [number, number, number, number, [number, number, number]][]): void {
    const phase = townPhase();
    if (this.indoor) {
      const k = 0.85 + 0.3 * daylight(phase), amb = this.indoor.map((v) => v * k) as [number, number, number];
      return this.light.render(this.base, this.glowC, lights.map(([x, y, r, i, c]) => ({ x: x + this.ox, y: y + this.oy, r, i, c })), amb);
    }
    const th = townLight({ floor: 'cobble', back: 'stone', ambient: [0.27, 0.25, 0.33], moon: 0.5 }, phase), torch = th.torch ?? 1;
    const ls: Light[] = lights.map(([x, y, r, i, c]) => ({ x: x + this.ox, y: y + this.oy, r, i: i * torch, c }));
    if (th.moon > 0.05) ls.push({ x: this.ox + FW * 0.75, y: this.oy - 40, r: 320, i: 0.3 * th.moon, c: [0.55, 0.6, 0.85] });
    this.light.render(this.base, this.glowC, ls, th.ambient);
  }
}

/** One logical pixel. */
export const dot = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => ((g.fillStyle = c), g.fillRect(Math.round(x), Math.round(y), w, h));
/** Ordered dither: is this pixel on, for a share `k` (0..1)? */
export const dith = (x: number, y: number, k: number) => [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16 < k;
