/**
 * The chat's word filter: slurs and swearing are starred out, and whoever swore is struck by lightning
 * (Kyle's call: chat.ts). Wickhold's people swear in their own lines (docs/lore/voice.md); players
 * in chat don't. Kept short on
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

/** Plain swearing: starred too, and it brings the lightning down. */
const SWEAR: RegExp[] = [
  /^f+u+c+k+/, /^m+o+t+h+e+r+f+u+c+k+/, /^s+h+i+t+e*/, /^b+u+l+l+s+h+i+t+/, /^p+i+s+s+/, /^a+r+s+e+[sd]?$/, /^a+s+s+h+o+l+e+s*$/, /^a+s+s+$/,
  /^b+i+t+c+h+/, /^b+a+s+t+a+r+d+/, /^b+o+l+l+o+c+k+s+$/, /^d+a+m+n+/, /^g+o+d+d+a+m+n+/, /^c+o+c+k+s*$/, /^d+i+c+k+s*$/, /^d+i+c+k+h+e+a+d+/,
  /^p+r+i+c+k+s*$/, /^t+w+a+t+s*$/, /^w+a+n+k+/, /^c+r+a+p+$/, /^w+h+o+r+e+s*$/, /^s+l+u+t+s*$/,
];

/** Look-alike characters, read as the letter they stand for. */
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't' };

/** A word as the filter reads it: lower case, look-alikes swapped, anything not a letter dropped. */
export function plain(word: string): string {
  return [...word.toLowerCase()].map((c) => LEET[c] ?? c).join('').replace(/[^a-z]/g, '');
}

/** True if this word is on the list (slurs, or swearing). */
export function isBad(word: string): boolean {
  const p = plain(word);
  return p.length > 2 && (BAD.some((r) => r.test(p)) || SWEAR.some((r) => r.test(p)));
}

/** True if anything in this line would be starred: whoever said it is struck. */
export const swore = (text: string): boolean => text.split(/\s+/).some(isBad);

/** The line with every listed word starred out (same length, so the line still reads as a line). */
export function starWords(text: string): string {
  return text.replace(/\S+/g, (w) => (isBad(w) ? '*'.repeat([...w].length) : w));
}
