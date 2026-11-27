/**
 * Trees knocked down (Kyle, 2026-11-19: "trees can be knocked down by bigger units like warrior and cleric";
 * "heavy is the right trigger. Falling tree should hurt everything. Felled trunks SHOULD burn").
 *
 * A Warrior's or a Cleric's charged heavy swing that reaches a small or middling tree fells it. It goes over away
 * from the blow, along the nearer of the four ways (the world is square-on, and so is a trunk on the ground), and
 * lands `FELL.fall` seconds later. Where it will lie is shown for that time. When it lands it hurts and throws
 * everything under it, goblins and heroes alike, whoever felled it included. Then it lies there: a wooden block
 * like any other, cover that stops a shot and a body, that can be chopped up and that burns. Its stump stays.
 *
 * What the room holds: the trunk is a `log` block from the blow on (`lands`: when it comes down; in the air till then,
 * nothing bumps into it), which is sent to friends as every block is; `stump` on it names the round that was the
 * tree, which the room turns into a stump at once and a friend's screen turns when it sees the block
 * (client/felled.ts). Big old trees (over `FELL.r`) stand.
 */
import { currentMap, inArea, type Block, type GameMap, type Round } from '../shared/arena';
import { FELL, WEAPONS, type Swing } from '../shared/tuning';
import { downIfDead, inArc } from './combat';
import { damage, isDead } from './damage';
import { count } from './score';
import type { Enemy, FightEvent, Hero } from './types';

// (Pines too since 2026-11-27, Kyle: "pine trees are really cool but can't be cut down by a heavy blow of the warrior, which is lame".)
const FELLABLE = new Set<Round['kind']>(['tree', 'deadtree', 'apple', 'pine']);
const FELLERS = new Set(['WARRIOR', 'HEALER']);
/** The four ways a tree falls: east, south, west, north. */
export const WAYS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

/** Can this round be felled at all (its kind and size)? */
export const fellable = (t: Round) => FELLABLE.has(t.kind) && t.r <= FELL.r;

/** Where a tree at `t` lies if it goes over the `way`: from just past its stump, its length by its width. */
export function trunkRect(m: GameMap, t: Round, way: number): { x: number; y: number; w: number; h: number } {
  const [dx, dy] = WAYS[way], len = FELL.long + t.r * FELL.grow, off = 0.35, wd = FELL.wide;
  const x0 = dx > 0 ? t.x + off : dx < 0 ? t.x - off - len : t.x - wd / 2, y0 = dy > 0 ? t.y + off : dy < 0 ? t.y - off - len : t.y - wd / 2;
  const x = Math.max(0.2, x0), y = Math.max(0.2, y0), q = (v: number) => Math.round(v * 100) / 100;
  return { x: q(x), y: q(y), w: q(Math.min(m.w - 0.2, x0 + (dx ? len : wd)) - x), h: q(Math.min(m.h - 0.2, y0 + (dy ? len : wd)) - y) };
}

/** A heavy swing of the right kind that reaches a tree fells it: one tree a swing. */
export function sweepTrees(h: Hero, s: Swing, now: number, ev: FightEvent[]): void {
  if (!h.heavy || !FELLERS.has(WEAPONS[h.weapon].cls)) return;
  const m = currentMap();
  for (let i = 0; i < m.rounds.length; i++) {
    const t = m.rounds[i];
    if (!fellable(t)) continue;
    const d = Math.hypot(t.x - h.x, t.y - h.y) || 1, in0 = Math.min(t.r, 0.3);
    if (!inArc(h.x, h.y, h.fx, h.fy, t.x - ((t.x - h.x) / d) * in0, t.y - ((t.y - h.y) / d) * in0, s.range, s.arc, 0.05)) continue;
    return void fell(m, i, t.x - h.x, t.y - h.y, now, ev);
  }
}

/** Fell round `i` away from a blow that came along (dx, dy). */
export function fell(m: GameMap, i: number, dx: number, dy: number, now: number, ev: FightEvent[]): Block | null {
  const t = m.rounds[i];
  if (!t || !fellable(t)) return null;
  const way = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 0 : 2) : dy >= 0 ? 1 : 3, q = trunkRect(m, t, way);
  if (q.w < 0.4 || q.h < 0.4) return null;
  // What kind of tree it was, for its crown on the ground: 0 a tree, 1 a willow, 2 a dead one, 3 an apple. And
  // which end the crown is: the far one from the stump.
  const wood = t.kind === 'deadtree' ? 2 : t.kind === 'apple' ? 3 : t.look === 1 ? 1 : 0, far = way === 2 || way === 3 ? 1 : 0;
  // (And how big, in three steps, as the drawing sizes a tree: client/flora.ts.)
  const size = t.r < 0.4 ? 0 : t.r < 0.65 ? 1 : 2;
  const b: Block = { kind: 'log', ...q, soft: true, hp: FELL.hp, maxHp: FELL.hp, burning: -1, look: 10 + far + wood * 2 + size * 8, lands: now + FELL.fall, stump: i };
  ev.push({ k: 'timber', x: t.x, y: t.y, way, wood, r: t.r });
  Object.assign(t, { kind: 'stump', r: 0.3, look: undefined });
  m.blocks.push(b);
  return b;
}

const under = (b: Block, o: { x: number; y: number }, r: number) => inArea({ x: b.x - r, y: b.y - r, w: b.w + r * 2, h: b.h + r * 2 }, o.x, o.y);

/** Once a tick: a trunk whose time has come lands on whatever is under it, and lies there from then on. */
export function stepFelling(m: GameMap, now: number, enemies: Enemy[], heroes: Hero[], ev: FightEvent[]): void {
  for (const b of m.blocks) {
    if (b.lands === undefined || now < b.lands) continue;
    const along = b.w >= b.h, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    // Thrown out sideways from under it, whichever side they are nearer.
    const out = (o: { x: number; y: number }): [number, number] => (along ? [0, o.y >= cy ? 1 : -1] : [o.x >= cx ? 1 : -1, 0]);
    for (const e of enemies) {
      if (isDead(e) || !under(b, e, e.radius)) continue;
      const [ox, oy] = out(e);
      damage(e, FELL.dmg, now, ev, { heavy: true, dx: ox, dy: oy, how: 'fall' });
    }
    for (const h of heroes) {
      // A roll gets out from under it, as from any blow.
      if (h.act === 'down' || h.act === 'roll' || h.out || h.safeT || !under(b, h, 0.35)) continue;
      const [ox, oy] = out(h);
      h.hp -= FELL.hero;
      count(h.id, 'taken', FELL.hero);
      ev.push({ k: 'hit', x: h.x, y: h.y, n: FELL.hero, heavy: true, on: 'hero', src: 'tree' });
      (h.kvx += ox * FELL.knock), (h.kvy += oy * FELL.knock);
      downIfDead(h, ev);
    }
    (b.lands = undefined), (b.soft = undefined);
    ev.push({ k: 'collapse', x: b.x, y: b.y, w: b.w, h: b.h });
  }
}
