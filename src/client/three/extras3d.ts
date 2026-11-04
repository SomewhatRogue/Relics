/**
 * The rest of what the flat view shows on top of bodies, for the 2.5D view's flat layer, each placed
 * where the room says: a swing's trail (the same pose and arc held.ts draws, so it sweeps what's
 * judged), what's on a goblin (flames, frost, ice, a net: status.ts), the grappling hook's line, a
 * drummer's reach and its beat, marks at the edge toward the freed who've fallen behind, the relic
 * held up in the wood, and dawn's mist.
 */
import type { Theme } from '../../shared/arena';
import { DRUMMER } from '../../shared/backline';
import type { ArenaRoom } from '../../sim/room';
import { drawMist } from '../daytime';
import type { Ctx } from '../draw';
import { pose } from '../held';
import { drawHook } from '../relicsdraw';
import { drawStatus } from '../status';
import { drawLoad } from '../xbowmark';
import { drawBladeMark } from '../blademark';
import { houseAlight, kindling } from '../../shared/kindling';
import { drawGlint, drawHouseSmoke, drawKindling } from '../kindledraw';
import { drawLife } from '../streetlife';
import { edgeMark, type View } from '../wayout';
import { PX } from '../world';
import type { Lerp } from './actors3d';
import type { Proj } from './overlay3d';
import { BOXFIGS } from './look';

const DRUM = '#c8e050';

export interface Extra { room: ArenaRoom; meId: string; lerp: Lerp; P: Proj; now: number; W: number; H: number; fanfare: boolean; mist: [number, number] }

export function drawExtras(g: CanvasRenderingContext2D, x: Extra): void {
  const { room, lerp, P, now } = x, c: Ctx = { lit: g, glow: g, now, t: room.time }, up = (z?: number) => (z ?? 0) * 0.75;
  // Wickhold's small life, as the flat view paints it: crows at the blood, a dog nosing about, moths
  // round a garden lamp, smoke rising past the wall.
  for (const r of room.map.rounds) if (r.kind === 'crows' || r.kind === 'dog' || r.kind === 'moths' || r.kind === 'smoke') {
    const [sx, sy] = P(r.x, 0, r.y);
    if (sx > -60 && sy > -140 && sx < x.W + 60 && sy < x.H + 60) drawLife(c, r, sx, sy);
  }
  // A house's kindling: the glint while you're near, the ring while someone lights it (kindledraw.ts).
  const meH = room.heroes.find((h) => h.id === x.meId);
  for (const b of room.map.blocks) {
    if (houseAlight(b)) {
      const [hx, hy] = P(b.x + b.w / 2, 2.3, b.y + b.h / 2);
      drawHouseSmoke(c, hx, hy, 1 - (b.hp ?? 0) / (b.maxHp || 1), b.x);
    }
    const k = kindling(b, room.map);
    if (!k) continue;
    const [sx, sy] = P(k.x, 0, k.y), d = meH && !b.ruined && (b.burning ?? -1) < 0 ? Math.hypot(meH.x - k.x, meH.y - k.y) : 99;
    drawGlint(c, sx, sy - 4, d, b.look ?? 0);
    drawKindling(c, b, sx, sy);
  }
  // A drummer's reach on the floor, its beat going out, and the goblins it has roused.
  const beat = (room.time % DRUMMER.beat) / DRUMMER.beat;
  for (const e of room.enemies) {
    if (!e.drumming || e.act === 'dead') continue;
    const [ex, ey] = lerp('e:' + e.id, e.x, e.y);
    ring(g, P, ex, ey, DRUMMER.radius, 0.22, 0.35);
    ring(g, P, ex, ey, DRUMMER.radius * (0.15 + 0.85 * beat), 0.55 * (1 - beat), 0.5);
  }
  for (const e of room.enemies) if (e.roused && e.act !== 'dead') {
    const [ex, ey] = lerp('e:' + e.id, e.x, e.y);
    ring(g, P, ex, ey, e.kind === 'butcher' ? 0.65 : 0.4, beat < 0.25 ? 0.85 : 0.45, 0.15);
  }
  // What's on a goblin: drawn at its feet as the flat view draws it (a flat figure carries its own).
  if (BOXFIGS) for (const e of room.enemies) {
    const carrier = room.heroes.find((h) => h.carrying === e.id), [ex, ey] = carrier ? lerp('h:' + carrier.id, carrier.x, carrier.y) : lerp('e:' + e.id, e.x, e.y);
    const [sx, sy] = P(ex, up(e.z) + (carrier ? 1.3 : 0), ey);
    drawStatus(c, e, sx, sy, room.time);
  }
  // The grappling hook's line, from the thrower's hand.
  for (const k of room.hooks) {
    const o = room.heroes.find((h) => h.id === k.owner);
    if (!o) continue;
    const [ox, oy] = lerp('h:' + o.id, o.x, o.y), [hx, hy] = P(ox, 0.35 + up(o.z), oy), [kx, ky] = P(k.x, 0.4, k.y);
    drawHook(c, k, hx, hy, kx, ky);
  }
  if (BOXFIGS) for (const h of room.heroes) trail(g, h, lerp, P, now, up(h.z));
  // A crossbow's load over its Ranger (a flat figure carries its own: actors.ts).
  if (BOXFIGS) for (const h of room.heroes) {
    const [hx, hy] = lerp('h:' + h.id, h.x, h.y), [sx, sy] = P(hx, up(h.z), hy);
    drawLoad(c, h, sx, sy);
    drawBladeMark(c, h, sx, sy, room.time);
  }
  // The relic held up over your head in a turning ring of light (the wood's find).
  const me = room.heroes.find((h) => h.id === x.meId);
  if (me && x.fanfare) {
    const [hx, hy] = lerp('h:' + me.id, me.x, me.y), [cx, cy] = P(hx, 2.1, hy);
    g.fillStyle = '#ffe9a8';
    g.globalAlpha = 0.6;
    for (let i = 0; i < 10; i++) {
      const a = room.time * 0.8 + (i / 10) * Math.PI * 2;
      for (let r = 8; r < 18 + (i % 2) * 6; r++) g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 1, 1);
    }
    g.globalAlpha = 1;
    g.fillStyle = '#7a5230';
    g.fillRect(Math.round(cx - 9), Math.round(cy), 16, 2);
    g.fillStyle = '#e8f0ff';
    g.fillRect(Math.round(cx + 7), Math.round(cy - 1), 3, 4);
  }
  // Anyone you've freed who's fallen behind out of sight: a mark at the edge, toward them.
  const tall = x.H > x.W * 1.2, view: View = { vw: x.W, vh: x.H, top: tall ? x.H * 0.2 : 20, bottom: tall ? x.H * 0.3 : 20 };
  for (const s of room.survivors ?? []) {
    if (s.dead || s.gone || s.home >= 0) continue;
    const [sx, sy] = lerp('s:' + s.id, s.x, s.y), [px, py] = P(sx, 0.6, sy), at = edgeMark(g, px, py, view, Math.sin(now * 6 + s.id) * 1.5, '#c8f0c0');
    if (!at) continue;
    g.fillRect(Math.round(at.x - 1), Math.round(at.y - 3), 3, 3);
    g.fillRect(Math.round(at.x - 2), Math.round(at.y + 1), 5, 2);
  }
}

/** Dawn's mist, anchored to the ground as the camera moves. */
export function drawMist3(g: CanvasRenderingContext2D, theme: Theme, x: Extra): void {
  drawMist(g, theme, x.W, x.H, x.mist[0], x.mist[1], x.now);
}

/** A dotted ring on the floor, `r` tiles round (x, y). */
function ring(g: CanvasRenderingContext2D, P: Proj, x: number, y: number, r: number, alpha: number, gap: number): void {
  const n = Math.max(10, Math.round((Math.PI * 2 * r) / gap));
  g.fillStyle = DRUM;
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, [px, py] = P(x + Math.cos(a) * r, 0.04, y + Math.sin(a) * r);
    g.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  g.globalAlpha = 1;
}

/** A swing's trail at waist height: the arc swept so far (a thrust's line), white, gold for a heavy, orange for a counter. */
function trail(g: CanvasRenderingContext2D, h: ArenaRoom['heroes'][number], lerp: Lerp, P: Proj, now: number, lift: number): void {
  if (h.act !== 'attack') return;
  const p = pose(h, now);
  if (p.from === undefined || !p.reach) return;
  const [hx, hy] = lerp('h:' + h.id, h.x, h.y), reach = p.reach / PX, hold = h.hitstop > 0;
  g.fillStyle = hold ? '#ffffff' : h.counter ? '#ffa040' : h.heavy ? '#ffe9a8' : '#ffffff';
  g.globalAlpha = hold ? 1 : 0.75;
  const dot = (a: number, r: number) => {
    const [x, y] = P(hx + Math.cos(a) * r, 0.62 + lift, hy + Math.sin(a) * r);
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
  };
  if (p.thrust) for (let r = 0.6; r <= reach; r += 0.06) dot(p.a, r);
  else {
    const span = p.a - p.from, n = Math.max(6, Math.round(Math.abs(span) * reach * 14));
    for (let i = 0; i <= n; i++) {
      const a = p.from + (span * i) / n, k = i / n;
      for (let r = reach * (0.95 - 0.35 * k); r <= reach * 0.95; r += 0.08) dot(a, r);
    }
  }
  g.globalAlpha = 1;
}
