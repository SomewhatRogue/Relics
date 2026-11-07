/**
 * Striking it yourself at Halvard's anvil (shared/forgestrike.ts has the rules). The forge's only way to
 * a plus (stores.ts; Kyle, 2026-11-06: "you always have to forge yourself"): the plus is paid for and made
 * first (Game.levelUp), so getting up early or a refresh leaves you the plain plus. Then you're at the anvil
 * (parked there for those in the forge: Game.enterPastime, said once) with the hammer: tap as the steel
 * glows brightest, three times. The strikes' seed is the hero and their count of strikes, counted before
 * the first comes down. What they add goes on the piece (Game.temper), and the card says so.
 */
import { STRIKE, newStrike, stepStrike, temperFrom, type StrikeMark, type StrikeState } from '../shared/forgestrike';
import { seedOf } from '../shared/fishing';
import { itemName, type Item } from '../shared/tuning';
import type { Game } from './game';
import type { Panel } from './panels';
import { sfx } from './sfx';
import { sfxTown } from './sfxtown';
import { AnvilView } from './anvilview';
import { OneButton } from './pastimeloop';
import { ANVILW } from './pastimewords';
import { card } from './card';
import { heroSkin } from './armmode';
import { line } from './speech';

const p = (s: string) => `<p>${s}</p>`;
/** A hero's seed for their `n`th time at the anvil. */
export const strikeSeed = (id: string, n: number) => seedOf(id + ':forge', n);

export class AnvilStrike extends OneButton {
  s: StrikeState;
  readonly n: number;
  private swing = 0;
  private mark: { mark: StrikeMark; t0: number } | null = null;

  constructor(g: Game, panel: Panel, private item: Item, after?: () => void) {
    super(g, panel, 'anvil', new AnvilView(heroSkin(g.hero)), [ANVILW.strikes, ANVILW.piece], ANVILW.stop, STRIKE.fps, after);
    const pr = g.profile;
    this.n = pr.strikes ?? 0;
    pr.strikes = this.n + 1;
    g.keep();
    this.s = newStrike(strikeSeed(pr.id, this.n));
    this.hud.hint(this.touch ? ANVILW.hintTouch : ANVILW.hintMouse);
    this.hud.cue(ANVILW.greet, performance.now() / 1000, 1.4, 'small');
  }

  protected get over(): boolean {
    return this.s.over;
  }

  protected step(press: boolean, now: number): void {
    stepStrike(this.s, press);
    for (const e of this.s.events) {
      if (e.k !== 'strike') continue;
      this.swing = 1;
      this.mark = { mark: e.mark, t0: now };
      sfxTown.anvil();
      if (e.mark === 'clean') sfx.perfect();
      else if (e.mark === 'cold') sfxTown.dull();
    }
    if (this.s.struck.length) this.hud.hint('');
  }

  protected draw(now: number): void {
    this.swing = Math.max(0, this.swing - 0.06);
    this.hud.stats(`${this.s.struck.length} / ${STRIKE.strikes}`, itemName(this.item));
    (this.view as AnvilView).render(this.s, now, this.swing, this.mark);
  }

  /** Off the anvil: what the strikes added, and the piece as it is now. */
  protected finish(): void {
    const add = temperFrom(this.s);
    this.item = this.g.temper(this.item, add);
    sfx.steam();
    add > 0 ? sfx.fanfare() : sfx.loot();
    const pct = Math.round(add * 100), cleans = this.s.struck.filter((x) => x.mark === 'clean').length;
    const said = cleans >= 2 ? ANVILW.halvard.good : add > 0 ? ANVILW.halvard.fair : ANVILW.halvard.none;
    this.panel.show(ANVILW.title, p(`<b>Halvard:</b> ${line(`"${said}"`, 'Halvard')}`) + p(add > 0 ? ANVILW.well(Math.max(1, pct)) : ANVILW.plain) + card(this.item, this.g.hero, true),
      [{ label: ANVILW.done, primary: true, act: () => this.close() }], true);
  }
}

let live: AnvilStrike | null = null;
/** Take the hammer to `item` (already upgraded by Game.levelUp). `after`: back to the forge's panel. */
export function openAnvil(g: Game, panel: Panel, item: Item, after: () => void = () => {}): AnvilStrike {
  live?.close(false);
  live = new AnvilStrike(g, panel, item, after);
  (globalThis as { __anvil?: AnvilStrike }).__anvil = live;
  return live;
}
