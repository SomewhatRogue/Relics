/**
 * Aiming on the wall. A laptop: the sight is the mouse; hold a button to draw, let go to loose. A
 * phone: put a finger down anywhere to start the draw, drag to move the sight (it moves with the
 * finger, not to it, so the finger never covers what you're aiming at), lift to loose. Releases are
 * counted, so a quick tap between two frames still looses.
 */
import { FIELDS, WATCH } from '../shared/watchtune';
import type { WatchIntent } from '../sim/watchtypes';
import type { WatchView } from './watchview';

/** How far the sight moves for a finger's drag (1: as far as the finger, on the screen). */
const DRAG = 1;

export class WatchInput {
  ax = 0;
  ay = 0;
  held = false;
  looses = 0;
  touch = matchMedia('(pointer: coarse)').matches;
  private finger: { id: number; x: number; y: number; ax: number; ay: number } | null = null;
  private off: (() => void)[] = [];

  constructor(private el: HTMLElement, private view: WatchView) {
    const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void, o: AddEventListenerOptions = { passive: false }) => {
      el.addEventListener(t, f as EventListener, o);
      this.off.push(() => el.removeEventListener(t, f as EventListener));
    };
    on('mousemove', (e) => this.mouse(e));
    on('mousedown', (e) => (e.button === 0 && (this.mouse(e), (this.held = true)), e.preventDefault()));
    on('mouseup', (e) => e.button === 0 && this.release());
    on('mouseleave', () => this.held && this.release());
    on('contextmenu', (e) => e.preventDefault());
    on('touchstart', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      this.touch = true;
      const t = e.changedTouches[0];
      if (this.finger || !t) return;
      this.finger = { id: t.identifier, x: t.clientX, y: t.clientY, ax: this.ax, ay: this.ay };
      this.held = true;
    });
    on('touchmove', (e) => {
      e.preventDefault();
      const f = this.finger, t = f && [...e.changedTouches].find((q) => q.identifier === f.id);
      if (!f || !t) return;
      const k = this.view.perCss * DRAG;
      this.aim(f.ax + (t.clientX - f.x) * k, f.ay + (t.clientY - f.y) * k);
    });
    const lift = (e: TouchEvent) => {
      const f = this.finger;
      if (!f || ![...e.changedTouches].some((q) => q.identifier === f.id)) return;
      e.preventDefault();
      this.finger = null;
      this.release();
    };
    on('touchend', lift);
    on('touchcancel', lift);
  }

  private mouse(e: MouseEvent): void {
    const r = this.el.getBoundingClientRect();
    this.aim(...this.view.toField(e.clientX - r.left, e.clientY - r.top));
  }
  private aim(x: number, y: number): void {
    const F = FIELDS[this.view.field];
    this.ax = Math.max(F.from - 20, Math.min(WATCH.w, x));
    this.ay = Math.max(0, Math.min(F.h, y));
  }
  private release(): void {
    if (!this.held) return;
    this.held = false;
    this.looses++;
  }

  intent(): WatchIntent {
    return { ax: this.ax, ay: this.ay, held: this.held, looses: this.looses };
  }

  dispose(): void {
    for (const f of this.off) f();
  }
}
