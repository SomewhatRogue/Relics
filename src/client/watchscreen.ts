/** What the shift's loop and the sight need of a view, side-on (watchview.ts) or upright (deepview.ts). */
import type { WatchState } from '../sim/watchtypes';
import type { Say } from './watchfx';

export interface ShiftView {
  readonly out: HTMLCanvasElement;
  /** Fit the screen at a whole-number scale. */
  resize(): void;
  render(s: WatchState, says: Say[], now: number, bigSight: boolean): void;
  /** A point on screen (CSS pixels from the canvas's corner) as an aim the sim takes. */
  toAim(cssX: number, cssY: number): [number, number];
  /** Aim units per CSS pixel (for dragging the sight). */
  readonly perCss: number;
  /** Keep an aim where the sight can go. */
  clampAim(x: number, y: number): [number, number];
  /** Where on the canvas a happening at (x, y), and `d` out upright, is drawn (words rise from there). */
  sayAt(x: number, y: number, d?: number): [number, number];
}
