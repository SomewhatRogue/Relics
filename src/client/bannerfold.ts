/**
 * The tracker folded (Kyle, 2026-11-04: "smaller in the top left unless you click it to expand", and of
 * where you are and what to do, "too big and should be less, and expand or shrink when clicked"): one
 * short line until tapped, the full box after. It opens by itself for a few seconds when the objective
 * or the place changes, then folds again; a tap opens or shuts it for good. Drawing only.
 */
const FLASH = 3;

/** An objective without its counts ("(2 left)", "34 s"): a count going down isn't a new objective. */
export const calm = (s: string) => s.replace(/\d+/g, '#');

export class BannerFold {
  private shown = '';
  private key: string | null = null;
  private until = 0;
  private open = false;

  constructor(private el: HTMLElement) {
    // (Not a click on the game: input.ts leaves [data-ui] alone.)
    el.dataset.ui = '';
    const tap = (e: Event) => {
      e.preventDefault();
      // Open by itself, or by a tap: a tap shuts it. Folded: a tap opens it till the next tap.
      const big = this.open || performance.now() / 1000 < this.until;
      this.open = !big;
      this.until = 0;
    };
    el.addEventListener('click', tap);
    el.addEventListener('touchend', tap, { passive: false });
  }

  /**
   * This frame's tracker: `full` the whole box, `small` its folded line (null: never folds, as in the
   * wood's lessons), `key` what it's about (a change opens it a moment; see calm), `hold` keeps it open (an
   * objective's done flash: objflash.ts), `tucked` keeps it to its line unless tapped open (a boss's plate is up).
   */
  render(full: string, small: string | null, key: string, now: number, hold = false, tucked = false): void {
    if (this.key !== null && key !== this.key) this.until = now + FLASH;
    this.key = key;
    const big = small === null || this.open || (!tucked && (hold || now < this.until));
    const html = big ? full : small;
    this.el.classList.toggle('small', !big);
    this.el.classList.toggle('fold', small !== null);
    if (html !== this.shown) (this.shown = html), (this.el.innerHTML = html);
  }
}
