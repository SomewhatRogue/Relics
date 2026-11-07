/**
 * The wood's goal, hard to miss (Kyle, 2026-11-06: "in the tutorial the 'mission' isn't obvious when
 * you're going through, especially on desktop, it's too small"). The tracker's goal is drawn big
 * (goal.css), its count as a row of pips under it, and a new goal is called out: the box flashes gold
 * a few times as it comes up, and each one counted gives it a small kick. Drawing only.
 */
import { calm } from './bannerfold';

/** How long a new goal is called out, and a count's kick (s). */
const FRESH = 2.4, BUMP = 0.5;

/** "BLOCKS 2 / 4" with a row of four pips under it, two lit. (Short counts only.) */
export function goalHtml(text: string): string {
  const m = /(\d+) \/ (\d+)/.exec(text), n = m ? +m[1] : 0, of = m ? +m[2] : 0;
  if (!m || of < 1 || of > 12) return text;
  return `${text}<i class="pips">${Array.from({ length: of }, (_, i) => `<u${i < n ? ' class="on"' : ''}></u>`).join('')}</i>`;
}

export class GoalPulse {
  private key: string | null = null;
  private count = '';
  private fresh = 0;
  private bump = 0;

  /** Each frame in the wood: `goal` the title and goal as shown; `hold` a done goal is still showing (objflash.ts). */
  frame(el: HTMLElement, goal: string, now: number, hold: boolean): void {
    if (!hold) {
      const key = calm(goal), count = goal.match(/\d+/g)?.join(',') ?? '';
      if (key !== this.key && key.replace(/[|\s]/g, '')) this.fresh = now + FRESH;
      else if (this.key !== null && count !== this.count) this.bump = now + BUMP;
      this.key = key;
      this.count = count;
    }
    this.set(el, now < this.fresh, now < this.bump);
  }

  /** Out of the wood. */
  clear(el: HTMLElement): void {
    this.key = null;
    this.fresh = this.bump = 0;
    this.set(el, false, false);
  }

  private set(el: HTMLElement, fresh: boolean, bump: boolean): void {
    if (el.classList.contains('fresh') !== fresh) el.classList.toggle('fresh', fresh);
    if (el.classList.contains('bump') !== bump) el.classList.toggle('bump', bump && !fresh);
  }
}
