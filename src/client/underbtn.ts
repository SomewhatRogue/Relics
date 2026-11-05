/**
 * The fallback (Kyle, 2026-11-04: buttons covering the hero on a phone): any touch button the hero, or
 * a red telegraph on the floor, passes under goes faint (35%, cluster.css .tb.under) so you can see
 * through it. The cameras keep the hero clear of the cluster (phoneband.ts); this catches the rest.
 * Drawing only.
 */
import { isRound, type Hero } from '../sim/types';
import type { ArenaRoom } from '../sim/room';

type Screen = { tileScreen(x: number, y: number, up?: number): [number, number] };
type Box = [number, number, number, number];

export class UnderButtons {
  private boxes: [HTMLElement, DOMRect][] = [];
  private at = -9;

  frame(view: Screen, room: ArenaRoom, me: Hero | undefined, now: number): void {
    // The buttons' places change only with the layout: looked up twice a second.
    if (now - this.at > 0.5) {
      this.at = now;
      this.boxes = [...document.querySelectorAll<HTMLElement>('#touch .tb')].map((b) => [b, b.getBoundingClientRect()] as [HTMLElement, DOMRect]).filter(([, r]) => r.width > 0);
    }
    const hits: Box[] = [];
    if (me) {
      const [x, y] = view.tileScreen(me.x, me.y);
      hits.push([x - 14, y - 48, x + 14, y + 4]);
    }
    for (const e of room.enemies) {
      const a = e.attack;
      if (!a || a.t >= a.windup + a.active) continue;
      for (const [px, py] of shape(a)) {
        const [x, y] = view.tileScreen(px, py);
        hits.push([x - 6, y - 6, x + 6, y + 6]);
      }
    }
    for (const [b, r] of this.boxes) {
      const under = hits.some(([l, t, rt, bt]) => l < r.right && rt > r.left && t < r.bottom && bt > r.top);
      if (b.classList.contains('under') !== under) b.classList.toggle('under', under);
    }
  }
}

/** Points over a telegraph's floor (tiles): a round one's middle and rim, a lane or cone along its reach. */
function shape(a: NonNullable<ArenaRoom['enemies'][number]['attack']>): [number, number][] {
  if (isRound(a.kind)) return [[a.cx, a.cy], ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [a.cx + Math.cos(i * 0.785) * a.radius, a.cy + Math.sin(i * 0.785) * a.radius] as [number, number])];
  const out: [number, number][] = [];
  const half = ((a.arc || 0) / 2) * (Math.PI / 180), base = Math.atan2(a.dy, a.dx);
  for (const da of half > 0.05 ? [-half, -half / 2, 0, half / 2, half] : [0]) for (const k of [0.25, 0.5, 0.75, 1]) {
    out.push([a.ox + Math.cos(base + da) * a.range * k, a.oy + Math.sin(base + da) * a.range * k]);
  }
  return out;
}
