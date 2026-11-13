/**
 * The top of the screen never hides danger (Kyle, 2026-11-13: "if UI is ever blocking an enemy or an
 * important thing"). Two parts, drawing only:
 * - The top line: on an upright phone, the lowest edge of what is docked at the top (the unit frame, the boss
 *   plate, the tracker, the loot roll card), measured each quarter second and handed to phoneband.ts, so the
 *   cameras make room under all of it the way they already do for the plate.
 * - The fade: any of those (and the corner's buttons) that has a live enemy, my hero or a red telegraph under
 *   it goes faint (ironui.css .uncovered), with a red notch on its lower edge over the danger. It still takes
 *   taps. The thumb buttons do the same already (underbtn.ts, whose telegraph shapes this shares).
 */
import type { Hero } from '../sim/types';
import type { ArenaRoom } from '../sim/room';
import { setTopLine, upright } from './phoneband';
import { shape } from './underbtn';

type Screen = { tileScreen(x: number, y: number, up?: number): [number, number] };
/** left, top, right, bottom in CSS pixels. */
export type Box = [number, number, number, number];

/** What sits over the fight at the top, and the corner's buttons. */
const WATCH = ['#hud .unit', '#boss', '#banner', '#roll', '#corner'];
/** How much of the screen's height counts as "docked at the top" for the top line. */
const TOP_SHARE = 0.4;

/** Whether two boxes overlap. */
export const overlaps = (a: Box, b: Box): boolean => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

/** The top line: the lowest bottom of the boxes whose top is in the screen's top share (0 if none). */
export function topLine(boxes: Box[], screenH: number): number {
  let low = 0;
  for (const b of boxes) if (b[1] < screenH * TOP_SHARE && b[3] > b[1]) low = Math.max(low, b[3]);
  return Math.min(low, screenH * TOP_SHARE);
}

export class Uncover {
  private els: { el: HTMLElement; box: Box | null; notch: HTMLElement }[];
  private at = -9;

  constructor() {
    this.els = WATCH.map((sel) => document.querySelector<HTMLElement>(sel)).filter((el): el is HTMLElement => !!el).map((el) => ({ el, box: null, notch: this.notch() }));
  }

  private notch(): HTMLElement {
    const n = document.createElement('i');
    n.className = 'unotch';
    n.hidden = true;
    n.setAttribute('aria-hidden', 'true');
    document.body.appendChild(n);
    return n;
  }

  frame(view: Screen, room: ArenaRoom, me: Hero | undefined, now: number): void {
    // Places change with the layout, a plate or a card coming up: looked up four times a second.
    if (now - this.at > 0.25) {
      this.at = now;
      for (const w of this.els) {
        // (Hidden, it's out of the count: the roll card is only slid off the screen, so its own flag decides.)
        const r = w.el.closest('[hidden]') ? null : w.el.getBoundingClientRect();
        w.box = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight ? [r.left, r.top, r.right, r.bottom] : null;
      }
      setTopLine(upright(innerWidth, innerHeight) ? topLine(this.els.flatMap((w) => (w.box ? [w.box] : [])), innerHeight) : 0);
    }
    const hits = dangers(view, room, me);
    for (const w of this.els) {
      const hit = w.box ? hits.find((h) => overlaps(h, w.box!)) : undefined;
      if (w.el.classList.contains('uncovered') !== !!hit) w.el.classList.toggle('uncovered', !!hit);
      if (w.notch.hidden !== !hit) w.notch.hidden = !hit;
      if (hit && w.box) {
        const x = Math.max(w.box[0] + 8, Math.min(w.box[2] - 8, (hit[0] + hit[2]) / 2));
        w.notch.style.transform = `translate(${Math.round(x)}px, ${Math.round(w.box[3])}px)`;
      }
    }
  }
}

/** Boxes on screen worth seeing: each live enemy's body, my hero's, and the floor under each telegraph. */
function dangers(view: Screen, room: ArenaRoom, me: Hero | undefined): Box[] {
  const out: Box[] = [];
  const body = (x: number, y: number) => {
    const [fx, fy] = view.tileScreen(x, y), [, hy] = view.tileScreen(x, y, 1.6), half = Math.max(12, (fy - hy) * 0.35);
    out.push([fx - half, hy, fx + half, fy + 4]);
  };
  if (me && me.hp > 0) body(me.x, me.y);
  for (const e of room.enemies) {
    if (e.hp <= 0) continue;
    body(e.x, e.y);
    const a = e.attack;
    if (!a || a.t >= a.windup + a.active) continue;
    for (const [px, py] of shape(a)) {
      const [x, y] = view.tileScreen(px, py);
      out.push([x - 8, y - 8, x + 8, y + 8]);
    }
  }
  return out;
}
