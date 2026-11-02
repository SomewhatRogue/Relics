/**
 * The wood's lessons on screen: a card when a lesson starts (Hew's words, the move, its control for this
 * device, what it's for), a freeze-frame prompt on the blow to answer, praise when you get it right,
 * the fade in at the start, and a pulse on the phone button to press.
 */
import type { Game } from './game';
import type { Move } from '../sim/wood';
import { dodgeName } from '../shared/weapons';
import { finish, speak, typing } from './speech';

const NAME: Record<Move, string> = { move: 'MOVE', step: 'STEP OUT', attack: 'ATTACK', roll: 'DODGE', block: 'BLOCK', parry: 'PARRY', skill: 'SKILL', relic: 'RELIC', grab: 'GRAB AND THROW', backstab: 'BACKSTAB', heavy: 'FULL SHOT', slip: 'LAST SECOND' };
const KEY: Record<Move, [string, string]> = {
  move: ['W A S D', 'THE STICK, LEFT'],
  step: ['W A S D', 'THE STICK, LEFT'],
  attack: ['LEFT CLICK', 'ATTACK'],
  roll: ['SPACE', 'ROLL'],
  block: ['HOLD RIGHT CLICK', 'HOLD BLOCK'],
  parry: ['RIGHT CLICK', 'BLOCK'],
  skill: ['E', 'SKILL'],
  relic: ['R', 'RELIC'],
  grab: ['F', 'GRAB'],
  backstab: ['LEFT CLICK, FROM BEHIND', 'ATTACK, FROM BEHIND'],
  heavy: ['HOLD LEFT CLICK', 'HOLD ATTACK'],
  slip: ['SPACE, AS IT LANDS', 'ROLL, AS IT LANDS'],
};
const BUTTON: Partial<Record<Move, string>> = { attack: '.tb.attack', roll: '.tb.roll', block: '.tb.block', parry: '.tb.block', skill: '.tb.relic', relic: '.tb.relic2', grab: '.tb.grab', backstab: '.tb.attack', heavy: '.tb.attack', slip: '.tb.roll' };

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
      this.go();
    };
    // A key that would go on while Hew is still talking finishes his line instead.
    g.typing = () => typing(this.el);
    g.finishTyping = () => finish(this.el);
    this.el.addEventListener('click', go);
    this.el.addEventListener('touchend', go, { passive: false });
  }

  /** Tap, click or Enter: finish the line if it's still typing, else go on. */
  go(): void {
    if (typing(this.el)) finish(this.el);
    else this.g.continueHold();
  }

  update(): void {
    // (Only in the wood: a hero who skipped it may still carry a wood that never woke.)
    const w = this.g.mode === 'wood' ? this.g.wood : null, hold = w?.hold ?? null;
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
    const h = hold!, k = KEY[h.move ?? 'attack'][this.touch ? 1 : 0].replace('ROLL', this.touch && w ? dodgeName(w.cls) : 'ROLL');
    this.el.className = h.kind === 'talk' ? 'card talk' : h.kind;
    const hint = `<p class="go-hint">${this.touch ? 'TAP TO GO ON' : 'CLICK OR PRESS ENTER TO GO ON'}</p>`;
    if (h.kind === 'relic') {
      // The relic: found, named, what it does, and its button.
      this.el.className = 'card found-relic';
      this.el.innerHTML = `<div class="card"><div class="found">FOUND</div><div class="relic-name">RELIC JAVELIN</div><p class="line"></p>` +
        `<div class="move"><span>RELIC</span><kbd>${this.touch ? 'RELIC' : 'R'}</kbd></div><p class="how">${h.how ?? ''}</p>${hint}</div>`;
      return speak(this.el.querySelector('.line')!, h.text, '');
    }
    if (h.kind === 'talk') {
      this.el.innerHTML = `<div class="card"><b class="who">${h.who}</b><p class="line"></p>${hint}</div>`;
      return speak(this.el.querySelector('.line')!, h.text, h.who);
    }
    this.el.innerHTML = h.kind === 'act'
      ? `<div class="now">${h.text}</div><kbd>${k}</kbd>`
      : `<div class="card">${h.who ? `<b class="who">${h.who}</b>` : ''}<p class="line"></p>` +
        `<div class="move"><span>${NAME[h.move ?? 'attack']}</span><kbd>${k}</kbd></div>${h.how ? `<p class="how">${h.how}</p>` : ''}` +
        hint + '</div>';
    const ln = this.el.querySelector<HTMLElement>('.line');
    if (ln) speak(ln, h.text, h.who);
  }
}
