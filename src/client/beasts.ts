/**
 * What the goblins are at past the trees in the wood (vignettes.ts), drawn in code like everything
 * else (sprites.ts): a deer, standing, running and down; one of the baggage train's oxen, dead on its
 * side and opened; the spit over their fire with something turning on it, and the boots they took
 * off the dead piled by it. Paint only.
 */
import { blit, shadow, type Ctx } from './draw';
import { makeSprite } from './sprites';

const HIDE = '#8a5a32', DARK = '#6a4426', LEG = '#4a3020', PALE = '#c8a878', RED = '#7a1010', BONE = '#e0d6c0';
const deerTop: Parameters<typeof makeSprite>[2] = [
  ['e', 8, 7, 5.5, 2.6, HIDE], ['r', 4, 8, 8, 1, PALE], ['r', 11, 3, 2, 4, HIDE], ['e', 13.5, 2.6, 2, 1.4, DARK],
  ['p', 15, 3, '#1a1410'], ['p', 13, 2, '#141218'], ['p', 12, 0, DARK], ['p', 12, 1, DARK], ['r', 2, 5, 2, 2, '#e8e0d0'],
];
const DEER = {
  stand: makeSprite(16, 13, [['r', 4, 8, 1, 5, LEG], ['r', 6, 8, 1, 5, LEG], ['r', 10, 8, 1, 5, LEG], ['r', 12, 8, 1, 5, LEG], ...deerTop]),
  run: makeSprite(17, 13, [['r', 1, 9, 3, 1, LEG], ['r', 2, 10, 2, 2, LEG], ['r', 4, 9, 2, 3, LEG], ['r', 12, 9, 2, 3, LEG], ['r', 13, 9, 3, 1, LEG], ['r', 15, 10, 1, 2, LEG], ...deerTop]),
  down: makeSprite(19, 8, [
    ['r', 4, 5, 5, 1, LEG], ['r', 3, 6, 6, 1, LEG], ['r', 11, 5, 6, 1, LEG], ['r', 12, 6, 6, 1, LEG],
    ['e', 10, 3.5, 6, 2.4, HIDE], ['r', 6, 2, 8, 1, DARK], ['e', 2.4, 3.5, 2, 1.3, DARK], ['p', 1, 4, '#1a1410'], ['r', 8, 5, 4, 1, RED], ['p', 9, 4, RED],
  ]),
};
/** An ox on its side, opened along the belly: the ribs showing, what came out of it. */
const OX = makeSprite(30, 11, [
  ['r', 7, 9, 4, 1, '#2a1a12'], ['r', 18, 9, 4, 1, '#2a1a12'], ['e', 14, 5.5, 10, 3.6, '#4a3022'], ['r', 6, 2, 15, 1, '#3a2418'],
  ['e', 26, 5.5, 3, 2.2, '#3e2a1e'], ['r', 25, 2, 1, 2, '#d8d0b0'], ['r', 27, 2, 2, 1, '#d8d0b0'], ['p', 28, 6, '#1a1410'],
  ['e', 13, 7.4, 6, 1.8, '#4a0c0c'], ['r', 9, 6, 1, 3, '#b8a890'], ['r', 12, 6, 1, 3, '#b8a890'], ['r', 15, 6, 1, 3, '#b8a890'], ['r', 10, 7, 2, 1, RED], ['r', 13, 7, 2, 1, RED],
  ['r', 8, 9, 6, 1, '#6a2020'], ['r', 10, 10, 5, 1, '#5a1616'],
]);
/** Two forked sticks and a green pole, and on it a goat or a sheep, skinned, black where it's caught. */
const SPIT = makeSprite(26, 14, [
  ['r', 2, 5, 1, 9, '#4a3420'], ['p', 1, 4, '#4a3420'], ['p', 3, 4, '#4a3420'], ['r', 23, 5, 1, 9, '#4a3420'], ['p', 22, 4, '#4a3420'], ['p', 24, 4, '#4a3420'],
  ['r', 1, 5, 24, 1, '#6b4a2b'], ['e', 13, 6.4, 7, 2.6, '#7a3a2a'], ['r', 7, 4, 12, 1, '#2a120c'], ['r', 9, 8, 8, 1, '#5a2418'],
  ['r', 4, 5, 3, 2, '#6a3020'], ['r', 19, 5, 3, 2, '#6a3020'], ['p', 21, 7, '#1a1410'], ['r', 10, 6, 1, 2, '#3a140c'], ['r', 14, 6, 1, 2, '#3a140c'], ['p', 16, 7, '#3a140c'],
]);
/** The boots they've had off the dead, in a heap. */
const BOOTS = makeSprite(12, 6, [
  ['r', 1, 3, 3, 3, '#3a2a1a'], ['r', 1, 5, 5, 1, '#2a1e14'], ['r', 6, 1, 3, 4, '#4a3420'], ['r', 6, 4, 5, 1, '#2a1e14'], ['r', 3, 1, 2, 3, '#5a3d22'], ['r', 9, 3, 2, 3, '#3a2a1a'],
]);

export type DeerPose = 'stand' | 'run' | 'down';
export function drawDeer(c: Ctx, pose: DeerPose, x: number, y: number, left: boolean, now: number): void {
  shadow(c, x, y, pose === 'down' ? 8 : 6);
  // Running: the two leg frames in turn.
  const s = pose === 'run' && Math.floor(now * 10) % 2 ? DEER.stand : DEER[pose];
  blit(c, s, x, y + (pose === 'run' ? -(Math.floor(now * 10) % 2) : 0), left);
}

export function drawOx(c: Ctx, x: number, y: number): void {
  shadow(c, x, y, 12);
  blit(c, OX, x, y + 2, true);
}

/** The fire under the spit, flickering; the spit turned now and then; smoke going up; the boots by it. */
export function drawSpit(c: Ctx, x: number, y: number, now: number): void {
  blit(c, BOOTS, x + 18, y + 3);
  c.lit.fillStyle = '#1e1410';
  c.lit.fillRect(Math.round(x - 6), Math.round(y - 2), 12, 3);
  for (let i = 0; i < 5; i++) {
    const h = 2 + ((Math.floor(now * 9) + i * 3) % 4);
    c.glow.fillStyle = i % 2 ? '#ff6a20' : '#ffb44c';
    c.glow.fillRect(Math.round(x - 5 + i * 2.4), Math.round(y - 1 - h), 2, h);
  }
  // A quarter turn every couple of seconds: the other side down to the heat.
  blit(c, SPIT, x, y + 1, Math.floor(now / 2.2) % 2 === 1);
  for (let i = 0; i < 4; i++) {
    const p = (now * 0.3 + i / 4) % 1;
    c.lit.globalAlpha = (1 - p) * 0.35;
    c.lit.fillStyle = '#5a5458';
    c.lit.fillRect(Math.round(x - 2 + Math.sin(p * 5 + i) * 3 + p * 5), Math.round(y - 14 - p * 30), 2 + Math.round(p * 3), 2);
    c.lit.globalAlpha = 1;
  }
}
