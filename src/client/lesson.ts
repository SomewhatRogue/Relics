/**
 * The wood's lessons on screen: a card when a lesson starts (Hew's words, the move, its control for this
 * device, what it's for), a freeze-frame prompt on the blow to answer, praise when you get it right,
 * the fade in at the start, and a pulse on the phone button to press.
 */
import type { Game } from './game';
import type { Move } from '../sim/wood';

const NAME: Record<Move, string> = { move: 'MOVE', attack: 'ATTACK', roll: 'DODGE', block: 'BLOCK', parry: 'PARRY', skill: 'SKILL' };
const KEY: Record<Move, [string, string]> = {
  move: ['W A S D', 'THE STICK, LEFT'],
  attack: ['LEFT CLICK', 'ATTACK'],
  roll: ['SPACE', 'ROLL'],
  block: ['HOLD RIGHT CLICK', 'HOLD BLOCK'],
  parry: ['RIGHT CLICK', 'BLOCK'],
  skill: ['E', 'SKILL'],
};
const BUTTON: Partial<Record<Move, string>> = { attack: '.tb.attack', roll: '.tb.roll', block: '.tb.block', parry: '.tb.block', skill: '.tb.relic' };

export class LessonView {
  private el = document.createElement('div');
  private fade = document.createElement('div');
  private key = '';

  constructor(private g: Game, private touch: boolean) {
    this.el.id = 'lesson';
    this.el.hidden = true;
    this.fade.id = 'fade';
    document.body.append(this.el, this.fade);
    // A tap or click anywhere on a card goes on (the card covers the screen, stick included).
    const go = (e: Event) => {
      if (!this.el.classList.contains('card')) return;
      e.preventDefault();
      g.continueHold();
    };
    this.el.addEventListener('click', go);
    this.el.addEventListener('touchend', go, { passive: false });
  }

  update(): void {
    const w = this.g.wood, hold = w?.hold ?? null;
    // The fade in, while you lie there.
    this.fade.style.opacity = w && w.wake >= 0 && w.wake < 2.5 ? String(1 - w.wake / 2.5) : '0';
    document.body.classList.toggle('waking', !!w && w.wake >= 0);
    for (const b of document.querySelectorAll('.tb.hint')) b.classList.remove('hint');
    if (hold?.move && BUTTON[hold.move] && this.touch) document.querySelector(BUTTON[hold.move]!)?.classList.add('hint');
    const show = !!hold && hold.kind !== 'praise';
    const key = show ? hold!.kind + hold!.text + hold!.move : '';
    if (key === this.key) return;
    this.key = key;
    this.el.hidden = !show;
    if (!show) return;
    const h = hold!, k = KEY[h.move ?? 'attack'][this.touch ? 1 : 0];
    this.el.className = h.kind === 'talk' ? 'card talk' : h.kind;
    const hint = `<p class="go-hint">${this.touch ? 'TAP TO GO ON' : 'CLICK OR PRESS ENTER TO GO ON'}</p>`;
    if (h.kind === 'talk') return void (this.el.innerHTML = `<div class="card"><b class="who">${h.who}</b><p class="line">${h.text}</p>${hint}</div>`);
    this.el.innerHTML = h.kind === 'act'
      ? `<div class="now">${h.text}</div><kbd>${k}</kbd>`
      : `<div class="card">${h.who ? `<b class="who">${h.who}</b>` : ''}<p class="line">${h.text}</p>` +
        `<div class="move"><span>${NAME[h.move ?? 'attack']}</span><kbd>${k}</kbd></div>${h.how ? `<p class="how">${h.how}</p>` : ''}` +
        hint + '</div>';
  }
}
