/**
 * An old job's goblins (before set pieces, shared/vignettes.ts): a band or two at their fires, and
 * often a heap of the dead with some at it. Kept exactly as it was so an old saved job's rooms come out
 * the same.
 */
import type { Npc } from './arena.js';
import type { Lay } from './vignettes.js';

export function oldBands(l: Lay): { x: number; y: number }[] {
  const { rng, W, H, n } = l;
  const fires = [l.spot(0.35, 3, H - 7), l.spot(0.35, 3, H / 2)].filter(Boolean) as { x: number; y: number }[];
  l.braziers.push(...fires.map((f) => ({ ...f, r: 0.35, wild: true })));
  for (let i = 0; i < n; i++) {
    const f = fires[i % Math.max(1, fires.length)];
    let c: { x: number; y: number } | null = null;
    for (let t = 0; f && t < 12 && !c; t++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(1, 2.4), x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d;
      if (x > 1 && x < W - 1 && y > 1.5 && y < H - 4 && l.free(x, y, 0.4)) (c = { x, y }), l.claim(x, y, 0.4);
    }
    c ??= l.spot(0.4, 1.5, H - 6);
    if (c) l.foes.push({ kind: 'scrapper', ...c });
  }
  // Often: a heap of the dead and goblins at it, too busy eating to look up till you're close.
  if (rng.next() < 0.6) {
    const c = l.spot(1.1, 3, H - 6);
    if (c) {
      const look = ({ village: 'villager', farm: 'farmer', field: 'farmer', forest: 'soldier', mine: 'villager' } as Record<string, string>)[l.kind] ?? 'villager';
      const dead: Npc[] = l.dead;
      dead.push({ x: c.x, y: c.y, name: '', talk: 'dead', look, pose: 'corpse' });
      if (rng.next() < 0.6) dead.push({ x: c.x + 0.6, y: c.y - 0.35, name: '', talk: 'dead', look: look === 'farmer' ? 'villager' : 'soldier2', pose: 'corpse' });
      const k = 1 + Math.floor(rng.next() * 3);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + rng.range(-0.4, 0.4);
        l.foes.push({ kind: 'scrapper', x: c.x + Math.cos(a) * 0.9, y: c.y + Math.sin(a) * 0.55, feeding: true });
      }
    }
  }
  return fires;
}
