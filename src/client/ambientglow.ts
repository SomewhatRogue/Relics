/**
 * Lights in the dark (docs/design/forest-redraw.md, "After dark"; Kyle, 2026-11-23: "a beautiful but dark world"):
 * fireflies and marsh wisps on a job's outdoor map at dusk and by night, gathered where the pattern book put
 * something for them (looks.ts): fireflies over tall grass, mossy hollows, mushroom rings and pools; a wisp over a
 * fen's pool. Paint only, on the glow layer (they shine, they light nothing), silent, few: the nearest places to
 * a hero, a handful of motes each. Each mote wanders its place on a slow loop and blinks on its own time.
 */
import type { GameMap } from '../shared/arena';
import { countryOf, motifsOf, type Motif } from './looks';
import type { Beast } from './townbeasts';

type At = { x: number; y: number };
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const HOSTS = new Set(['tallgrass', 'hollow', 'ring', 'pool']);

/** How dark it is on this map, 0 to 1: nothing by day, a little at dawn, all of it at dusk and night. */
const dark = (m: GameMap) => (m.theme.time === 'night' || m.theme.time === 'dusk' ? 1 : m.theme.time === 'dawn' ? 0.5 : 0);

/** A firefly: a warm green point that swells and fades, a faint halo round it at its brightest. */
function firefly(c: Parameters<Beast['draw']>[0], px: number, py: number, lit: number): void {
  if (lit <= 0.08) return;
  const g = c.glow, x = Math.round(px), y = Math.round(py);
  g.globalAlpha = Math.min(1, lit);
  g.fillStyle = '#dcec7a';
  g.fillRect(x, y, 1, 1);
  if (lit > 0.7) (g.globalAlpha = 0.22), (g.fillStyle = '#b8d060'), g.fillRect(x - 1, y - 1, 3, 3);
  g.globalAlpha = 1;
}

/** A wisp: a pale cold flame a few pixels tall, its halo breathing. */
function wisp(c: Parameters<Beast['draw']>[0], px: number, py: number, now: number, i: number): void {
  const g = c.glow, x = Math.round(px), y = Math.round(py), b = 0.5 + 0.5 * Math.sin(now * 1.7 + i * 2.1);
  g.globalAlpha = 0.16 + b * 0.12;
  g.fillStyle = '#7fc4b4';
  g.fillRect(x - 2, y - 3, 5, 6);
  g.globalAlpha = 0.75;
  g.fillStyle = '#a8e0d0';
  g.fillRect(x - 1, y - 1, 3, 3), g.fillRect(x, y - 2 - Math.round(b), 1, 2);
  g.globalAlpha = 1;
  g.fillStyle = '#e8fff4';
  g.fillRect(x, y, 1, 1);
}

export function glowAmbient(m: GameMap, now: number, heroes: At[]): Beast[] {
  const k = dark(m), country = countryOf(m);
  if (!k || !country || !heroes.length) return [];
  const near = (o: Motif) => Math.min(...heroes.map((h) => Math.hypot(h.x - o.x, h.y - o.y)));
  const hosts = motifsOf(m).filter((o) => HOSTS.has(o.kind) && near(o) < 10).sort((a, b) => near(a) - near(b)).slice(0, 4);
  const out: Beast[] = [];
  hosts.forEach((o, hi) => {
    const n = Math.round((o.kind === 'tallgrass' ? 4 : 3) * k);
    for (let i = 0; i < n; i++) {
      const id = o.v * 7 + i, t = now * (0.16 + hash(id, 1) * 0.12) + hash(id, 2) * 6.28;
      // A slow loop inside its place, its own blink.
      const x = o.x + Math.sin(t) * o.rx * 0.7 * (0.5 + hash(id, 3) * 0.5) + Math.sin(t * 2.3 + id) * 0.25;
      const y = o.y + Math.cos(t * 0.8 + id) * o.ry * 0.7 + Math.sin(t * 1.7) * 0.15;
      const lit = Math.max(0, Math.sin(now * (0.9 + hash(id, 4) * 0.8) + hash(id, 5) * 6.28)) ** 2;
      out.push({ key: `ff${hi}_${o.v}_${i}`, x, y, up: 0.35 + hash(id, 6) * 0.5 + Math.sin(t * 1.3) * 0.12, draw: (c, px, py) => firefly(c, px, py, lit) });
    }
  });
  // Wisps: a fen's, one over each of the two nearest pools, bobbing, drifting a little round it.
  if (country === 'fen' && k >= 1) {
    motifsOf(m).filter((o) => o.kind === 'pool' && near(o) < 12).sort((a, b) => near(a) - near(b)).slice(0, 2).forEach((o, i) => {
      const t = now * 0.21 + o.v;
      out.push({ key: `wisp${o.v}`, x: o.x + Math.sin(t) * o.rx * 0.4, y: o.y + Math.cos(t * 0.7) * o.ry * 0.3, up: 0.55 + Math.sin(now * 0.9 + i) * 0.12, draw: (c, px, py) => wisp(c, px, py, now, i) });
    });
  }
  return out;
}
