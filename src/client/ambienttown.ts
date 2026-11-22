/**
 * The living world, L2, the town's half (ambient.ts): moths round the lit lamps at night, bats at dusk over the
 * roofs, the forge's sparks. Wickhold only. Each is a small `Beast` drawn the tile way (a few shades, whole pixels,
 * lit from the upper left); pure functions of the clock, so every screen in a party sees the same. Silent, and few
 * (Kyle, 2026-11-22: "not too too busy"): at most six moths, three bats and three sparks.
 */
import type { GameMap } from '../shared/arena';
import { lampKey, lampsLit } from '../shared/lamps';
import type { Beast } from './townbeasts';
import type { At } from './ambient';
import { dusk } from './streetlife';
import { townPhase } from './townclock';

/** Moths come to a lamp within this many tiles of a hero. */
const MOTH_REACH = 8;
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const nearest = (heroes: At[], x: number, y: number) => heroes.reduce((d, h) => Math.min(d, Math.hypot(h.x - x, h.y - y)), Infinity);
/** A 0..1 ramp from `a` to `b`. */
const ramp = (v: number, a: number, b: number) => Math.max(0, Math.min(1, (v - a) / (b - a)));

interface Lamp { x: number; y: number; up: number }
interface Town { lamps: Lamp[]; roofs: { x: number; y: number; r: number }[]; forge: { x: number; y: number } | null }
const seen = new WeakMap<GameMap, Town>();

/** What the map has that these use, found once: its lamps (posts, wall and yard torches, braziers), its roofs, the forge's stack. */
function town(m: GameMap): Town {
  const had = seen.get(m);
  if (had) return had;
  const lamps: Lamp[] = [];
  for (const o of m.rounds) if (o.kind === 'post') lamps.push({ x: o.x, y: o.y, up: 2.1 });
  for (const t of m.torches) if (!m.blocks.some((b) => b.kind === 'hearth' && t.x > b.x && t.x < b.x + b.w && t.y > b.y - 0.1 && t.y < b.y + b.h + 0.1)) lamps.push({ x: t.x, y: t.y, up: 1.15 });
  for (const b of m.braziers) if (!b.wild) lamps.push({ x: b.x, y: b.y, up: 1.1 });
  const roofs = m.blocks.filter((b) => ['house', 'hall', 'church', 'tavern', 'forge', 'tower', 'granary'].includes(b.kind) && b.w >= 2).map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: Math.max(b.w, b.h) / 2 + 0.8 }));
  const f = m.blocks.find((b) => b.door === 'forge');
  const out: Town = { lamps, roofs, forge: f ? { x: f.x + f.w - 1, y: f.y + 0.6 } : null };
  seen.set(m, out);
  return out;
}

/** A moth: two pale pixels that flutter, on the glow layer, round a lamp's flame. */
function moth(c: Parameters<Beast['draw']>[0], px: number, py: number, now: number, i: number, k: number): void {
  const t = now * (0.8 + (i % 3) * 0.25) + i * 2.3, g = c.glow;
  const x = Math.round(px + Math.sin(t) * (5 + (i % 2) * 2) + Math.cos(t * 1.9) * 2), y = Math.round(py + Math.sin(t * 1.4) * 4 + Math.cos(t * 0.6) * 2);
  g.globalAlpha = k;
  g.fillStyle = '#e8dcb0';
  g.fillRect(x, y, 1, 1);
  if (Math.floor(now * 9 + i * 3) % 2) g.fillRect(x - 1, y - 1, 1, 1), g.fillRect(x + 1, y - 1, 1, 1);
  else g.fillRect(x - 1, y, 3, 1);
  g.fillStyle = '#fff4c8';
  g.fillRect(x, y, 1, 1);
  g.globalAlpha = 1;
}

/** A bat: a dark body with wings that beat in two frames, turned the way it is going. */
function bat(c: Parameters<Beast['draw']>[0], px: number, py: number, now: number, i: number, fx: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), up = Math.floor(now * 7 + i * 2) % 2;
  g.fillStyle = '#1c1824';
  g.fillRect(X - 1, Y - 1, 3, 2);
  g.fillStyle = '#2e2838';
  if (up) g.fillRect(X - 4, Y - 3, 3, 1), g.fillRect(X + 2, Y - 3, 3, 1), g.fillRect(X - 3, Y - 2, 1, 1), g.fillRect(X + 3, Y - 2, 1, 1);
  else g.fillRect(X - 4, Y, 3, 1), g.fillRect(X + 2, Y, 3, 1), g.fillRect(X - 5, Y + 1, 1, 1), g.fillRect(X + 5, Y + 1, 1, 1);
  g.fillStyle = '#1c1824';
  g.fillRect(X + (fx > 0 ? 1 : -1), Y - 2, 1, 1);
}

/** A spark off the forge's stack: it climbs, drifts and dims, white-yellow to orange to red, then is gone. */
function spark(c: Parameters<Beast['draw']>[0], px: number, py: number, now: number, i: number): void {
  const life = 1.2 + hash(i, 5) * 0.8, T = now / life + hash(i, 9), k = T - Math.floor(T), seed = Math.floor(T) * 7 + i;
  const x = Math.round(px + (hash(seed, 1) - 0.5) * 4 + Math.sin(k * 6 + seed) * 3 * k), y = Math.round(py - k * (14 + hash(seed, 2) * 10));
  if (k > 0.92) return;
  c.glow.fillStyle = k < 0.25 ? '#fff0a0' : k < 0.6 ? '#ff9a3c' : '#c8501c';
  c.glow.fillRect(x, y, 1, 1);
}

export function townAmbient(m: GameMap, now: number, heroes: At[]): Beast[] {
  if (m.name !== 'WICKHOLD' || !heroes.length) return [];
  const T = town(m), out: Beast[] = [], d = dusk();
  // Moths: round the lit lamps nearest the heroes, once it is properly dark.
  if (d > 0.5) {
    const lit = T.lamps.filter((l) => lampsLit(townPhase(), lampKey(l.x, l.y)) > 0.5 && nearest(heroes, l.x, l.y) < MOTH_REACH).sort((a, b) => nearest(heroes, a.x, a.y) - nearest(heroes, b.x, b.y)).slice(0, 3);
    const k = ramp(d, 0.5, 0.7);
    lit.forEach((l, li) => {
      for (let i = 0; i < (li ? 2 : 3); i++) out.push({ key: `mo${Math.round(l.x * 4)}_${Math.round(l.y * 4)}_${i}`, x: l.x, y: l.y, up: l.up, draw: (c, px, py) => moth(c, px, py, now, i + li * 3, k) });
    });
  }
  // Bats: a few loose loops over the rooftops near the heroes, as the light goes and before the deep of night.
  if (d > 0.4 && d < 0.9 && T.roofs.length) {
    const n = 1 + Math.round(2 * Math.sin(ramp(d, 0.4, 0.9) * Math.PI));
    for (let i = 0; i < n; i++) {
      const near = T.roofs.filter((r) => nearest(heroes, r.x, r.y) < 16);
      if (!near.length) break;
      const r = near[Math.floor(hash(i, 3) * near.length)], t = now * (0.35 + hash(i, 4) * 0.2) + i * 2, a = t + Math.sin(t * 0.7) * 0.8;
      out.push({ key: 'bat' + i, x: r.x + Math.cos(a) * r.r * 1.1, y: r.y + Math.sin(a) * r.r * 0.7, up: 3 + hash(i, 6) * 1.2 + Math.sin(t * 2.3) * 0.25, draw: (c, px, py) => bat(c, px, py, now, i, -Math.sin(a)) });
    }
  }
  // The forge's sparks, any time of day, while a hero is within sight of it.
  if (T.forge && nearest(heroes, T.forge.x, T.forge.y) < 16) for (let i = 0; i < 3; i++) out.push({ key: 'sp' + i, x: T.forge.x, y: T.forge.y, up: 1.9, draw: (c, px, py) => spark(c, px, py, now, i) });
  return out;
}
