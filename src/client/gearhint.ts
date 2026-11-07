/**
 * Where to find BUTTONS (Kyle, 2026-11-06: what your buttons and abilities are, in the tutorial and
 * after): once, in the wood, when Hew has given you your second button and his card is shut, the gear
 * in the corner is ringed in gold for a few seconds with a word under it, and BUTTONS inside its box is
 * ringed too, so the box that explains every button is easy to find. Once a device (a convenience).
 */
import { HINTW } from './hintwords';

const SEEN = 'relic.gearHint', SECS = 9;

export class GearHint {
  private until = -1;
  private done = (() => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } })();

  /** Each frame: `ready` the moment's come (the wood, two buttons given, nothing on screen to read). */
  update(ready: boolean, now: number): void {
    if (!this.done && ready) {
      this.done = true;
      this.until = now + SECS;
      try { localStorage.setItem(SEEN, '1'); } catch { /* (private window) */ }
    }
    const on = now < this.until;
    for (const id of ['opts', 'legendbtn']) {
      const b = document.getElementById(id);
      if (!b || b.classList.contains('hintme') === on) continue;
      b.classList.toggle('hintme', on);
      if (id === 'opts') b.dataset.hint = HINTW.gear;
    }
  }
}
