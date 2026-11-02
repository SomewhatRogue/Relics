/**
 * The recovery code panel on the start screen: this browser's code (made the first time it's opened,
 * once there's a hero), and USE A CODE to bring heroes here from another phone or computer, with a
 * step to say yes before they replace the ones here. Every line is in copy.ts (RECOVER).
 */
import { RECOVER as T } from './copy';
import type { Game } from './game';
import type { Found, Recovery } from './recovery';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const count = (n: number) => T.counts[n] ?? `${n} heroes`;

export class RecoveryPanel {
  private making = false;
  private failed = false;
  private looking = false;
  private note = '';
  private typed = '';
  private found: Found | null = null;

  constructor(private rec: Recovery, private g: Game, private redraw: () => void, private back: () => void) {}

  /** Opened from the start screen. */
  open(): void {
    this.note = '';
    this.found = null;
    void this.make();
  }

  html(): string {
    const code = this.rec.code, here = this.g.save.heroes.length;
    const mine = code ? `<div class="rcode">${esc(code)}</div><p class="lede">${T.writeDown}</p>`
      : !here ? `<p class="lede">${T.noHeroes}</p>`
      : this.failed ? `<p class="lede">${T.unreachable}</p><button data-rmake class="wide">${T.tryAgain}</button>`
      : `<p class="lede dim">${T.making}</p>`;
    const f = this.found;
    const use = f
      ? `<div class="about"><p>${T.found.replace('{n}', count(f.save.heroes.length)).replace('{names}', f.save.heroes.map((h) => `<b>${esc(h.name)}</b>`).join(', '))}</p>` +
        `${here ? `<p>${T.replaces.replace('{n}', count(here))}</p>` : ''}</div>` +
        `<button data-rbring class="primary wide">${T.bring}</button><button data-rcancel class="ghost wide">${T.cancel}</button>`
      : `<p class="lede small">${T.useLede}</p><form class="rform"><label class="name"><input aria-label="${T.useTitle}" placeholder="${T.example}" value="${esc(this.typed)}" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>` +
        `<button class="primary"${this.looking ? ' disabled' : ''}>${T.use}</button></form>${this.note ? `<p class="dim small">${this.note}</p>` : ''}`;
    return `<div class="tcard rec"><h1>RELIC</h1><div class="sub">${T.title}</div>${mine}<div class="sub rsep">${T.useTitle}</div>${use}` +
      `<button data-rback class="ghost wide">${T.back}</button></div>`;
  }

  click(d: DOMStringMap): void {
    if (d.rmake !== undefined) void this.make();
    else if (d.rcancel !== undefined) (this.found = null), this.redraw();
    else if (d.rback !== undefined) this.back();
    else if (d.rbring !== undefined && this.found) {
      this.rec.use(this.found, (s) => (this.g.adopt(s), true));
      this.found = null;
      this.typed = '';
      this.back();
    }
  }

  /** USE THIS CODE: look it up, then ask before anything here changes. */
  async submit(text: string): Promise<void> {
    if (this.looking) return;
    this.typed = text;
    this.looking = true;
    this.note = T.looking;
    this.redraw();
    const got = await this.rec.look(text);
    this.looking = false;
    this.note = got === 'bad' ? T.bad : got === 'none' ? T.none : !got ? T.unreachable : this.rec.isMine(got) ? T.mine : !got.save.heroes.length ? T.empty : '';
    if (got && typeof got === 'object' && !this.note) this.found = got;
    this.redraw();
  }

  /** This browser's code, made on the server the first time (once there's a hero to keep). */
  private async make(): Promise<void> {
    if (this.rec.code || !this.g.save.heroes.length || this.making) return;
    this.making = true;
    this.failed = false;
    this.redraw();
    this.failed = !(await this.rec.make());
    this.making = false;
    this.redraw();
  }
}
