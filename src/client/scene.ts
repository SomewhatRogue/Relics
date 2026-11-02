/**
 * One frame: camera, the flat (lit) layer in depth order, the glowing layer, then the lighting pass.
 * The scene is painted at a low resolution and scaled up by a whole number so pixels stay crisp.
 */
import { ARENA, npcAt, type GameMap } from '../shared/arena';
import { GRAB, GUARD, POTION, TIERS, WEAPONS } from '../shared/tuning';
import { lightsHolder } from './heldkits';
import type { ArenaRoom } from '../sim/room';
import { drawHero } from './actors';
import { drawHound, drawSnare } from './hound';
import type { Hero } from '../sim/types';
import { blit, type Ctx } from './draw';
import { asleep, drawEnemy, drawHeld, drawTelegraph } from './foes';
import { drawDrums } from './backline';
import { camKick } from './heropose';
import { houseOf } from './cottage';
import { EL_LIGHT } from './palette';
import { drawChest, drawFlask, drawPickup, drawSmoke } from './relicsdraw';
/** A '#rrggbb' as light colour 0..1. */
const tint = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
import { drawBolt, drawDrop, drawCoal, drawHook, drawJavelin } from './relicsdraw';
import { drawStatus } from './status';
import { drawLifted, drawProp } from './propsdraw';
import type { Fx } from './fx';
import { Lighting, type Light } from './light';
import { SPRITES } from './sprites';
import { LIFT, OX, OY, PX, paintMap, worldH, worldW } from './world';
import { drawText, textWidth } from './pixfont';
import { blockAt, blockFoot, drawBlock, drawRound } from './blocks';
import { drawNpc } from './npcs';
import { drawCaged, drawSurvivor } from './captives';
import { behindMarks, drawWays } from './wayout';
import { SPOT_REACH } from '../shared/town';
import { dusk } from './streetlife';


/** The view's jolt this frame (heropose.ts), reused. */
const KICK: [number, number] = [0, 0];

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
  private bg: HTMLCanvasElement | null = null;
  private painted: GameMap | null = null;
  private cam = { x: 0, y: 0, ready: false };
  /** A cutscene's point of interest (tiles): the camera eases there instead of following the hero. */
  focus: { x: number; y: number } | null = null;
  /** The relic held up over your head (the wood's find), and where the arrow by your feet points. */
  fanfare = false;
  pointTo: { x: number; y: number } | null = null;
  private heroAt: [number, number] | null = null;

  constructor(private out: HTMLCanvasElement) {
    this.lighting = new Lighting(out);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** The relic (the javelin) held over your head in a turning ring of light. */
  private heldUp(c: Ctx, x: number, y: number, t: number): void {
    const top = Math.round(y - 34), g = c.glow;
    g.globalAlpha = 0.55;
    g.fillStyle = '#ffe9a8';
    for (let i = 0; i < 10; i++) {
      const a = t * 0.8 + (i / 10) * Math.PI * 2, r0 = 8, r1 = 18 + (i % 2) * 6;
      for (let r = r0; r < r1; r++) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(top + Math.sin(a) * r * 0.8), 1, 1);
    }
    g.globalAlpha = 1;
    // The javelin across the top, its point bright.
    c.lit.fillStyle = '#7a5230';
    c.lit.fillRect(Math.round(x - 9), top, 16, 2);
    g.fillStyle = '#e8f0ff';
    g.fillRect(Math.round(x + 7), top - 1, 3, 4);
    g.fillRect(Math.round(x + 10), top, 2, 2);
  }

  /** A gold arrow at your feet, pointing the way on, pulsing out and back. */
  private arrow(c: Ctx, h: Hero, x: number, y: number, t: number): void {
    const p = this.pointTo!, dx = p.x - h.x, dy = p.y - h.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const d = 14 + Math.sin(t * 5) * 3, bx = x + ux * d, by = y - 6 + uy * d * 0.8, g = c.glow;
    g.fillStyle = '#ffd27a';
    for (let k = 0; k < 6; k++) for (let s = -k; s <= k; s++) g.fillRect(Math.round(bx + ux * (6 - k) - uy * s * 0.9), Math.round(by + uy * (6 - k) * 0.8 + ux * s * 0.9), 1, 1);
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

  /** My hero's position on screen in CSS pixels, and CSS pixels per tile (for aiming with the mouse). */
  heroScreen(): [number, number, number] | null {
    if (!this.heroAt) return null;
    const k = this.scale / this.dpr;
    return [(this.heroAt[0] - this.cam.x) * k, (this.heroAt[1] - 8 - this.cam.y) * k, PX * k];
  }

  /** `others`: other players' heroes in this place (the shared town); drawn only, never in the room. */
  render(room: ArenaRoom, meId: string, fx: Fx, now: number, dt: number, others: Hero[] = []): void {
    const a = room.alpha;
    const lerp = (key: string, x: number, y: number): [number, number] => {
      const p = room.prev.get(key);
      const ix = p ? p[0] + (x - p[0]) * a : x, iy = p ? p[1] + (y - p[1]) * a : y;
      return [OX + ix * PX, OY + iy * PX];
    };
    const me = room.heroes.find((h) => h.id === meId);
    if (me) {
      const [hx, hy0] = lerp('h:' + me.id, me.x, me.y), hy = hy0 - (me.z ?? 0) * LIFT;
      this.heroAt = [hx, hy];
      const portrait = this.vh > this.vw * 1.2;
      const f = this.focus;
      const tx = f ? OX + f.x * PX - this.vw / 2 : hx + me.fx * 10 - this.vw / 2, ty = f ? OY + f.y * PX - 8 - this.vh / 2 : hy - 8 + me.fy * 8 - this.vh / 2 + (portrait ? this.vh * 0.12 : 0);
      const k = this.cam.ready ? Math.min(1, dt * (f ? 2.5 : 7)) : 1;
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
      this.cam.ready = true;
    }
    const map = room.map;
    if (this.painted !== map) (this.bg = paintMap(map)), (this.painted = map), (this.cam.ready = false);
    const clamp = (v: number, size: number, world: number) => (size >= world ? (world - size) / 2 : Math.max(0, Math.min(world - size, v)));
    this.cam.x = clamp(this.cam.x, this.vw, worldW(map));
    this.cam.y = clamp(this.cam.y, this.vh, worldH(map));
    const sh = fx.shake;
    const [kx, ky] = camKick(me, room.time, KICK);
    const cx = Math.round(this.cam.x + (Math.random() - 0.5) * sh) + kx, cy = Math.round(this.cam.y + (Math.random() - 0.5) * sh) + ky;

    const lit = this.lit, glow = this.glow, c: Ctx = { lit, glow, now, t: room.time };
    lit.fillStyle = '#0d0b10';
    lit.fillRect(0, 0, this.vw, this.vh);
    lit.drawImage(this.bg!, -cx, -cy);
    fx.drawDecals(lit, cx, cy);
    glow.clearRect(0, 0, this.vw, this.vh);
    const pw = me ? WEAPONS[me.weapon].parryWindow + me.lenience : 0.3;
    for (const e of room.enemies) if (e.attack && e.act === 'attack') drawTelegraph(c, e.attack, cx, cy, pw);
    // A drummer's reach and its beat on the floor, and the goblins it has roused (client/backline.ts).
    drawDrums(c, room.enemies, (e) => {
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      return [x - cx, y - (e.z ?? 0) * LIFT - cy];
    }, room.time);
    // A Rogue's kit in hand: show each goblin's back, the place a backstab lands.
    if (me && WEAPONS[me.weapon].cls === 'ROGUE') for (const e of room.enemies) {
      if (e.act === 'dead' || e.kind === 'dummy' || e.kind === 'swingDummy') continue;
      const [ex, ey] = lerp('e:' + e.id, e.x, e.y), tx = me.x - e.x, ty = me.y - e.y, tl = Math.hypot(tx, ty) || 1;
      if (tl > 6) continue;
      const behind = (e.fx * tx + e.fy * ty) / tl < GUARD.rearCos, back = Math.atan2(-e.fy, -e.fx), r = e.radius * PX + 5;
      glow.fillStyle = '#b080ff';
      glow.globalAlpha = behind ? 0.95 : 0.35;
      for (let a = -1.1; a <= 1.1; a += 0.08) glow.fillRect(Math.round(ex - cx + Math.cos(back + a) * r), Math.round(ey - cy + Math.sin(back + a) * r * 0.5), 1, 1);
      glow.globalAlpha = 1;
    }

    const items: { y: number; draw: () => void }[] = [];
    for (const h of others) {
      const x = OX + h.x * PX, y = OY + h.y * PX;
      items.push({ y, draw: () => drawHero(c, h, x - cx, y - cy, false, room.time) });
    }
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y), up = (h.z ?? 0) * LIFT;
      items.push({ y, draw: () => drawHero(c, h, x - cx, y - up - cy, h.id === meId, room.time) });
      // A Ranger's hound, wherever it is.
      if (h.hound) {
        const d = h.hound, [dx, dy] = lerp('d:' + h.id, d.x, d.y);
        items.push({ y: dy, draw: () => drawHound(c, d, dx - cx, dy - cy) });
      }
      if (h.id === meId && this.fanfare) items.push({ y: y + 0.5, draw: () => this.heldUp(c, x - cx, y - up - cy, room.time) });
      if (h.id === meId && this.pointTo) items.push({ y: y + 0.5, draw: () => this.arrow(c, h, x - cx, y - up - cy, room.time) });
      // A Mage's blink image, flickering where they stood until it goes.
      if (h.decoyUntil > room.time) {
        const dx = OX + h.decoyX * PX, dy = OY + h.decoyY * PX, left = h.decoyUntil - room.time;
        items.push({ y: dy, draw: () => {
          const a = (0.35 + Math.sin(room.time * 18) * 0.12) * Math.min(1, left / 0.5);
          c.lit.globalAlpha = c.glow.globalAlpha = a;
          drawHero(c, { ...h, act: 'idle', actT: 0 }, dx - cx, dy - cy, false, room.time);
          c.lit.globalAlpha = c.glow.globalAlpha = 1;
        } });
      }
    }
    for (const e of room.enemies) {
      const carrier = room.heroes.find((h) => h.carrying === e.id);
      if (carrier) {
        // Held overhead by a hero: drawn with them, just in front.
        const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
        items.push({ y: hy + 0.5, draw: () => (drawHeld(c, e, hx - cx, hy - cy, carrier.fx, carrier.fy, slam), drawStatus(c, e, hx - cx, hy - cy - 20, room.time)) });
        continue;
      }
      const [x, y] = lerp('e:' + e.id, e.x, e.y), up = (e.z ?? 0) * LIFT;
      items.push({ y, draw: () => (drawEnemy(c, e, x - cx, y - up - cy, asleep(map, e)), drawStatus(c, e, x - cx, y - up - cy, room.time)) });
    }
    for (const p of room.props) {
      if (p.broken) continue;
      const carrier = p.lifted ? room.heroes.find((h) => h.lifting === p.id) : undefined;
      if (carrier) {
        const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
        items.push({ y: hy + 0.5, draw: () => drawLifted(c, p, hx - cx, hy - cy, carrier.fx, carrier.fy, slam) });
        continue;
      }
      const x = OX + p.x * PX - cx, y = OY + p.y * PX - cy;
      items.push({ y: OY + p.y * PX, draw: () => drawProp(c, p, x, y, room.time) });
      // Someone caged: a mark over them, and their call when you're close.
      if (p.kind === 'cage' && !p.broken) {
        const near = !!me && Math.hypot(me.x - p.x, me.y - p.y) < 7;
        items.push({ y: OY + p.y * PX + 0.2, draw: () => drawCaged(c, x, y, room.time, near, p.id) });
      }
    }
    // The freed, where the room has them (the dead lie under everyone; the gone are gone).
    for (const s of room.survivors ?? []) {
      if (s.gone) continue;
      const [x, y] = lerp('s:' + s.id, s.x, s.y);
      items.push({ y: s.dead ? y - 20 : y, draw: () => drawSurvivor(c, s, x - cx, y - cy, room.time) });
    }
    for (const ch of room.chests) {
      const x = OX + ch.x * PX - cx, y = OY + ch.y * PX - cy;
      items.push({ y: OY + ch.y * PX, draw: () => drawChest(c, ch, x, y) });
    }
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      const x = OX + d.x * PX - cx, y = OY + d.y * PX - cy;
      items.push({ y: OY + d.y * PX - 20, draw: () => drawDrop(c, d, x, y) });
    }
    for (const p of room.pickups) {
      const x = OX + p.x * PX - cx, y = OY + p.y * PX - cy;
      items.push({ y: OY + p.y * PX - 20, draw: () => drawPickup(c, p, x, y) });
    }
    for (const s of room.smokes) {
      const x = OX + s.x * PX - cx, y = OY + s.y * PX - cy;
      items.push({ y: OY + s.y * PX + 30, draw: () => drawSmoke(c, s, x, y, POTION.smokeR * PX, room.time) });
    }
    for (const m of room.coals) {
      const x = OX + m.x * PX - cx, y = OY + m.y * PX - cy;
      items.push({ y: OY + m.y * PX - 20, draw: () => drawCoal(c, m, x, y) });
    }
    for (const b of room.bolts) {
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy;
      // Things on the floor draw under the bodies; things in the air over them.
      const floor = b.kind === 'smite' || b.state === 'well';
      items.push({ y: OY + b.y * PX + (floor ? -40 : b.kind === 'lodestone' ? 30 : 0), draw: () => (b.kind === 'flask' ? drawFlask(c, b, x, y) : drawBolt(c, b, x, y)) });
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
    for (const r of map.rounds) items.push({ y: OY + r.y * PX, draw: () => drawRound(c, r, OX + r.x * PX - cx, OY + r.y * PX - cy) });
    for (const b of map.blocks) {
      const [bx, by] = blockAt(b);
      items.push({ y: blockFoot(b), draw: () => drawBlock(c, b, bx - cx, by - cy, true) });
    }
    for (const n of map.npcs ?? []) {
      const at = npcAt(n, room.time), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
      items.push({ y: OY + at.y * PX, draw: () => drawNpc(c, n, OX + at.x * PX - cx, OY + at.y * PX - cy, near && !n.mute, at.fx, !!n.path, at.x) });
    }
    for (const b of map.braziers) items.push({ y: OY + b.y * PX, draw: () => this.brazier(c, OX + b.x * PX - cx, OY + b.y * PX + 2 - cy, now) });
    if (map === ARENA) items.push({ y: OY + ARENA.cage.y * PX, draw: () => this.cage(c, OX + ARENA.cage.x * PX - cx, OY + ARENA.cage.y * PX - cy, now) });
    // The way out: stakes across the gap while it's shut; lit, torches and chevrons once it's open (wayout.ts).
    const wayLights = drawWays(c, map, room.exitOpen, cx, cy, now);
    // Blessed ground: a ring of gold on the floor, light rising off it.
    for (const s of room.snares) drawSnare(c, s, OX + s.x * PX - cx, OY + s.y * PX - cy);
    for (const z of room.zones) {
      const zx = OX + z.x * PX - cx, zy = OY + z.y * PX - cy, R = z.r * PX, left = z.until - room.time, k = Math.min(1, left / 1.2);
      glow.globalAlpha = 0.75 * k;
      glow.fillStyle = '#ffd27a';
      for (let a = 0; a < Math.PI * 2; a += 0.06) glow.fillRect(Math.round(zx + Math.cos(a + now * 0.3) * R), Math.round(zy + Math.sin(a + now * 0.3) * R * 0.55), 1, 1);
      glow.fillStyle = '#fff1b0';
      for (let i = 0; i < 14; i++) {
        const p = (now * 0.6 + i / 14) % 1, a = i * 2.4;
        glow.globalAlpha = (1 - p) * 0.8 * k;
        glow.fillRect(Math.round(zx + Math.cos(a) * R * 0.8 * ((i % 5) / 5)), Math.round(zy + Math.sin(a) * R * 0.45 * ((i % 5) / 5) - p * 22), 1, 1);
      }
      glow.globalAlpha = 1;
    }
    // At a fork, both ways out glow, each with its name.
    if (room.exitOpen) for (const r of map.roads ?? []) {
      const e = r.area, ex = OX + e.x * PX - cx, ey = OY + e.y * PX - cy;
      drawText(glow, r.label, Math.round(ex + (e.w * PX) / 2 - textWidth(r.label) / 2), Math.round(ey + e.h * PX + 34), r.road === 'high' ? '#ffd27a' : '#9fe8ff');
    }
    items.sort((p, q) => p.y - q.y);
    for (const it of items) it.draw();
    // Anyone you've freed who's fallen behind out of sight: a mark at the edge, toward them (clear of the HUD).
    const tall = this.vh > this.vw * 1.2;
    behindMarks(c, room.survivors ?? [], cx, cy, this.vw, this.vh, tall ? this.vh * 0.2 : 20, tall ? this.vh * 0.3 : 20, now);

    const lights: Light[] = [...wayLights];
    for (const m of room.coals) lights.push({ x: OX + m.x * PX - cx, y: OY + m.y * PX - cy - 4, r: 26 + Math.sin(now * 7 + m.id) * 3, i: 0.6 * Math.min(1, m.life / 4), c: [1, 0.6, 0.28] });
    for (const ch of room.chests) if (ch.state !== 'shut') lights.push({ x: OX + ch.x * PX - cx, y: OY + ch.y * PX - cy - 6, r: ch.state === 'opening' ? 16 + 30 * (ch.t / 1.2) : 26, i: ch.state === 'opening' ? 0.4 + 0.5 * (ch.t / 1.2) : 0.35, c: tint(TIERS[ch.tier].col) });
    for (const d of room.drops) {
      if (d.owner && d.owner !== meId) continue;
      if (!d.item.traits.some((t) => t === 'ember' || t === 'rime' || t === 'storm')) continue;
      lights.push({ x: OX + d.x * PX - cx, y: OY + d.y * PX - cy - 6, r: 22, i: 0.5, c: [1, 0.9, 0.6] });
    }
    for (const t of map.torches) {
      const x = OX + t.x * PX - cx, y = OY + t.y * PX - cy;
      this.flame(glow, x, y - 1, now, 1);
      lights.push({ x, y: y - 3, r: 118 + Math.sin(now * 13 + x) * 4 + Math.sin(now * 7.3) * 3, i: 1.15, c: [1, 0.66, 0.36] });
    }
    for (const b of map.braziers) {
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy;
      lights.push({ x, y: y - 8, r: 78 + Math.sin(now * 11 + x) * 3, i: 0.95, c: [1, 0.6, 0.3] });
    }
    // Moonlight through a ceiling grate over the middle of the room.
    if (map.theme.moon && !map.theme.day) lights.push({ x: OX + (map.w / 2) * PX - cx, y: OY + (map.h / 2) * PX - cy, r: 125 * Math.max(1, map.w / 22), i: map.theme.moon, c: [0.55, 0.62, 0.9] });
    for (const r of map.rounds) if (r.kind === 'post') {
      const x = OX + r.x * PX - cx, y = OY + r.y * PX - cy - 24;
      this.flame(glow, x, y + 2, now, 1);
      lights.push({ x, y, r: 64, i: 0.8, c: [1, 0.72, 0.42] });
    }
    // Perrin's garden after dark: a soft pool of lamplight over the benches and the beds.
    for (const r of map.rounds) if (r.kind === 'moths' && !map.theme.day) lights.push({ x: OX + r.x * PX - cx - 36, y: OY + r.y * PX - cy - 34, r: 84, i: 0.4 * dusk(), c: [1, 0.84, 0.58] });
    for (const r of map.rounds) if (r.kind === 'lantern') lights.push({ x: OX + r.x * PX - cx, y: OY + r.y * PX - cy - 28, r: 150 + Math.sin(now * 3) * 4, i: 1.25, c: [1, 0.78, 0.45] });
    for (const b of map.blocks) {
      const [bx, by] = blockAt(b), mx = bx + (b.w * PX) / 2 - cx;
      // A building on fire lights the whole street; its ashes smoulder.
      if (((b.burning ?? -1) >= 0 || b.smoulder) && !b.ruined) lights.push({ x: mx, y: by + (b.h * PX) / 2 - cy - 10, r: 70 + b.w * 10 + Math.sin(now * 13 + bx) * 6, i: 1.2, c: [1, 0.55, 0.25] });
      if (b.ruined) lights.push({ x: mx, y: by + (b.h * PX) / 2 - cy, r: 22 + b.w * 3, i: 0.35, c: [1, 0.35, 0.15] });
      // A job's cottage with its fire going shows a little light at the windows.
      const home = houseOf(b), fire = !!home?.lit && b.kind === 'house' && !b.ruined && (b.burning ?? -1) < 0;
      if (!fire && (b.maxHp || (b.kind !== 'house' && b.kind !== 'church' && b.kind !== 'hall' && b.kind !== 'forge'))) continue;
      lights.push({ x: bx + (b.w * PX) / 2 - cx, y: by + b.h * PX - cy, r: 34, i: 0.45, c: b.kind === 'forge' ? [1, 0.5, 0.25] : [1, 0.8, 0.5] });
    }
    for (const z of room.zones) lights.push({ x: OX + z.x * PX - cx, y: OY + z.y * PX - cy - 6, r: z.r * PX * 1.4, i: 0.8 * Math.min(1, (z.until - room.time) / 1.2), c: [1, 0.85, 0.5] });
    for (const h of room.heroes) {
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      // Underground (no moon), each hero carries a lantern.
      if (!map.theme.day) lights.push({ x: x - cx, y: y - 10 - cy, r: map.theme.moon ? 44 : 90, i: map.theme.moon ? 0.35 : 0.7, c: [0.95, 0.8, 0.6] });
      // A Healer's censer burns brighter the more coals it has taken.
      if (h.glow > 0 && WEAPONS[h.weapon].cls === 'HEALER') lights.push({ x: x - cx, y: y - 4 - cy, r: 20 + h.glow * 3 + Math.sin(now * 9) * 2, i: 0.25 + h.glow * 0.04, c: [1, 0.62, 0.3] });
    }
    for (const e of room.enemies) {
      const at = e.attack;
      if (!at || at.t >= at.windup) continue;
      const k = at.t / at.windup, round = at.kind === 'slam' || at.kind === 'hex', ax = round ? at.cx : at.ox + at.dx * at.range * 0.5, ay = round ? at.cy : at.oy + at.dy * at.range * 0.5;
      lights.push({ x: OX + ax * PX - cx, y: OY + ay * PX - cy, r: 40, i: 0.35 * k, c: [1, 0.25, 0.15] });
      // A hexer's fetish lights it up green as the spell comes.
      if (at.kind === 'hex') lights.push({ x: OX + e.x * PX - cx, y: OY + e.y * PX - cy - 16, r: 18 + 22 * k, i: 0.3 + 0.5 * k, c: [0.55, 1, 0.3] });
    }
    for (const j of room.javelins) {
      const x = OX + j.x * PX - cx, y = OY + j.y * PX - cy - 8;
      lights.push({ x, y, r: j.state === 'fly' ? 34 : 14, i: j.state === 'fly' ? 0.6 : 0.3 * Math.min(1, j.life), c: [0.55, 0.85, 1] });
    }
    for (const b of room.bolts) {
      if (b.kind === 'arrow' || b.kind === 'knife') continue;
      const x = OX + b.x * PX - cx, y = OY + b.y * PX - cy - 8;
      if (b.kind === 'net' || b.kind === 'bolt') continue;
      if (b.kind === 'smite') lights.push({ x, y: y + 4, r: 40, i: 0.9 * Math.min(1, b.t / b.flight), c: [1, 0.9, 0.6] });
      else if (b.kind === 'lodestone') lights.push({ x, y, r: b.state === 'well' ? 50 : 12, i: 0.5, c: b.el ? EL_LIGHT[b.el] : [0.7, 0.5, 1] });
      else lights.push({ x, y, r: b.kind === 'orb' ? 50 : 30, i: 0.7, c: EL_LIGHT[b.el] });
    }
    for (const e of room.enemies) {
      if (e.act === 'dead') continue;
      const [x, y] = lerp('e:' + e.id, e.x, e.y);
      if (e.burnUntil > room.time) lights.push({ x: x - cx, y: y - cy - 10, r: 44 + Math.sin(now * 17 + e.id) * 4, i: 0.75, c: [1, 0.55, 0.25] });
      else if (e.frozenUntil > room.time) lights.push({ x: x - cx, y: y - cy - 8, r: 26, i: 0.4, c: [0.6, 0.85, 1] });
    }
    for (const h of room.heroes) {
      if (!lightsHolder(h.weapon)) continue;
      const [x, y] = lerp('h:' + h.id, h.x, h.y);
      lights.push({ x: x - cx, y: y - cy - 14, r: 22, i: 0.4, c: WEAPONS[h.weapon].cls === 'HEALER' ? [1, 0.75, 0.4] : EL_LIGHT[h.augments[h.relic]] });
    }
    fx.drawGlow(glow, lit, cx, cy);
    lights.push(...fx.lights(cx, cy));
    // Only lights that reach the screen (a town has more than the pass can take at once).
    const seen = lights.filter((l) => l.x + l.r > 0 && l.x - l.r < this.vw && l.y + l.r > 0 && l.y - l.r < this.vh);
    this.lighting.render(this.base, this.glowC, seen, map.theme.ambient);
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
