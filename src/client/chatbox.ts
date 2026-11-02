/**
 * Saying something. Laptop: Enter opens a one-line box at the bottom left, over the log; Enter says
 * it, Esc shuts it, Tab switches WORLD and NEAR (on a job it's always the party), and 1 to 8 in an
 * empty box say a quick line. Phone: CHAT in the corner. In town it opens the chat panel at the top
 * (the box first, so the keyboard never covers it, then the quick lines, then the log); on a job,
 * where typing mid-fight is hopeless, it opens a strip of quick lines, with TYPE for the panel.
 * The page's own keys (input.ts, main.ts) already ignore whatever is typed into a box.
 */
import { MAX_CHAT, type Channel } from '../shared/chatrules';
import { QUICK } from '../shared/chatlines';
import type { ChatLog } from './chatlog';

export type ChatState = 'shut' | 'open' | 'quick';
const LABEL: Record<Channel, string> = { world: 'WORLD', local: 'NEAR', party: 'PARTY' };
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), props);

export class ChatBox {
  readonly root = el('div', { id: 'chat' });
  readonly btn = el('button', { id: 'chatbtn', textContent: 'CHAT' });
  readonly input = el('input', { type: 'text', maxLength: MAX_CHAT, placeholder: 'Say something', autocomplete: 'off', spellcheck: false });
  private chan = el('button', { className: 'chan' });
  state: ChatState = 'shut';
  /** A line to say: typed text, or a quick line's number. */
  onSay: (said: string | number) => void = () => {};
  /** Tab or the channel button: WORLD and NEAR in town. */
  onChannel: () => void = () => {};
  /** May the chat open now (online, in town or with a party, nothing else open)? */
  canOpen: () => boolean = () => false;
  /** On a job (the phone's CHAT opens the quick strip). */
  job = false;

  constructor(log: ChatLog, private touch: boolean) {
    this.btn.setAttribute('aria-label', 'Chat');
    this.input.setAttribute('enterkeyhint', 'send');
    const box = el('div', { className: 'box' });
    const say = el('button', { className: 'say', textContent: 'SAY' });
    const shut = el('button', { className: 'shut', textContent: 'X' });
    shut.setAttribute('aria-label', 'Close chat');
    box.append(this.chan, this.input, say, shut);
    const quick = el('div', { className: 'quick' });
    QUICK.forEach((q, i) => {
      const b = el('button', { textContent: (touch ? '' : `${i + 1} `) + q.replace(/[.!]$/, '').toUpperCase() });
      b.addEventListener('click', () => this.sayQuick(i));
      quick.appendChild(b);
    });
    const type = el('button', { className: 'type', textContent: 'TYPE' });
    type.addEventListener('click', () => this.set('open', true));
    quick.appendChild(type);
    this.root.append(box, quick, log.el);
    document.body.append(this.root, log.peek);
    document.getElementById('corner')?.prepend(this.btn);
    // Clicks in the chat are not swings (input.ts listens on the whole page).
    for (const n of [this.root, log.peek]) n.addEventListener('mousedown', (e) => e.stopPropagation());
    this.chan.addEventListener('click', () => (this.onChannel(), this.state === 'open' && !this.touch && this.input.focus()));
    say.addEventListener('click', () => this.sayTyped());
    shut.addEventListener('click', () => this.set('shut'));
    this.btn.addEventListener('click', () => this.pressChat());
    log.peek.addEventListener('click', () => this.set('open'));
    this.input.addEventListener('keydown', (e) => this.key(e));
    // A laptop's box shuts when you click back into the game.
    this.input.addEventListener('blur', () => !this.touch && this.state === 'open' && setTimeout(() => document.activeElement !== this.input && this.set('shut'), 0));
    addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || this.state === 'open' || (e.target as HTMLElement).closest?.('input, textarea') || !this.canOpen()) return;
      e.preventDefault();
      this.set('open', true);
    });
  }

  setChannel(ch: Channel): void {
    this.chan.textContent = LABEL[ch];
    this.chan.dataset.ch = ch;
  }

  /** Open, shut, or the quick strip. `focus`: put the cursor in the box (on a phone, the keyboard comes up). */
  set(state: ChatState, focus = false): void {
    if (state !== 'shut' && !this.canOpen()) state = 'shut';
    this.state = state;
    document.body.classList.toggle('chat-open', state === 'open');
    document.body.classList.toggle('chat-quick', state === 'quick');
    this.btn.classList.toggle('on', state !== 'shut');
    if (state !== 'shut') this.btn.classList.remove('new');
    if (state === 'open') this.root.querySelector<HTMLElement>('#chatlog')!.scrollTop = 1e9;
    if (state === 'open' && focus) this.input.focus();
    if (state !== 'open' && document.activeElement === this.input) this.input.blur();
  }

  /** Something new was said while the chat is shut: the button says so. */
  ping(): void {
    if (this.state === 'shut') this.btn.classList.add('new');
  }

  private pressChat(): void {
    if (this.state !== 'shut') return this.set('shut');
    this.set(this.touch && this.job ? 'quick' : 'open', !this.touch);
  }

  private sayTyped(): void {
    const t = this.input.value;
    if (t.trim()) this.onSay(t);
    this.input.value = '';
    // A laptop's box shuts once you've said it; a phone's panel stays, to read the answer.
    if (!this.touch) this.set('shut');
  }

  private sayQuick(i: number): void {
    this.onSay(i);
    if (this.state === 'quick' || !this.touch) this.set('shut');
  }

  private key(e: KeyboardEvent): void {
    if (e.key === 'Enter') return e.preventDefault(), this.sayTyped();
    if (e.key === 'Escape') return e.preventDefault(), this.set('shut');
    if (e.key === 'Tab') return e.preventDefault(), this.onChannel();
    const n = Number(e.key);
    if (!this.input.value && n >= 1 && n <= QUICK.length) return e.preventDefault(), this.sayQuick(n - 1);
  }
}
