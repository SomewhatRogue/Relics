/**
 * The chat's word filter: slurs and the very worst words are starred out, nothing else. Wickhold
 * swears (arse, piss, bollocks, shite: docs/lore/voice.md) and so may its players. Kept short on
 * purpose; it catches the common spellings (letters doubled, 0 for o, 1 for i, dots between letters),
 * not a determined speller. MUTE (chat log) is the answer to those.
 *
 * Words like "chink" (in the armour), "coon" and "dyke" are left off: they're ordinary words too.
 */
const BAD: RegExp[] = [
  /^n+i+g{2,}[aeuhrzs]*$/,
  /^f+a+g+s*$/,
  /^f+a+g+[oe]+t+s*$/,
  /^k+i+k+e+s*$/,
  /^s+p+i+c+k*s*$/,
  /^g+o{2,}k+s*$/,
  /^w+e+t+b+a+c+k+s*$/,
  /^t+r+a+n+n+(y+|i+e+)s*$/,
  /^r+e+t+a+r+d+(s|e+d+)?$/,
  /^c+u+n+t+(s|y)?$/,
];

/** Look-alike characters, read as the letter they stand for. */
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't' };

/** A word as the filter reads it: lower case, look-alikes swapped, anything not a letter dropped. */
export function plain(word: string): string {
  return [...word.toLowerCase()].map((c) => LEET[c] ?? c).join('').replace(/[^a-z]/g, '');
}

/** True if this word is on the list. */
export function isBad(word: string): boolean {
  const p = plain(word);
  return p.length > 2 && BAD.some((r) => r.test(p));
}

/** The line with every listed word starred out (same length, so the line still reads as a line). */
export function starWords(text: string): string {
  return text.replace(/\S+/g, (w) => (isBad(w) ? '*'.repeat([...w].length) : w));
}
