/**
 * A round at the archery butts, run only in this browser (shared/range.ts has the rules, in fixed
 * steps). Stepping up to the line parks your hero there for the town (Game.enterPastime, said once);
 * the sight is aimed as on the wall (watchinput.ts: drag and lift on a phone, the mouse and a click on
 * a laptop). At the bell, the card; your best is kept on your hero, and the round's arrows go to the
 * shared world once, which scores them again before they go on the town's board (shared/rangeboard.ts).
 */
import { newRange, stepRange, targetAt, type RangeState, type Target } from '../shared/range';
import { RANGE } from '../shared/rangetune';
import { seedOf } from '../shared/fishing';
import type { Game } from './game';
import type { Panel } from './panels';
import type { ShiftView } from './watchscreen';
import { sfx } from './sfx';
import { RangeView, type RangeSay } from './rangeview';
import { PastimeHud } from './pastimehud';
import { WatchInput } from './watchinput';
import { RANGEW } from './pastimewords';
import { labelRows } from './card';

const p = (s: string) => `<p>${s}</p>`;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const STEP = 1 / RANGE.fps;

export class RangeRound {
  s: RangeState;
  /** Which of this hero's rounds it is (its seed). */
  readonly n: number;
  private view: RangeView;
  private hud: PastimeHud;
  private input: WatchInput;
  private says: RangeSay[] = [];
  private last = performance.now();
  private acc = 0;
  private used = 0;
  private raf = 0;
  private ended = false;

  constructor(private g: Game, private panel: Panel, private after: () => void) {
    g.enterPastime('range');
    const pr = g.profile, rec = (pr.range ??= { rounds: 0, best: 0 });
    // The round's seed is the hero and their count of rounds, kept as the round starts: a refresh can't roll it again.
    this.n = rec.rounds++;
    g.keep();
    this.s = newRange(seedOf(pr.id, this.n), pr.cls === 'RANGER');
    this.view = new RangeView(g.hero);
    this.hud = new PastimeHud(this.view.out, [RANGEW.time, RANGEW.score], RANGEW.stop, () => this.end());
    this.view.resize();
    this.input = new WatchInput(this.hud.el, this.view as unknown as ShiftView);
    [this.input.ax, this.input.ay] = [RANGE.w / 2, 100];
    this.hud.el.classList.add('aiming');
    this.hud.hint(this.input.touch ? RANGEW.hintTouch : RANGEW.hintMouse);
    addEventListener('resize', this.fit);
    addEventListener('keydown', this.key, true);
    this.raf = requestAnimationFrame(this.frame);
  }

  private fit = () => this.view.resize();
  /** For the look scripts: where a target is at `t` (the rules' own answer), and the view to put it on screen. */
  where = (g: Target, t: number) => targetAt(g, t);
  get screen(): RangeView {
    return this.view;
  }
  private key = (e: KeyboardEvent) => {
    e.stopImmediatePropagation();
    if (e.key === 'Escape') this.ended ? this.close() : this.end();
  };

  private frame = (t: number) => {
    const dt = Math.max(0, Math.min(0.1, (t - this.last) / 1000)), now = t / 1000;
    this.last = t;
    if (!this.ended) {
      // Fixed steps, the same the world server replays: a loose waiting goes on the next step.
      this.acc += dt;
      while (this.acc >= STEP && !this.s.over) {
        this.acc -= STEP;
        const want = this.input.looses > this.used;
        if (want) this.used = this.input.looses;
        stepRange(this.s, want ? [Math.round(this.input.ax * 10), Math.round(this.input.ay * 10)] : null);
        this.heard(now);
      }
      if (this.s.over) this.end();
    }
    this.says = this.says.filter((w) => now - w.t0 < 1.1);
    this.hud.stats(clock(Math.ceil(Math.max(0, RANGE.round - this.s.t))), String(this.s.score), RANGE.round - this.s.t <= 10);
    if (this.s.shots >= 3) this.hud.hint('');
    this.hud.tick(now);
    this.view.render(this.s, [this.input.ax, this.input.ay], this.says, now, this.input.touch);
    this.raf = requestAnimationFrame(this.frame);
  };

  private heard(now: number): void {
    for (const e of this.s.events) {
      if (e.k === 'loose') sfx.arrow();
      else if (e.k === 'hit') {
        e.ring === 0 ? sfx.perfect() : sfx.javstick();
        this.says.push({ s: e.ring === 0 ? `${RANGEW.gold} +${e.pts}` : `+${e.pts}`, x: e.x, y: e.y, col: e.ring === 0 ? '#ffd27a' : '#e8e0d0', t0: now });
      } else if (e.k === 'miss') sfx.thud();
    }
  }

  /** The bell (or STOP): the card, your best, and the round to the town's board. */
  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.input.held = false;
    this.hud.done(true);
    this.hud.el.classList.remove('aiming');
    const s = this.s, pr = this.g.profile, rec = (pr.range ??= { rounds: this.n + 1, best: 0 }), best = s.score > rec.best;
    if (best) rec.best = s.score;
    this.g.keep();
    // One write for the round (not every arrow): only a whole round counts, and only if it'd change the board.
    const mine = this.g.world.range?.find((l) => l.id === pr.id)?.n ?? 0, post = s.over && s.score > mine;
    if (post) this.g.give({ range: { n: this.n, shots: s.record } });
    best ? sfx.fanfare() : sfx.loot();
    const R = RANGEW.rows, acc = s.shots ? Math.round((s.hits / s.shots) * 100) : 0;
    const rows: [string, string][] = [[R.score, String(s.score)], [R.arrows, String(s.shots)], [R.hits, `${s.hits} (${acc}%)`], [R.golds, String(s.golds)], [R.streak, String(s.bestStreak)], [best ? R.newBest : R.best, String(rec.best)]];
    this.panel.show(RANGEW.over, labelRows(rows) + (post ? p(RANGEW.posted) : ''),
      [{ label: RANGEW.again, primary: true, act: () => (this.close(false), openRange(this.g, this.panel, this.after)) }, { label: RANGEW.leave, act: () => this.close() }], true);
  }

  /** Off the line: the overlay goes and you're back in town at the butts. */
  close(out = true): void {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.fit);
    removeEventListener('keydown', this.key, true);
    this.input.dispose();
    this.hud.remove();
    this.panel.hide();
    if (live === this) live = null;
    if (out) this.g.leavePastime(), this.after();
  }
}

let live: RangeRound | null = null;
/** Step up to the line for a round. */
export function openRange(g: Game, panel: Panel, after: () => void = () => {}): RangeRound {
  live?.close(false);
  live = new RangeRound(g, panel, after);
  (globalThis as { __range?: RangeRound }).__range = live;
  return live;
}
