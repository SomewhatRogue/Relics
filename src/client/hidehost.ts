/**
 * A host's page out of sight hands the job on (Kyle, 2026-11-06). Hidden, a desktop tab runs its timers
 * about once a second (once a minute after five), so friends would get a patch a second; a phone freezes
 * the page outright. So with a friend still in the job the room goes to the friend first in line
 * (CoopHost.handOver: the whole job to everyone, then goodbye), a desktop after HIDE.desk seconds out of
 * sight, a phone or touch device at once (`visibilitychange` or `pagehide`), any page going away at once.
 * Back in sight, this page carries on as a guest of whoever has it now. Alone, nothing changes: the room
 * runs on here as before (main.ts's hidden loop). The rule is shared/hostpick.ts `handNow`.
 */
import { HIDE, handNow } from '../shared/hostpick';

export interface HideHooks {
  touch: boolean;
  /** Seconds, any steady clock. */
  now: () => number;
  /** Running a job's room for a party. */
  hosting: () => boolean;
  /** Friends still with the job (not gone, heard from lately). */
  friends: () => number;
  /** Hand the job on; whether it went. */
  hand: () => boolean;
  /** Back in sight after handing on: follow whoever has it. */
  back: () => void;
  later: (fn: () => void, ms: number) => unknown;
  cancel: (t: unknown) => void;
}

export class HideWatch {
  private hiddenAt = -1;
  private timer: unknown = null;
  /** Handed on while out of sight: back in sight, follow. */
  handed = false;

  constructor(private o: HideHooks) {}

  /** The page went out of sight. */
  hidden(): void {
    if (this.hiddenAt < 0) this.hiddenAt = this.o.now();
    if (!this.check() && !this.timer) this.timer = this.o.later(() => ((this.timer = null), this.check()), HIDE.desk * 1000 + 50);
  }

  /** The page is going away (closed, navigated off, put in the back-forward cache). */
  gone(): void {
    this.check(true);
  }

  /** Back in sight. */
  visible(): void {
    if (this.timer) this.o.cancel(this.timer), (this.timer = null);
    this.hiddenAt = -1;
    if (this.handed) (this.handed = false), this.o.back();
  }

  /** Now and then while hidden (main.ts's hidden loop): time to hand on yet? */
  tick(): void {
    if (this.hiddenAt >= 0) this.check();
  }

  private check(gone = false): boolean {
    if (this.handed) return true;
    const hiddenFor = this.hiddenAt < 0 ? -1 : this.o.now() - this.hiddenAt;
    if (handNow({ hosting: this.o.hosting(), friends: this.o.friends(), touch: this.o.touch, hiddenFor, gone })) this.handed = this.o.hand();
    return this.handed;
  }

  /** Listen to this page: out of sight, back, going away. */
  attach(doc: Document, win: Window): void {
    doc.addEventListener('visibilitychange', () => (doc.visibilityState === 'hidden' ? this.hidden() : this.visible()));
    win.addEventListener('pagehide', () => this.gone());
    win.addEventListener('pageshow', () => doc.visibilityState !== 'hidden' && this.visible());
  }
}
