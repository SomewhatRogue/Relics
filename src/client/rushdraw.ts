/**
 * A pack rush's shared telegraph (sim/packrush.ts), in both views: a red line linking the goblins winding
 * up together, across their feet, filling as their own floor telegraphs fill, and flashing white with
 * them while a parry would land. Each blow's own red shape is drawn as ever (foes.ts, three/teleg3d.ts):
 * these are the same attacks the room judges. Drawing only.
 */
import type { Enemy } from '../sim/types';

const RED = '#e23a30', DARK = '#5a1410', WHITE = '#ffffff', HOT = '#ffb0a0';

/** The goblins of each rush still winding up, in order round the fan. */
export function rushGroups(enemies: Enemy[]): Enemy[][] {
  const by = new Map<number, Enemy[]>();
  for (const e of enemies) {
    const a = e.attack;
    if (e.act !== 'attack' || !a?.rush || a.t >= a.windup) continue;
    by.set(a.rush, [...(by.get(a.rush) ?? []), e]);
  }
  return [...by.values()].filter((g) => g.length >= 2).map((g) => {
    // Round the fan's middle, from the hero's side: sort by the angle each faces at it.
    const a = g[0].attack!, cx = a.rcx ?? g[0].x, cy = a.rcy ?? g[0].y, mx = g.reduce((s, e) => s + e.attack!.dx, 0), my = g.reduce((s, e) => s + e.attack!.dy, 0);
    const rel = (e: Enemy) => Math.atan2((e.x - cx) * my - (e.y - cy) * mx, (e.x - cx) * mx + (e.y - cy) * my);
    return [...g].sort((p, q) => rel(p) - rel(q));
  });
}

/**
 * Draw every rush's link. `at`: an enemy's feet on this layer; `g` the unlit layer; `pw` the watching
 * player's parry window (s), as the floor telegraphs use it; `t` the wall clock for the pulse.
 */
export function drawRushLinks(g: CanvasRenderingContext2D, enemies: Enemy[], at: (e: Enemy) => [number, number], pw: number, t: number): void {
  for (const grp of rushGroups(enemies)) {
    const a = grp[0].attack!, prog = Math.min(1, a.t / a.windup), now = a.windup - a.t <= pw;
    const pts = grp.map(at);
    for (let i = 0; i + 1 < pts.length; i++) link(g, pts[i], pts[i + 1], prog, now, t);
    // A mark at each goblin's feet: the link's knots.
    for (const [x, y] of pts) {
      g.fillStyle = now ? WHITE : RED;
      g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      g.fillStyle = now ? HOT : DARK;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
}

/** One stretch of the link: dark under, red filling in from both ends to the middle as the wind-up runs. */
function link(g: CanvasRenderingContext2D, [x0, y0]: [number, number], [x1, y1]: [number, number], prog: number, now: boolean, t: number): void {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0))), pulse = Math.floor(t * 12) % 2;
  for (let i = 0; i <= n; i++) {
    const q = i / n, lit = Math.min(q, 1 - q) * 2 <= prog;
    const x = Math.round(x0 + (x1 - x0) * q), y = Math.round(y0 + (y1 - y0) * q);
    g.fillStyle = DARK;
    g.fillRect(x, y + 1, 1, 1);
    if (!lit && (i + pulse) % 2) continue;
    // Two pixels thick once lit, so it reads on a phone.
    g.fillStyle = now ? WHITE : lit ? RED : '#8a2a20';
    g.fillRect(x, y - (lit ? 1 : 0), 1, lit ? 2 : 1);
  }
}
