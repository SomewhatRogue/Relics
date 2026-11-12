/**
 * Loot on the floor, drawn as things (Kyle, 2026-11-12: "dropped items, gold and potions, along with weapons
 * and weapon glint on the ground, like loot in general ... a better pass"): coins and a heap of them, a corked
 * bottle in its potion's colour, each weapon lying as itself with a glint running down its blade now and
 * then, a breastplate for armour, an amulet for a charm. Pixel maps through makeSprite (outlined and shaded),
 * a shadow under each. relicsdraw.ts says which and where; the tier's ring and light stay there.
 */
import { blit, shadow, type Ctx } from './draw';
import { makeSprite, type Part, type Sprite } from './sprites';

/** A pixel map to a sprite: '.' empty, a letter a colour from `pal`. */
function art(rows: string[], pal: Record<string, string>): Sprite {
  const parts: Part[] = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && parts.push(['p', x, y, pal[ch] ?? '#ff00ff'])));
  return makeSprite(Math.max(...rows.map((r) => r.length)), rows.length, parts);
}

const STEEL = { W: '#e8eef2', w: '#9aa6b2', c: '#b89a4a', o: '#d4a537', H: '#5a3d22' };
const WOOD = { H: '#8b6a3a', h: '#6b4a2b', K: '#6b4a2b', k: '#4a3420', s: '#d8d0bc', g: '#3a2a1a' };

/** Each weapon lying on the floor, and its blade's run for the glint (x from, x to, row), if it has one. */
const WEAPONS: Record<string, { s: Sprite; glint?: [number, number, number] }> = {
  sword: { s: art(['....c..........', 'oHHHcWWWWWWWWW.', '....cwwwwwwwwww', '....c..........'], STEEL), glint: [5, 13, 1] },
  greatsword: { s: art(['.....cc............', 'oHHHHccWWWWWWWWWWW.', 'oHHHHccwwwwwwwwwwww', '.....cc............'], STEEL), glint: [7, 17, 1] },
  spellblade: { s: art(['....c..........', 'oHHHcWWWWWWWWW.', '....cwwwwwwwwww', '....c..........'], { ...STEEL, W: '#d8e0f4', w: '#7a8ac8', c: '#8a7ab8' }), glint: [5, 13, 1] },
  spear: { s: art(['................ww..', 'HhHhHhHhHhHhHhHhWWWW', '................ww..'], { ...WOOD, W: '#e8eef2', w: '#9aa6b2' }), glint: [16, 19, 1] },
  daggers: { s: art(['.c........', 'HcWWWW....', '.c........', '....c.....', '...HcWWWW.', '....c.....'], STEEL), glint: [2, 5, 1] },
  longbow: { s: art(['..HHHHHHggHHHHHH..', '.H..............H.', 'HssssssssssssssssH'], WOOD) },
  shortbow: { s: art(['..HHHHggHHHH..', '.H..........H.', 'HssssssssssssH'], { ...WOOD, H: '#6b4a2b' }) },
  crossbow: { s: art(['..........H..', '..........H..', 'KKKKKKKKKKHWw', '..........H..', '..........H..'], { ...WOOD, H: '#5a3d22', W: '#e8eef2', w: '#9aa6b2' }) },
  wand: { s: art(['KKKKKKKKKe', 'kkkkkkkkk.'], { ...WOOD, e: '#c9a8ff' }) },
  staff: { s: art(['..................ee', 'KKKKKKKKKKKKKKKKKKKe', 'kkkkkkkkkkkkkkkkkk..'], { ...WOOD, e: '#c9a8ff' }) },
  mace: { s: art(['.........m..', '........MMM.', 'oHHHHHHHMMMM', '........MMM.', '.........m..'], { ...STEEL, M: '#9aa3ad', m: '#6a727c' }), glint: [8, 11, 1] },
};

const ARMOUR: Record<string, Sprite> = Object.fromEntries(
  ([['heavy', '#b4bcc6', '#6a727c'], ['medium', '#8a929c', '#5a6068'], ['light', '#7a5a34', '#4a3420']] as const).map(([k, A, a]) => [
    k, art(['.AA...AA.', 'AAAAAAAAA', 'AaAAAAAaA', '.AAAAAAA.', '.AAaAaAA.', '.AAAAAAA.', '.aaaaaaa.'], { A, a }),
  ]),
);

const COIN = art(['.yy.', 'yYYy', '.yy.'], { Y: '#ecc860', y: '#b08a3a' });
const HEAP = art(['....yY....', '..yYYyYy..', '.yYYyYYyy.', 'yYyYYyYYYy', 'YYyYYYyYyY', '.yyyyyyyy.'], { Y: '#ecc860', y: '#b08a3a' });

const bottles = new Map<string, Sprite>();
const bottle = (col: string) => {
  let s = bottles.get(col);
  if (!s) bottles.set(col, (s = art(['..kkk..', '...n...', '..nnn..', '.nLLLn.', 'nLLhLLn', 'nLLLLLn', 'nLLLLLn', '.nLLLn.', '..nnn..'], { k: '#8a6a3a', n: '#8a9aa8', L: col, h: '#ffffff' })));
  return s;
};
const charms = new Map<string, Sprite>();
const charm = (col: string) => {
  let s = charms.get(col);
  if (!s) charms.set(col, (s = art(['c...c', '.c.c.', '..c..', '.ggg.', '.gGg.', '..g..'], { c: '#b89a4a', g: '#d4a537', G: col })));
  return s;
};

/** Gold: a coin or three for a little, a heap for a lot, and glints winking over it. */
export function drawGold(c: Ctx, gold: number, x: number, y: number, id: number): void {
  shadow(c, x, y, gold >= 18 ? 6 : 4);
  if (gold >= 18) blit(c, HEAP, x, y + 1);
  else for (let i = 0, n = Math.min(3, 2 + Math.floor(gold / 9)); i < n; i++) blit(c, COIN, x - 3 + i * 3, y + 1 - (i % 2));
  const f = Math.floor(c.now * 3 + id) % 5;
  if (f < 2) (c.glow.fillStyle = f ? '#fff1d0' : '#ffffff'), c.glow.fillRect(Math.round(x - 2 + ((id * 3 + Math.floor(c.now)) % 5)), Math.round(y - 3 - (f % 2)), 1, 1);
}

/** A potion: a corked bottle in its colour, the light inside it breathing. */
export function drawBottle(c: Ctx, col: string, x: number, y: number, id: number): void {
  shadow(c, x, y, 3);
  blit(c, bottle(col), x, y + 1);
  c.glow.globalAlpha *= 0.6 + 0.4 * Math.sin(c.now * 3 + id);
  c.glow.fillStyle = col;
  c.glow.fillRect(Math.round(x - 1), Math.round(y - 5), 3, 2);
  c.glow.globalAlpha = 1;
}

/** Gear lying on the floor: the weapon itself (a glint down its blade every few seconds), a breastplate, or an amulet in its tier's colour. */
export function drawGear(c: Ctx, kind: string, kit: string | undefined, armor: string | undefined, tierCol: string, x: number, y: number, id: number, alpha: number): void {
  shadow(c, x, y, 6);
  if (kind === 'weapon') {
    const w = WEAPONS[kit ?? 'sword'] ?? WEAPONS.sword;
    blit(c, w.s, x, y + 1);
    // The glint: once every few seconds a bright pixel runs down the blade.
    const t = (c.now * 0.45 + id * 0.37) % 1;
    if (w.glint && t < 0.25) {
      const [a, b, row] = w.glint, k = t / 0.25, left = Math.round(x - w.s.w / 2) + 1, top = y + 1 - w.s.h + 1;
      c.glow.globalAlpha = alpha;
      c.glow.fillStyle = '#ffffff';
      c.glow.fillRect(Math.round(left + a + (b - a) * k), top + row, 1, 1);
      c.glow.globalAlpha = alpha * 0.5;
      c.glow.fillRect(Math.round(left + a + (b - a) * k) - 1, top + row, 1, 1);
    }
  } else if (kind === 'armor') blit(c, ARMOUR[armor ?? 'medium'] ?? ARMOUR.medium, x, y + 1);
  else {
    blit(c, charm(tierCol), x, y + 1);
    c.glow.fillStyle = tierCol;
    c.glow.fillRect(Math.round(x), Math.round(y - 2), 1, 1);
  }
}
