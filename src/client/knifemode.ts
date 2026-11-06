/**
 * A round at the Drowned Rat's knife board, run only in this browser (shared/knives.ts has the rules).
 * Stepping up to the chalk parks your hero there for those in the Rat (Game.enterPastime, said once). One
 * button: throw when the point is over the middle. With a bet down, the card sharp's round is the one to
 * beat (shared/knives.ts `houseScore`, from the round's own seed), a tie his. At the end your best is kept
 * on your hero, and a round that'd change the town's board goes to the shared world once, which plays it
 * again before it goes up (shared/knifeboard.ts), the way the butts' rounds do.
 */
import { aimAt, houseScore, newKnives, stepKnives, type KnifeState } from '../shared/knives';
import { KNIVES } from '../shared/knifetune';
import { knifeSeed } from '../shared/knifeboard';
import { settleStake, takeStake } from '../shared/stakes';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { sfxTown } from './sfxtown';
import { KnifeView, type KnifeSay } from './knifeview';
import { OneButton } from './pastimeloop';
import { KNIFEW } from './pastimewords';
import { labelRows } from './card';
import { heroSkin } from './armmode';

const p = (s: string) => `<p>${s}</p>`;

export class KnifeRound extends OneButton {
  s: KnifeState;
  readonly n: number;
  /** The card sharp's round to beat (only with a bet down). */
  readonly house: number;
  private says: KnifeSay[] = [];

  constructor(g: Game, panel: Panel, readonly bet: number, private again: () => void, after?: () => void) {
    super(g, panel, 'knives', new KnifeView(heroSkin(g.hero)), [KNIFEW.knives, KNIFEW.score], KNIFEW.stop, KNIVES.fps, after);
    const pr = g.profile, rec = (pr.knives ??= { rounds: 0, best: 0 });
    // The round's seed is the hero and their count of rounds, kept as it starts (with any bet): a refresh can't roll it again.
    this.n = rec.rounds++;
    if (bet && !takeStake(pr, 'knives', this.n, bet)) this.bet = 0;
    g.keep();
    if (this.bet) sfxTown.coins();
    const seed = knifeSeed(pr.id, this.n);
    this.s = newKnives(seed, pr.cls === 'ROGUE');
    this.house = this.bet ? houseScore(seed) : 0;
    this.hud.hint(this.touch ? KNIFEW.hintTouch : KNIFEW.hintMouse);
    if (this.bet) this.hud.cue(KNIFEW.beat(this.house), performance.now() / 1000, 2.2);
  }

  protected get over(): boolean {
    return this.s.over;
  }
  /** For the look scripts: where the point is now, from the board's middle (the rules' own answer). */
  get aim(): [number, number] {
    return aimAt(this.s);
  }

  protected step(press: boolean, now: number): void {
    stepKnives(this.s, press);
    for (const e of this.s.events) {
      if (e.k === 'throw') sfx.throw();
      else if (e.k === 'stick') {
        e.ring === 0 ? sfx.perfect() : sfx.javstick();
        this.says.push({ s: e.ring === 0 ? `${KNIFEW.bull} +${e.pts}` : `+${e.pts}`, x: KNIVES.board[0] + e.x, y: KNIVES.board[1] + e.y, col: e.ring === 0 ? '#ffd27a' : '#e8e0d0', t0: now });
      } else if (e.k === 'miss') sfx.thud(), this.says.push({ s: KNIFEW.wide, x: KNIVES.board[0] + e.x, y: KNIVES.board[1] + e.y, col: '#ff8a6a', t0: now });
    }
    if (this.s.thrown >= 2) this.hud.hint('');
  }

  protected draw(now: number): void {
    this.says = this.says.filter((w) => now - w.t0 < 1.1);
    this.hud.stats(`${KNIVES.knives - this.s.thrown}`, this.bet ? `${this.s.score} / ${this.house}` : String(this.s.score));
    (this.view as KnifeView).render(this.s, this.says, now, this.touch);
  }

  /** The card: the score, his round if there was a bet, your best, and the round to the town's board. */
  protected finish(early: boolean): void {
    const s = this.s, pr = this.g.profile, rec = (pr.knives ??= { rounds: this.n + 1, best: 0 }), done = !early && s.over;
    const best = done && s.score > rec.best;
    if (best) rec.best = s.score;
    const won = done && !!this.bet && s.score > this.house, paid = settleStake(pr, 'knives', this.n, won);
    this.g.keep();
    // One write for the round (never a throw), only a whole one, and only if it'd change the board.
    const mine = this.g.world.knives?.find((l) => l.id === pr.id)?.n ?? 0, post = done && s.score > mine;
    if (post) this.g.give({ knives: { n: this.n, throws: s.record } });
    best || won ? sfx.fanfare() : sfx.loot();
    if (paid) sfxTown.coins();
    const R = KNIFEW.rows, rows: [string, string][] = [[R.score, String(s.score)], [R.board, `${s.onBoard} / ${s.thrown}`], [R.bulls, String(s.bulls)],
      ...(this.bet ? [[R.house, String(this.house)] as [string, string]] : []), [best ? R.newBest : R.best, String(rec.best)]];
    const bet = !this.bet ? '' : early ? KNIFEW.early : won ? KNIFEW.won(this.house) + ' ' + KNIFEW.paid(paid) : s.score === this.house ? KNIFEW.tie : KNIFEW.lost(this.house);
    this.panel.show(KNIFEW.over, labelRows(rows) + (bet ? p(bet) : '') + (post ? p(KNIFEW.posted) : '') + p(KNIFEW.gold(pr.gold)),
      [{ label: KNIFEW.again, primary: true, disabled: !!this.bet && pr.gold < this.bet, act: () => (this.close(false), this.again()) }, { label: KNIFEW.leave, act: () => this.close() }], true);
  }
}

let live: KnifeRound | null = null;
/** Step up to the chalk with `bet` on it (0 for none). `after`: back in the Rat. */
export function openKnives(g: Game, panel: Panel, bet: number, after: () => void = () => {}): KnifeRound {
  live?.close(false);
  live = new KnifeRound(g, panel, bet, () => openKnives(g, panel, bet, after), after);
  (globalThis as { __knives?: KnifeRound }).__knives = live;
  return live;
}
