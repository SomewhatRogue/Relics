/**
 * Hempen's ropes coming down out of the branches on a second hero (sim/hempenbook.ts; numbers
 * shared/hangtune.ts HEMPEN_BOSS.rope), drawn on the ground in both views (client/wooddraw.ts calls it, and
 * the 2.5D overlay draws the wood's ground through that): after the kit's pose (BOSS.tell) a red circle
 * filling as the rope falls, its edge striped (nothing blocks it: walk out), and the rope's shadow
 * tightening at the middle. The circle drawn is the one judged. Only draws.
 */
import { BOSS, HEMPEN_BOSS } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import type { Ground } from './expeddraw';

export function drawRopes(g: CanvasRenderingContext2D, enemies: Enemy[], P: Ground, t: number, now: number): void {
  const { fall, r } = HEMPEN_BOSS.rope;
  for (const e of enemies) for (const q of e.boss?.ropes ?? []) {
    const k = 1 - (q.at - t) / fall;
    if (k < 0 || q.at - t > fall + BOSS.tell) continue;
    const n = Math.max(16, Math.round(r * 30)), pulse = 0.85 + 0.15 * Math.sin(now * 20);
    // The red filling in from the middle as it comes down.
    g.globalAlpha = 0.45 * pulse;
    g.fillStyle = '#e23a30';
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, [px, py] = P(q.x + Math.cos(a) * r * Math.min(1, k), q.y + Math.sin(a) * r * Math.min(1, k));
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.fill();
    // The striped edge, gold and dark: can't be blocked.
    g.globalAlpha = 0.95;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, [px, py] = P(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r);
      g.fillStyle = Math.floor(i / 2) % 2 ? '#ffd040' : '#2a1408';
      g.fillRect(Math.round(px), Math.round(py), 2, 1);
    }
    // The rope's shadow at the middle, tightening as it nears.
    const [cx, cy] = P(q.x, q.y), s = Math.max(1, Math.round(4 * (1 - Math.min(1, k)) + 1));
    g.globalAlpha = 0.5;
    g.fillStyle = '#1a0a08';
    g.fillRect(Math.round(cx - s), Math.round(cy - 1), s * 2, 2);
  }
  g.globalAlpha = 1;
}
