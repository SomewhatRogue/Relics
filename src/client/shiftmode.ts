/**
 * A shift at Halvard's forge, run only in this browser (shared/forgeshift.ts has the rules, shifttune.ts
 * the numbers). Taking it parks your hero at the anvil for those in the forge (Game.enterPastime('anvil'),
 * said once; one more word as you get up). One button: strike when the piece glows brightest. The shift's
 * seed is the hero and their count of shifts, counted (with the pay it's owed and the rest) as it starts,
 * so a refresh can't roll it again or pay twice (shared/shiftpay.ts). At the bell: the pay, your best kept,
 * and a shift that'd change the town's board goes to the shared world once, which plays it again before
 * it goes up (shared/shiftboard.ts).
 */
import { newShift, shiftLeft, stepShift, type ShiftState } from '../shared/forgeshift';
import { SHIFT, SHIFT_PAY } from '../shared/shifttune';
import { shiftSeed } from '../shared/shiftboard';
import { restLeft, settleShift, startShift, type ShiftRecord } from '../shared/shiftpay';
import type { StrikeMark } from '../shared/forgestrike';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { sfxTown } from './sfxtown';
import { ShiftView, type ShiftSay } from './shiftview';
import { OneButton } from './pastimeloop';
import { SHIFTW } from './shiftwords';
import { labelRows } from './card';
import { heroSkin } from './armmode';
import { line } from './speech';

const p = (s: string) => `<p>${s}</p>`;
export const shiftRecord = (g: Game): ShiftRecord => (g.profile.shift ??= { shifts: 0, best: 0, restUntil: 0 });

export class ForgeShift extends OneButton {
  s: ShiftState;
  readonly n: number;
  /** This shift pays at the bell (not one worked in the rest). */
  readonly paid: boolean;
  private swing = 0;
  private mark: { mark: StrikeMark; t0: number } | null = null;
  private says: ShiftSay[] = [];
  private warned = false;

  constructor(g: Game, panel: Panel, private again: () => void, after?: () => void) {
    super(g, panel, 'anvil', new ShiftView(heroSkin(g.hero)), [SHIFTW.score, SHIFTW.time], SHIFTW.stop, SHIFT.fps, after);
    const r = startShift(shiftRecord(g), Date.now());
    this.n = r.n;
    this.paid = r.paid;
    g.keep();
    this.s = newShift(shiftSeed(g.profile.id, this.n));
    this.hud.hint(this.touch ? SHIFTW.hintTouch : SHIFTW.hintMouse);
    this.hud.cue(SHIFTW.greet, performance.now() / 1000, 1, 'small');
  }

  protected get over(): boolean {
    return this.s.over;
  }

  protected step(press: boolean, now: number): void {
    stepShift(this.s, press);
    for (const e of this.s.events) {
      if (e.k === 'strike') {
        this.swing = 1;
        this.mark = { mark: e.mark, t0: now };
        sfxTown.anvil();
        if (e.mark === 'clean') sfx.perfect();
        else if (e.mark === 'cold') sfxTown.dull();
      } else if (e.k === 'made') this.says.push({ s: SHIFTW.made(e.pts), col: '#ffd27a', t0: now }), sfx.steam();
      else if (e.k === 'spoiled') this.says.push({ s: SHIFTW.spoiled, col: '#ff8a6a', t0: now }), sfxTown.dull();
    }
    if (this.s.record.length >= 2) this.hud.hint('');
    if (!this.warned && shiftLeft(this.s) <= 10) (this.warned = true), this.hud.cue(SHIFTW.last, now, 1.4, 'bad');
  }

  protected draw(now: number): void {
    this.swing = Math.max(0, this.swing - 0.08);
    this.says = this.says.filter((w) => now - w.t0 < 0.9);
    const left = shiftLeft(this.s);
    this.hud.stats(String(this.s.score), String(Math.ceil(left)), left <= 10);
    (this.view as ShiftView).draw(this.s, now, this.swing, this.mark, this.says);
  }

  /** The card: the score and how it went, the pay, your best, and the shift to the town's board. */
  protected finish(early: boolean): void {
    const s = this.s, g = this.g, pr = g.profile, rec = shiftRecord(g), whole = !early && s.over;
    const { gold, best } = settleShift(rec, this.n, s.score, whole);
    pr.gold += gold;
    g.keep();
    // One write for the shift (never a strike), only a whole one, and only if it'd change the board.
    const mine = g.world.shift?.find((l) => l.id === pr.id)?.n ?? 0, post = whole && s.score > 0 && s.score > mine;
    if (post) g.give({ shift: { n: this.n, hits: s.record } });
    best ? sfx.fanfare() : sfx.loot();
    if (gold) sfxTown.coins();
    const R = SHIFTW.rows, rows: [string, string][] = [[R.score, String(s.score)], [R.made, String(s.made)], [R.spoiled, String(s.spoiled)],
      [R.clean, String(s.clean)], [R.streak, String(s.bestStreak)], [best ? R.newBest : R.best, String(rec.best)]];
    const said = !whole ? '' : s.score >= SHIFT_PAY.per * SHIFT_PAY.cap ? SHIFTW.halvard.good : s.spoiled <= s.made / 4 ? SHIFTW.halvard.fair : SHIFTW.halvard.poor;
    const pay = early ? SHIFTW.early : !this.paid ? SHIFTW.forBoard : gold ? SHIFTW.paid(gold) : SHIFTW.nothing;
    const rest = restLeft(rec, Date.now());
    // The numbers first (a spoken line holds back whatever follows it until it's typed: speech.ts), Halvard last.
    this.panel.show(whole ? SHIFTW.over : SHIFTW.cut, labelRows(rows) + p(pay) + (post ? p(SHIFTW.posted) : '') +
      (rest ? p(`<span class="dim">${SHIFTW.next(rest)}</span>`) : '') + p(SHIFTW.gold(pr.gold)) + (said ? p(`<b>Halvard:</b> ${line(`"${said}"`, 'Halvard')}`) : ''),
    [{ label: SHIFTW.again, primary: true, act: () => (this.close(false), this.again()) }, { label: SHIFTW.done, act: () => this.close() }], true);
  }
}

let live: ForgeShift | null = null;
/** Take a shift at the anvil. `after`: back to the forge's panel. */
export function openShift(g: Game, panel: Panel, after: () => void = () => {}): ForgeShift {
  live?.close(false);
  live = new ForgeShift(g, panel, () => openShift(g, panel, after), after);
  (globalThis as { __shift?: ForgeShift }).__shift = live;
  return live;
}
