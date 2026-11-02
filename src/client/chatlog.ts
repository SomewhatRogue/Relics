/**
 * The chat log: lines as they come, newest at the bottom. On a laptop it sits at the bottom left
 * (the last few lines, fading, while the box is shut; all of them, scrolling, while it's open). On a
 * phone it's inside the chat panel, and the town shows only the last two lines, small and faint,
 * under the banner (the peek): tap them to open the panel. Tap a name to mute that player here.
 * Everything a player wrote goes in as textContent, never as markup.
 */
import type { Channel } from '../shared/chatrules';

export interface Entry { from: string; name: string; ch: Channel | 'note'; text: string; mine?: boolean }

const KEEP = 60, FADE_AFTER = 14, PEEK_FOR = 40;
const TAG: Record<string, string> = { local: 'NEAR', party: 'PARTY' };

export class ChatLog {
  readonly el = document.createElement('div');
  readonly peek = document.createElement('div');
  /** A name tapped (not your own): mute or unmute them. */
  onName: (id: string, name: string) => void = () => {};
  private lines: { e: Entry; at: number; node: HTMLElement }[] = [];

  constructor() {
    this.el.id = 'chatlog';
    this.peek.id = 'chatpeek';
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-who]') as HTMLElement | null;
      if (b?.dataset.who) this.onName(b.dataset.who, b.textContent ?? '');
    });
  }

  add(e: Entry, now: number): void {
    const node = document.createElement('div');
    node.className = `ln ${e.ch}${e.mine ? ' mine' : ''}`;
    if (TAG[e.ch]) node.appendChild(Object.assign(document.createElement('i'), { textContent: TAG[e.ch] }));
    // (A note can name someone too: the one just muted, tappable to hear them again.)
    if (e.name) {
      const who = document.createElement('b');
      who.textContent = e.name;
      if (!e.mine && e.from) who.dataset.who = e.from;
      node.appendChild(who);
    }
    node.appendChild(document.createTextNode(e.text));
    const end = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight < 24;
    this.el.appendChild(node);
    this.lines.push({ e, at: now, node });
    while (this.lines.length > KEEP) this.lines.shift()!.node.remove();
    // Reading back up the log: stay there; at the bottom: follow the new line.
    if (end) this.el.scrollTop = this.el.scrollHeight;
    this.renderPeek(now);
  }

  /** A player muted: their lines go from the log. */
  drop(id: string): void {
    this.lines = this.lines.filter((l) => (l.e.from === id && !l.e.mine && l.e.ch !== 'note' ? (l.node.remove(), false) : true));
  }

  /** Each frame: old lines fade (laptop, box shut); the peek empties once it's gone quiet. */
  frame(now: number): void {
    for (const l of this.lines) l.node.classList.toggle('old', now - l.at > FADE_AFTER);
    const last = this.lines[this.lines.length - 1];
    this.peek.classList.toggle('quiet', !last || now - last.at > PEEK_FOR);
  }

  toBottom(): void {
    this.el.scrollTop = this.el.scrollHeight;
  }

  private renderPeek(now: number): void {
    this.peek.textContent = '';
    for (const l of this.lines.filter((x) => x.e.ch !== 'note').slice(-2)) {
      const row = document.createElement('div');
      row.appendChild(Object.assign(document.createElement('b'), { textContent: l.e.name }));
      row.appendChild(document.createTextNode(l.e.text));
      this.peek.appendChild(row);
    }
    this.frame(now);
  }

  /** Test hook: the log as text. */
  get text(): string[] {
    return this.lines.map((l) => (l.e.ch === 'note' ? '' : `${l.e.ch} ${l.e.name}: `) + l.e.text);
  }
}
