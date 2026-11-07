/**
 * Which pair of faces the game's words wear. Today's is Tiny5 with Jacquard 12 for titles; three easier
 * reads are on trial (fontchoice.css): A, readable pixel; B, clean book; C, hybrid. `?font=a|b|c` tries
 * one; without it PICK holds. The page side is one data-font on <html> (the variables in fontchoice.css);
 * the canvas side (words over heads, damage numbers, boards) is the pixel face below, read from a
 * bundled font at its native size (pixface.ts). Settling on one is the one line: PICK.
 */
import './fontchoice.css';
import { loadPixFace, useFace } from './pixface';
import { tallFace } from './pixtall';

export type FontPick = 'today' | 'a' | 'b' | 'c';

/** The pairing the game wears when the address doesn't ask for one. */
const PICK: FontPick = 'c'; // Kyle picked C, the hybrid (2026-11-06): Source Sans 3 and Grenze Gotisch, Silkscreen on the canvas.

/** The canvas's face for each: none keeps the hand-drawn 3x5 capitals (pixfont.ts), 'tall' is the 4x7
 *  ones (pixtall.ts), and a font is read at the size it is drawn on (Silkscreen's pixel is an eighth of its em). */
const CANVAS: Record<FontPick, 'tall' | { family: string; size: number } | null> = {
  today: null,
  a: 'tall',
  b: 'tall',
  c: { family: 'Silkscreen', size: 8 },
};

const asked = new URLSearchParams(location.search).get('font');
export const FONT: FontPick = asked === 'a' || asked === 'b' || asked === 'c' || asked === 'today' ? asked : PICK;

if (FONT !== 'today') document.documentElement.dataset.font = FONT;
const face = CANVAS[FONT];
if (face === 'tall') useFace(tallFace());
else if (face) void loadPixFace(face.family, face.size);
