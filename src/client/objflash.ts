/**
 * An objective done (Kyle: "the bar should flash and turn gold and shiny, so you know it's complete and
 * you did it"): the tracker holds the objective it had, counted out ("3 / 3", "(1 left)" dropped), flashes
 * it, turns it gold with a shine sweeping across (hud.css .obj.done) and keeps it a moment before the next
 * one shows, with a small chime. Done is a wood lesson passed or a job's way on opening (wayfind.ts).
 */
import { sfxTown } from './sfxtown';

const HOLD = 1.8;

export class ObjFlash {
  private last = '';
  private held = '';
  private until = 0;
  private stage = -1;

  /** The banner's html for this frame: what it would show, unless a done objective is being held. */
  show(html: string, now: number): string {
    if (now < this.until) return this.held;
    this.last = html;
    return html;
  }

  /** The wood's lesson number this frame (-1 out of it): a step on is a lesson passed. */
  watchWood(stage: number, now: number): void {
    if (stage > this.stage && this.stage >= 0) this.done(now);
    this.stage = stage;
  }

  /** The objective just shown is done. */
  done(now: number): void {
    if (now < this.until || !this.last.includes('class="obj"')) return;
    this.held = this.last.replace(/<div class="obj">([\s\S]*?)<\/div>/, (_, t: string) => `<div class="obj done">${finished(t)}</div>`);
    this.until = now + HOLD;
    sfxTown.chime();
  }
}

/** "DODGES 2 / 3" as "DODGES 3 / 3"; "Clear the goblins (1 left)" as "Clear the goblins". */
function finished(t: string): string {
  return t.replace(/(\d+) \/ (\d+)/, '$2 / $2').replace(/\s*\(\d+ [a-z]+ left\)|\s*\(\d+ left\)/, '');
}
