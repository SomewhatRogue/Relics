/**
 * The flat layer over the 3D view, at the same low resolution and drawn unlit: the 3x5 pixel font for
 * names over friends' heads, a downed hero's count, calls and numbers; quest marks (or a point at the
 * edge toward one off screen), the arrow at your feet toward the way on, goblins' health, a Rogue's
 * backstab arcs, and the 2D
 * effects themselves (sparks, rings, lightning, gore, words), each placed where the room says it is.
 */
import type { ArenaRoom } from '../../sim/room';
import type { Target } from '../../sim/targets';
import type { DoorMark } from '../jobrooms';
import type { Fx } from '../fx';
import { GUARD, PARTY, WEAPONS } from '../../shared/tuning';
import { drawText, textWidth } from '../pixfont';
import { drawBlock } from '../saylines';
import { CHASE, chaseLabel, chasePoint, chasers } from '../chasers';
import { drawExpedGround, friendMarks } from '../expeddraw';
import { drawPunt, drawStaitheGround, puntAt } from '../staithedraw';
import { drawWoodGround } from '../wooddraw';
import { OX, OY, PX } from '../world';
import type { Lerp } from './actors3d';
import { BOXFIGS } from './look';
import { ROWS, boardRows } from '../voteboards';
import { WALL_H } from './ground';
import { cueAt, drawCue, drawWayWord } from '../waycues';

export type Proj = (x: number, y: number, z: number) => [number, number];
export interface Marks { marks: Target[]; doors: DoorMark[]; pointTo: { x: number; y: number } | null; focus?: { x: number; y: number; snap?: boolean } | null; fanfare?: boolean }

export class Overlay {
  readonly canvas = document.createElement('canvas');
  readonly g = this.canvas.getContext('2d')!;
  private W = 1;
  private H = 1;

  constructor() {
    Object.assign(this.canvas.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', imageRendering: 'pixelated' });
  }

  resize(W: number, H: number, css: [string, string]): void {
    this.canvas.width = this.W = W;
    this.canvas.height = this.H = H;
    [this.canvas.style.width, this.canvas.style.height] = css;
  }

  draw(room: ArenaRoom, meId: string, fx: Fx, m: Marks, P: Proj, lerp: Lerp, now: number, ppu: number): void {
    const g = this.g, k = ppu / PX, up = (z?: number) => (z ?? 0) * 0.75;
    g.clearRect(0, 0, this.W, this.H);
    // The town hall's vote boards' words, each row placed on the wall's face (../voteboards.ts).
    // (Rows under a board's name go a fixed step below it: the wall is foreshortened, and lines would touch.)
    for (const r of boardRows(room.map)) {
      const [x, y0] = P(r.x, WALL_H * (1 - (Math.min(r.row, 9) + 2.5) / ROWS), 0.05), y = y0 + Math.max(0, r.row - 9) * (7 / 6);
      drawText(g, r.s, Math.round(x - textWidth(r.s) / 2), Math.round(y - 2), r.col);
    }
    // The 2D effects: a world pixel is a spot on the floor (its height baked into its y, as in 2D).
    const at = (px: number, py: number, h = 0) => P((px - OX) / PX, h, (py - OY) / PX);
    for (const gb of fx.gore.gibs) {
      const [x, y] = at(gb.x, gb.y, gb.z / PX), s = Math.max(1, Math.round(gb.size * k));
      g.fillStyle = gb.col;
      g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    }
    // Coins flying into whoever picked them up (coinfly.ts), each at its height.
    fx.coins.each((px, py, z, col, w) => {
      const [x, y] = at(px, py, z / PX);
      g.fillStyle = col;
      g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    });
    for (const p of fx.parts) {
      const [x, y] = at(p.x, p.y);
      g.globalAlpha = p.glow ? Math.min(1, (p.life / p.max) * 1.5) : 1;
      g.fillStyle = p.col;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    for (const r of fx.rings) {
      const q = 1 - r.life / r.max, rad = (4 + q * (r.size ?? 22)) * k, [x, y] = at(r.x, r.y);
      g.globalAlpha = 1 - q;
      g.fillStyle = r.col;
      for (let a = 0; a < 48; a++) g.fillRect(Math.round(x + Math.cos((a / 48) * 6.283) * rad), Math.round(y + Math.sin((a / 48) * 6.283) * rad * 0.6), 1, 1);
    }
    g.globalAlpha = 1;
    for (const a of fx.arcs) {
      const [x0, y0] = at(a.x, a.y, 0.6), [x1, y1] = at(a.x2, a.y2, 0.6), n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3));
      g.fillStyle = Math.random() < 0.5 ? '#ffffff' : a.col ?? '#fff27a';
      for (let i = 0; i <= n; i++) {
        const q = i / n, j = i && i < n ? (Math.random() - 0.5) * 5 : 0;
        g.fillRect(Math.round(x0 + (x1 - x0) * q + j), Math.round(y0 + (y1 - y0) * q + j), 1, 1);
      }
    }
    // A Rogue's kit in hand: each near goblin's back, where a backstab lands (bright once you're behind it).
    const me = room.heroes.find((h) => h.id === meId);
    if (me && WEAPONS[me.weapon].cls === 'ROGUE') for (const e of room.enemies) {
      if (e.act === 'dead' || e.kind === 'dummy' || e.kind === 'swingDummy') continue;
      const [ex, ey] = lerp('e:' + e.id, e.x, e.y), tx = me.x - e.x, ty = me.y - e.y, tl = Math.hypot(tx, ty) || 1;
      if (tl > 6) continue;
      const behind = (e.fx * tx + e.fy * ty) / tl < GUARD.rearCos, back = Math.atan2(-e.fy, -e.fx), r = e.radius + 0.3;
      g.fillStyle = '#b080ff';
      g.globalAlpha = behind ? 0.95 : 0.35;
      for (let q = -1.1; q <= 1.1; q += 0.12) {
        const [x, y] = P(ex + Math.cos(back + q) * r, 0.05 + up(e.z), ey + Math.sin(back + q) * r);
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      g.globalAlpha = 1;
    }
    // Goblins' health, over the hurt ones; the butcher's "!" over a blow that can't be blocked. Flat
    // figures (figs3d.ts) bring their own, as the flat view draws them: a ring at the feet, names, counts.
    if (BOXFIGS) for (const e of room.enemies) {
      if (e.act === 'dead' || e.kind === 'dummy' || e.kind === 'swingDummy') continue;
      const big = e.kind === 'butcher' || e.kind === 'brood' || e.variant === 'heavy', [ex, ey] = lerp('e:' + e.id, e.x, e.y), [x, y] = P(ex, (big ? 2.6 : 1.3) + up(e.z), ey);
      if (e.hp < e.maxHp && (room.time - e.hitAt < 3 || e.hp < e.maxHp * 0.5)) {
        const w = big ? 20 : 10, f = Math.max(0, Math.round((w * e.hp) / e.maxHp));
        g.fillStyle = '#0e0a10';
        g.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 1), w + 2, 3);
        g.fillStyle = '#d8402a';
        g.fillRect(Math.round(x - w / 2), Math.round(y), f, 1);
      }
      if (e.attack?.unblockable && e.attack.t < e.attack.windup) drawText(g, '!', Math.round(x - 1), Math.round(y - 9 - (Math.floor(now * 6) % 2)), '#ffd040');
    }
    // Friends' names over their heads; a downed hero's count (a flat figure's card carries that).
    for (const h of room.heroes) {
      const [hx, hy] = lerp('h:' + h.id, h.x, h.y), [x, y] = P(hx, (BOXFIGS ? 1.75 : 1.5) + up(h.z), hy);
      if (h.act === 'down' && (h.out || h.lying || !BOXFIGS)) continue;
      if (h.act === 'down') {
        const left = h.bleeding ? PARTY.bleed - h.actT : h.actDur - h.actT, s = String(Math.max(0, Math.ceil(left)));
        drawText(g, s, Math.round(x - textWidth(s) / 2), Math.round(y - 2), h.bleeding && !h.selfUp ? '#ffd27a' : '#ff6a5a');
      } else if (h.id !== meId && h.id !== 'squire') {
        const name = (h.tag ?? h.id).toUpperCase();
        drawText(g, name, Math.round(x - textWidth(name) / 2), Math.round(y - 6), '#9ad8a8');
      }
    }
    // An expedition: the rings on the ground and friends off screen (../expeddraw.ts); the beacon stands in 3D (beacon3d.ts).
    drawExpedGround(g, room, (x, y) => P(x, 0, y), now);
    // The Staithe: its log's clock, the jetty's ring and the punt on the water (../staithedraw.ts).
    drawStaitheGround(g, room, (x, y) => P(x, 0, y), now);
    // Hangman's Wood's ground (../wooddraw.ts).
    drawWoodGround(g, room, (x, y) => P(x, 0, y), now);
    const punt = puntAt(room);
    if (punt) {
      const [px, py] = P(punt.x, -0.1, punt.y), [qx] = P(punt.x + 1, -0.1, punt.y);
      drawPunt(g, px, py, Math.abs(qx - px), punt.full, now);
    }
    friendMarks(g, room, meId, (x, y) => P(x, 1, y), this.W, this.H, 16, 16);
    this.marks(room, meId, m, P, lerp, now);
    for (const t of fx.texts) {
      const [x, y] = at(t.x, t.y);
      g.globalAlpha = Math.min(1, t.life * 3);
      drawBlock(g, t.lines, x, y, t.col, this.W);
    }
    g.globalAlpha = 1;
  }

  /** Gold marks over what the goal is about (a point at the edge for one off screen), names at doors, and the way on. */
  private marks(room: ArenaRoom, meId: string, m: Marks, P: Proj, lerp: Lerp, now: number): void {
    // (On a phone, held below the top HUD as the flat view's points are: wayout.ts.)
    const g = this.g, bob = Math.round(Math.sin(now * 4) * 1.5), pad = 8, top = this.H > this.W * 1.2 ? Math.round(this.H * 0.2) : pad;
    for (const t of m.marks) {
      const [tx, ty] = t.id !== undefined ? lerp('e:' + t.id, t.x, t.y) : [t.x, t.y];
      let [x, y] = P(tx, t.kind === 'door' ? 2.6 : t.kind === 'boss' ? 3.4 : t.kind === 'folk' ? 2.75 : t.kind === 'hall' ? 1.6 : 2.0, ty);
      const off = x < pad || y < top || x > this.W - pad || y > this.H - pad;
      x = Math.min(this.W - pad, Math.max(pad, x));
      y = Math.min(this.H - pad, Math.max(top, y));
      diamond(g, Math.round(x), Math.round(y) + (off ? 0 : bob), off ? 2 : 3);
    }
    if (!room.indoors) for (const d of m.doors) {
      const [x, y] = P(d.x, 2.2, d.y);
      d.who.forEach((w, i) => drawText(g, w.name.toUpperCase(), Math.round(x - textWidth(w.name) / 2), Math.round(y - 8 * (i + 1)), '#9ad8a8'));
    }
    for (const r of room.map.roads ?? []) {
      // Layout 4's ways say what's past them from the start, their cue drawn past the gap (../waycues.ts).
      if (!room.exitOpen && !r.way) continue;
      const a = r.area, [x, y] = r.side === 'W' ? P(a.x + a.w + 1.8, 0, a.y + a.h / 2) : r.side === 'E' ? P(a.x - 1.8, 0, a.y + a.h / 2) : P(a.x + a.w / 2, 0, a.y + a.h + 1.2);
      drawWayWord(g, r, x, y, room.exitOpen);
      if (r.way) {
        const q = cueAt(r, room.map), [cx, cy] = P(q.x, q.z + (r.side === 'E' || r.side === 'W' ? 0 : WALL_H * 0.4), q.y);
        drawCue({ lit: g, glow: g, now, t: room.time }, r.way, cx, cy, a.x + a.y);
      }
    }
    const me = room.heroes.find((h) => h.id === meId), p = m.pointTo;
    if (me) this.chasing(room, me, P, lerp);
    if (!me || !p) return;
    const [hx, hy] = lerp('h:' + me.id, me.x, me.y), [ax, ay] = P(hx, 0, hy), [bx, by] = P(p.x, 0, p.y), l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l;
    const d = 13 + Math.sin(now * 5) * 3, cx = ax + ux * d, cy = ay + uy * d;
    g.fillStyle = '#ffd27a';
    for (let q = 0; q < 6; q++) for (let s = -q; s <= q; s++) g.fillRect(Math.round(cx + ux * (6 - q) - uy * s * 0.9), Math.round(cy + uy * (6 - q) + ux * s * 0.9), 1, 1);
  }

  /** Goblins on your trail off screen: a red point at the edge toward each, and a count at the top. */
  private chasing(room: ArenaRoom, me: { x: number; y: number }, P: Proj, lerp: Lerp): void {
    const g = this.g, pad = 6;
    let off = 0;
    for (const e of chasers(room, me)) {
      const [ex, ey] = lerp('e:' + e.id, e.x, e.y), [x, y] = P(ex, 1, ey);
      if (x >= pad && y >= pad && x <= this.W - pad && y <= this.H - pad) continue;
      const cx = this.W / 2, cy = this.H / 2, dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
      chasePoint(g, Math.min(this.W - pad, Math.max(pad, x)), Math.min(this.H - pad, Math.max(pad, y)), dx / l, dy / l);
      off++;
    }
    if (off) drawText(g, chaseLabel(off), Math.round(this.W / 2 - textWidth(chaseLabel(off)) / 2), 14, CHASE.red);
  }
}

function diamond(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  for (const [col, rr] of [['#0e0a10', r + 1], ['#ffd27a', r]] as const) {
    g.fillStyle = col;
    for (let dy = -rr; dy <= rr; dy++) {
      const w = rr - Math.abs(dy);
      g.fillRect(x - w, y + dy, w * 2 + 1, 1);
    }
  }
  g.fillStyle = '#fff1b0';
  g.fillRect(x, y - r + 1, 1, 1);
}
