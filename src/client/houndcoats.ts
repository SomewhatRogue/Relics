/**
 * The hounds' colours (shared/houndlook.ts says which breed, coat and white a hound has). A hound is
 * drawn as a pixel map of letters (houndbody.ts), one letter a part of the coat:
 * B the coat, D its dark (the far legs and side, a saddle), L its light (belly, chest, feathering),
 * P points (a hill hound's tan, a collie's white collar), R rough hair (a wolfhound's beard and brows),
 * S stripes or patches (brindle, merle), N the nose and lips, E the eye, W white marking, w white
 * marking on the far side. sprites.ts shades and outlines it like a hero.
 */
import type { BreedId, MarkId } from '../shared/houndlook';

export type Pal = Record<'B' | 'D' | 'L' | 'P' | 'R' | 'S' | 'N' | 'E' | 'W' | 'w', string>;

const white = { W: '#e8e4da', w: '#bdb8ae' };
const dark = '#16121a', brown = '#6a4626';
const coat = (B: string, D: string, L: string, P: string, R: string, S: string, E = dark): Pal => ({ B, D, L, P, R, S, N: '#141016', E, ...white });

/** Each breed's coats, in the order the panel offers them. */
export const COAT_PALS: Record<BreedId, Pal[]> = {
  // Rough-coated wolfhound: grey (the bible's), wheaten, and dark brindle; wiry beard and brows.
  wolfhound: [
    coat('#8c8781', '#5f5a55', '#aaa59d', '#9a958e', '#6f6a64', '#6f6a64'),
    coat('#b49b70', '#85704f', '#cdb990', '#c0a87e', '#977f5a', '#977f5a'),
    coat('#6e5e4c', '#4a3e32', '#8a7862', '#7a6a56', '#5a4b3d', '#3a2f26'),
  ],
  // Lean grey lurcher: blue-grey, fawn, brindle; fine coat, pale underneath.
  lurcher: [
    coat('#7d8591', '#565d67', '#a6adb6', '#9097a1', '#6a717b', '#6a717b'),
    coat('#c29c6c', '#8f6d47', '#ddc49c', '#cfae82', '#a8845a', '#a8845a'),
    coat('#8c6c48', '#5c4632', '#b29068', '#9a7a55', '#6e5438', '#3e2f22'),
  ],
  // Black and tan hill hound: black and tan, liver and tan, red; tan points on muzzle, brows, chest, legs.
  hillhound: [
    coat('#2a262e', '#1a181e', '#3c3842', '#b4743c', '#34303a', '#34303a', brown),
    coat('#5c3626', '#3f2419', '#704636', '#c68c52', '#4c2c20', '#4c2c20', '#2a1810'),
    coat('#9c4c2c', '#70341e', '#ba663e', '#c98552', '#86402a', '#86402a'),
  ],
  // Scruffy border collie sort: black and white, red and white, blue merle; white collar, chest, tail tip.
  collie: [
    coat('#242228', '#17151b', '#36333c', '#e6e2d8', '#2e2c33', '#2e2c33', brown),
    coat('#8c4c28', '#64361c', '#a65e34', '#e6e2d8', '#7a4224', '#7a4224'),
    coat('#8c929e', '#5c626e', '#a8aeb8', '#e6e2d8', '#7a808c', '#2c2c34'),
  ],
};

/** The palette for one hound. */
export const palOf = (breed: BreedId, coat: number): Pal => COAT_PALS[breed][coat] ?? COAT_PALS[breed][0];

/** Brindle and merle coats (S laid over B in stripes or patches). */
export const PATTERN: Partial<Record<BreedId, Record<number, 'brindle' | 'merle'>>> = { wolfhound: { 2: 'brindle' }, lurcher: { 2: 'brindle' }, collie: { 2: 'merle' } };

export const hasBlaze = (m: MarkId) => m === 'blaze' || m === 'both';
export const hasSocks = (m: MarkId) => m === 'socks' || m === 'both';
