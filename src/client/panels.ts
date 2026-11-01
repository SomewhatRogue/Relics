/** A panel over the game: a title, some words, and buttons (the job board, the trainer, results). */
import { finish, forget, typeIn, typing } from './speech';
export interface Button { label: string; act: () => void; primary?: boolean; disabled?: boolean }

export class Panel {
  private el = document.createElement('div');
  open = false;

  constructor() {
    this.el.id = 'panel';
    this.el.hidden = true;
    document.body.appendChild(this.el);
    const press = (e: Event) => {
      const b = (e.target as HTMLElement).closest('button[data-i]') as HTMLButtonElement | null;
      // A tap on the words while someone's talking finishes the line.
      if (!b && typing(this.el)) return finish(this.el);
      if (!b || b.disabled) return;
      e.preventDefault();
      this.acts[Number(b.dataset.i)]?.();
    };
    this.el.addEventListener('click', press);
    this.el.addEventListener('touchend', press, { passive: false });
  }

  private acts: (() => void)[] = [];

  /** Show `html` (trusted, built here) with buttons; a Close button is added unless `noClose`. */
  show(title: string, html: string, buttons: Button[] = [], noClose = false): void {
    const all = noClose ? buttons : [...buttons, { label: 'CLOSE', act: () => this.hide() }];
    this.acts = all.map((b) => b.act);
    this.el.innerHTML =
      `<div class="card"><h2>${title}</h2><div class="body">${html}</div><div class="buttons">` +
      all.map((b, i) => `<button data-i="${i}" class="${b.primary ? 'primary' : ''}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('') +
      `</div></div>`;
    this.el.hidden = false;
    this.open = true;
    typeIn(this.el);
  }

  hide(): void {
    finish(this.el);
    forget();
    this.el.hidden = true;
    this.open = false;
  }
}
