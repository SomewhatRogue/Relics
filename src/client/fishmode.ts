/**
 * Fishing at the millpond, run only in this browser (shared/fishing.ts has the rules). Taking a rod
 * sits your hero down on the bank (Game.enterPastime), which the town hears once (townpresence.ts);
 * the rest is here: one button (a finger anywhere, the mouse, or Space) to swing the cast, strike and
 * reel. A landed fish shows on a card, goes on your record if it's a best, and back in the pond. PUT THE
 * ROD BACK (or Escape) stands you up again, and the town hears that once too.
 */
import { newFishRecord, newFishing, recordCatch, seedOf, stepFish, type FishPhase, type FishState } from '../shared/fishing';
import { speciesOf, weighs } from '../shared/fishtune';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { FishView } from './fishview';
import { PastimeHud } from './pastimehud';
import { fishCard } from './fishart';
import { FISHW } from './pastimewords';

const p = (s: string) => `<p>${s}</p>`;

export class FishSit {
  s: FishState = newFishing();
  private view: FishView;
  private hud: PastimeHud;
  private held = false;
  private presses = 0;
  private last = performance.now();
  private raf = 0;
  private was: FishPhase = 'ready';
  private caught = 0;
  private touch = matchMedia('(pointer: coarse)').matches;
  private off: (() => void)[] = [];

  constructor(private g: Game, private panel: Panel) {
    g.enterPastime('fish');
    this.view = new FishView(g.hero);
    this.hud = new PastimeHud(this.view.out, [FISHW.caught, FISHW.biggest], FISHW.leave, () => this.close());
    this.view.resize();
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
      if (e.key === 'Escape') return e.stopImmediatePropagation(), this.close();
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.stopImmediatePropagation();
      if (!e.repeat && !this.panel.open) down(e);
    }, window, { capture: true });
    on('keyup', (e) => (e.key === ' ' || e.key === 'Enter') && up(), window, { capture: true });
    on('resize', () => this.view.resize(), window);
    this.raf = requestAnimationFrame(this.frame);
  }

  /** The next cast's seed: the hero and how many casts they've made, saved as it goes (a refresh can't roll it again). */
  private castSeed(): number {
    const pr = this.g.profile, rec = (pr.fishing ??= newFishRecord()), seed = seedOf(pr.id, rec.casts);
    rec.casts++;
    this.g.keep();
    return seed;
  }

  private frame = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, (t - this.last) / 1000)), now = t / 1000;
    this.last = t;
    if (!this.panel.open) stepFish(this.s, { held: this.held, presses: this.presses }, dt, () => this.castSeed());
    if (this.s.phase !== this.was) this.changed(this.was, now);
    this.was = this.s.phase;
    this.cues(now);
    this.view.render(this.s, now);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** What a change of phase sounds like and says. */
  private changed(from: FishPhase, now: number): void {
    const s = this.s;
    if (s.phase === 'fly') sfx.swing();
    else if (s.phase === 'wait' && from === 'fly') sfx.well();
    else if (s.phase === 'bite') (sfx.well(), this.hud.cue(FISHW.strike, now, FISH_WINDOW));
    else if (s.phase === 'reel') (sfx.yank(), this.hud.clearCue());
    else if (s.phase === 'landed') this.landed();
    else if (s.phase === 'lost') (s.why === 'snapped' ? sfx.guardbreak() : sfx.drop(), this.hud.cue(FISHW.lost[s.why!], now, 3.2, 'small'));
  }

  private cues(now: number): void {
    const s = this.s, rec = this.g.profile.fishing, best = rec?.best ? weighs(rec.best.oz) : '-';
    this.hud.stats(String(this.caught), best);
    if (s.phase === 'reel') {
      const say = s.running ? FISHW.running : s.tell ? FISHW.willRun : '';
      if (say && this.hud.cueText !== say) this.hud.cue(say, now, 0, s.running ? 'bad' : '');
      else if (!say && this.hud.cueText) this.hud.clearCue();
    }
    this.hud.tick(now);
    this.hud.hint(s.phase === 'ready' || s.phase === 'aim' || s.phase === 'landed' || s.phase === 'lost' ? (this.touch ? FISHW.hintCast.touch : FISHW.hintCast.mouse) : s.phase === 'reel' ? FISHW.hintReel : s.phase === 'wait' ? FISHW.hintWait : '');
  }

  /** On the bank: the card, your record, and back in it goes. */
  private landed(): void {
    const s = this.s, f = s.fish!, sp = speciesOf(f.sp), pr = this.g.profile, rec = (pr.fishing ??= newFishRecord());
    const r = recordCatch(rec, f.sp, f.oz);
    this.g.keep();
    this.caught++;
    r.ever && rec.caught > 1 ? sfx.fanfare() : sfx.loot();
    this.held = false;
    const note = [r.first ? FISHW.first(sp.name) : '', r.kind ? FISHW.kindBest(sp.name) : '', r.ever && rec.caught > 1 ? FISHW.everBest : ''].filter(Boolean).map(p).join('');
    this.hud.done(true);
    this.panel.show(sp.name, fishCard(f.sp, f.oz) + p(`<b>${FISHW.landed(sp.name, f.oz)}</b>`) + note + p(FISHW.back),
      [{ label: FISHW.again, primary: true, act: () => (this.panel.hide(), this.hud.done(false)) }, { label: FISHW.leave, act: () => this.close() }], true);
  }

  /** Up off the bank, back in town where you sat. */
  close(): void {
    cancelAnimationFrame(this.raf);
    for (const f of this.off) f();
    this.hud.remove();
    this.panel.hide();
    if (live === this) live = null;
    this.g.leavePastime();
  }
}

const FISH_WINDOW = 1;

let live: FishSit | null = null;
/** Sit down at the millpond with a rod. */
export function openFishing(g: Game, panel: Panel): FishSit {
  live?.close();
  live = new FishSit(g, panel);
  (globalThis as { __fish?: FishSit }).__fish = live;
  return live;
}
