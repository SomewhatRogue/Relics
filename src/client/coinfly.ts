/**
 * Coins flying to you (Kyle, 2026-11-13): when a pile of gold is picked up, its coins hop off the floor and
 * fly into whoever walked over it, a glint where each lands. Cosmetic only (Math.random is fine): the room
 * has already split the gold. A pile counts as picked up when it goes from the room with a hero over it and
 * life still in it (a pile that fades, or a room left behind, flies nowhere). World pixels, like fx.ts.
 */
import type { Hero } from '../sim/types';
import type { Pickup } from '../sim/pickups';
import { COINS } from '../shared/potions';
import { OX, OY, PX } from './world';

interface Coin { x: number; y: number; z: number; to: string; t: number; dur: number; x0: number; y0: number; hop: number }
interface Glint { x: number; y: number; z: number; life: number }

const CHEST = 18;

export class CoinFly {
  coins: Coin[] = [];
  glints: Glint[] = [];
  private seen = new Map<number, Pickup>();

  /** Each frame: piles gone since the last one, with a hero on them, send their coins. */
  track(pickups: readonly Pickup[], heroes: readonly Hero[]): void {
    const now = new Set(pickups.map((p) => p.id));
    for (const [id, p] of this.seen) {
      if (now.has(id) || !p.gold || p.life < 0.5) continue;
      const h = heroes.filter((o) => o.id !== 'squire').map((o) => ({ o, d: Math.hypot(o.x - p.x, o.y - p.y) })).sort((a, b) => a.d - b.d)[0];
      if (!h || h.d > COINS.reach + 0.5) continue;
      const n = Math.max(3, Math.min(12, Math.round(p.gold / 4)));
      for (let i = 0; i < n; i++) {
        const x0 = OX + p.x * PX + (Math.random() - 0.5) * 8, y0 = OY + p.y * PX + (Math.random() - 0.5) * 4;
        this.coins.push({ x: x0, y: y0, z: 0, to: h.o.id, t: -i * 0.035, dur: 0.38 + Math.random() * 0.12, x0, y0, hop: 8 + Math.random() * 8 });
      }
    }
    this.seen = new Map(pickups.map((p) => [p.id, { ...p }]));
  }

  /** Each frame: every coin along its arc to its hero's chest, lifting off first; a glint where it lands. */
  update(dt: number, heroes: readonly Hero[]): void {
    this.coins = this.coins.filter((c) => {
      c.t += dt;
      const h = heroes.find((o) => o.id === c.to);
      if (!h) return false;
      const k = Math.max(0, Math.min(1, c.t / c.dur)), e = k * k * (3 - 2 * k), hx = OX + h.x * PX, hy = OY + h.y * PX;
      c.x = c.x0 + (hx - c.x0) * e;
      c.y = c.y0 + (hy - c.y0) * e;
      c.z = CHEST * e + c.hop * Math.sin(Math.PI * k);
      if (k < 1) return true;
      if (this.glints.length < 40) this.glints.push({ x: hx + (Math.random() - 0.5) * 6, y: hy, z: CHEST + (Math.random() - 0.5) * 6, life: 0.18 });
      return false;
    });
    this.glints = this.glints.filter((g) => (g.life -= dt) > 0);
  }

  /** Each coin and glint as a world point with its height above the floor (pixels): `put` draws them. */
  each(put: (x: number, y: number, z: number, col: string, w: number) => void): void {
    for (const c of this.coins) {
      if (c.t < 0) continue;
      const turn = Math.floor(c.t * 18) % 3;
      put(c.x, c.y, c.z, turn ? '#ecc860' : '#fff1b0', turn === 2 ? 1 : 2);
    }
    for (const g of this.glints) put(g.x, g.y, g.z, '#ffffff', 1);
  }

  /** The flat view: into the glowing layer, a coin's height lifting it up the screen. */
  draw(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.each((x, y, z, col, w) => ((g.fillStyle = col), g.fillRect(Math.round(x - cx - w / 2), Math.round(y - z - cy - w / 2), w, w)));
  }
}
