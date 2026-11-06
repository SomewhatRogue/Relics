/**
 * A bout at the Drowned Rat's arm-wrestling table, run only in this browser (shared/armwrestle.ts has the
 * rules). Sitting down parks your hero at the table for those in the Rat (Game.enterPastime, said once).
 * One button: hold to bear down, let go to ease off. A bet goes on the table as the bout starts and comes
 * back doubled if you win (shared/stakes.ts); the bout's seed is the hero and their count of bouts,
 * counted then, so a refresh can't roll it again. LET GO (or Escape) gives the bout up.
 */
import { newArm, stepArm, zoneAt, type ArmState } from '../shared/armwrestle';
import { ARM, type ArmFoe } from '../shared/armtune';
import { seedOf } from '../shared/fishing';
import { settleStake, takeStake } from '../shared/stakes';
import { WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { sfxTown } from './sfxtown';
import { ArmView } from './armview';
import { OneButton } from './pastimeloop';
import { ARMW } from './pastimewords';
import { labelRows } from './card';
import { LOOK_DEFS } from './herolooks';
import { skinOf } from './idlekit';
import type { Cls } from './lookkit';

const p = (s: string) => `<p>${s}</p>`;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const heroSkin = (h: Hero) => {
  const ls = LOOK_DEFS[WEAPONS[h.weapon].cls as Cls];
  return skinOf(ls[h.look ?? 0] ?? ls[0]);
};
/** A hero's seed for their `n`th bout at the table (its own, apart from the other pastimes'). */
export const armSeed = (id: string, n: number) => seedOf(id + ':arm', n);

export class ArmBout extends OneButton {
  s: ArmState;
  readonly n: number;

  constructor(g: Game, panel: Panel, readonly foe: ArmFoe, readonly bet: number, private again: () => void, after?: () => void) {
    super(g, panel, 'arm', new ArmView(heroSkin(g.hero)), [ARMW.stake, ARMW.time], ARMW.leave, ARM.fps, after);
    const pr = g.profile, rec = (pr.arm ??= { bouts: 0, wins: 0, beat: [] });
    this.n = rec.bouts++;
    // The bet goes down with the bout, saved together: it pays only if this bout is won.
    if (bet && !takeStake(pr, 'arm', this.n, bet, foe.cap)) this.bet = 0;
    g.keep();
    if (this.bet) sfxTown.coins();
    this.s = newArm(armSeed(pr.id, this.n), foe);
    this.hud.hint(this.touch ? ARMW.hintTouch : ARMW.hintMouse);
  }

  protected get over(): boolean {
    return this.s.over;
  }
  /** For the look scripts: the band's middle now (the rules' own answer). */
  get zone(): number {
    return zoneAt(this.s);
  }

  protected step(): void {
    stepArm(this.s, this.held);
    for (const e of this.s.events) {
      if (e.k === 'tell') sfx.growl(false), this.hud.cue(ARMW.tell, performance.now() / 1000, ARM.tell + 0.4, 'bad');
      else if (e.k === 'heave') sfx.heavy();
    }
    if (this.s.t > 2.5) this.hud.hint('');
  }

  protected draw(now: number): void {
    this.hud.stats(this.bet ? String(this.bet) : ARMW.none, clock(this.s.t), this.s.lean < -0.6);
    (this.view as ArmView).render(this.s, now);
  }

  /** The card: who went down, the money, your record. */
  protected finish(early: boolean): void {
    const s = this.s, pr = this.g.profile, rec = (pr.arm ??= { bouts: this.n + 1, wins: 0, beat: [] }), won = !early && s.won;
    const paid = settleStake(pr, 'arm', this.n, won), first = won && !rec.beat.includes(this.foe.id);
    if (won) rec.wins++;
    if (first) rec.beat.push(this.foe.id);
    this.g.keep();
    won ? (sfx.thud(), sfx.fanfare()) : (sfx.thud(), sfx.drop());
    if (paid) sfxTown.coins();
    const say = early ? ARMW.gaveUp : won ? ARMW.won(this.foe.name) : ARMW.lost(this.foe.name);
    const money = this.bet ? (won ? ARMW.paid(paid) : ARMW.kept(this.bet)) : '';
    const R = ARMW.rows, rows: [string, string][] = [[R.held, `${s.held.toFixed(1)} s`], [R.time, clock(s.t)], [R.bouts, String(rec.bouts)], [R.wins, String(rec.wins)]];
    this.panel.show(this.foe.name, p(`<b>${say}</b>`) + (money ? p(money) : '') + (first ? p(ARMW.first) : '') + labelRows(rows) + p(ARMW.gold(pr.gold)),
      [{ label: ARMW.again, primary: true, disabled: !!this.bet && pr.gold < this.bet, act: () => (this.close(false), this.again()) },
        { label: ARMW.other, act: () => this.close() }, { label: ARMW.up, act: () => ((this.after = () => {}), this.close()) }], true);
  }
}

let live: ArmBout | null = null;
/** Sit down across from `foe` with `bet` on it (0 for nothing). `again`: the same bout once more; `after`: back to the table's panel. */
export function openArm(g: Game, panel: Panel, foe: ArmFoe, bet: number, after: () => void = () => {}): ArmBout {
  live?.close(false);
  live = new ArmBout(g, panel, foe, bet, () => openArm(g, panel, foe, bet, after), after);
  (globalThis as { __arm?: ArmBout }).__arm = live;
  return live;
}
