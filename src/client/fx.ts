/**
 * Effects that only decorate: sparks, blood (that stays on the floor), floating calls ("PARRY"),
 * rings, screen shake and short flashes of light. Cosmetic, so Math.random is fine here.
 */
import type { FightEvent } from '../sim/types';
import type { Light } from './light';
import { drawText, textWidth } from './pixfont';
import { toPx } from './world';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; glow: boolean; grav: number; stick: boolean }
interface Text { x: number; y: number; s: string; col: string; life: number }
interface Ring { x: number; y: number; life: number; max: number; col: string }
interface Flash extends Light { life: number; max: number }

export class Fx {
  parts: Part[] = [];
  texts: Text[] = [];
  rings: Ring[] = [];
  flashes: Flash[] = [];
  decals: { x: number; y: number; col: string }[] = [];
  shake = 0;

  private burst(x: number, y: number, n: number, cols: string[], speed: number, glow: boolean, grav = 0, stick = false): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8), life = 0.25 + Math.random() * 0.35;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (grav ? speed * 0.6 : 0), life, max: life, col: cols[i % cols.length], glow, grav, stick });
    }
  }

  private say(x: number, y: number, s: string, col: string): void {
    this.texts.push({ x, y, s, col, life: 0.8 });
  }

  on(ev: FightEvent): void {
    const [x, y] = toPx(ev.x, ev.y);
    switch (ev.k) {
      case 'hit':
        this.burst(x, y - 8, ev.heavy ? 12 : 7, ['#ffffff', '#fff1b0', '#ffd27a'], ev.heavy ? 70 : 50, true);
        this.burst(x, y - 6, ev.heavy ? 10 : 5, ['#7a1d1d', '#5a1414', '#9a2a2a'], 45, false, 160, true);
        this.say(x, y - 22, String(ev.n), ev.on === 'hero' ? '#ff6a5a' : ev.counter ? '#ffa040' : ev.heavy ? '#ffe070' : '#ffffff');
        if (ev.counter) this.say(x, y - 30, 'COUNTER', '#ffa040');
        this.shake = Math.max(this.shake, ev.on === 'hero' ? 3 : ev.heavy ? 2 : 1);
        this.flashes.push({ x, y: y - 8, r: 34, i: 0.7, c: [1, 0.8, 0.5], life: 0.08, max: 0.08 });
        break;
      case 'block':
        this.burst(x, y - 8, 7, ['#ffd27a', '#ff9a40', '#ffffff'], 55, true);
        this.say(x, y - 24, 'BLOCK', '#c8c4d0');
        this.shake = Math.max(this.shake, 1);
        break;
      case 'parry':
        this.burst(x, y - 8, 18, ['#ffffff', '#cfe8ff', '#9fd0ff'], 90, true);
        this.rings.push({ x, y: y - 8, life: 0.3, max: 0.3, col: '#e8f4ff' });
        this.say(x, y - 26, 'PARRY', '#bfe4ff');
        this.shake = Math.max(this.shake, 3);
        this.flashes.push({ x, y: y - 8, r: 80, i: 1.4, c: [0.8, 0.9, 1], life: 0.18, max: 0.18 });
        break;
      case 'guardbreak':
        this.say(x, y - 26, 'GUARD BREAK', '#ff5a4a');
        this.shake = Math.max(this.shake, 3);
        break;
      case 'dodge':
        this.say(x, y - 24, 'DODGE', '#7fe0c8');
        break;
      case 'roll':
        this.burst(x, y, 6, ['#6a647a', '#57525e'], 25, false);
        break;
      case 'death':
        this.burst(x, y - 10, 26, ['#7a1d1d', '#5a1414', '#9a2a2a', '#3a4a1f'], 80, false, 160, true);
        this.say(x, y - 34, 'SLAIN', '#ffe070');
        this.shake = 4;
        break;
      case 'down':
        this.say(x, y - 26, 'DOWN', '#ff5a4a');
        break;
    }
  }

  update(dt: number): void {
    for (const p of this.parts) {
      p.life -= dt;
      p.vy += p.grav * dt;
      p.vx *= 0.92;
      p.vy *= p.grav ? 0.98 : 0.92;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 && p.stick && this.decals.length < 600) this.decals.push({ x: Math.round(p.x), y: Math.round(p.y), col: p.col });
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const t of this.texts) (t.life -= dt), (t.y -= 18 * dt);
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter((f) => f.life > 0);
    this.shake = Math.max(0, this.shake - dt * 20);
  }

  /** Blood on the floor: drawn into the lit layer, under everyone. */
  drawDecals(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    for (const d of this.decals) {
      g.fillStyle = d.col;
      g.fillRect(d.x - cx, d.y - cy, 1, 1);
    }
  }

  /** Sparks, rings and calls: drawn into the glowing layer. */
  drawGlow(g: CanvasRenderingContext2D, lit: CanvasRenderingContext2D, cx: number, cy: number): void {
    for (const p of this.parts) {
      const ctx = p.glow ? g : lit;
      ctx.globalAlpha = p.glow ? Math.min(1, (p.life / p.max) * 1.5) : 1;
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1);
    }
    g.globalAlpha = 1;
    lit.globalAlpha = 1;
    for (const r of this.rings) {
      const k = 1 - r.life / r.max, rad = 4 + k * 22;
      g.globalAlpha = 1 - k;
      g.fillStyle = r.col;
      for (let a = 0; a < 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        g.fillRect(Math.round(r.x - cx + Math.cos(t) * rad), Math.round(r.y - cy + Math.sin(t) * rad * 0.7), 1, 1);
      }
    }
    g.globalAlpha = 1;
    for (const t of this.texts) {
      g.globalAlpha = Math.min(1, t.life * 3);
      drawText(g, t.s, Math.round(t.x - cx - textWidth(t.s) / 2), Math.round(t.y - cy), t.col);
    }
    g.globalAlpha = 1;
  }

  lights(cx: number, cy: number): Light[] {
    return this.flashes.map((f) => ({ ...f, x: f.x - cx, y: f.y - cy, i: f.i * (f.life / f.max) }));
  }
}
