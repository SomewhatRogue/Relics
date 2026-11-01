/**
 * Gore: pieces that fly with height and land as stains. A head that comes off, a body that bursts,
 * a blood fountain from the neck, ash from the burned. Cosmetic only (Math.random is fine here).
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

interface Gib { x: number; y: number; z: number; vx: number; vy: number; vz: number; col: string; size: number; head: boolean; big: boolean; bounced: boolean }

const SKIN = ['#5b6b2a', '#4a5a22', '#3a4a1f'], BLOOD = ['#7a1d1d', '#5a1414', '#9a2a2a'], BONE = '#e8e0c8';

export class Gore {
  gibs: Gib[] = [];

  constructor(private fx: Fx) {}

  private fling(x: number, y: number, z: number, n: number, cols: string[], speed: number, lift: number, size: number, dx = 0, dy = 0): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.9);
      this.gibs.push({ x, y, z, vx: Math.cos(a) * s + dx * speed * 0.6, vy: Math.sin(a) * s * 0.6 + dy * speed * 0.4, vz: lift * (0.5 + Math.random()), col: cols[i % cols.length], size, head: false, big: false, bounced: false });
    }
  }

  /** Wood flying apart: a broken barrel, crate or table. */
  splinters(x: number, y: number, big: boolean, dx: number, dy: number): void {
    this.fling(x, y, 6, big ? 18 : 10, ['#8b6a3a', '#7a5230', '#5a3d22', '#4a4652'], big ? 80 : 60, 90, 2, dx, dy);
    this.fling(x, y, 6, 10, ['#9a7a4a', '#6b4a2b'], 70, 120, 1, dx, dy);
  }

  /** A goblin died (x, y in screen pixels). */
  death(ev: Extract<FightEvent, { k: 'death' }>, x: number, y: number): void {
    const fx = this.fx, big = ev.kind === 'butcher', neck = big ? 18 : 10, l = Math.hypot(ev.dx, ev.dy) || 1, dx = ev.dx / l, dy = ev.dy / l;
    if (ev.how === 'behead') {
      this.gibs.push({ x, y, z: neck, vx: dx * 70 + (Math.random() - 0.5) * 30, vy: dy * 40, vz: 120, col: SKIN[0], size: big ? 5 : 3, head: true, big, bounced: false });
      // The fountain from the neck: spurts that climb and fall, staining the floor.
      for (let i = 0; i < 34; i++) {
        this.gibs.push({ x: x + (Math.random() - 0.5) * 2, y, z: neck, vx: (Math.random() - 0.5) * 30 + dx * 15, vy: (Math.random() - 0.5) * 16, vz: 40 + Math.random() * 90, col: BLOOD[i % 3], size: 1, head: false, big: false, bounced: true });
      }
      fx.say(x, y - neck - 22, 'BEHEADED', '#ff6a5a');
      fx.shake = Math.max(fx.shake, 4);
    } else if (ev.how === 'burst') {
      this.fling(x, y, neck * 0.6, big ? 22 : 14, [...SKIN, ...BLOOD], big ? 90 : 75, 110, 2, dx, dy);
      this.fling(x, y, neck * 0.6, 5, [BONE], 70, 120, 1, dx, dy);
      for (let i = 0; i < (big ? 70 : 45); i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * (big ? 16 : 10);
        fx.decal(x + Math.cos(a) * r + dx * r * 0.6, y + Math.sin(a) * r * 0.5 + dy * r * 0.4, BLOOD[i % 3]);
      }
      fx.burst(x, y - neck * 0.6, 30, BLOOD, 110, false, 200, true);
      fx.say(x, y - neck - 22, 'SPLATTERED', '#ff6a5a');
      fx.shake = Math.max(fx.shake, 6);
    } else if (ev.how === 'burn') {
      fx.burst(x, y - 8, 22, ['#1a1614', '#2a2420', '#ff9a3c'], 40, true);
      fx.say(x, y - neck - 20, 'BURNED', '#ff9a3c');
    } else if (ev.how === 'shatter') {
      fx.burst(x, y - 8, 12, BLOOD, 60, false, 200, true);
    } else {
      fx.burst(x, y - 10, 26, [...BLOOD, '#3a4a1f'], 80, false, 160, true);
      fx.say(x, y - 34, 'SLAIN', '#ffe070');
      fx.shake = Math.max(fx.shake, 4);
    }
  }

  update(dt: number): void {
    for (const g of this.gibs) {
      g.vz -= 320 * dt;
      g.z += g.vz * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.z > 0) continue;
      g.z = 0;
      // One bounce, then it rests where it lands.
      if (!g.bounced && g.vz < -60) (g.bounced = true), (g.vz = -g.vz * 0.3), (g.vx *= 0.5), (g.vy *= 0.5);
      else g.vz = g.vx = g.vy = 0;
    }
    for (const g of this.gibs) if (g.z === 0 && g.vz === 0) this.settle(g);
    this.gibs = this.gibs.filter((g) => g.z > 0 || g.vz !== 0);
  }

  /** A landed piece becomes part of the floor. */
  private settle(g: Gib): void {
    const s = g.size;
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) this.fx.decal(g.x + i - s / 2, g.y + j - s / 2, g.col);
    if (g.head) {
      this.fx.decal(g.x - 1, g.y - 1, '#7a1d1d');
      this.fx.decal(g.x + (g.big ? 1 : 0), g.y, '#141218');
      for (let i = 0; i < 6; i++) this.fx.decal(g.x + (Math.random() - 0.5) * 6, g.y + Math.random() * 3, BLOOD[i % 3]);
    }
  }

  draw(g2: CanvasRenderingContext2D, glow: CanvasRenderingContext2D, cx: number, cy: number): void {
    for (const g of this.gibs) {
      const x = Math.round(g.x - cx), y = Math.round(g.y - g.z - cy), s = g.size;
      g2.fillStyle = 'rgba(8,6,12,0.45)';
      g2.fillRect(Math.round(g.x - cx - s / 2), Math.round(g.y - cy), s, 1);
      g2.fillStyle = g.col;
      g2.fillRect(x - Math.floor(s / 2), y - Math.floor(s / 2), s, s);
      if (g.head) {
        // Still glaring as it flies: the eyes stay lit.
        glow.fillStyle = '#ff4a3a';
        glow.fillRect(x - 1, y - 1, 1, 1);
        glow.fillRect(x + 1, y - 1, 1, 1);
        g2.fillStyle = '#7a1d1d';
        g2.fillRect(x - Math.floor(s / 2), y + Math.ceil(s / 2) - 1, s, 1);
      }
    }
  }
}
