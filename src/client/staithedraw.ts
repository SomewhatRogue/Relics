/**
 * The Staithe in both views (scene.ts for the flat one, three/overlay3d.ts for 2.5D; each passes its own
 * projection from tiles on the ground to screen pixels), all from the room's own state: the log's clock
 * (a red ring of dots filling at the carriers' feet: a clock, not a blow), the jetty's ring on the bank (gold
 * dots filling as it's held), the punt going over and back with the folk in it, a net over anyone netted,
 * and the light of the lamps and of oil burning on the water. Drawing only.
 */
import type { ArenaRoom } from '../sim/room';
import { STAITHE } from '../shared/tuning';
import { heldK, jettyOf, laidK, logOf, onJetty, set } from '../sim/staithe';
import { slickBurn } from '../sim/oil';
import type { Ctx } from './draw';

export type Ground = (x: number, y: number) => [number, number];

/** A ring of dots on the ground, `share` of it bright. */
function dots(g: CanvasRenderingContext2D, P: Ground, x: number, y: number, r: number, share: number, lit: string, dim: string, now: number): void {
  const n = Math.max(24, Math.round(r * 16));
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2, [px, py] = P(x + Math.cos(t) * r, y + Math.sin(t) * r), on = i / n < share;
    if (!on && (i + Math.floor(now * 6)) % 3 === 0) continue;
    g.fillStyle = on ? lit : dim;
    g.fillRect(Math.round(px), Math.round(py), on ? 2 : 1, on ? 2 : 1);
  }
}

/** On the ground, under everyone: the log's clock while it's being laid, the jetty's ring once it can be held. */
export function drawStaitheGround(g: CanvasRenderingContext2D, room: ArenaRoom, P: Ground, now: number): void {
  const st = room.map.staithe, j = jettyOf(room.map), lg = logOf(room.map);
  if (!st || !j || room.indoors) return;
  const carriers = room.enemies.find((e) => e.variant === 'log' && e.act !== 'dead' && e.task?.k === 'lay' && !e.task.quit);
  if (lg && carriers && !lg.deck && !lg.ruined) dots(g, P, carriers.x, carriers.y, 1.3, laidK(lg, room.time), '#ff5a40', '#7a2a20', now);
  const logDone = !lg || lg.ruined || (!lg.deck && !room.enemies.some((e) => e.variant === 'log' && e.act !== 'dead'));
  if (!j.over && logDone && room.survivors.some(onJetty)) dots(g, P, st.ring.x, st.ring.y, STAITHE.ring, heldK(j, room.time), '#ffd27a', '#a0782a', now);
}

/** Where the punt is now (tiles), and whether it's carrying anyone: over and back each trip, moored otherwise. */
export function puntAt(room: ArenaRoom): { x: number; y: number; full: boolean } | null {
  const st = room.map.staithe, j = jettyOf(room.map);
  if (!st || !j) return null;
  const [a, b] = st.punt, holding = set(j.holdAt) || set(j.holdLeft);
  if (j.over) return { x: b[0], y: b[1], full: false };
  if (!holding) return { x: a[0], y: a[1], full: false };
  const k = heldK(j, room.time) * STAITHE.trips, f = k - Math.floor(k), go = f < 0.5, s = go ? f * 2 : (f - 0.5) * 2, e = s * s * (3 - 2 * s);
  const [p, q] = go ? [a, b] : [b, a];
  return { x: p[0] + (q[0] - p[0]) * e, y: p[1] + (q[1] - p[1]) * e, full: go };
}

/** The punt at screen (x, y) (its middle on the water), `s` pixels a tile, running along (dx, dy) on screen. */
export function drawPunt(g: CanvasRenderingContext2D, x: number, y: number, s: number, full: boolean, now: number): void {
  const L = Math.round(1.5 * s), W = Math.max(3, Math.round(0.55 * s)), bob = Math.round(Math.sin(now * 2.2));
  g.fillStyle = '#2e2016', g.fillRect(Math.round(x - L / 2), Math.round(y - W / 2 + bob + 1), L, W);
  g.fillStyle = '#4a3420', g.fillRect(Math.round(x - L / 2 + 1), Math.round(y - W / 2 + bob), L - 2, W - 1);
  g.fillStyle = '#5a4228', g.fillRect(Math.round(x - L / 2 + 1), Math.round(y - W / 2 + bob), L - 2, 1);
  // The punter at the stern with the pole; the folk sat low in it.
  const px = Math.round(x + L / 2 - 4), py = Math.round(y + bob);
  g.fillStyle = '#3a3040', g.fillRect(px, py - 9, 3, 7);
  g.fillStyle = '#c79c78', g.fillRect(px, py - 12, 3, 3);
  g.fillStyle = '#8a7a5a';
  for (let i = 0; i < 16; i++) g.fillRect(px + 2 + Math.round(i * 0.25), py - 14 + i, 1, 1);
  if (full) for (let i = 0; i < 3; i++) (g.fillStyle = i % 2 ? '#5a5a6a' : '#6a5a48'), g.fillRect(Math.round(x - L / 2 + 3 + i * 4), py - 5, 3, 4), (g.fillStyle = '#c79c78'), g.fillRect(Math.round(x - L / 2 + 3 + i * 4), py - 7, 3, 2);
}

/** A net over one of the netted (at their feet, (x, y) on screen): they're down under it, its weights round the edge. */
export function drawNetOver(c: Ctx, x: number, y: number, now: number): void {
  const g = c.lit, stir = Math.floor(now * 3) % 2;
  g.fillStyle = '#a89a72';
  for (let dy = -10; dy <= 0; dy++) for (let dx = -6; dx <= 6; dx++) if ((dx + dy + 40) % 3 === 0 || (dx - dy + 40) % 3 === 0) if (Math.abs(dx) + Math.max(0, -dy - 6) * 2 <= 6) g.fillRect(Math.round(x + dx), Math.round(y + dy + (dx === 0 ? stir : 0)), 1, 1);
  g.fillStyle = '#6a6470';
  for (const dx of [-6, -2, 2, 6]) g.fillRect(Math.round(x + dx), Math.round(y + 1), 1, 1);
}

/** This frame's light from the Staithe, in tiles: lamps unbroken, and oil burning (on the water or anywhere). */
export function staitheLights(room: ArenaRoom): { x: number; y: number; r: number; i: number; c: [number, number, number] }[] {
  const out: { x: number; y: number; r: number; i: number; c: [number, number, number] }[] = [];
  for (const p of room.props) if (p.kind === 'lamp' && !p.broken) out.push({ x: p.x, y: p.y, r: 3.2, i: 0.75, c: [1, 0.78, 0.45] });
  const j = jettyOf(room.map);
  if (j && !j.ruined) out.push({ x: j.x + j.w / 2, y: j.y + j.h / 2, r: 3, i: 0.5, c: [1, 0.78, 0.45] });
  for (const s of room.slicks ?? []) if (s.lit >= 0 && room.time - s.lit < slickBurn(s)) out.push({ x: s.x, y: s.y, r: 2.6 + s.r, i: 1, c: [1, 0.55, 0.25] });
  return out;
}

/** Drifting oil drawn eased along, not in the steps its place is sent in (sim/drift.ts): where to draw it. */
const shown = new Map<number, { x: number; y: number; t: number }>();
export function driftAt(s: { id: number; x: number; y: number; drift?: [number, number] }, now: number): { x: number; y: number } {
  if (!s.drift) return s;
  const want = { x: s.x + s.drift[0] * 0.35, y: s.y + s.drift[1] * 0.35 }, was = shown.get(s.id);
  if (!was || Math.hypot(was.x - want.x, was.y - want.y) > 1.5) return shown.set(s.id, { ...want, t: now }), want;
  const k = Math.min(1, Math.max(0, now - was.t) * 2.5);
  Object.assign(was, { x: was.x + (want.x - was.x) * k, y: was.y + (want.y - was.y) * k, t: now });
  if (shown.size > 64) shown.delete(shown.keys().next().value!);
  return was;
}
