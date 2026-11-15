/**
 * The moment a relic is yours (relicnews.ts): a gold-framed pop at the top of the screen with its
 * picture, NEW RELIC, its name, its uses as pips, and one line on how to use it (on your RELIC button,
 * or in your pack to carry). The first relic a hero ever gets adds a short tip on the button. The
 * fanfare plays unless the room's pickup rang it already. A tap closes it; it goes by itself after a
 * while; several wait their turn. Never blocks the fight (it takes no input but its own tap).
 * A relic won (a great boss's first kill: item.from) has the full-screen fanfare instead (relicfanfare.ts).
 */
import { relicName } from '../shared/relicitems';
import { chargePips } from './reliccard';
import { fanfareHtml } from './relicfanfare';
import { relicCol, relicItemIcon } from './relicicons';
import type { RelicMoment } from './relicnews';
import { RELICW } from './relicwords';
import { sfx } from './sfx';
import './relicpop.css';

/** How long a pop stays, in s (a little longer with the tip to read; the fanfare till it's tapped, or long). */
const STAY = 6, STAY_TIP = 9, STAY_WON = 25;

export class RelicPop {
  private el = document.createElement('div');
  private until = 0;
  /** What was last shown (the tests and shots read it). */
  last: RelicMoment | null = null;
  /** SEE IT IN THE PACK on the fanfare (main.ts opens the pack). */
  onPack?: () => void;

  constructor() {
    this.el.id = 'relicpop';
    this.el.hidden = true;
    this.el.addEventListener('pointerup', (e) => {
      e.preventDefault();
      const pack = (e.target as HTMLElement).closest('[data-pack]');
      this.close();
      if (pack) this.onPack?.();
    });
    document.body.appendChild(this.el);
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** Show one. `now` in s. */
  show(m: RelicMoment, now: number): void {
    const r = m.item, won = !!r.from;
    this.last = m;
    this.el.classList.toggle('won', won);
    if (won) this.el.innerHTML = fanfareHtml(m);
    else this.el.innerHTML = `<div class="rp-in"><img class="rp-icon" src="${relicItemIcon(r)}" alt="">` +
      `<div class="rp-body"><i class="rp-k">${RELICW.newRelic}</i><b style="color:${relicCol(r)}">${relicName(r)}</b>` +
      `<div class="rp-uses">${chargePips(r)}<span>${RELICW.uses(r.charge)}</span></div></div></div>` +
      `<p class="rp-how">${m.carried ? RELICW.carryHint : RELICW.momentShelf}</p>` +
      (m.tip ? `<p class="rp-tip">${RELICW.firstTip(!!r.el)}</p>` : '') + `<i class="rp-tap">${RELICW.tapClose}</i>`;
    this.el.hidden = false;
    this.el.classList.remove('in');
    void this.el.offsetWidth;
    this.el.classList.add('in');
    this.until = now + (won ? STAY_WON : m.tip ? STAY_TIP : STAY);
    if (m.sound || won) sfx.fanfare();
  }

  close(): void {
    this.el.hidden = true;
  }

  /** Each frame: the next one waiting, when nothing's in the way (`blocked`), or this one's time up. */
  frame(queue: RelicMoment[], now: number, blocked: boolean): void {
    if (this.open && now >= this.until) this.close();
    if (!this.open && !blocked && queue.length) this.show(queue.shift()!, now);
  }
}
