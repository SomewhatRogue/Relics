/**
 * What a chat line may be, pure so the tests and both ends share it: 120 characters of plain text,
 * no more than one line every 1.5 s and five every 15 s from anyone (the sender holds itself to it,
 * and everyone else drops what breaks it), slurs starred (chatfilter.ts), and names as the town
 * spells them. What goes over the relay is tiny: `{k:'chat', c, n, t}` or, for a quick line, `q`.
 */
import { starWords } from './chatfilter';
import { QUICK } from './chatlines';

export const MAX_CHAT = 120;
/** Where a line is heard: everyone in Wickhold, those near you in town, or your party on a job. */
export type Channel = 'world' | 'local' | 'party';
const CODE: Record<Channel, string> = { world: 'w', local: 'l', party: 'p' };
const FROM_CODE: Record<string, Channel> = { w: 'world', l: 'local', p: 'party' };

/** One line on the wire. */
export interface ChatWire { k: 'chat'; c: string; n: string; t?: string; q?: number }
/** One line as heard. */
export interface ChatLine { ch: Channel; name: string; text: string; quick?: number }

/** Control characters, zero-width and direction marks: nothing a player means to type. */
const HIDDEN = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;

/** Plain, one line, at most 120 characters, slurs starred. Empty if nothing's left. */
export function cleanText(raw: string): string {
  const one = String(raw).replace(HIDDEN, ' ').replace(/\s+/g, ' ').trim();
  return starWords([...one].slice(0, MAX_CHAT).join('')).trim();
}

/** A hero's name as the town shows it (townfolk.ts does the same). */
export function cleanName(raw: unknown): string {
  return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9 '-]/g, '').trim().slice(0, 14) || 'STRANGER';
}

/** For anything that does go into HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** A line to send: free text (cleaned) or a quick line by its number. Null if there's nothing to say. */
export function wire(ch: Channel, name: string, said: string | number): ChatWire | null {
  if (typeof said === 'number') return Number.isInteger(said) && QUICK[said] ? { k: 'chat', c: CODE[ch], n: cleanName(name), q: said } : null;
  const t = cleanText(said);
  return t ? { k: 'chat', c: CODE[ch], n: cleanName(name), t } : null;
}

/** A line heard: checked and cleaned again (never trust the sender's page), or null. */
export function heard(d: unknown): ChatLine | null {
  if (!d || typeof d !== 'object') return null;
  const w = d as Partial<ChatWire>;
  const ch = FROM_CODE[String(w.c)];
  if (w.k !== 'chat' || !ch) return null;
  const name = cleanName(w.n);
  if (typeof w.q === 'number') return Number.isInteger(w.q) && QUICK[w.q] ? { ch, name, text: QUICK[w.q], quick: w.q } : null;
  if (typeof w.t !== 'string' || w.t.length > MAX_CHAT * 4) return null;
  const text = cleanText(w.t);
  return text ? { ch, name, text } : null;
}

/**
 * How fast one player may talk: a gap between lines and a most-in-a-window. The sender uses the
 * real numbers; a listener allows a little for the network bunching lines up (`slack`).
 */
export class Pace {
  private times: number[] = [];
  constructor(private gap = 1.5, private most = 5, private window = 15) {}

  /** May a line go now (seconds)? If so it's counted. */
  ok(now: number): boolean {
    this.times = this.times.filter((t) => now - t < this.window);
    const last = this.times[this.times.length - 1];
    if ((last !== undefined && now - last < this.gap) || this.times.length >= this.most) return false;
    this.times.push(now);
    return true;
  }
}

/** A listener's pace for one sender: the same rules, a little looser for lines bunched in transit. */
export const listenerPace = () => new Pace(1.0, 5, 13);
