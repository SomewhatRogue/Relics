/**
 * What happens on the water (paint only; Math.random is fine): blood that lands in it doesn't lie on
 * the surface like paint on a floor but clouds red in the water, drifts a little downstream and fades
 * over a few seconds; a chunk that lands in deep water sinks out of sight; feet in the shallows leave
 * rings that spread, and a landing or a body falling in splashes. Kept in tiles; drawn flat by
 * wetdraw.ts and in 2.5D by three/water3d.ts. Capped for phones.
 */
import type { GameMap } from '../shared/arena';
import { DEEP, DRY, currentAt, levelAt, waterField, type WaterField } from './waterfield';
import { OX, OY, PX } from './world';

export interface Cloud { x: number; y: number; r: number; a: number; age: number; life: number; deep: boolean }
export interface Ripple { x: number; y: number; r: number; max: number; age: number; life: number }
export interface Sink { x: number; y: number; col: string; size: number; age: number }

export const WET = {
  clouds: 16, ripples: 24, sinks: 24,
  /** A cloud: how long it lasts (s), how wide it grows to (tiles), and a new drop joins one this near and young. */
  cloudLife: [4, 6.5], cloudGrow: 0.6, join: 1, joinAge: 1,
  /** A ring: how long it takes to spread (s) and how wide (tiles). */
  ringLife: 1.2, ringR: 0.7, sinkLife: 0.9,
} as const;

/** Blood's colours (and gore's red): what clouds the water. Anything else that lands in it is lost. */
const reddish = (col: string) => {
  const v = parseInt(col.slice(1, 7), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  return r > 70 && r > g * 1.6 && r > b * 1.6;
};

export class Wet {
  clouds: Cloud[] = [];
  ripples: Ripple[] = [];
  sinks: Sink[] = [];
  field: WaterField | null = null;
  private map: GameMap | null = null;

  /** The room's water (a new room clears the old one's clouds and rings). */
  use(m: GameMap): void {
    if (m === this.map) return;
    this.map = m;
    this.field = waterField(m);
    this.clouds = [];
    this.ripples = [];
    this.sinks = [];
  }

  /** DRY, SHALLOW or DEEP at a spot in tiles. */
  at(x: number, y: number): number {
    return levelAt(this.field, x, y);
  }

  /** A stain about to land at world pixel (px, py): true if water took it (it clouds or is lost). */
  take(px: number, py: number, col: string): boolean {
    if (!this.field) return false;
    const x = (px - OX) / PX, y = (py - OY) / PX, lv = this.at(x, y);
    if (lv === DRY) return false;
    if (reddish(col)) this.bleed(x, y, 0.05, lv === DEEP);
    return true;
  }

  /** Blood in the water at (x, y): a new cloud, or more in one just made close by. */
  bleed(x: number, y: number, amount: number, deep: boolean): void {
    const near = this.clouds.find((c) => c.age < WET.joinAge && Math.hypot(c.x - x, c.y - y) < WET.join);
    if (near) {
      const k = 1 / (1 + amount * 4);
      near.x = near.x * (1 - (1 - k) * 0.3) + x * (1 - k) * 0.3;
      near.y = near.y * (1 - (1 - k) * 0.3) + y * (1 - k) * 0.3;
      near.a = Math.min(1, near.a + amount * 0.6);
      near.r = Math.min(1.3, near.r + amount * 0.25);
      return;
    }
    if (this.clouds.length >= WET.clouds) this.clouds.shift();
    const life = WET.cloudLife[0] + Math.random() * (WET.cloudLife[1] - WET.cloudLife[0]);
    this.clouds.push({ x, y, r: 0.32 + amount, a: Math.min(1, 0.45 + amount * 2), age: 0, life, deep });
  }

  /** A ring spreading from (x, y): `k` 1 for a footstep, more for a landing or a butcher. */
  ring(x: number, y: number, k = 1): void {
    if (this.at(x, y) === DRY) return;
    if (this.ripples.length >= WET.ripples) this.ripples.shift();
    this.ripples.push({ x, y, r: 0.08, max: WET.ringR * k, age: 0, life: WET.ringLife * Math.sqrt(k) });
  }

  /** A chunk gone into deep water: it sinks out of sight. */
  sink(px: number, py: number, col: string, size: number): void {
    if (this.sinks.length >= WET.sinks) this.sinks.shift();
    this.sinks.push({ x: (px - OX) / PX, y: (py - OY) / PX, col, size, age: 0 });
  }

  update(dt: number): void {
    const f = this.field;
    for (const c of this.clouds) {
      const [vx, vy] = currentAt(f, c.x, c.y), out = levelAt(f, c.x, c.y) === DRY;
      // Carried off downstream; spreading; thinning (quickly, if it's been carried out of the water).
      c.x += vx * dt * (c.deep ? 1 : 0.6);
      c.y += vy * dt * (c.deep ? 1 : 0.6);
      c.r += (WET.cloudGrow * dt) / c.life;
      c.age += dt * (out ? 4 : 1);
    }
    this.clouds = this.clouds.filter((c) => c.age < c.life);
    for (const r of this.ripples) (r.age += dt), (r.r = 0.08 + (r.max - 0.08) * Math.sqrt(Math.min(1, r.age / r.life)));
    this.ripples = this.ripples.filter((r) => r.age < r.life);
    for (const s of this.sinks) s.age += dt;
    this.sinks = this.sinks.filter((s) => s.age < WET.sinkLife);
  }
}

/** How strong a cloud is now (0 to 1): full a moment, then thinning out. */
export const cloudStrength = (c: Cloud) => c.a * Math.min(1, c.age * 6) * (1 - Math.max(0, c.age / c.life) ** 1.6);
/** How strong a ring is now (0 to 1). */
export const ringStrength = (r: Ripple) => 1 - r.age / r.life;
