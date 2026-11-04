/**
 * The wood gives you its buttons a lesson at a time (Game.taught). The first time one is given, it
 * pulses gold for a few seconds with a small label naming it (cluster.css .unlock); on a laptop, which
 * has no buttons, the move and its key are said over your hero instead.
 */
import { dodgeName, type HeroClass } from '../shared/weapons';

const SECS = 4;
/** The phone's buttons for each move the wood teaches, and what each is called. */
const BTN: Record<string, [string, string][]> = {
  attack: [['.tb.attack', 'ATTACK']],
  roll: [['.tb.roll', 'DODGE']],
  block: [['.tb.block', 'GUARD']],
  relic: [['.tb.relic', 'SKILL'], ['.tb.relic2', 'RELIC']],
  potion: [['.tb.potion', 'POTION']],
  grab: [['.tb.grab', 'GRAB']],
};
/** A laptop's: the move and its key. */
const KEYS: Record<string, string> = { attack: 'ATTACK: LEFT CLICK', roll: 'DODGE: SPACE', block: 'GUARD: RIGHT CLICK', relic: 'SKILL: E', potion: 'POTION: Q', grab: 'GRAB: G' };

export class UnlockFlash {
  private had: Set<string> | null = null;
  private until = new Map<HTMLElement, number>();

  /** Each frame: `taught` the wood's moves now (null out of the wood). `say` speaks over the hero (laptop). */
  update(taught: string[] | null, cls: HeroClass, touch: boolean, now: number, say: (s: string) => void): void {
    if (!taught) this.had = null;
    else {
      // (The first frames of the wood, while you lie there, teach nothing: so only what comes after counts.)
      const fresh = this.had ? taught.filter((m) => !this.had!.has(m)) : [];
      this.had = new Set(taught);
      for (const m of fresh) {
        if (!touch) {
          if (KEYS[m]) say(m === 'roll' ? KEYS[m].replace('DODGE', dodgeName(cls)) : KEYS[m]);
          continue;
        }
        for (const [sel, name] of BTN[m] ?? []) {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (!el) continue;
          el.dataset.unlock = m === 'roll' ? dodgeName(cls) : name;
          this.until.set(el, now + SECS);
        }
      }
    }
    for (const [el, t] of this.until) {
      const on = now < t && !el.hidden;
      el.classList.toggle('unlock', on);
      if (now >= t) this.until.delete(el);
    }
  }
}
