/**
 * The live hound in Maeve's panel (houndui.ts): the hound as picked so far, drawn by the game's own
 * drawHound, going through its paces on a loop: trotting, a sit with the tail going, nose to the
 * ground, a shake, a run, lying with its head on its paws. Its name over it. Stops when the panel goes.
 */
import type { HoundLook } from '../shared/houndlook';
import type { Hound } from '../sim/types';
import type { Ctx } from './draw';
import { drawHound } from './hound';
import type { PoseName } from './houndposes';

const W = 64, H = 40;
/** The loop: [pose, seconds, frames a second]. */
const LOOP: [PoseName, number, number][] = [['trot', 2.2, 9], ['sit', 1.6, 0], ['sniff', 1.6, 3], ['shake', 1, 9], ['run', 1.6, 13], ['down', 1.8, 0], ['walk', 2, 6]];
const SPAN = LOOP.reduce((s, [, d]) => s + d, 0);

export class HoundPreview {
  readonly el = document.createElement('canvas');
  private lit = document.createElement('canvas');
  private glow = document.createElement('canvas');
  private raf = 0;
  private dog: Hound = { x: 0, y: 0, fx: 1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false };

  constructor(public look: HoundLook) {
    for (const c of [this.el, this.lit, this.glow]) (c.width = W), (c.height = H);
    this.el.className = 'hd-prev';
  }

  start(): void {
    const frame = (ms: number) => {
      // Gone with the panel: stop.
      if (!this.el.isConnected) return;
      this.draw(ms / 1000);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  /** The pose and frame `now` s into the loop. */
  static at(now: number): [PoseName, number] {
    let t = now % SPAN;
    for (const [n, d, fps] of LOOP) {
      if (t < d) return [n, fps ? Math.floor(t * fps) : 0];
      t -= d;
    }
    return ['stand', 0];
  }

  private draw(now: number): void {
    const lit = this.lit.getContext('2d')!, glow = this.glow.getContext('2d')!, out = this.el.getContext('2d')!;
    for (const g of [lit, glow, out]) g.clearRect(0, 0, W, H), (g.imageSmoothingEnabled = false);
    const c: Ctx = { lit, glow, now }, pose = HoundPreview.at(now);
    drawHound(c, this.dog, W / 2, H - 4, { look: this.look, name: this.look.name, pose, mood: pose[0] === 'sit' ? { wag: Math.floor(now * 10) % 2 === 0 } : undefined });
    out.drawImage(this.lit, 0, 0);
    out.drawImage(this.glow, 0, 0);
  }
}
