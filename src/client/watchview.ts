/**
 * The Night Watch's picture: painted flat at low resolution (the field, its goblins, the hero on the
 * wall in their own class look), then the game's own lighting pass (light.ts) lights it from the wall's
 * torches, the goblins' torches and the moon, in stepped bands with a little dither; the glowing layer
 * (eyes, flames, the moon, the sight, the words) goes on top. Scaled up by a whole number.
 */
import { FIELDS, WATCH, groundY, type FieldName } from '../shared/watchtune';
import { moonlight } from '../sim/watchnight';
import type { WatchState } from '../sim/watchtypes';
import type { Hero } from '../sim/types';
import { feet } from '../sim/watchzones';
import { drawHero } from './actors';
import { Lighting, type Light } from './light';
import { WALL_TORCHES, paintLand } from './watchland';
import { drawGob } from './watchgobs';
import { drawFog, drawSky } from './watchsky';
import { drawArrows, drawBits, drawBow, drawSays, drawSight, drawTorches, type Say } from './watchfx';

const FIRE: [number, number, number] = [1, 0.62, 0.3];
/** Upright, the screen's right edge is this far past the hero's feet (the hero and bow just in). */
const TALL_PAST = 8;

export class WatchView {
  readonly out = document.createElement('canvas');
  private base = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private lit = this.base.getContext('2d')!;
  private glow = this.glowC.getContext('2d')!;
  private light = new Lighting(this.out);
  private land: HTMLCanvasElement | null = null;
  /** Logical pixels across and down, the whole number they're scaled by, and where the field's corner sits. */
  lw = 0;
  lh = 0;
  k = 1;
  ox = 0;
  oy = 0;
  private dpr = 1;

  constructor(private hero: Hero, readonly field: FieldName) {
    this.out.className = 'watch-canvas';
  }

  /**
   * Fit the screen, at the biggest whole-number scale. The wide field: all of it, the sky and fields
   * carried on round it. The tall field (a phone held upright): from its edge to the hero, the right
   * edge on the hero, scaled to that width; the sky cropped to a strip with the moon, and the goblins'
   * slope in the middle of the screen.
   */
  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr, F = FIELDS[this.field];
    if (this.field === 'tall') {
      const right = WATCH.heroX + TALL_PAST, span = right - F.from;
      this.k = Math.max(1, Math.min(Math.floor(W / span), Math.floor(H / 150)));
      this.lw = Math.ceil(W / this.k);
      this.lh = Math.ceil(H / this.k);
      this.ox = this.lw - right;
      const lane = (groundY(F.from, 'tall') + groundY(WATCH.reachX, 'tall')) / 2 - 10;
      this.oy = Math.round(this.lh / 2 - lane);
    } else {
      this.k = Math.max(1, Math.min(Math.floor(W / WATCH.w), Math.floor(H / F.h)));
      this.lw = Math.ceil(W / this.k);
      this.lh = Math.ceil(H / this.k);
      this.ox = Math.floor((this.lw - WATCH.w) / 2);
      // A tall screen showing the wide field (turned upright mid-shift): the field a little below the middle.
      this.oy = this.lh - F.h > 60 ? Math.round((this.lh - F.h) * 0.58) : Math.floor((this.lh - F.h) / 2);
    }
    for (const c of [this.out, this.base, this.glowC]) (c.width = this.lw), (c.height = this.lh);
    this.out.style.width = (this.lw * this.k) / this.dpr + 'px';
    this.out.style.height = (this.lh * this.k) / this.dpr + 'px';
    this.lit.imageSmoothingEnabled = this.glow.imageSmoothingEnabled = false;
    this.land = paintLand(this.lw, this.lh, this.ox, this.oy, this.field);
  }

  /** A point on screen (CSS pixels from the canvas's corner) in the field's pixels. */
  toField(cssX: number, cssY: number): [number, number] {
    const per = this.k / this.dpr;
    return [cssX / per - this.ox, cssY / per - this.oy];
  }
  /** Field pixels per CSS pixel (for dragging the sight). */
  get perCss(): number {
    return this.dpr / this.k;
  }

  render(s: WatchState, says: Say[], now: number, bigSight: boolean): void {
    const { lit, glow, ox, oy } = this;
    if (!this.land) this.resize();
    lit.setTransform(1, 0, 0, 1, 0, 0);
    glow.setTransform(1, 0, 0, 1, 0, 0);
    lit.drawImage(this.land!, 0, 0);
    glow.clearRect(0, 0, this.lw, this.lh);
    drawSky(glow, s, ox, oy, now);
    lit.setTransform(1, 0, 0, 1, ox, oy);
    glow.setTransform(1, 0, 0, 1, ox, oy);
    drawTorches(lit, glow, WALL_TORCHES, now);
    // The farthest up the field first; the fallen under the standing.
    const gobs = [...s.gobs].sort((a, b) => (a.state === 'dead' ? 0 : 1) - (b.state === 'dead' ? 0 : 1) || b.lane - a.lane);
    for (const g of gobs) if (g.state !== 'gone') drawGob(lit, glow, s, g, now);
    this.sinking(s, now);
    drawBits(lit, glow, s, now);
    drawArrows(lit, s);
    drawHero({ lit, glow, now, t: now }, { ...this.hero, fx: -1, fy: 0, act: 'idle', actT: 0, moving: false, blocking: false }, WATCH.heroX, WATCH.walkY, 'bare', now);
    drawBow(lit, s);
    lit.setTransform(1, 0, 0, 1, 0, 0);
    drawFog(lit, s, ox, oy, this.lw);
    drawSight(glow, s, bigSight);
    drawSays(glow, says, now);
    const m = moonlight(s.clouds, s.t);
    this.light.render(this.base, this.glowC, this.lights(s, m, now), [0.07 + 0.2 * m, 0.075 + 0.21 * m, 0.11 + 0.3 * m]);
  }

  /** Goblins dropping into the ditch, clipped at the ground: they sink out of your sight. */
  private sinking(s: WatchState, now: number): void {
    const gone = s.gobs.filter((g) => g.state === 'gone');
    if (!gone.length) return;
    for (const g of [this.lit, this.glow]) {
      g.save();
      g.beginPath();
      g.moveTo(WATCH.reachX - 12, 0);
      for (let x = WATCH.reachX - 12; x <= WATCH.wallX; x++) g.lineTo(x, Math.round(groundY(x, this.field)));
      g.lineTo(WATCH.wallX, 0);
      g.clip();
    }
    for (const g of gone) drawGob(this.lit, this.glow, s, g, now);
    this.lit.restore();
    this.glow.restore();
  }

  private lights(s: WatchState, m: number, now: number): Light[] {
    const at = (x: number, y: number, r: number, i: number, c: [number, number, number]): Light => ({ x: this.ox + x, y: this.oy + y, r, i, c });
    const flick = (k: number) => 1 + Math.sin(now * 9 + k) * 0.06;
    const [mx, my] = FIELDS[this.field].moon, out = [at(mx, my + 30, 260, 0.32 * m, [0.55, 0.6, 0.85])];
    WALL_TORCHES.forEach(([x, y], i) => out.push(at(x, y, 54, 0.8 * flick(i), FIRE)));
    for (const g of s.gobs) {
      if (g.state === 'dead' || g.state === 'gone' || (!g.torch && g.burning < 0)) continue;
      const [fx, fy] = feet(g);
      out.push(at(fx + 5, fy - (g.torch ? 24 : 10), g.burning >= 0 ? 46 : 38, 0.95 * flick(g.id), FIRE));
    }
    for (const b of s.bits) if (b.kind === 'torch' && s.t - b.t < 6) out.push(at(b.x, b.y, 30, 0.7 * flick(b.t), FIRE));
    return out;
  }
}
