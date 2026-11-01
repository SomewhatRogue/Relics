/**
 * The people of Wickhold (and those you bring home): placeholder sprites in the same style as the
 * heroes, each trade with its own colours and hat, and a gold mark over anyone you can talk to.
 */
import type { Npc } from '../shared/arena';
import { blit, shadow, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import { makeSprite, type Sprite } from './sprites';

type Part = Parameters<typeof makeSprite>[2][number];
interface Look { body: string; trim: string; skin: string; hair: Part[]; apron?: string }

const SKIN = '#c79c78', DARK = '#a07a5a';
const LOOKS: Record<string, Look> = {
  smith: { body: '#4a3a30', trim: '#2a2018', skin: DARK, apron: '#5a3d22', hair: [['r', 4, 1, 4, 1, '#2a2018'], ['r', 4, 5, 4, 2, '#2a2018']] },
  wright: { body: '#3a4a6a', trim: '#c9a8ff', skin: SKIN, hair: [['r', 3, 0, 6, 2, '#4a3a6a'], ['p', 6, 6, '#9a8a7a']] },
  priest: { body: '#26222c', trim: '#d4a537', skin: SKIN, hair: [['r', 4, 1, 4, 1, '#8a8494']] },
  trainer: { body: '#6a2a2a', trim: '#9aa3ad', skin: DARK, hair: [['r', 4, 1, 4, 1, '#14121a'], ['r', 4, 5, 4, 1, '#14121a']] },
  squire: { body: '#2f5d9b', trim: '#d8d0bc', skin: SKIN, hair: [['r', 4, 1, 4, 2, '#8a6a3a']] },
  healer: { body: '#d8d0bc', trim: '#7a1d1d', skin: SKIN, hair: [['r', 3, 1, 6, 2, '#e8e0c8'], ['r', 3, 2, 1, 4, '#e8e0c8'], ['r', 8, 2, 1, 4, '#e8e0c8']] },
  reeve: { body: '#4a2f2f', trim: '#d4a537', skin: SKIN, hair: [['r', 3, 0, 6, 2, '#26222c'], ['r', 2, 2, 8, 1, '#26222c']] },
  trader: { body: '#8a5a2a', trim: '#d8c48a', skin: DARK, hair: [['r', 3, 1, 6, 2, '#7a2a6a'], ['p', 9, 3, '#7a2a6a']] },
  farmer: { body: '#6a5a3a', trim: '#3a2a1a', skin: SKIN, hair: [['r', 2, 1, 8, 1, '#c8b060'], ['r', 4, 0, 4, 1, '#c8b060']] },
  villager: { body: '#5a5a48', trim: '#3a3a2a', skin: SKIN, apron: '#8a8070', hair: [['r', 4, 1, 4, 1, '#5a3d22']] },
  elder: { body: '#4a4652', trim: '#6a6470', skin: SKIN, hair: [['r', 4, 1, 4, 1, '#d8d4de'], ['r', 4, 5, 4, 2, '#d8d4de']] },
  survivor: { body: '#7a6a58', trim: '#5a4a3a', skin: SKIN, hair: [['r', 4, 1, 4, 1, '#3a2a1a'], ['r', 3, 2, 6, 1, '#e8e0c8']] },
};

function person(l: Look): Sprite {
  const parts: Part[] = [
    ['r', 3, 11, 2, 5, '#3a3036'], ['r', 7, 11, 2, 5, '#3a3036'], ['r', 3, 15, 2, 1, '#1a1410'], ['r', 7, 15, 2, 1, '#1a1410'],
    ['r', 2, 6, 8, 7, l.body], ['r', 2, 6, 8, 1, l.trim], ['r', 1, 7, 2, 4, l.body], ['r', 9, 7, 2, 4, l.body],
    ['p', 1, 11, l.skin], ['p', 10, 11, l.skin],
  ];
  if (l.apron) parts.push(['r', 3, 8, 6, 5, l.apron]);
  parts.push(['e', 6, 3.5, 3.4, 3.4, l.skin], ['p', 5, 4, '#141218'], ['p', 7, 4, '#141218'], ...l.hair);
  return makeSprite(12, 16, parts);
}

const SPRITES: Record<string, Sprite> = {};
for (const [k, l] of Object.entries(LOOKS)) SPRITES[k] = person(l);
SPRITES.child = makeSprite(9, 11, [
  ['r', 2, 8, 2, 3, '#3a3036'], ['r', 5, 8, 2, 3, '#3a3036'], ['r', 1, 4, 7, 5, '#6a7a4a'], ['e', 4.5, 2.5, 2.6, 2.6, SKIN],
  ['p', 3, 3, '#141218'], ['p', 5, 3, '#141218'], ['r', 3, 0, 4, 1, '#8a5a2a'],
]);

/** Someone standing about, breathing; a gold mark overhead says you can talk to them, their name when you're close. */
export function drawNpc(c: Ctx, n: Npc, x: number, y: number, near: boolean): void {
  const s = SPRITES[n.look] ?? SPRITES.villager, bob = Math.floor(c.now * 1.5 + n.x) % 2 ? -1 : 0;
  shadow(c, x, y, 5);
  blit(c, s, x, y + bob, Math.floor(c.now * 0.25 + n.y) % 2 === 0);
  const top = Math.round(y - s.h - 4 + (Math.floor(c.now * 3) % 2));
  c.glow.fillStyle = near ? '#fff1b0' : '#d4a537';
  c.glow.fillRect(Math.round(x), top - 2, 1, 1);
  c.glow.fillRect(Math.round(x) - 1, top - 1, 3, 1);
  c.glow.fillRect(Math.round(x), top, 1, 1);
  if (near) drawText(c.glow, n.name, Math.round(x - textWidth(n.name) / 2), Math.round(y + 4), '#f0e0b0');
}
