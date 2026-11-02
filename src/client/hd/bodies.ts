/**
 * The hero bodies at twice the detail: five shapes every look is drawn on (plate, hood, a wide hat,
 * a robe under a pointed hat, a robe under a hood), facing you and walking away. Rows of 12 are the
 * left half, mirrored. The characters mean the same thing in every body, and each look's palette says
 * what they are made of:
 *   H h i  head (helm, hood, hat), its shade, a trim     o e  the shadow over the face, the eyes (glow)
 *   f b    skin, beard                                   T t j J  body, shade, trim, emblem
 *   A a g  sleeve or pauldron, shade, hand               B k  belt, buckle
 *   L l K  legs, shade, boots                            C c  cape and its shade (the back)
 *   P      crest or plume                                x y z  a look's own details
 */
import type { Grid, Regions } from './grid';

export interface Body { w: number; down: Grid; up: Grid; reg: Regions }

const LEGS = ['......LLLl..', '......LLLl..', '......LiLl..', '......LLLl..', '......LLLl..', '......LLLl..', '.....KKKKl..', '.....KKKKK..', '.....KKKKK..'];
/** Regions for a 24 wide body: the weapon arm on the right, the off arm on the left. */
const reg = (headTo: number, hip: number, top: number, bottom: number): Regions => ({ arm: [17, top, 24, bottom], back: [0, top, 7, bottom], headTo, hip, byChar: { C: 'cape', c: 'cape' } });

const PLATE_DOWN = [
  '..........PP', '.........PPP', '.......hHHHH', '......hHHHHH', '.....hHHHHiH', '.....hHHHHHH', '.....hHHHHHH', '.....hoooooo',
  '.....hoooeeo', '.....hhooooo', '.....hhHHHHH', '......hhHHHH', '..aAAAAhhhjj', '.aAAAAATTTjj', '.aAAAaATTTjj', '.aAAaATTTTjj',
  '..aAaTtTTTjj', '..aAatTTTTjj', '..gAatTTTTjj', '..ggatTTTTjj', '..gg.BBBBBBk', '.....tTTTTTj', '.....tTTTTT.', ...LEGS,
];
const PLATE_UP = [
  '..........PP', '.........PPP', '.......hHHHH', '......hHHHHH', '.....hHHHHHH', '.....hHHHHHH', '.....hHHHHHH', '.....hHHHHHH',
  '.....hHHHHHH', '.....hhHHHHH', '.....hhhHHHH', '......hhhhhh', '..aAAAACcccc', '.aAAAAACCCCC', '.aAAAaACCCCC', '.aAAaACCCCCC',
  '..aAaCCCCCCC', '..aAaCCCCCCC', '..gAaCCCCCCC', '..ggaCCCCCCC', '..gg.CCCCCCC', '.....cCCCCCC', '.....ccCCCCC', ...LEGS,
];
export const PLATE: Body = { w: 24, down: { rows: PLATE_DOWN }, up: { rows: PLATE_UP }, reg: reg(12, 23, 12, 22) };

const HOOD_DOWN = [
  '..........HH', '.........HHH', '........hHHH', '.......hHHHH', '......hHHHHH', '......hHoooo', '.....hHooooo', '.....hHooeeo',
  '.....hHxxxxx', '.....hhxxxxx', '......hhhHHH', '......hhHHHH', '..aAAAhhTTTT', '.aAAAAhTTTTT', '.aAAAAtTTTTT', '.aAAaATTTTTT',
  '..aAaTTTTTTT', '..aAatTTTTTT', '..gAatTTTTTT', '..ggatTTTTTT', '..gg.BBBBBBk', '.....tTTTTTT', '.....tTTTTT.', ...LEGS,
];
const HOOD_UP = [
  '..........HH', '.........HHH', '........hHHH', '.......hHHHH', '......hHHHHH', '......hHHHHH', '.....hHHHHHH', '.....hHHHHHH',
  '.....hHHHHHH', '.....hhHHHHH', '......hhhHHH', '......hhHHHH', '..aAAAhhCCCC', '.aAAAAhCCCCC', '.aAAAACCCCCC', '.aAAaACCCCCC',
  '..aAaCCCCCCC', '..aAacCCCCCC', '..gAacCCCCCC', '..ggacCCCCCC', '..gg.BBBBBBB', '.....tTTTTTT', '.....tTTTTT.', ...LEGS,
];
export const HOOD: Body = { w: 24, down: { rows: HOOD_DOWN }, up: { rows: HOOD_UP }, reg: reg(12, 23, 12, 22) };

const HAT_DOWN = [
  '............', '........HHHH', '.......HHHHH', '.......HHHHH', '.......iiiii', '.hhhhhhhhhhh', '..hhhhhhhhhh', '......oooooo',
  '......ooeeoo', '......offfff', '......ffbbbb', '.......bbbbb', '..aAxxxxxxxx', '.aAAxxxxxxxx', '.aAAAAtTTTTT', '.aAAaATTTTTT',
  '..aAaTTTTTTT', '..aAatTTTTTT', '..gAatTTTTTT', '..ggatTTTTTT', '..gg.BBBBBBk', '.....tTTTTTT', '.....tTTTTT.', ...LEGS,
];
const HAT_UP = [
  '............', '........HHHH', '.......HHHHH', '.......HHHHH', '.......iiiii', '.hhhhhhhhhhh', '..hhhhhhhhhh', '......HHHHHH',
  '......HHHHHH', '......hHHHHH', '......hhHHHH', '.......hhhhh', '..aAxxxxxxxx', '.aAAxxxxxxxx', '.aAAAATTTTTT', '.aAAaATTTTTT',
  '..aAaTTTTTTT', '..aAatTTTTTT', '..gAatTTTTTT', '..ggatTTTTTT', '..gg.BBBBBBB', '.....tTTTTTT', '.....tTTTTT.', ...LEGS,
];
export const HAT: Body = { w: 24, down: { rows: HAT_DOWN }, up: { rows: HAT_UP }, reg: reg(12, 23, 12, 22) };

/** A robe to the ground, sleeves wide, only the boots showing. */
const ROBE = [
  '..aAAATTTTTj', '.aAAAATTTTTj', 'aAAAAATTTTTj', 'aAAAaATTTTTj', 'aAAaAtTTTTTj', '.aAaATTTTTTj', '.gAaATTTTTTj', '.gg.BBBBBBBk',
  '....tTTTTTTj', '....tTTTTTTj', '....tTTTTTTj', '....tTTTTTTj', '...tTTTTTTTj', '...tTTTTTTTj', '...tTTTTTTTj', '...ttTTTTTTj',
  '..ttTTTTTTTj', '..ttTTTTTTTj', '..cccccccccc', '.....KKK....',
];
const ROBE_UP = ROBE.map((r) => r.replace(/j/g, 'T').replace(/k/g, 'B'));
/** The Mage's hat: a bent point, a band, a wide brim; the face in its shadow, a beard. */
const HAT_TALL = [
  '...............HH.......', '..............HHH.......', '.............HHHH.......', '............HHiH........', '...........HHHH.........',
  '..........HHHHH.........', '.........HHHHHH.........', '.........HHHHHH.........', '........HHHHHHHH........',
];
const MAGE_DOWN = [...HAT_TALL, '.......jjjjj', '...hhhhhhhhh', '........oooo', '.......ooeeo', '.......oobbb', '........bbbb', '.........bbb', ...ROBE];
const MAGE_UP = [...HAT_TALL, '.......jjjjj', '...hhhhhhhhh', '........HHHH', '.......hHHHH', '.......hhHHH', '........hhhh', '.........hhh', ...ROBE_UP];
const robeReg = (top: number): Regions => ({ arm: [18, top, 24, top + 8], back: [0, top, 6, top + 8], headTo: top, hip: top + 19, byChar: {} });
export const MAGE: Body = { w: 24, down: { rows: MAGE_DOWN }, up: { rows: MAGE_UP }, reg: robeReg(16) };

/** A robe under a deep hood (the frost Mage, the friar). */
const COWL_DOWN = [
  '..........HH', '........hHHH', '.......hHHHH', '......hHHHHH', '......hHoooo', '.....hHooooo', '.....hHooeeo', '.....hHooooo',
  '.....hHobbbb', '......hhbbbb', '......hhhbbb', '......hhHHbb', ...ROBE.slice(0, 1).map((r) => r.replace('TTTTT', 'hhbbb')), ...ROBE.slice(1),
];
const COWL_UP = [
  '..........HH', '........hHHH', '.......hHHHH', '......hHHHHH', '......hHHHHH', '.....hHHHHHH', '.....hHHHHHH', '.....hHHHHHH',
  '.....hHHHHHH', '......hhHHHH', '......hhhHHH', '......hhHHHH', ...ROBE_UP,
];
export const COWL: Body = { w: 24, down: { rows: COWL_DOWN }, up: { rows: COWL_UP }, reg: robeReg(12) };
