/**
 * The potion button (and Q): a tap drinks or throws the potion at the front of the belt; held about
 * 0.4 s it turns the belt instead (the next kind comes to the front, its name pops up) and drinks
 * nothing; held on, it keeps turning. Both go to the room as press counters (Input).
 */
export const LONG_PRESS = { first: 400, again: 450 };

export class PotionPress {
  private timer = 0;
  private held = false;
  private turned = false;

  constructor(private drink: () => void, private turn: () => void) {}

  down(): void {
    if (this.held) return;
    this.held = true;
    this.turned = false;
    const tick = (wait: number) => (this.timer = window.setTimeout(() => {
      this.turned = true;
      this.turn();
      tick(LONG_PRESS.again);
    }, wait));
    tick(LONG_PRESS.first);
  }

  /** Let go: a tap drinks; after a turn, nothing more happens. */
  up(): void {
    if (!this.held) return;
    this.cancel();
    if (!this.turned) this.drink();
  }

  /** Lost the press (window blurred, touch cancelled): nothing is drunk. */
  cancel(): void {
    clearTimeout(this.timer);
    this.held = false;
  }
}
