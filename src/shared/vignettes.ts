/**
 * A routed room's set piece (docs/terrain-nodes.md 4, slice 1b): one little scene a room, never the
 * same twice in a job, made only of what the goblins already know how to do (rest at a fire, eat at
 * the dead, lie asleep) and pieces that already exist. Where it goes is the room's own roll, so the
 * same heart holds it somewhere else next time. Returns the fires (a butcher stands at the first).
 */
import type { Block, Circle, Grim, Mark, Npc, Round } from './arena.js';
import type { PlaceKind } from './jobs.js';
import type { Piece } from './nodes.js';
import type { PropKind } from './props.js';
import type { River } from './river.js';
import type { Rng } from './rng.js';
import { wooden } from './sitekit.js';
import { along, type Pt } from './spine.js';
import type { Foe } from './terrain.js';

type P = { x: number; y: number };
/** What a set piece is laid with: the room's stream and its free-spot finder, and where it puts things. */
export interface Lay {
  rng: Rng; W: number; H: number; kind: PlaceKind; n: number;
  spot(r: number, y0?: number, y1?: number): P | null;
  free(x: number, y: number, r: number): boolean;
  claim(x: number, y: number, r: number): void;
  foes: Foe[]; dead: Npc[]; braziers: (Circle & { wild?: boolean })[]; props: { kind: PropKind; x: number; y: number }[];
  blocks: Block[]; rounds: Round[]; marks: Mark[]; grim: Grim[]; sleepers: P[];
  spine?: Pt[][]; river?: River;
}

/** `k` goblins round a point, at rest, `d0` to `d1` from it. */
export function band(l: Lay, at: P, k: number, d0 = 1, d1 = 2.4, more: Partial<Foe> = {}): void {
  for (let i = 0; i < k; i++) {
    let c: P | null = null;
    for (let t = 0; t < 14 && !c; t++) {
      const a = l.rng.range(0, Math.PI * 2), d = l.rng.range(d0, d1), x = at.x + Math.cos(a) * d, y = at.y + Math.sin(a) * d;
      if (x > 1 && x < l.W - 1 && y > 1.5 && y < l.H - 4 && l.free(x, y, 0.4)) (c = { x, y }), l.claim(x, y, 0.4);
    }
    c ??= l.spot(0.4, 1.5, l.H - 6);
    if (c) l.foes.push({ kind: 'scrapper', ...c, ...more });
  }
}

/** A wild fire the goblins burn whatever the hour. */
function fire(l: Lay, y0 = 3, y1 = l.H - 7): P | null {
  const f = l.spot(0.35, y0, y1);
  if (f) l.braziers.push({ ...f, r: 0.35, wild: true });
  return f;
}

/** The dead: a body or two (whoever lived here; soldiers in the wood), and `k` of them eating. */
function bodies(l: Lay, at: P, k: number, look?: string): void {
  const who = look ?? ({ village: 'villager', farm: 'farmer', field: 'farmer', forest: 'soldier', mine: 'villager' } as Record<string, string>)[l.kind] ?? 'villager';
  l.dead.push({ x: at.x, y: at.y, name: '', talk: 'dead', look: who, pose: 'corpse' });
  if (l.rng.next() < 0.6) l.dead.push({ x: at.x + 0.6, y: at.y - 0.35, name: '', talk: 'dead', look: who === 'farmer' ? 'villager' : 'soldier2', pose: 'corpse' });
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 + l.rng.range(-0.4, 0.4);
    l.foes.push({ kind: 'scrapper', x: at.x + Math.cos(a) * 0.9, y: at.y + Math.sin(a) * 0.55, feeding: true });
  }
}

export function setPiece(l: Lay, piece: Piece): P[] {
  const { rng, n } = l;
  if (piece === 'fire') {
    // At the fire: a band round each of two fires, at rest till they see you.
    const fires = [fire(l), fire(l, 3, l.H / 2)].filter(Boolean) as P[];
    for (let i = 0; i < n; i++) band(l, fires[i % Math.max(1, fires.length)] ?? { x: l.W / 2, y: 8 }, 1);
    return fires;
  }
  if (piece === 'dead') {
    // At the dead: a heap of them and three bent over it, slow to look up; the rest at their fire.
    const f = fire(l), c = l.spot(1.1, 3, l.H - 6), k = Math.min(3, Math.max(2, n - 2));
    if (c) bodies(l, c, k), l.marks.push({ kind: 'blood', x: c.x - 0.9, y: c.y - 0.1, w: 1.8, h: 0.9 });
    if (f) band(l, f, n - (c ? k : 0));
    return f ? [f] : [];
  }
  if (piece === 'feast') {
    // The feast: one long fire, the pot on it, bones heaped by it, the whole band round it.
    const f = l.spot(1.2, 3.5, l.H - 8);
    if (!f) return setPiece(l, 'fire');
    l.braziers.push({ x: f.x - 0.5, y: f.y, r: 0.35, wild: true }, { x: f.x + 0.5, y: f.y, r: 0.35, wild: true });
    l.grim.push({ kind: 'pot', x: f.x, y: f.y + 0.1, k: rng.int(4) }, { kind: 'bones', x: f.x + 1.5, y: f.y + 0.9, k: rng.int(4) });
    band(l, f, n, 1.5, 2.8);
    return [f];
  }
  if (piece === 'asleep') {
    // Asleep: curled up round a fire burned down to ash, hay pulled about them; one band still up at another.
    const c = l.spot(1.6, 3, l.H - 6), f = fire(l), k = Math.min(n, 2 + rng.int(2));
    if (c) {
      l.marks.push({ kind: 'scorch', x: c.x - 0.6, y: c.y - 0.4, w: 1.2, h: 0.8 });
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + rng.range(-0.3, 0.3), x = c.x + Math.cos(a) * 1.2, y = c.y + Math.sin(a) * 0.9;
        l.foes.push({ kind: 'scrapper', x, y, feeding: true }), l.sleepers.push({ x, y });
      }
      if (l.kind !== 'mine') l.rounds.push({ kind: 'hay', x: c.x + 1.9, y: c.y - 0.9, r: 0.4 });
    }
    if (f) band(l, f, n - (c ? k : 0));
    return f ? [f] : [];
  }
  if (piece === 'cart' || piece === 'wreck') {
    // Looting a cart: its crates broken open, goblins at it. The wrecked cart: on its side, burned
    // or not, its oil barrels about it (a fire trap), and the band at their fire beyond.
    const c = l.spot(1.9, 4, l.H - 6);
    if (c) {
      l.blocks.push(wooden({ kind: 'cart', x: c.x - 1.4, y: c.y - 0.6, w: 2.8, h: 1.2, ...(piece === 'wreck' ? { worn: true } : {}) }));
      l.marks.push({ kind: 'debris', x: c.x - 1.8, y: c.y + 0.5, w: 3.6, h: 1.1 });
      if (piece === 'wreck') l.marks.push({ kind: 'scorch', x: c.x - 1.2, y: c.y - 0.2, w: 2.4, h: 1.2 });
      const kinds: PropKind[] = piece === 'wreck' ? ['oil', 'oil', 'barrel'] : ['crate', 'crate', 'barrel'];
      kinds.forEach((kind, i) => {
        const x = c.x - 1.6 + i * 1.6, y = c.y + 1.3;
        if (l.free(x, y, 0.4)) l.props.push({ kind, x, y }), l.claim(x, y, 0.45);
      });
    }
    const f = fire(l), at = piece === 'cart' && c ? Math.min(n, 3) : 0;
    if (c && at) band(l, c, at, 1.6, 2.6);
    if (f) band(l, f, n - at);
    return f ? [f] : c ? [c] : [];
  }
  if (piece === 'column') {
    // The column's dead: soldiers where they fell along the road, picked over, spent arrows about them.
    const f = fire(l), line = l.spine?.[0] ?? [[l.W / 2, l.H], [l.W / 2, 0]] as Pt[];
    const pts = along(line, 2.4).filter((p) => p.y > 5 && p.y < l.H - 6);
    let laid = 0, fed = 0;
    for (const p of pts) {
      if (laid >= 4) break;
      const x = p.x + (rng.next() < 0.5 ? -1.6 : 1.6) + rng.range(-0.3, 0.3), y = p.y + rng.range(-0.4, 0.4);
      if (!l.free(x, y, 0.6)) continue;
      l.claim(x, y, 0.7), laid++;
      l.dead.push({ x, y, name: '', talk: 'dead', look: laid % 2 ? 'soldier' : 'soldier2', pose: 'corpse' });
      l.marks.push({ kind: 'arrows', x: x - 0.8, y: y - 0.5, w: 1.6, h: 1 });
      if (fed < 2 && rng.next() < 0.6) l.foes.push({ kind: 'scrapper', x: x + 0.8, y: y + 0.3, feeding: true }), fed++;
    }
    if (f) band(l, f, n - fed);
    return f ? [f] : [];
  }
  // The broken bridge: their fire on the far bank (they know the way over; you'll have to find it).
  const r = l.river, f = r ? fire(l, 2.6, Math.max(3.4, r.y - 1.6)) : fire(l), near = r ? l.spot(0.35, r.y + r.h + 2, l.H - 6) : null;
  if (near) l.braziers.push({ ...near, r: 0.35, wild: true });
  const far = Math.ceil(n * 0.6);
  if (f) band(l, f, far);
  if (near) band(l, near, n - far);
  return [f, near].filter(Boolean) as P[];
}
