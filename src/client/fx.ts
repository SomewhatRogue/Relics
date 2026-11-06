/**
 * Effects that only decorate: sparks, blood (that stays on the floor), floating calls ("PARRY"),
 * rings, screen shake and short flashes of light. Cosmetic, so Math.random is fine here.
 */
import { foeFx } from './fxfoes';
import { staitheFx } from './fxstaithe';
import { woodFx } from './fxwood';
import type { FightEvent, Hero } from '../sim/types';
import { magicFx } from './fxmagic';
import { Gore } from './gore';
import type { Light } from './light';
import { drawText, textWidth } from './pixfont';
import { toPx } from './world';
import { CRY } from './captives';
import { spiderFx } from './fxspiders';
import { weakFx } from './fxweak';
import { rushFx } from './fxrush';
import { venomFx } from './fxvenom';
import { warriorFx } from './fxwarrior';
import { rangerFx } from './fxranger';
import { mageFx } from './fxmage';
import { clericFx } from './fxcleric';
import { levelFx } from './fxlevel';
import { skillFx } from './fxskills';
import { relicFx } from './fxrelics';
import { cageFx } from './fxcages';
import { mageTapFx } from './fxmagetap';
import { techFx } from './fxtech';
import { stormFx } from './fxstorm';
import { ladderFx } from './fxladder';
import { signFx } from './fxsign';
import { Wet } from './wetfx';
import { iceFx } from './fxice';
import { worldFx } from './fxworld';
import { chalkFx } from './chalkfx';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; glow: boolean; grav: number; stick: boolean }
interface Text { x: number; y: number; s: string; col: string; life: number; rise?: number }
interface Ring { x: number; y: number; life: number; max: number; col: string; size?: number }
/** A lightning arc between two points, in world pixels. */
interface Arc { x: number; y: number; x2: number; y2: number; life: number; col?: string; /** A straight line (a glinted bolt's path), not lightning. */ straight?: boolean }
interface Flash extends Light { life: number; max: number }

export class Fx {
  /** Deaths a moment apart (a bunch splattered by one swing). */
  private bunch = 0;
  private bunchAt = -1e9;
  parts: Part[] = [];
  texts: Text[] = [];
  rings: Ring[] = [];
  flashes: Flash[] = [];
  arcs: Arc[] = [];
  decals: { x: number; y: number; col: string }[] = [];
  shake = 0;
  gore = new Gore(this);
  /** The water's own effects: blood clouding in it, rings, things sinking (wetfx.ts). */
  wet = new Wet();
  /** The room's heroes (set each frame), so an effect can tell whose cast it was. */
  heroes: readonly Hero[] = [];

  burst(x: number, y: number, n: number, cols: string[], speed: number, glow: boolean, grav = 0, stick = false): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8), life = 0.25 + Math.random() * 0.35;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (grav ? speed * 0.6 : 0), life, max: life, col: cols[i % cols.length], glow, grav, stick });
    }
  }

  /** Words that rise and fade over (x, y); `life` seconds (rising slower the longer they stay). */
  say(x: number, y: number, s: string, col: string, life = 0.8): void {
    this.texts.push({ x, y, s, col, life, rise: 18 * Math.min(1, 0.8 / life) });
  }

  /** A jagged crack in the stone, left for good (javelins, slams into walls). */
  crack(x: number, y: number, len: number): void {
    for (let b = 0; b < 3; b++) {
      let cx = x, cy = y, a = Math.random() * Math.PI * 2;
      for (let i = 0; i < len; i++) {
        a += (Math.random() - 0.5) * 1.2;
        cx += Math.cos(a);
        cy += Math.sin(a) * 0.8;
        this.decal(cx, cy, i < 2 ? '#0e0c12' : '#1a1720');
      }
    }
  }

  /** A crater: a dark bowl ringed with cracks (the butcher's slam). */
  crater(x: number, y: number, r: number): void {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy * 1.4);
      if (d < r * 0.55) this.decal(x + dx, y + dy, Math.random() < 0.5 ? '#1d1a24' : '#24212c');
      else if (d < r * 0.7 && Math.random() < 0.6) this.decal(x + dx, y + dy, '#5a5468');
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
      this.crack(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.45, 5 + Math.floor(Math.random() * 6));
    }
  }

  decal(x: number, y: number, col: string): void {
    // Landing in water: it clouds there (or is lost), never a stain on the surface.
    if (this.wet.take(x, y, col)) return;
    if (this.decals.length > 4000) this.decals.shift();
    this.decals.push({ x: Math.round(x), y: Math.round(y), col });
  }

  debris(x: number, y: number, n: number): void {
    this.burst(x, y, n, ['#6a647a', '#4f4a5c', '#8a8494'], 70, false, 220, true);
  }

  on(ev: FightEvent): void {
    const [x, y] = toPx(ev.x, ev.y);
    mageTapFx(this, ev, x, y, this.heroes);
    if (chalkFx(this, ev, x, y)) return;
    if (foeFx(this, ev, x, y) || staitheFx(this, ev, x, y) || woodFx(this, ev, x, y) || rushFx(this, ev, x, y) || spiderFx(this, ev, x, y) || weakFx(this, ev, x, y) || venomFx(this, ev, x, y) || warriorFx(this, ev, x, y) || rangerFx(this, ev, x, y) || mageFx(this, ev, x, y) || clericFx(this, ev, x, y) || levelFx(this, ev, x, y) || skillFx(this, ev, x, y) || relicFx(this, ev, x, y) || cageFx(this, ev, x, y) || techFx(this, ev, x, y) || stormFx(this, ev, x, y) || ladderFx(this, ev, x, y) || iceFx(this, ev, x, y) || worldFx(this, ev, x, y) || signFx(this, ev, x, y)) return;
    switch (ev.k) {
      case 'impact':
        if (ev.kind === 'slam') {
          this.crater(x, y, 13);
          this.debris(x, y - 2, 22);
          this.rings.push({ x, y, life: 0.35, max: 0.35, col: '#d8c8a8' });
          this.shake = Math.max(this.shake, 6);
          this.flashes.push({ x, y: y - 4, r: 60, i: 0.6, c: [1, 0.6, 0.35], life: 0.12, max: 0.12 });
        } else if (ev.kind === 'hex') {
          // The ground under a hex goes up: clods, green fire, a scorch left behind.
          this.crater(x, y, 9);
          this.debris(x, y - 2, 10);
          this.burst(x, y - 3, 22, ['#9be040', '#d8ff90', '#5a8a20'], 75, true);
          this.rings.push({ x, y, life: 0.3, max: 0.3, col: '#9be040' });
          this.shake = Math.max(this.shake, 3);
          this.flashes.push({ x, y: y - 4, r: 50, i: 0.6, c: [0.55, 1, 0.3], life: 0.14, max: 0.14 });
        } else if (ev.kind === 'cleave') this.shake = Math.max(this.shake, 1.5);
        else if (ev.kind === 'charge') (this.shake = Math.max(this.shake, 4)), this.debris(x, y - 2, 10);
        break;
      case 'stunned':
        this.say(x, y - 34, 'STUNNED', '#ffe070');
        break;
      // The prologue's cutscene: the ground going, the bite, the body landing, the bellow.
      case 'channeled': {
        const col = ev.el === 'fire' ? '#ff8a3c' : ev.el === 'frost' ? '#9fe0ff' : '#e8e07a';
        this.burst(x, y - 9, 26, [col, '#ffffff'], 80, true);
        this.rings.push({ x, y: y - 9, life: 0.4, max: 0.4, col });
        this.say(x, y - 30, ev.el.toUpperCase(), col);
        break;
      }
      case 'snareset':
        this.burst(x, y - 1, 6, ['#8a6a3a', '#5a3d22'], 25, false, 120, true);
        break;
      case 'noblock':
        this.say(x, y - 30, "CAN'T BLOCK: TAP TO PARRY", '#c8c4d0');
        break;
      case 'noguard':
        this.say(x, y - 30, "CAN'T BLOCK: " + ({ roll: 'ROLL', backstep: 'JUMP', dash: 'DASH', blink: 'BLINK' } as Record<string, string>)[(ev as { dodge?: string }).dodge ?? 'roll'], '#c8c4d0');
        break;
      case 'fanfare':
        this.flashes.push({ x, y: y - 24, r: 140, i: 1.1, c: [1, 0.85, 0.5], life: 1.2, max: 1.2 });
        for (let i = 0; i < 3; i++) this.rings.push({ x, y: y - 24, life: 0.6 + i * 0.3, max: 0.6 + i * 0.3, col: '#ffe9a8' });
        this.burst(x, y - 26, 30, ['#fff6d0', '#ffd27a', '#ffb35a'], 70, true);
        break;
      case 'rumble':
        this.shake = Math.max(this.shake, 3);
        this.debris(x, y - 10, 14);
        break;
      case 'bite':
        this.burst(x, y - 40, 46, ['#9a0f0f', '#c41a1a', '#6a0808', '#e03a2a'], 110, false, 260, true);
        this.burst(x, y - 40, 14, ['#ff4a3a'], 60, true);
        this.flashes.push({ x, y: y - 40, r: 70, i: 0.9, c: [1, 0.2, 0.15], life: 0.25, max: 0.25 });
        this.shake = Math.max(this.shake, 7);
        break;
      case 'thud':
        this.debris(x, y - 2, 12);
        for (let i = 0; i < 18; i++) this.decal(x - 8 + Math.random() * 16, y - 2 + Math.random() * 5, i % 2 ? '#6a0a0a' : '#8a1212');
        this.shake = Math.max(this.shake, 3);
        break;
      case 'bellow':
        this.shake = Math.max(this.shake, 14);
        for (let i = 0; i < 3; i++) this.rings.push({ x, y: y - 20, life: 0.5 + i * 0.25, max: 0.5 + i * 0.25, col: '#ff8a5a' });
        this.flashes.push({ x, y: y - 20, r: 120, i: 0.7, c: [1, 0.4, 0.2], life: 0.5, max: 0.5 });
        break;
      case 'wallhit':
        this.crack(x, y - 6, 7);
        this.debris(x, y - 6, 8);
        this.shake = Math.max(this.shake, 2);
        break;
      case 'charged':
        this.rings.push({ x, y: y - 8, life: 0.25, max: 0.25, col: '#ffe9a8' });
        this.flashes.push({ x, y: y - 8, r: 40, i: 0.8, c: [1, 0.9, 0.5], life: 0.15, max: 0.15 });
        break;
      case 'heavy':
        this.shake = Math.max(this.shake, 1.5);
        this.burst(x, y, 8, ['#6a647a', '#57525e'], 40, false);
        break;
      case 'weapon':
      case 'relic':
        this.say(x, y - 30, ev.name, '#e8e4ee');
        break;
      case 'pinned':
        this.say(x, y - 30, 'PINNED', '#9fe8ff');
        this.crack(x, y - 8, 9);
        this.debris(x, y - 8, 14);
        this.shake = Math.max(this.shake, 4);
        this.flashes.push({ x, y: y - 8, r: 50, i: 1, c: [0.6, 0.9, 1], life: 0.15, max: 0.15 });
        break;
      case 'javwall':
        this.crack(x, y - 8, 6);
        this.debris(x, y - 8, 10);
        this.burst(x, y - 8, 6, ['#ffffff', '#9fe8ff'], 60, true);
        this.shake = Math.max(this.shake, 2);
        break;
      case 'javstick':
        this.burst(x, y - 10, 8, ['#7a1d1d', '#5a1414'], 50, false, 160, true);
        this.shake = Math.max(this.shake, 2);
        break;
      case 'latch':
        this.burst(x, y - 8, 6, ['#ffffff', '#9fe8ff'], 50, true);
        break;
      case 'yank':
        this.say(x, y - 24, 'YANK', '#9fe8ff');
        break;
      case 'land':
        this.burst(x, y, 8, ['#6a647a', '#57525e'], 35, false);
        this.shake = Math.max(this.shake, 1.5);
        break;
      case 'hit':
        if (ev.tick) {
          // (A storm stream ticks ten times a second: its sparks, and only some of its numbers.)
          const venom = ev.src === 'poison', spark = ev.src === 'spark';
          this.burst(x, y - 10, spark ? 2 : 3, venom ? ['#9be040', '#6ab82a'] : spark ? ['#fff27a', '#ffffff'] : ['#ffd27a', '#ff9a3c'], 30, true);
          if (!spark || Math.random() < 0.3) this.say(x, y - 20, String(ev.n), venom ? '#9be040' : spark ? '#fff27a' : '#ff9a3c');
          break;
        }
        this.burst(x, y - 8, ev.heavy ? 12 : 7, ['#ffffff', '#fff1b0', '#ffd27a'], ev.heavy ? 70 : 50, true);
        this.burst(x, y - 6, ev.heavy ? 10 : 5, ['#7a1d1d', '#5a1414', '#9a2a2a'], 45, false, 160, true);
        this.say(x, y - 22, String(ev.n), ev.on === 'hero' ? '#ff6a5a' : ev.marked ? '#ffc23a' : ev.counter ? '#ffa040' : ev.heavy ? '#ffe070' : '#ffffff');
        if (ev.marked) {
          // MARK biting (shared/signs.ts): a gold ring and sparks, bigger on a heavy, and a touch more weight.
          this.rings.push({ x, y: y - 8, life: 0.22, max: 0.22, col: '#ffc23a', size: ev.heavy ? 18 : 11 });
          this.burst(x, y - 8, ev.heavy ? 14 : 7, ['#ffc23a', '#fff1b0', '#ffffff'], ev.heavy ? 80 : 60, true);
          this.flashes.push({ x, y: y - 8, r: ev.heavy ? 48 : 30, i: 0.9, c: [1, 0.78, 0.3], life: 0.1, max: 0.1 });
          this.shake = Math.max(this.shake, ev.heavy ? 3 : 1.5);
        }
        if (ev.counter) this.say(x, y - 30, 'COUNTER', '#ffa040');
        if (ev.boarded) this.say(x, y - 30, 'BLOCKED', '#c8b090');
        if (ev.ambush) (this.say(x, y - 30, 'AMBUSH', '#9affc0'), this.burst(x, y - 8, 12, ['#9affc0', '#ffffff'], 70, true));
        else if (ev.crit && !ev.counter && !ev.backstab) (this.say(x, y - 30, 'CRIT', '#ffe070'), this.burst(x, y - 8, 8, ['#ffe070', '#ffffff'], 65, true));
        if (ev.backstab) {
          this.say(x, y - (ev.counter ? 38 : 30), 'BACKSTAB', '#d8a0ff');
          this.burst(x, y - 8, 14, ['#7a1d1d', '#9a2a2a', '#5a1414'], 70, false, 180, true);
          this.burst(x, y - 8, 8, ['#d8a0ff', '#ffffff'], 60, true);
          this.flashes.push({ x, y: y - 8, r: 40, i: 0.8, c: [0.8, 0.6, 1], life: 0.12, max: 0.12 });
        }
        this.shake = Math.max(this.shake, ev.on === 'hero' ? 3 : ev.heavy ? 2 : 1);
        this.flashes.push({ x, y: y - 8, r: 34, i: 0.7, c: [1, 0.8, 0.5], life: 0.08, max: 0.08 });
        break;
      case 'block':
        this.burst(x, y - 8, 7, ['#ffd27a', '#ff9a40', '#ffffff'], 55, true);
        this.say(x, y - 24, 'BLOCK', '#c8c4d0');
        this.shake = Math.max(this.shake, 1);
        break;
      case 'spotted':
        this.say(x, y - 22, '!', '#ff6a5a');
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
      case 'slip':
        this.say(x, y - 38, 'LAST SECOND', '#ffd27a');
        this.shake = Math.max(this.shake, 2);
        break;
      case 'winded':
        this.say(x, y - 30, 'WINDED', '#c84a3a');
        break;
      case 'roll':
        this.burst(x, y, 6, ['#6a647a', '#57525e'], 25, false);
        break;
      case 'death': {
        this.gore.death(ev, x, y);
        // Several cut down together: each one more shakes harder and sprays more (SPLAT, splatting a bunch).
        const t = performance.now();
        this.bunch = t - this.bunchAt < 160 ? this.bunch + 1 : 1;
        this.bunchAt = t;
        if (this.bunch > 1 && ev.kind === 'scrapper') this.gore.bunch(x, y, ev.dx, ev.dy, this.bunch);
        break;
      }
      case 'down':
        this.say(x, y - 26, 'DOWN', '#ff5a4a');
        break;
      case 'out':
        this.say(x, y - 26, 'OUT', '#a04a4a', 2);
        break;
      case 'gotup':
        this.say(x, y - 26, 'UP', '#ffd27a');
        break;
      case 'survivorhit':
        // Someone you freed, hurt by the party: blood, the number, and a cry (not for every burn).
        this.burst(x, y - 6, ev.tick ? 3 : 8, ['#7a1d1d', '#5a1414', '#9a2a2a'], 45, false, 160, true);
        this.say(x, y - 18, String(ev.n), '#ff6a5a');
        if (!ev.tick) (this.say(x, y - 26, CRY, '#f0e0b0'), (this.shake = Math.max(this.shake, 1.5)));
        break;
      case 'survivorhome':
        this.say(x, y - 26, 'SAVED', '#9affc0', 1.6);
        break;
      case 'survivordeath':
        this.burst(x, y - 6, 16, ['#7a1d1d', '#5a1414', '#9a2a2a'], 70, false, 180, true);
        break;
      default:
        magicFx(this, ev, x, y);
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
      if (p.life <= 0 && p.stick && this.decals.length < 600 && !this.wet.take(p.x, p.y, p.col)) this.decals.push({ x: Math.round(p.x), y: Math.round(p.y), col: p.col });
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const t of this.texts) (t.life -= dt), (t.y -= (t.rise ?? 18) * dt);
    this.texts = this.texts.filter((t) => t.life > 0);
    this.gore.update(dt);
    this.wet.update(dt);
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter((a) => a.life > 0);
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
    this.gore.draw(lit, g, cx, cy);
    for (const p of this.parts) {
      const ctx = p.glow ? g : lit;
      ctx.globalAlpha = p.glow ? Math.min(1, (p.life / p.max) * 1.5) : 1;
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1);
    }
    g.globalAlpha = 1;
    lit.globalAlpha = 1;
    for (const r of this.rings) {
      const k = 1 - r.life / r.max, rad = 4 + k * (r.size ?? 22);
      g.globalAlpha = 1 - k;
      g.fillStyle = r.col;
      for (let a = 0; a < 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        g.fillRect(Math.round(r.x - cx + Math.cos(t) * rad), Math.round(r.y - cy + Math.sin(t) * rad * 0.7), 1, 1);
      }
    }
    g.globalAlpha = 1;
    // Lightning: a jagged line, re-jagged every frame.
    for (const a of this.arcs) {
      g.fillStyle = Math.random() < 0.5 ? '#ffffff' : a.col ?? '#fff27a';
      const n = Math.max(2, Math.round(Math.hypot(a.x2 - a.x, a.y2 - a.y) / 3));
      for (let i = 0; i <= n; i++) {
        const k = i / n, j = i && i < n && !a.straight ? (Math.random() - 0.5) * 5 : 0;
        g.fillRect(Math.round(a.x + (a.x2 - a.x) * k - cx + j), Math.round(a.y + (a.y2 - a.y) * k - cy - 10 + j), 1, 1);
      }
    }
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
