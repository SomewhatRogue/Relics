/**
 * The things that say what a place was (shared/sites.ts): a wayside shrine with a candle stub, a stone
 * fountain gone green, a market cross on its steps, a washing line still pegged out, a scarecrow, a
 * cookfire's ring of stones with a few coals left, a charcoal clamp smoking under its turf, a stack of
 * cut peat. And a shack's scrap boards and sailcloth. Drawn at the foot, like the rest.
 */
import type { Block, Round } from '../shared/arena';
import { blit, type Ctx } from './draw';
import { makeSprite, type Sprite } from './sprites';

const S: Partial<Record<Round['kind'], Sprite>> = {
  shrine: makeSprite(10, 20, [['r', 4, 6, 2, 14, '#4a3420'], ['r', 1, 3, 8, 1, '#5a3d22'], ['r', 2, 4, 6, 6, '#3a2a1a'], ['r', 3, 5, 4, 4, '#14100c'], ['r', 4, 7, 2, 2, '#d8d0bc'], ['r', 0, 2, 10, 1, '#6a2a1a'], ['r', 2, 1, 6, 1, '#6a2a1a']]),
  fountain: makeSprite(22, 16, [['e', 11, 11, 10.5, 4.5, '#57525e'], ['e', 11, 10.5, 8.5, 3.2, '#2e4a4a'], ['e', 11, 10, 6, 2, '#3e5a5e'], ['r', 10, 2, 3, 9, '#6a6470'], ['r', 8, 2, 7, 2, '#6a6470'], ['p', 11, 1, '#8a8494'], ['r', 3, 13, 4, 1, '#3e4a36'], ['r', 15, 12, 3, 1, '#3e4a36']]),
  cross: makeSprite(14, 28, [['r', 1, 23, 12, 5, '#4a4652'], ['r', 3, 20, 8, 3, '#57525e'], ['r', 5, 18, 4, 2, '#6a6470'], ['r', 6, 2, 2, 16, '#6a6470'], ['r', 3, 5, 8, 2, '#6a6470'], ['p', 7, 1, '#8a8494'], ['r', 2, 26, 3, 1, '#3e4a36']]),
  scarecrow: makeSprite(14, 22, [['r', 6, 6, 2, 16, '#4a3420'], ['r', 1, 8, 12, 1, '#4a3420'], ['r', 4, 8, 6, 8, '#5a4a3a'], ['r', 1, 9, 2, 3, '#5a4a3a'], ['r', 11, 9, 2, 3, '#5a4a3a'], ['e', 7, 4, 2.6, 2.6, '#8a7448'], ['r', 3, 1, 8, 2, '#3a2a1a'], ['r', 5, 0, 4, 1, '#3a2a1a'], ['p', 6, 4, '#14100c'], ['p', 8, 4, '#14100c'], ['r', 4, 16, 2, 2, '#8a7448'], ['r', 8, 15, 2, 2, '#8a7448']]),
  cookfire: makeSprite(12, 6, [['e', 6, 3.5, 5.5, 2.5, '#2a2420'], ['p', 1, 3, '#57525e'], ['p', 3, 1, '#4a4652'], ['p', 8, 1, '#57525e'], ['p', 10, 3, '#4a4652'], ['p', 8, 5, '#57525e'], ['p', 3, 5, '#4a4652'], ['r', 4, 3, 4, 1, '#3a2a1a'], ['r', 5, 2, 2, 1, '#1a1410']]),
  clamp: makeSprite(28, 12, [['e', 14, 8, 13.5, 4.5, '#2a2420'], ['e', 14, 6.5, 11, 3.5, '#33302a'], ['e', 13, 5.5, 8, 2.5, '#2e3a22'], ['r', 6, 9, 3, 1, '#1a1410'], ['r', 19, 8, 3, 1, '#1a1410'], ['r', 13, 3, 2, 1, '#1a1410']]),
  peat: makeSprite(14, 12, [['r', 1, 4, 12, 8, '#2a2018'], ['r', 1, 4, 12, 1, '#3a2c20'], ['r', 1, 8, 12, 1, '#3a2c20'], ['r', 4, 1, 7, 3, '#2a2018'], ['r', 4, 1, 7, 1, '#3a2c20'], ['r', 6, 5, 1, 3, '#1a1410'], ['r', 9, 9, 1, 3, '#1a1410']]),
};

/** Draw one of a place's things; false if it isn't one. */
export function drawSite(c: Ctx, r: Round, x: number, y: number): boolean {
  if (r.kind === 'washline') return washline(c, r, x, y), true;
  const s = S[r.kind];
  if (!s) return false;
  blit(c, s, x, y + Math.round(r.r * 4));
  const t = c.now;
  if (r.kind === 'shrine' && Math.floor(t * 3 + x) % 4) (c.glow.fillStyle = '#ffd27a'), c.glow.fillRect(Math.round(x), Math.round(y + r.r * 4 - 13), 1, 1);
  if (r.kind === 'cookfire') for (let i = 0; i < 3; i++) if (Math.floor(t * 4 + i * 1.7 + x) % 3) (c.glow.fillStyle = i ? '#ff6a20' : '#ffb44c'), c.glow.fillRect(Math.round(x - 2 + i * 2), Math.round(y + r.r * 4 - 3), 1, 1);
  if (r.kind === 'clamp') for (let i = 0; i < 5; i++) {
    // Smoke seeping out of the turf.
    const p = (t * 0.25 + i / 5 + x * 0.01) % 1;
    c.lit.globalAlpha = (1 - p) * 0.4;
    c.lit.fillStyle = '#5a5458';
    c.lit.fillRect(Math.round(x - 6 + i * 3 + Math.sin(p * 4 + i) * 2 + p * 6), Math.round(y - 4 - p * 26), 2 + Math.round(p * 3), 2);
    c.lit.globalAlpha = 1;
  }
  return true;
}

/** Two posts and a sagging line between them, rags and shirts still pegged on it, stirring. */
function washline(c: Ctx, r: Round, x: number, y: number): void {
  const len = 30, g = c.lit;
  g.fillStyle = '#4a3420';
  g.fillRect(Math.round(x), Math.round(y - 16), 1, 16), g.fillRect(Math.round(x + len), Math.round(y - 16), 1, 16);
  const cols = ['#8a8070', '#6a5a48', '#7a6a8a', '#8a7a5a', '#5a6a7a'];
  for (let i = 0; i <= len; i++) {
    const sag = Math.round(Math.sin((i / len) * Math.PI) * 3);
    g.fillStyle = '#6b5a3a';
    g.fillRect(Math.round(x + i), Math.round(y - 15 + sag), 1, 1);
    if (i > 3 && i < len - 3 && i % 7 < 4) {
      const k = Math.floor(i / 7), stir = Math.round(Math.sin(c.now * 2 + k + x) * 0.6);
      g.fillStyle = cols[(k + Math.round(x)) % cols.length];
      g.fillRect(Math.round(x + i + stir), Math.round(y - 14 + sag), 1, 4 + (k % 2) * 2);
    }
  }
}

/** A shack: boards of every colour nailed up anyhow, a sailcloth roof patched and weighted with stones, a doorway with a hanging cloth. */
export function paintShack(rect: (x: number, y: number, w: number, h: number, c: string) => void, b: Block, w: number, roofH: number, tall: number): void {
  let seed = Math.round(b.x * 37 + b.y * 11) + 3;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  const cloth = ['#8a7a5a', '#7a6a58', '#6a6a5a', '#8a7060'][rnd(4)];
  rect(0, 0, w, roofH, cloth);
  for (let i = 0; i < 3; i++) rect(rnd(w - 6), rnd(roofH - 3), 5 + rnd(5), 3 + rnd(3), ['#6a5a48', '#9a8a6a', '#5a4a3a'][rnd(3)]);
  for (let x = 0; x < w; x += 5) rect(x, 0, 1, roofH, 'rgba(0,0,0,0.15)');
  for (let i = 0; i < 3; i++) rect(rnd(w - 2), rnd(roofH - 2), 2, 2, '#57525e');
  for (let x = 0; x < w; x += 2 + rnd(2)) rect(x, roofH, 3, tall, ['#4a3420', '#5a3d22', '#3a2a1a', '#6b4a2b', '#4a4044'][rnd(5)]);
  rect(0, roofH, w, 1, '#14121a');
  const dx = Math.round(w / 2 - 3);
  rect(dx, roofH + 3, 6, tall - 3, '#14100c'), rect(dx, roofH + 3, 6, Math.round((tall - 3) * 0.7), ['#6a5a48', '#5a4a6a', '#6a4a3a'][rnd(3)]);
}
