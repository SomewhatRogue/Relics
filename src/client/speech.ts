/**
 * Spoken lines come alive: they type in a letter at a time with a little voice blip per speaker, and a
 * light markup lets a word lean, sway, or colour with feeling (docs/lore/voice.md, "Emphasis"):
 *   *word* bold   ~word~ sways   ^word^ warm, a good thing   _word_ dull red and trembling, a bad thing
 * A panel reveals in reading order (reveal.ts): a tap finishes the line being typed, another shows the rest.
 */
import { blip } from './sfx';
import { GAP, plan, Reveal, type Beat, type Unit } from './reveal';

const MARK: Record<string, string> = { '*': 'em', '~': 'sway', '^': 'good', _: 'bad' };
/** Letters a second, and the pauses after punctuation (seconds). */
const SPEED = 42, PAUSE: Record<string, number> = { ',': 0.09, ';': 0.12, ':': 0.12, '.': 0.24, '!': 0.24, '?': 0.24 };

/** Each speaker's voice: pitch in Hz and waveform. Anyone not listed gets one from their name. */
const VOICE: Record<string, [number, OscillatorType]> = {
  HEW: [150, 'triangle'], ORLA: [300, 'triangle'], 'THE STOKER': [95, 'sawtooth'], HALVARD: [120, 'square'],
  'FATHER ODRIC': [170, 'sine'], 'MOTHER ISOLDE': [250, 'square'], GANNET: [210, 'triangle'], 'DICER MOLL': [330, 'triangle'],
  'IVO THE RELIC-WRIGHT': [280, 'sine'], 'REEVE HOLLIS': [230, 'triangle'],
};
const voiceOf = (who: string): [number, OscillatorType] | null => {
  if (!who) return null;
  const k = who.toUpperCase().replace(/:$/, '');
  if (VOICE[k]) return VOICE[k];
  const key = Object.keys(VOICE).find((v) => k.includes(v) || v.includes(k));
  if (key) return VOICE[key];
  let h = 0;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [160 + (h % 180), 'triangle'];
};

/** The markup to HTML, every visible letter its own span (so it can type in and sway letter by letter).
 *  Each word is wrapped whole (it never breaks across lines); a mark open across words reopens in each. */
export function markup(s: string): string {
  let out = '', i = 0, n = 0, inWord = false;
  const open: string[] = [];
  const tags = () => open.map((m) => `<span class="${MARK[m]}">`).join('');
  const startWord = () => { if (!inWord) (out += '<span class="w">' + tags()), (inWord = true); };
  const endWord = () => { if (inWord) (out += '</span>'.repeat(open.length) + '</span>'), (inWord = false); };
  while (i < s.length) {
    const c = s[i];
    if (c === '<') {
      endWord();
      const j = s.indexOf('>', i);
      out += s.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (MARK[c]) {
      if (open[open.length - 1] === c) {
        open.pop();
        if (inWord) out += '</span>';
      } else {
        open.push(c);
        if (inWord) out += `<span class="${MARK[c]}">`;
      }
      i++;
      continue;
    }
    if (c === ' ') {
      endWord();
      out += ' ';
      i++;
      continue;
    }
    startWord();
    const ch = c === '&' ? s.slice(i, s.indexOf(';', i) + 1) || c : c;
    out += `<span class="ch" style="--i:${n++}">${ch}</span>`;
    i += ch.length;
  }
  endWord();
  return out;
}
/** The words without the markup (for anything that isn't typed). */
export const plain = (s: string) => s.replace(/[*~^_]/g, '');

/** Every reveal under way, each in its own root (a panel's words, a lesson card, the caption). */
interface Seq { root: HTMLElement; rev: Reveal }
let seqs: Seq[] = [], last = 0, ticking = false;
const still = matchMedia('(prefers-reduced-motion: reduce)');

function tick(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // A root redrawn or taken away is dropped; only the newest talker blips.
  seqs = seqs.filter((q) => q.root.isConnected && q.rev.pending);
  seqs.forEach((q, i) => q.rev.step(dt, i === seqs.length - 1));
  seqs = seqs.filter((q) => q.rev.pending);
  ticking = seqs.length > 0;
  if (ticking) requestAnimationFrame(tick);
}

function run(root: HTMLElement, beats: Beat[], done: () => void = () => {}): void {
  seqs = seqs.filter((q) => q.root !== root);
  const rev = new Reveal(beats, done);
  if (still.matches) return rev.finish();
  if (!rev.pending) return;
  seqs.push({ root, rev });
  if (!ticking) (ticking = true), (last = performance.now()), requestAnimationFrame(tick);
}

/** A recorded voice is speaking (voiceplay.ts): the typed letters stay quiet until it's done. */
let hushUntil = 0;
export const hushBlips = (seconds: number) => void (hushUntil = Math.max(hushUntil, performance.now() + seconds * 1000));

/** Lay out a line's letters in `el`, all hidden; the beat that types them. */
function letters(el: HTMLElement, text: string, who: string): Beat {
  el.innerHTML = markup(text);
  el.classList.add('speech');
  const chars = Array.from(el.querySelectorAll<HTMLElement>('.ch')), voice = voiceOf(who);
  const waits = chars.map((c) => 1 / SPEED + (PAUSE[c.textContent ?? ''] ?? 0));
  const letter = (i: number, loud: boolean) => {
    const c = chars[i], t = c.textContent ?? '';
    c.classList.add('in');
    if (loud && voice && /[a-z0-9]/i.test(t) && i % 2 === 0 && performance.now() >= hushUntil) blip(voice[0], voice[1]);
  };
  return { show: () => {}, waits, letter, after: GAP };
}

/** Type a line into `el` as `who` speaks it (no one: narration, typed quietly). */
export function speak(el: HTMLElement, text: string, who = '', done: () => void = () => {}): void {
  run(el, [letters(el, text, who)], done);
}

const within = (q: Seq, el?: HTMLElement) => q.root.isConnected && (!el || el.contains(q.root));
/** Is anything still typing or waiting to show (inside `el`, if given)? */
export const typing = (el?: HTMLElement) => seqs.some((q) => within(q, el) && q.rev.pending);
/** Show and type everything still to come (inside `el`, if given). */
export function finish(el?: HTMLElement): void {
  for (const q of seqs.filter((q) => within(q, el))) q.rev.finish();
  seqs = seqs.filter((q) => !within(q, el));
}
/** A tap: finish the line being typed; a second tap shows the rest (inside `el`, if given). */
export function skip(el?: HTMLElement): void {
  for (const q of seqs.filter((q) => within(q, el))) q.rev.skip();
}

/** The things in `root` in reading order: each spoken line, and each plain thing around them. A bare
 *  stretch of words beside a line is wrapped so it can wait its turn. */
function units(node: Element, out: Unit<HTMLElement>[] = []): Unit<HTMLElement>[] {
  for (const c of Array.from(node.childNodes)) {
    if (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()) {
      const s = document.createElement('span');
      c.replaceWith(s);
      s.append(c);
      out.push({ item: s, parent: node, letters: s.textContent!.length });
    } else if (c instanceof HTMLElement) {
      if (c.dataset.say !== undefined) out.push({ item: c, parent: node, line: { fresh: !said.has((c.dataset.who ?? '') + c.dataset.say) }, letters: c.dataset.say.length });
      else if (c.querySelector('[data-say]')) units(c, out);
      else out.push({ item: c, parent: node, letters: c.textContent?.length ?? 0 });
    }
  }
  return out;
}

/** Reveal `root` in reading order: each unwritten `[data-say]` line types in turn, and whatever comes
 *  after a line waits for it. A line already typed in this sitting (the panel redrawn after a
 *  purchase, say) shows at once. `forget` starts a new sitting. */
const said = new Set<string>();
export function typeIn(root: HTMLElement): void {
  const p = plan(units(root)), typed = new Map<HTMLElement, Beat>();
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-say]'))) {
    const text = el.dataset.say!, who = el.dataset.who ?? '', b = letters(el, text, who);
    delete el.dataset.say;
    if (said.has(who + text)) b.waits.forEach((_, i) => b.letter(i, false));
    else typed.set(el, b);
    said.add(who + text);
  }
  p.hide.forEach((el) => el.classList.add('unread'));
  const show = (els: HTMLElement[]) => () => els.forEach((el) => (el.classList.remove('unread'), el.classList.add('unveil')));
  run(root, p.beats.map((b) => {
    const t = b.type ? typed.get(b.type)! : null;
    return { show: show(b.show), waits: t?.waits ?? [], letter: t?.letter ?? (() => {}), after: b.after };
  }));
}
export const forget = () => said.clear();

/** A placeholder that typeIn fills: `who` speaking `text`. */
export const line = (text: string, who = '') => `<span data-say="${text.replace(/"/g, '&quot;')}" data-who="${who}"></span>`;
