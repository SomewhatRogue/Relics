/** Chat: the word filter, the pace limits, cleaning and escaping, and what's accepted off the wire. */
import { describe, expect, it } from 'vitest';
import { isBad, starWords } from '../src/shared/chatfilter';
import { MAX_CHAT, Pace, cleanName, cleanText, escapeHtml, heard, listenerPace, wire } from '../src/shared/chatrules';
import { QUICK } from '../src/shared/chatlines';

describe('word filter', () => {
  it('stars slurs in their common spellings, same length', () => {
    for (const w of ['nigger', 'N1GGA', 'f@ggot', 'k.i.k.e', 'cuuunt', 'retarded', 'tr4nny']) expect(isBad(w), w).toBe(true);
    expect(starWords('you f4ggot.')).toBe('you *******');
  });
  it("leaves Wickhold's own swearing and ordinary words alone", () => {
    for (const w of ['arse', 'shite', 'bollocks', 'piss', 'Niger', 'chink', 'spice', 'scunthorpe', 'cunning', 'figure', 'fagin', 'spicy']) expect(isBad(w), w).toBe(false);
    expect(starWords('Burn me, that hurt.')).toBe('Burn me, that hurt.');
  });
});

describe('pace', () => {
  it('one line every 1.5 s', () => {
    const p = new Pace();
    expect(p.ok(0)).toBe(true);
    expect(p.ok(1)).toBe(false);
    expect(p.ok(1.6)).toBe(true);
  });
  it('five in 15 s, then wait', () => {
    const p = new Pace();
    for (const t of [0, 2, 4, 6, 8]) expect(p.ok(t)).toBe(true);
    expect(p.ok(10)).toBe(false);
    expect(p.ok(14.9)).toBe(false);
    expect(p.ok(15.1)).toBe(true);
  });
  it('a listener lets lines bunched in transit through, but not a flood', () => {
    const p = listenerPace();
    expect([0, 1.2, 2.5, 4, 5.4].map((t) => p.ok(t))).toEqual([true, true, true, true, true]);
    expect(p.ok(6.6)).toBe(false);
    const q = listenerPace();
    expect(q.ok(0) && !q.ok(0.3)).toBe(true);
  });
});

describe('cleaning and escaping', () => {
  it('one plain line of at most 120 characters', () => {
    expect(cleanText('  hello\n\tthere​‮  ')).toBe('hello there');
    expect(cleanText('x'.repeat(400)).length).toBe(MAX_CHAT);
    expect(cleanText('\u0000\u0007')).toBe('');
  });
  it('escapes anything that would be markup', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">&'`)).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
  });
  it('names as the town spells them', () => {
    expect(cleanName('<b>sam</b>')).toBe('BSAMB');
    expect(cleanName('')).toBe('STRANGER');
  });
});

describe('the wire', () => {
  it('a typed line goes out cleaned and comes back the same', () => {
    const w = wire('world', 'Kyle', '  Anyone for the mine?  ')!;
    expect(w).toEqual({ k: 'chat', c: 'w', n: 'KYLE', t: 'Anyone for the mine?' });
    expect(heard(JSON.parse(JSON.stringify(w)))).toEqual({ ch: 'world', name: 'KYLE', text: 'Anyone for the mine?' });
  });
  it('a quick line goes as its number', () => {
    const w = wire('party', 'sam', 0)!;
    expect(w.q).toBe(0);
    expect(heard(w)).toEqual({ ch: 'party', name: 'SAM', text: QUICK[0], quick: 0 });
    expect(wire('party', 'sam', 99)).toBeNull();
  });
  it("drops what isn't a chat line, and cleans what a hostile page sends", () => {
    expect(heard({ k: 'me', p: [] })).toBeNull();
    expect(heard({ k: 'chat', c: 'x', n: 'A', t: 'hi' })).toBeNull();
    expect(heard({ k: 'chat', c: 'l', n: 'A', t: '   ' })).toBeNull();
    expect(heard({ k: 'chat', c: 'l', n: 'A', q: 1.5 })).toBeNull();
    expect(heard({ k: 'chat', c: 'l', n: 'A', t: 'y'.repeat(2000) })).toBeNull();
    expect(heard({ k: 'chat', c: 'l', n: 'A', t: 'z'.repeat(300) })!.text.length).toBe(MAX_CHAT);
    expect(heard({ k: 'chat', c: 'w', n: 'A', t: 'you kike' })!.text).toBe('you ****');
  });
});
