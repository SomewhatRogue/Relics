/**
 * A shift on the wall: the Night Watch over the town, run only in this browser (no relay traffic; the
 * town drops you while you're up there, as the yard does: Game.enterWatch). Its own loop: read the
 * sight, step the shift (sim/watch.ts), say and sound what happened, paint it. At the bell, or END
 * SHIFT, the card (watchcard.ts); then another shift or back down the stair to Brisk.
 * (Later: your hero shows parked on the wall for everyone else in town, bow on the parapet.)
 */
import { advance, newWatch } from '../sim/watch';
import { results } from '../sim/watchscore';
import type { Part, WatchEvent, WatchState } from '../sim/watchtypes';
import type { GobKind } from '../shared/watchtune';
import { newGob } from '../sim/watchnight';
import { zones } from '../sim/watchzones';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { WatchView } from './watchview';
import { WatchInput } from './watchinput';
import { WatchHud } from './watchhud';
import { bankShift, showShift } from './watchcard';
import type { Say } from './watchfx';
import { WATCHW } from './watchwords';

/** A seed for each shift (the shift's own goblins and night come from it). */
const seedNow = () => (Date.now() ^ (performance.now() * 1000)) >>> 0;

export class WatchShift {
  s: WatchState;
  private view: WatchView;
  private hud: WatchHud;
  private input: WatchInput;
  private says: Say[] = [];
  private last = performance.now();
  private raf = 0;
  private ended = false;

  constructor(private g: Game, private panel: Panel, seed = seedNow()) {
    // Held upright, a phone gets the tall field (shorter, steeper, bigger on screen); otherwise the wide one.
    this.s = newWatch(seed, innerHeight > innerWidth * 1.2 ? 'tall' : 'wide');
    this.view = new WatchView(g.hero, this.s.field);
    this.hud = new WatchHud(this.view.out, matchMedia('(pointer: coarse)').matches, () => this.end());
    this.input = new WatchInput(this.hud.el, this.view);
    [this.input.ax, this.input.ay] = [this.s.ax, this.s.ay];
    this.view.resize();
    addEventListener('resize', this.fit);
    addEventListener('keydown', this.key, true);
    this.raf = requestAnimationFrame(this.frame);
  }

  private fit = () => this.view.resize();
  /** Keys are the wall's while you're on it: Escape ends the shift (and can't shut the card under you). */
  private key = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest?.('input')) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') this.end();
  };

  private frame = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, (t - this.last) / 1000));
    this.last = t;
    if (!this.ended) {
      advance(this.s, this.input.intent(), dt);
      for (const e of this.s.events) this.heard(e, t / 1000);
      if (this.s.over) this.end();
    }
    this.says = this.says.filter((w) => t / 1000 - w.t0 < w.dur);
    this.view.render(this.s, this.says, t / 1000, this.input.touch);
    this.hud.frame(this.s);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** What a happening says over the field, and how it sounds. */
  private heard(e: WatchEvent, now: number): void {
    const say = (s: string, x: number, y: number, col: string, dur = 1.1) => this.says.push({ s, x: x + this.view.ox, y: y + this.view.oy, col, t0: now, dur });
    if (e.k === 'loose') sfx.arrow();
    else if (e.k === 'hit') e.part === 'head' ? sfx.hit(true) : sfx.bodyhit();
    else if (e.k === 'helmet') sfx.block();
    else if (e.k === 'splinter') sfx.propbreak();
    else if (e.k === 'shieldbreak') sfx.guardbreak();
    else if (e.k === 'torch') sfx.oilfire();
    else if (e.k === 'nearmiss') sfx.wallhit();
    else if (e.k === 'kill') {
      if (e.head) say(WATCHW.headshot, e.x, e.y - 8, '#ffd27a', 1.2);
      say(`+${e.pts}`, e.x, e.y, e.head ? '#ffd27a' : '#e8e0d0');
    } else if (e.k === 'wall') say(WATCHW.atWall, Math.min(e.x, 160), e.y - 6, '#ff8a6a', 1.8);
  }

  /** The bell (or END SHIFT): bank the score and the pay, and show the card. */
  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.s.over = true;
    this.input.held = false;
    this.hud.done();
    const r = results(this.s), st = bankShift(this.g, r);
    showShift(this.panel, r, st, () => this.again(), () => this.close());
  }

  /** For the look scripts: a goblin of `kind` at x on the near line, and an arrow put just short of one of its parts. */
  put(kind: GobKind, x: number): number {
    const g = newGob(this.s, kind, x, 0);
    this.s.gobs.push(g);
    return g.id;
  }
  shootAt(id: number, part: Part, power = 1): void {
    const z = zones(this.s.gobs.find((g) => g.id === id)!).find((q) => q.part === part)!;
    const [x, y] = z.disc ? [z.disc.x, z.disc.y] : [(z.box!.x0 + z.box!.x1) / 2, (z.box!.y0 + z.box!.y1) / 2];
    this.s.arrows.push({ x: x + 8, y, vx: -400, vy: 0, power });
  }

  private again(): void {
    this.close(false);
    openWatch(this.g, this.panel);
  }

  /** Down the stair: the overlay goes, and you're back by Brisk in town. */
  close(down = true): void {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.fit);
    removeEventListener('keydown', this.key, true);
    this.input.dispose();
    this.hud.remove();
    this.panel.hide();
    if (live === this) live = null;
    if (down) this.g.leaveWatch();
  }
}

let live: WatchShift | null = null;
/** Up onto the wall for a shift. */
export function openWatch(g: Game, panel: Panel, seed?: number): WatchShift {
  live?.close(false);
  g.enterWatch();
  live = new WatchShift(g, panel, seed);
  (globalThis as { __watch?: WatchShift }).__watch = live;
  return live;
}
