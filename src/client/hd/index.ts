/** Every body at twice the detail, built once at load: hero looks, goblin kinds, the butcher, the dead. */
import { BURNT, BUTCHER_PAL, BUTCHER_REG, GOBLIN_PAL, GOBLIN_REG, SHIELD, SHIELD_PAL, burnt, butcherRows, goblinRows, headless } from './goblins';
import { expand, figure, type Figure } from './grid';
import { HD_LOOKS } from './looks';

export interface Facing { down: Figure; up: Figure }

export const HERO_FIGS = Object.fromEntries(Object.entries(HD_LOOKS).map(([cls, ls]) => [cls, ls.map((l): Facing => ({
  down: figure(expand({ rows: l.body.down.rows, over: l.down }, l.body.w), l.pal, l.body.reg, l.glow),
  up: figure(expand({ rows: l.body.up.rows, over: l.up }, l.body.w), l.pal, l.body.reg, l.glow),
}))])) as Record<keyof typeof HD_LOOKS, Facing[]>;

/** The small goblin by what it is (`plain` for the rest). */
export const GOBLIN_FIGS: Record<string, Facing> = Object.fromEntries(['plain', 'heavy', 'lunger', 'looter', 'archer'].map((k) => [k, { down: figure(goblinRows(k, false), GOBLIN_PAL, GOBLIN_REG), up: figure(goblinRows(k, true), GOBLIN_PAL, GOBLIN_REG) }]));
export const BUTCHER_FIG: Facing = { down: figure(butcherRows(false), BUTCHER_PAL, BUTCHER_REG), up: figure(butcherRows(true), BUTCHER_PAL, BUTCHER_REG) };

const NONE = { arm: [0, 0, 0, 0] as [number, number, number, number], back: [0, 0, 0, 0] as [number, number, number, number], headTo: 0, hip: 999 };
/** Whole sprites for what isn't posed: the dead, and the sword's shield. */
export const HD_SPRITES = {
  scrapper: GOBLIN_FIGS.plain.down.whole,
  scrapperUp: GOBLIN_FIGS.plain.up.whole,
  scrapperHeadless: figure(headless(goblinRows('plain', false), 12, 22), GOBLIN_PAL, NONE).whole,
  scrapperBurnt: figure(burnt(goblinRows('plain', false)), BURNT, NONE).whole,
  butcherDown: BUTCHER_FIG.down.whole,
  butcherUp: BUTCHER_FIG.up.whole,
  butcherHeadless: figure(headless(butcherRows(false), 14, 36), BUTCHER_PAL, NONE).whole,
  butcherBurnt: figure(burnt(butcherRows(false)), BURNT, NONE).whole,
  shield: figure(SHIELD, SHIELD_PAL, NONE).whole,
};

/** Which goblin body a run goblin wears. */
export const goblinKind = (variant?: string, bow?: boolean) => (bow ? 'archer' : variant === 'heavy' || variant === 'lunger' || variant === 'looter' ? variant : 'plain');
