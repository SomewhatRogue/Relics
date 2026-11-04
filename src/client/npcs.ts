/**
 * The people of Wickhold (and those you bring home): placeholder sprites in the same style as the
 * heroes, each trade with its own colours and hat, and a gold mark over anyone you can talk to.
 */
import type { Npc } from '../shared/arena';
import { blit, shadow, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import { makeSprite, type Sprite } from './sprites';
import { drawWork } from './siegedraw';

type Part = Parameters<typeof makeSprite>[2][number];
export interface Look { body: string; trim: string; skin: string; hair: Part[]; apron?: string }

const SKIN = '#c79c78', DARK = '#a07a5a';
export const LOOKS: Record<string, Look> = {
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
  // Hew: soot to the elbows, a white beard, a leather apron.
  burner: { body: '#2a2622', trim: '#4a3a2a', skin: DARK, apron: '#5a3d22', hair: [['r', 4, 1, 4, 1, '#e8e4ee'], ['r', 4, 5, 4, 2, '#e8e4ee'], ['r', 3, 0, 6, 1, '#3a3020']] },
  elder: { body: '#4a4652', trim: '#6a6470', skin: SKIN, hair: [['r', 4, 1, 4, 1, '#d8d4de'], ['r', 4, 5, 4, 2, '#d8d4de']] },
  // The column's dead on the Greyhollow field: mail and a steel cap, or a leather jerkin.
  soldier: { body: '#4a5262', trim: '#8a8f9a', skin: SKIN, hair: [['r', 3, 0, 6, 3, '#7a808c']] },
  soldier2: { body: '#5a4632', trim: '#3a2a1a', skin: SKIN, hair: [['r', 4, 1, 4, 1, '#5a3d22']] },
  guard: { body: '#7a1d1d', trim: '#d4a537', skin: SKIN, hair: [['r', 3, 0, 6, 3, '#9aa3ad'], ['r', 4, 3, 4, 1, '#6a6470']] },
  bard: { body: '#2f6a5a', trim: '#d8c48a', skin: SKIN, hair: [['r', 3, 0, 7, 2, '#7a2a6a'], ['p', 9, 0, '#d8d0bc']] },
  ranger: { body: '#3f6b3a', trim: '#8b6a3a', skin: DARK, hair: [['r', 3, 0, 6, 3, '#3f5a32']] },
  rogue: { body: '#3a3346', trim: '#5a3d22', skin: SKIN, hair: [['r', 3, 0, 6, 3, '#2a2630'], ['r', 4, 5, 4, 1, '#141218']] },
  // Magister Vell: a deep blue robe, silver trim, a tall hat gone soft at the point.
  mage: { body: '#2a2a5a', trim: '#b8b4c8', skin: SKIN, hair: [['r', 2, 1, 8, 1, '#1e1e44'], ['r', 3, -1, 6, 2, '#2a2a5a'], ['r', 4, -3, 4, 2, '#2a2a5a'], ['r', 5, -5, 3, 2, '#2a2a5a'], ['p', 8, -5, '#2a2a5a'], ['r', 4, 5, 4, 3, '#d8d4de']] },
  // The gravedigger: earth-coloured smock, a cap pulled down.
  digger: { body: '#3e3628', trim: '#2a2018', skin: DARK, hair: [['r', 3, 0, 6, 2, '#2e2a24'], ['r', 2, 2, 8, 1, '#2e2a24']] },
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
  // A tall hat reaches above the head: grow the sprite upward to fit it.
  const lift = Math.max(0, ...parts.map((q) => -(q[2] as number)));
  return makeSprite(12, 16 + lift, parts.map((q) => q.map((v, i) => (i === 2 ? (v as number) + lift : v)) as Part));
}

const SPRITES: Record<string, Sprite> = {};
for (const [k, l] of Object.entries(LOOKS)) SPRITES[k] = person(l);
SPRITES.child = makeSprite(9, 11, [
  ['r', 2, 8, 2, 3, '#3a3036'], ['r', 5, 8, 2, 3, '#3a3036'], ['r', 1, 4, 7, 5, '#6a7a4a'], ['e', 4.5, 2.5, 2.6, 2.6, SKIN],
  ['p', 3, 3, '#141218'], ['p', 5, 3, '#141218'], ['r', 3, 0, 4, 1, '#8a5a2a'],
]);

/** Someone's sprite by their look (the soldier past the trees in the wood is drawn from it: vigshots.ts). */
export const personSprite = (look: string): Sprite => SPRITES[look] ?? SPRITES.villager;

/** Someone standing about, breathing; a gold mark overhead says you can talk to them, their name when you're close. */
/** One of the column's dead: on their back or side, in what they bled. */
function drawCorpse(c: Ctx, s: Sprite, x: number, y: number, n: Npc): void {
  const k = Math.round(n.x * 7 + n.y * 3), side = k % 2 ? 1 : -1, g = c.lit;
  g.fillStyle = '#5a0c0c';
  for (let i = 0; i < 14; i++) g.fillRect(Math.round(x - 7 + ((k * (i + 3)) % 13)), Math.round(y - 3 + ((k + i * 5) % 5)), 2, 1);
  g.fillStyle = '#7a1010';
  g.fillRect(Math.round(x - 3), Math.round(y - 1), 5, 2);
  for (const t of [c.lit, c.glow]) t.save(), t.translate(Math.round(x), Math.round(y - 3)), t.rotate((side * Math.PI) / 2 + (k % 5) * 0.06);
  blit(c, s, 0, s.h / 2, false);
  for (const t of [c.lit, c.glow]) t.restore();
  // Now and then an arrow still in them.
  if (k % 3 === 0) (g.fillStyle = '#6b4a2b'), g.fillRect(Math.round(x + 1), Math.round(y - 9), 1, 6), (g.fillStyle = '#d8d0bc'), g.fillRect(Math.round(x), Math.round(y - 10), 3, 1);
}

/** Hew after the bite: still held up without his head, or thrown down on his side. */
function drawDead(c: Ctx, s: Sprite, x: number, y: number, n: Npc): void {
  const neck = 7, both = [c.lit, c.glow];
  for (const g of both) {
    g.save();
    g.translate(Math.round(x), Math.round(y - (n.lift ?? 0)));
    if (n.pose === 'body') g.rotate(-Math.PI / 2), g.translate(0, 3);
    g.beginPath();
    g.rect(-20, -s.h + neck, 40, s.h);
    g.clip();
  }
  blit(c, s, 0, 0, false);
  for (const g of both) g.restore();
  // Where the head was.
  c.lit.fillStyle = '#7a1010';
  if (n.pose === 'body') c.lit.fillRect(Math.round(x - s.h + neck - 2), Math.round(y - 3), 3, 3), c.lit.fillRect(Math.round(x - s.h + neck - 6), Math.round(y - 1), 6, 2);
  else c.lit.fillRect(Math.round(x - 2), Math.round(y - (n.lift ?? 0) - s.h + neck - 1), 4, 2);
}

export function drawNpc(c: Ctx, n: Npc, x: number, y: number, near: boolean, fx = 0, walking = false, tx = n.x): void {
  const s = SPRITES[n.look] ?? SPRITES.villager;
  walking ||= !!n.walking;
  // The gravedigger stops walking while he digs.
  if ((n.work === 'bury' || n.work === 'dig') && tx < 5) walking = false;
  const bob = n.pose ? 0 : Math.floor(c.now * (walking ? (n.sneak ? 4 : 7) : 1.5) + n.x) % 2 ? -1 : 0;
  shadow(c, x, y, 5);
  if (n.pose === 'corpse') return drawCorpse(c, s, x, y, n);
  if (n.pose) return drawDead(c, s, x, y, n);
  blit(c, s, x, y - (n.lift ?? 0) + bob, walking ? fx < 0 : Math.floor(c.now * 0.25 + n.y) % 2 === 0, 0, n.sneak ? 0.78 : 1);
  // A guard carries a spear upright.
  if (n.work) drawWork(c, n, x, y + bob, tx, fx);
  if (n.mute) return;
  if (n.look === 'guard') (c.lit.fillStyle = '#6b4a2b'), c.lit.fillRect(Math.round(x + (fx < 0 && walking ? -6 : 5)), Math.round(y - 22 + bob), 1, 20), (c.lit.fillStyle = '#cfd6dc'), c.lit.fillRect(Math.round(x + (fx < 0 && walking ? -6 : 5)), Math.round(y - 24 + bob), 1, 3);
  const top = Math.round(y - s.h - 4 + (Math.floor(c.now * 3) % 2));
  c.glow.fillStyle = near ? '#fff1b0' : '#d4a537';
  c.glow.fillRect(Math.round(x), top - 2, 1, 1);
  c.glow.fillRect(Math.round(x) - 1, top - 1, 3, 1);
  c.glow.fillRect(Math.round(x), top, 1, 1);
  if (near) drawText(c.glow, n.name, Math.round(x - textWidth(n.name) / 2), Math.round(y + 4), '#f0e0b0');
}
