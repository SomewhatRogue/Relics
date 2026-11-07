import { faceSprite, faceWidth, pixFace } from './pixface';

/** A 3x5 pixel font for numbers, short calls ("BLOCK") and a few words of speech (in capitals), drawn crisp at any zoom. */
const G: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111', '9': '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  G: '011100101101011', I: '111010010010111', H: '101101111101101', J: '001001001101010', V: '101101101101010',
  M: '101111111101101', F: '111100110100100', X: '101101010101101', K: '101101110101101', L: '100100100100111', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
  W: '101101111111101', Y: '101101010010010', Q: '010101101110011', Z: '111001010100111', '+': '000010111010000', '!': '010010010000010', ' ': '000000000000000',
  '.': '000000000000010', ',': '000000000010100', "'": '010010000000000', ':': '000010000010000', '?': '111001011000010',
  '-': '000000111000000', '/': '001001010100100', '♥': '101111111010000',
};

/** One letter of the 3x5 capitals (15 cells, row by row), whatever face the words wear (cut in stone: statuedraw.ts). */
export const glyph = (ch: string): string => G[ch] ?? G[ch.toUpperCase()] ?? G[' '];

export function textWidth(s: string): number {
  const f = pixFace();
  return f ? faceWidth(f, s) : s.length * 4 - 1;
}

/** Pixels from one line's top to the next (5 tall letters and their outline; more in a taller face: fontchoice.ts). */
export const lineHeight = (): number => (pixFace()?.capH ?? 5) + 2;
/** Pixels an average capital takes across, with its gap. */
export const charAdvance = (): number => pixFace()?.avg ?? 4;

/** Draw text with a one-pixel dark outline so it reads on any floor. */
export function drawText(g: CanvasRenderingContext2D, s: string, x: number, y: number, col: string): void {
  const f = pixFace();
  // A taller face sits on the same baseline, so words over a head grow up, not into it.
  if (f) return void g.drawImage(faceSprite(f, s, col), Math.round(x) - 1, Math.round(y) - 1 - (f.capH - 5));
  const px = (ox: number, oy: number, c: string) => {
    g.fillStyle = c;
    for (let i = 0; i < s.length; i++) {
      const p = G[s[i]] ?? G[s[i].toUpperCase()] ?? G[' '];
      for (let k = 0; k < 15; k++) if (p[k] === '1') g.fillRect(x + ox + i * 4 + (k % 3), y + oy + Math.floor(k / 3), 1, 1);
    }
  };
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(dx, dy, '#0d0b10');
  px(0, 0, col);
}
