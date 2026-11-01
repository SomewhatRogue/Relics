/**
 * One frame: camera, the flat (lit) layer in depth order, the glowing layer, then the lighting pass.
 * The scene is painted at a low resolution and scaled up by a whole number so pixels stay crisp.
 */
import { ARENA } from '../shared/arena';
import type { ArenaRoom } from '../sim/room';
import { drawHero } from './actors';
import { blit, type Ctx } from './draw';
import { drawEnemy, drawTelegraph } from './foes';
import { drawHook, drawJavelin } from './relicsdraw';
import type { Fx } from './fx';
import { Lighting, type Light } from './light';
import { SPRITES } from './sprites';
import { OX, OY, PX, WORLD_H, WORLD_W, paintRoom } from './world';

const AMBIENT: [number, number, number] = [0.2, 0.19, 0.27];

export class Scene {
  vw = 0;
  vh = 0;
  scale = 1;
  private dpr = 1;
  private base = document.createElement('canvas');
  private glowC = document.createElement('canvas');
  private lit = this.base.getContext('2d')!;
  private glow = this.glowC.getContext('2d')!;
  private lighting: Lighting;
  private bg = paintRoom();
  private cam = { x: 0, y: 0, ready: false };
  private heroAt: [number, number] | null = null;

  constructor(private out: HTMLCanvasElement) {
    this.lighting = new Lighting(out);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    const W = innerWidth * this.dpr, H = innerHeight * this.dpr;
    this.scale = Math.max(1, Math.round(Math.sqrt((W * H) / 82000)));
    this.vw = Math.ceil(W / this.scale);
    this.vh = Math.ceil(H / this.scale);
    for (const c of [this.out, this.base, this.glowC]) (c.width = this.vw), (c.height = this.vh);
    this.out.style.width = (this.vw * this.scale) / this.dpr + 'px';
    this.out.style.height = (this.vh * this.scale) / this.dpr + 'px';
    for (const g of [this.lit, this.glow]) g.imageSmoothingEnabled = false;
  }

  /** My hero's position on screen in CSS pixels (for aiming with the mouse). */
  heroScreen(): [number, number] | null {
    if (!this.heroAt) return null;
    const k = this.scale / this.dpr;
    return [(this.heroAt[0] - this.cam.x) * k, (this.heroAt[1] - 8 - this.cam.y) * k];
  }

  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number): void {
    const a = room.alpha;
    const lerp = (key: string, x: number, y: number): [number, number] => {
      const p = room.prev.get(key);
      const ix = p ? p[0] + (x - p[0]) * a : x, iy = p ? p[1] + (y - p[1]) * a : y;
      return [OX + ix * PX, OY + iy * PX];
    };
    const me = room.heroes.find((h) => h.id === meId);
    if (me) {
      const [hx, hy] = lerp('h:' + me.id, me.x, me.y);
      this.heroAt = [hx, hy];
      const portrait = this.vh > this.vw * 1.2;
      const tx = hx + me.fx * 10 - this.vw / 2, ty = hy - 8 + me.fy * 8 - this.vh / 2 + (portrait ? this.vh * 0.12 : 0);
      const k = this.cam.ready ? Math.min(1, dt * 7) : 1;
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
      this.cam.ready = true;
    }
    const clamp = (v: number, size: number, world: number) => (size >= world ? (world - size) / 2 : Math.max(0, Math.min(world - size, v)));
    this.cam.x = clamp(this.cam.x, this.vw, WORLD_W);
    this.cam.y = clamp(this.cam.y, this.vh, WORLD_H);
    const sh = fx.shake;
    const cx = Math.round(this.cam.x + (Math.random() - 0.5) * sh), cy = Math.round(this.cam.y + (Math.random() - 0.5) * sh);

    const lit = this.lit, glow = this.glow, c: Ctx = { lit, glow, now };
    lit.fillStyle = '#0d0b10';
    lit.fillRect(0, 0, this.vw, this.vh);
    lit.drawImage(this.bg, -cx, -cy);
    fx.drawDecals(lit, cx, cy);
    glow.clearRect(0, 0, this.vw, this.vh);
    for (const e of room.enemies) if (e.attack && e.act === 'attack') drawTelegraph(c, e.attack, cx, cy);

    const items: { y: number; draw: () => void }[] = [];
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      items.push({ y, draw: () => drawHero(c, h, x - cx, y - cy, h.id === meId) });
    }
    for (const e of room.enemies) {
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      items.push({ y, draw: () => drawEnemy(c, e, x - cx, y - cy) });
    }
    for (const j of room.javelins) {
      const x = OX + j.x * PX - cx, y = OY + j.y * PX - cy;
      items.push({ y: OY + j.y * PX + (j.state === 'wall' && j.dy < 0 ? -40 : 0), draw: () => drawJavelin(c, j, x, y) });
    }
    for (const k of room.hooks) {
      const o = room.heroes.find((h) => h.id === k.owner);
      if (!o) continue;
      const [ox, oy] = lerp('h:' + o.id, o.x, o.y);
      items.push({ y: OY + k.y * PX + 1, draw: () => drawHook(c, k, ox - cx, oy - cy, OX + k.x * PX - cx, OY + k.y * PX - cy) });
    }
    for (const p of ARENA.pillars) items.push({ y: OY + p.y * PX, draw: () => blit(c, SPRITES.pillar, OX + p.x * PX - cx, OY + p.y * PX + 5 - cy) });
    for (const b of ARENA.braziers) items.push({ y: OY + b.y * PX, draw: () => this.brazier(c, OX + b.x * PX - cx, OY + b.y * PX + 2 - cy, now) });
    items.push({ y: OY + ARENA.cage.y * PX, draw: () => this.cage(c, OX + ARENA.cage.x * PX - cx, OY + ARENA.cage.y * PX - cy, now) });
    items.sort((p, q) => p.y - q.y);
    for (const it of items) it.draw();

    const lights: Light[] = [];
    for (const t of ARENA.torches) {
      const x = OX + t.x * PX - cx, y = OY + t.y * PX - cy;
      this.flame(glow, x, y - 1, now, 1);
      lights.push({ x, y: y - 3, r: 118 + Math.sin(now * 13 + x) * 4 + Math.sin(now * 7.3) * 3, i: 1.15, c: [1, 0.66, 0.36] });
    }
    for (const b of ARENA.braziers) {
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy;
      lights.push({ x, y: y - 8, r: 78 + Math.sin(now * 11 + x) * 3, i: 0.95, c: [1, 0.6, 0.3] });
    }
    // Moonlight through a ceiling grate over the middle of the room.
    lights.push({ x: OX + (ARENA.w / 2) * PX - cx, y: OY + 8.5 * PX - cy, r: 125, i: 0.42, c: [0.55, 0.62, 0.9] });
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      lights.push({ x: x - cx, y: y - 10 - cy, r: 44, i: 0.35, c: [0.9, 0.86, 0.78] });
    }
    for (const e of room.enemies) {
      const at = e.attack;
      if (!at || at.t >= at.windup) continue;
      const k = at.t / at.windup, ax = at.kind === 'slam' ? at.cx : at.ox + at.dx * at.range * 0.5, ay = at.kind === 'slam' ? at.cy : at.oy + at.dy * at.range * 0.5;
      lights.push({ x: OX + ax * PX - cx, y: OY + ay * PX - cy, r: 40, i: 0.35 * k, c: [1, 0.25, 0.15] });
    }
    for (const j of room.javelins) {
      const x = OX + j.x * PX - cx, y = OY + j.y * PX - cy - 8;
      lights.push({ x, y, r: j.state === 'fly' ? 34 : 14, i: j.state === 'fly' ? 0.6 : 0.3 * Math.min(1, j.life), c: [0.55, 0.85, 1] });
    }
    fx.drawGlow(glow, lit, cx, cy);
    lights.push(...fx.lights(cx, cy));
    this.lighting.render(this.base, this.glowC, lights, AMBIENT);
  }

  private flame(g: CanvasRenderingContext2D, x: number, y: number, now: number, size: number): void {
    const f = Math.floor(now * 10 + x) % 3;
    const px = (dx: number, dy: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1));
    px(0, 0, '#fff1b0');
    px(-1, 0, '#ff9a3c');
    px(1, 0, '#ff9a3c');
    px(0, -1, '#ffd27a');
    px(0, -2 - (f === 0 ? 1 : 0), '#ffb44c');
    px(f === 1 ? 1 : -1, -3, '#ff7a28');
    if (size > 1) px(f === 2 ? -1 : 1, -1, '#ffd27a'), px(0, -4, '#ff6a20');
  }

  private brazier(c: Ctx, x: number, y: number, now: number): void {
    blit(c, SPRITES.brazier, x, y);
    this.flame(c.glow, x - 2, y - 10, now, 2);
    this.flame(c.glow, x + 2, y - 10, now + 0.37, 2);
  }

  private cage(c: Ctx, x: number, y: number, now: number): void {
    const sway = Math.floor(now * 0.7) % 4 === 0 ? 1 : 0;
    blit(c, SPRITES.survivor, x + sway, y + 9);
    c.lit.fillStyle = '#6a6470';
    for (let bx = -12; bx <= 12; bx += 3) c.lit.fillRect(Math.round(x + bx), Math.round(y - 14), 1, 24);
    c.lit.fillStyle = '#57525e';
    for (const by of [-14, -3, 9]) c.lit.fillRect(Math.round(x - 12), Math.round(y + by), 25, 1);
  }
}
