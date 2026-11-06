/** The Night Watch's overlay: the canvas, the clock, score and streak along the top, END SHIFT, and the hint. */
import { WATCH } from '../shared/watchtune';
import type { WatchState } from '../sim/watchtypes';
import { streakMult } from '../sim/watchscore';
import { WATCHW } from './watchwords';
import './watch.css';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class WatchHud {
  readonly el = document.createElement('div');
  private time: HTMLElement;
  private score: HTMLElement;
  private streak: HTMLElement;
  private hint: HTMLElement;
  private said = '';

  constructor(canvas: HTMLCanvasElement, touch: boolean, end: () => void) {
    this.el.id = 'watch';
    this.el.innerHTML = `<div class="watch-hud"><span class="t">${WATCHW.time}<b></b></span><span class="s">${WATCHW.score}<b></b></span>` +
      `<span class="k">${WATCHW.streak}<b></b></span><span class="gap"></span><button class="watch-end">${WATCHW.endShift}</button></div>` +
      `<div class="watch-hint">${touch ? WATCHW.hintTouch : WATCHW.hintMouse}</div>`;
    this.el.prepend(canvas);
    this.time = this.el.querySelector('.t')!;
    this.score = this.el.querySelector('.s')!;
    this.streak = this.el.querySelector('.k')!;
    this.hint = this.el.querySelector('.watch-hint')!;
    const btn = this.el.querySelector<HTMLButtonElement>('.watch-end')!;
    btn.addEventListener('click', (e) => (e.stopPropagation(), end()));
    btn.addEventListener('touchend', (e) => (e.preventDefault(), e.stopPropagation(), end()));
    document.body.appendChild(this.el);
  }

  /** The numbers, changed only when they change. */
  frame(s: WatchState): void {
    const left = Math.max(0, WATCH.duration - s.t), m = streakMult(s.streak);
    const key = `${Math.ceil(left)}|${s.score}|${s.streak}`;
    if (key === this.said) return;
    this.said = key;
    this.time.lastElementChild!.textContent = clock(Math.ceil(left));
    this.time.classList.toggle('low', left <= 20);
    this.score.lastElementChild!.textContent = String(s.score);
    this.streak.lastElementChild!.textContent = m > 1 ? `${s.streak} x${m}` : String(s.streak);
    this.streak.classList.toggle('hot', m > 1);
    // The hint goes once the first few arrows are away.
    this.hint.classList.toggle('gone', s.shots >= 3);
  }

  done(): void {
    this.el.classList.add('done');
  }

  remove(): void {
    this.el.remove();
  }
}
