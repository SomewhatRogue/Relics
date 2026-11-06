/**
 * What the one-button pastimes share (armmode.ts, knifemode.ts, anvilmode.ts): sitting the hero down at
 * the pastime's spot (Game.enterPastime: the town hears it once), the overlay (pastimehud.ts) over the
 * picture, one button (a finger anywhere, the mouse, Space or Enter; Escape is the way out), and the
 * rules stepped in fixed steps on this screen alone. A press is counted, so a quick tap between two
 * frames still lands on the next step. Getting up (close) stands the hero back where they were, and
 * the town hears that once too. Nothing goes out while it runs.
 */
import type { PastimeId } from '../shared/pastimes';
import type { Game } from './game';
import type { Panel } from './panels';
import type { PastimeCanvas } from './pastimecanvas';
import { PastimeHud } from './pastimehud';

export abstract class OneButton {
  protected hud: PastimeHud;
  /** The button is down now. */
  protected held = false;
  protected touch = matchMedia('(pointer: coarse)').matches;
  /** The rules are finished (the card is up or about to be). */
  protected ended = false;
  private presses = 0;
  private used = 0;
  private last = performance.now();
  private acc = 0;
  private raf = 0;
  private off: (() => void)[] = [];
  private closed = false;

  constructor(protected g: Game, protected panel: Panel, id: PastimeId, protected view: PastimeCanvas, labels: [string, string], leave: string, private fps: number, protected after: () => void = () => {}) {
    g.enterPastime(id);
    this.hud = new PastimeHud(view.out, labels, leave, () => this.quit());
    view.resize();
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, el: EventTarget = this.hud.el, o: AddEventListenerOptions = { passive: false }) => {
      el.addEventListener(t, f as EventListener, o);
      this.off.push(() => el.removeEventListener(t, f as EventListener, o));
    };
    const down = (e: Event) => ((this.held = true), this.presses++, e.preventDefault());
    const up = () => (this.held = false);
    on('pointerdown', down);
    on('pointerup', up, window);
    on('pointercancel', up, window);
    on('keydown', (e) => {
      if (e.key === 'Escape') return e.stopImmediatePropagation(), this.quit();
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.stopImmediatePropagation();
      if (!e.repeat && !this.panel.open) down(e);
    }, window, { capture: true });
    on('keyup', (e) => (e.key === ' ' || e.key === 'Enter') && up(), window, { capture: true });
    on('resize', () => this.view.resize(), window);
    this.raf = requestAnimationFrame(this.frame);
  }

  /** One fixed step of the rules; `press`: a new press lands on it. */
  protected abstract step(press: boolean, now: number): void;
  /** The rules say it's over. */
  protected abstract get over(): boolean;
  /** Draw the picture and the strip along the top. */
  protected abstract draw(now: number): void;
  /** The card at the end (`early`: they got up before it was done). */
  protected abstract finish(early: boolean): void;

  private frame = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, (t - this.last) / 1000)), now = t / 1000, step = 1 / this.fps;
    this.last = t;
    if (!this.ended && !this.panel.open) {
      this.acc += dt;
      while (this.acc >= step && !this.over) {
        this.acc -= step;
        const press = this.presses > this.used;
        this.used = this.presses;
        this.step(press, now);
      }
      if (this.over) this.end(false);
    }
    this.hud.tick(now);
    this.draw(now);
    if (!this.closed) this.raf = requestAnimationFrame(this.frame);
  };

  /** The rules are done (or the way out was taken first): the card. */
  protected end(early: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.held = false;
    this.hud.done(true);
    this.finish(early);
  }

  /** The way out, from the strip or Escape: before the end it ends it; after, it gets you up. */
  quit(): void {
    if (!this.ended) this.end(true);
    else this.close();
  }

  /** Up from it: the overlay goes and you're back where you sat (`out`: and the town hears it). */
  close(out = true): void {
    if (this.closed) return;
    this.closed = true;
    cancelAnimationFrame(this.raf);
    for (const f of this.off) f();
    this.hud.remove();
    this.panel.hide();
    if (out) this.g.leavePastime(), this.after();
  }
}
