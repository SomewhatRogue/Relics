/**
 * Small notes about parties: someone posted one, someone came or went, yours was called off. One per
 * happening, a soft chime, gone after a few seconds, never more than three at once. A posted party's
 * note has JOIN on it, and a tap anywhere else on it opens the parties gathering.
 */
import { tone, ready } from './sfx';
import { PW } from './partywords';
import type { News } from './parties';

const LIFE_MS = 4500, MOST = 3;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function shelf(): HTMLElement {
  let el = document.getElementById('partytoasts');
  if (!el) (el = document.createElement('div')), (el.id = 'partytoasts'), (document.getElementById('partyhud') ?? document.body).appendChild(el);
  return el;
}

function chime(): void {
  if (!ready()) return;
  tone('sine', 660, 660, 0.035, 0.16);
  tone('sine', 990, 990, 0.03, 0.22, 0.08);
}

/** A note on the shelf; `tap` for the note, `act` for its one button. */
export function toast(text: string, opt: { kind?: string; tap?: () => void; act?: { label: string; go: () => void } } = {}): void {
  const s = shelf(), t = document.createElement('div');
  t.className = 'ptoast' + (opt.kind ? ' ' + opt.kind : '');
  t.innerHTML = `<span>${esc(text)}</span>` + (opt.act ? `<button data-act>${esc(opt.act.label)}</button>` : '');
  t.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('[data-act]');
    if (b) opt.act?.go();
    else opt.tap?.();
    t.remove();
  });
  s.appendChild(t);
  while (s.children.length > MOST) s.firstElementChild!.remove();
  chime();
  setTimeout(() => t.classList.add('going'), LIFE_MS - 500);
  setTimeout(() => t.remove(), LIFE_MS);
}

/** The leader's own note when the party goes up (from the board). */
export const postedToast = () => toast(PW.up, { kind: 'mine' });

/** What a party's news says; `join` and `open` for a posted party (null: you can't join just now). */
export function newsToast(n: News, join: ((lead: string) => void) | null, open: () => void): void {
  if (n.k === 'posted') return toast(PW.posted(n.name, n.job.title), { kind: 'posted', tap: open, ...(join ? { act: { label: PW.join, go: () => join(n.lead) } } : {}) });
  const text = { joined: PW.joined, left: PW.left, in: PW.in, off: PW.off, quiet: PW.quiet, full: PW.isFull }[n.k](n.name);
  toast(text, { kind: n.k === 'joined' || n.k === 'in' ? 'good' : 'bad' });
}
