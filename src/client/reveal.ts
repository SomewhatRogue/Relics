/**
 * A panel reveals in reading order (no DOM here, so it can be tested in Node). Its words are units:
 * spoken lines that type in, and plain things (a speaker's name, narration, a stats line) that just
 * appear. What comes before the first new line shows at once; after that, each thing waits for
 * everything before it. A speaker's name comes with its line. A tap finishes the line being typed;
 * another tap shows the rest.
 */

/** Seconds between one line ending and the next thing; and how long narration is left to be read. */
export const GAP = 0.3;
export const readFor = (letters: number) => Math.min(1.2, 0.35 + letters * 0.012);

/** One thing in the panel: a spoken line (`fresh` if not yet said this sitting) or a plain thing. */
export interface Unit<T> { item: T; parent: unknown; line?: { fresh: boolean }; letters?: number }

/** The reveal worked out: what shows now, what starts hidden, and the beats that show the rest. */
export interface Plan<T> { hide: T[]; beats: { show: T[]; type: T | null; after: number }[] }

export function plan<T>(units: Unit<T>[]): Plan<T> {
  const out: Plan<T> = { hide: [], beats: [] };
  let live = false, waiting: Unit<T>[] = [];
  const flush = (keep: (u: Unit<T>) => boolean) => {
    const go = waiting.filter((u) => !keep(u));
    waiting = waiting.filter(keep);
    if (go.length) out.beats.push({ show: go.map((u) => u.item), type: null, after: readFor(go.reduce((n, u) => n + (u.letters ?? 0), 0)) });
  };
  for (const u of units) {
    // Before the first new line everything is simply there, lines already said included.
    if (!live && !u.line?.fresh) continue;
    if (!u.line?.fresh) {
      out.hide.push(u.item);
      waiting.push(u);
      continue;
    }
    // The things waiting that sit beside this line (its speaker) come with it; the rest go first.
    flush((w) => w.parent === u.parent);
    out.beats.push({ show: waiting.map((w) => w.item), type: u.item, after: GAP });
    waiting = [];
    live = true;
  }
  flush(() => false);
  return out;
}

/** A beat as it plays: things to show, then letters to type, each with the wait after it. */
export interface Beat { show: () => void; waits: number[]; letter: (i: number, loud: boolean) => void; after: number }

export class Reveal {
  private i = 0;
  private at = 0;
  private wait = 0;
  private open = false;
  private hurried = false;

  constructor(private beats: Beat[], private onDone: () => void = () => {}) {
    if (!this.pending) onDone();
  }

  /** Is anything still to show or type? */
  get pending(): boolean {
    const n = this.beats.length;
    if (this.i >= n) return false;
    return !(this.i === n - 1 && this.open && this.at >= this.beats[this.i].waits.length);
  }

  /** Time passes: things appear and letters type (`loud`: letters blip). */
  step(dt: number, loud = true): void {
    if (!this.pending) return;
    this.wait -= dt;
    while (this.wait <= 0 && this.pending) {
      const b = this.beats[this.i];
      if (!this.open) (b.show(), (this.open = true), (this.at = 0));
      if (this.at < b.waits.length) {
        b.letter(this.at, loud);
        this.wait += b.waits[this.at++];
      } else (this.wait += b.after), this.i++, (this.open = false);
    }
    if (!this.pending) this.onDone();
  }

  /** A tap: finish the line being typed; if none is (or it's the second tap), show everything. */
  skip(): void {
    const b = this.beats[this.i];
    if (!this.hurried && b && this.open && this.at < b.waits.length) {
      while (this.at < b.waits.length) b.letter(this.at++, false);
      this.hurried = true;
      this.wait = 0;
      if (!this.pending) this.onDone();
      return;
    }
    this.finish();
  }

  /** Show and type everything now. */
  finish(): void {
    if (!this.pending) return;
    for (; this.i < this.beats.length; this.i++, this.open = false) {
      const b = this.beats[this.i];
      if (!this.open) (b.show(), (this.at = 0));
      while (this.at < b.waits.length) b.letter(this.at++, false);
    }
    this.onDone();
  }
}
