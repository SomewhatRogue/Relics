/**
 * Spoken lines come alive: they type in a letter at a time with a little voice blip per speaker, and a
 * light markup lets a word lean, sway, or colour with feeling (docs/lore/voice.md, "Emphasis"):
 *   *word* bold   ~word~ sways   ^word^ warm, a good thing   _word_ dull red and trembling, a bad thing
 * A tap, click or Enter while a line is typing finishes it; the next one goes on.
 */
import { blip } from './sfx';

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

interface Run { el: HTMLElement; chars: HTMLElement[]; at: number; wait: number; voice: [number, OscillatorType] | null; done: () => void }
const runs: Run[] = [];
let last = 0, ticking = false;

function tick(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const r = runs[0];
  if (r) {
    r.wait -= dt;
    while (r.wait <= 0 && r.at < r.chars.length) {
      const ch = r.chars[r.at++];
      ch.classList.add('in');
      const t = ch.textContent ?? '';
      r.wait += 1 / SPEED + (PAUSE[t] ?? 0);
      if (r.voice && /[a-z0-9]/i.test(t) && r.at % 2) blip(r.voice[0], r.voice[1]);
    }
    if (r.at >= r.chars.length) (runs.shift(), r.done());
  }
  ticking = runs.length > 0;
  if (ticking) requestAnimationFrame(tick);
}

/** Type a line into `el` as `who` speaks it (no one: narration, typed quietly). */
export function speak(el: HTMLElement, text: string, who = '', done: () => void = () => {}): void {
  el.innerHTML = markup(text);
  el.classList.add('speech');
  const chars = Array.from(el.querySelectorAll<HTMLElement>('.ch'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return (chars.forEach((c) => c.classList.add('in')), done());
  runs.push({ el, chars, at: 0, wait: 0, voice: voiceOf(who), done });
  if (!ticking) (ticking = true), (last = performance.now()), requestAnimationFrame(tick);
}

/** Is anything still typing (inside `within`, if given)? */
export const typing = (within?: HTMLElement) => runs.some((r) => !within || within.contains(r.el));

/** Finish every line still typing (inside `within`, if given). */
export function finish(within?: HTMLElement): void {
  for (const r of [...runs]) {
    if (within && !within.contains(r.el)) continue;
    r.chars.forEach((c) => c.classList.add('in'));
    runs.splice(runs.indexOf(r), 1);
    r.done();
  }
}

/** Type every unwritten `[data-say]` line in `root`, one after another; a line already typed in this
 *  sitting (the panel redrawn after a purchase, say) shows at once. `forget` starts a new sitting. */
const said = new Set<string>();
export function typeIn(root: HTMLElement): void {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-say]'))) {
    const text = el.dataset.say!, who = el.dataset.who ?? '';
    delete el.dataset.say;
    if (said.has(who + text)) {
      el.innerHTML = markup(text);
      el.classList.add('speech');
      el.querySelectorAll('.ch').forEach((c) => c.classList.add('in'));
      continue;
    }
    said.add(who + text);
    speak(el, text, who);
  }
}
export const forget = () => said.clear();

/** A placeholder that typeIn fills: `who` speaking `text`. */
export const line = (text: string, who = '') => `<span data-say="${text.replace(/"/g, '&quot;')}" data-who="${who}"></span>`;
