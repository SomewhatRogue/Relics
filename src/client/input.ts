/**
 * Turns keys, mouse and touch into an Intent. Laptop: WASD to move, mouse to aim, left click to
 * attack, hold right click to block (tap it to parry), Space to roll; J / K work too. Phone (upright):
 * a floating stick on the left, Attack, Block and Roll under the right thumb.
 */
import { NO_INTENT, type Intent } from '../sim/types';
import { unlockAudio } from './sfx';

export class Input {
  intent: Intent = { ...NO_INTENT };
  readonly touch = 'ontouchstart' in window || matchMedia('(pointer: coarse)').matches;
  private keys = new Set<string>();
  private mouse: [number, number] | null = null;
  private blockHeld = { mouse: false, key: false, touch: false };
  private stick = { id: '', ox: 0, oy: 0, x: 0, y: 0 };
  private stickEl!: HTMLElement;
  private knobEl!: HTMLElement;

  constructor(private heroScreen: () => [number, number] | null) {
    const unlock = () => unlockAudio();
    for (const t of ['touchend', 'pointerup', 'click', 'keydown']) addEventListener(t, unlock, { passive: true });
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === ' ') this.intent.rollSeq++, e.preventDefault();
      if (k === 'j') this.intent.attackSeq++;
      if (k === 'k') (this.intent.blockSeq++), (this.blockHeld.key = true);
    });
    addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'k') this.blockHeld.key = false;
    });
    addEventListener('blur', () => {
      this.keys.clear();
      this.blockHeld = { mouse: false, key: false, touch: false };
    });
    addEventListener('mousemove', (e) => (this.mouse = [e.clientX, e.clientY]));
    addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.mouse = [e.clientX, e.clientY];
      if (e.button === 0) this.intent.attackSeq++;
      if (e.button === 2) (this.intent.blockSeq++), (this.blockHeld.mouse = true);
    });
    addEventListener('mouseup', (e) => e.button === 2 && (this.blockHeld.mouse = false));
    addEventListener('contextmenu', (e) => e.preventDefault());
    if (this.touch) this.buildTouch();
  }

  private buildTouch(): void {
    const ui = document.getElementById('touch')!;
    ui.hidden = false;
    this.stickEl = ui.querySelector('.stick')!;
    this.knobEl = ui.querySelector('.knob')!;
    const zone = ui.querySelector('.stick-zone') as HTMLElement;
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      Object.assign(this.stick, { id: String(t.identifier), ox: t.clientX, oy: t.clientY, x: 0, y: 0 });
      this.stickEl.style.left = t.clientX + 'px';
      this.stickEl.style.top = t.clientY + 'px';
      this.stickEl.classList.add('on');
    }, { passive: false });
    const move = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (String(t.identifier) !== this.stick.id) continue;
        e.preventDefault();
        let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
        const l = Math.hypot(dx, dy), max = 46;
        if (l > max) (dx *= max / l), (dy *= max / l);
        this.stick.x = dx / max;
        this.stick.y = dy / max;
        this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) if (String(t.identifier) === this.stick.id) {
        Object.assign(this.stick, { id: '', x: 0, y: 0 });
        this.knobEl.style.transform = '';
        this.stickEl.classList.remove('on');
      }
    };
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end);
    zone.addEventListener('touchcancel', end);
    const btn = (sel: string, down: () => void, up?: () => void) => {
      const el = ui.querySelector(sel) as HTMLElement;
      el.addEventListener('touchstart', (e) => (e.preventDefault(), el.classList.add('down'), down()), { passive: false });
      const release = (e: TouchEvent) => (e.preventDefault(), el.classList.remove('down'), up?.());
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
    };
    btn('.attack', () => this.intent.attackSeq++);
    btn('.roll', () => this.intent.rollSeq++);
    btn('.block', () => ((this.intent.blockSeq++), (this.blockHeld.touch = true)), () => (this.blockHeld.touch = false));
  }

  /** The current intent, read once a frame. */
  read(): Intent {
    const k = this.keys;
    let mx = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let my = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    if (this.stick.id) (mx = this.stick.x), (my = this.stick.y);
    else if (mx && my) (mx *= Math.SQRT1_2), (my *= Math.SQRT1_2);
    const i = this.intent;
    i.mx = Math.abs(mx) < 0.12 ? 0 : mx;
    i.my = Math.abs(my) < 0.12 ? 0 : my;
    i.block = this.blockHeld.mouse || this.blockHeld.key || this.blockHeld.touch;
    i.ax = i.ay = 0;
    const hs = this.heroScreen();
    if (!this.touch && this.mouse && hs) (i.ax = this.mouse[0] - hs[0]), (i.ay = this.mouse[1] - hs[1]);
    return { ...i };
  }
}
