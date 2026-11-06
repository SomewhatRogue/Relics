/**
 * The overlay both pastimes use (fishmode.ts, rangemode.ts): the picture's canvas, a strip along the
 * top with two numbers and a way back out, a cue in the middle (STRIKE NOW, a fish lost, points), and a
 * hint at the foot. Text only changes when it changes.
 */
import './pastime.css';

export class PastimeHud {
  readonly el = document.createElement('div');
  private a: HTMLElement;
  private b: HTMLElement;
  private cueEl: HTMLElement;
  private hintEl: HTMLElement;
  private cueUntil = 0;
  private said = '';

  constructor(canvas: HTMLCanvasElement, labels: [string, string], leave: string, out: () => void) {
    this.el.id = 'pastime';
    this.el.innerHTML = `<div class="pt-hud"><span class="a">${labels[0]}<b></b></span><span class="b">${labels[1]}<b></b></span><span class="gap"></span><button class="pt-end">${leave}</button></div>` +
      `<div class="pt-cue"></div><div class="pt-hint"></div>`;
    this.el.prepend(canvas);
    this.a = this.el.querySelector('.a')!;
    this.b = this.el.querySelector('.b')!;
    this.cueEl = this.el.querySelector('.pt-cue')!;
    this.hintEl = this.el.querySelector('.pt-hint')!;
    const btn = this.el.querySelector<HTMLButtonElement>('.pt-end')!;
    btn.addEventListener('click', (e) => (e.stopPropagation(), out()));
    btn.addEventListener('touchend', (e) => (e.preventDefault(), e.stopPropagation(), out()));
    // (A press on the button isn't a press in the game.)
    for (const ev of ['pointerdown', 'touchstart', 'mousedown']) btn.addEventListener(ev, (e) => e.stopPropagation());
    document.body.appendChild(this.el);
  }

  /** The two numbers along the top (`low`: the first shown in warning red). */
  stats(a: string, b: string, low = false): void {
    const key = `${a}|${b}|${low}`;
    if (key === this.said) return;
    this.said = key;
    this.a.lastElementChild!.textContent = a;
    this.b.lastElementChild!.textContent = b;
    this.a.classList.toggle('low', low);
  }

  /** A word in the middle for `secs` (0: until replaced); `kind`: bad (red) or small (a sentence). */
  cue(s: string, now: number, secs = 1.2, kind: '' | 'bad' | 'small' = ''): void {
    this.cueEl.textContent = s;
    this.cueEl.className = `pt-cue on ${kind}`;
    this.cueUntil = secs ? now + secs : Infinity;
  }
  /** Each frame: the cue goes when its time's up. */
  tick(now: number): void {
    if (now > this.cueUntil) (this.cueEl.className = 'pt-cue'), (this.cueUntil = Infinity), (this.cueEl.textContent = '');
  }
  clearCue(): void {
    this.cueEl.className = 'pt-cue';
    this.cueEl.textContent = '';
  }
  get cueText(): string {
    return this.cueEl.textContent ?? '';
  }

  hint(s: string): void {
    if (this.hintEl.textContent !== s) this.hintEl.textContent = s;
    this.hintEl.classList.toggle('gone', !s);
  }

  /** Under the card (the panel shows over it), or back on top. */
  done(on: boolean): void {
    this.el.classList.toggle('done', on);
  }

  remove(): void {
    this.el.remove();
  }
}
