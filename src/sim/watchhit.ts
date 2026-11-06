/**
 * What an arrow does where it lands, side-on or upright alike: head x2, body x1, legs slow; a helmet
 * comes off at the first head hit; a shield splinters and breaks; a torch hit drops it and sets its
 * bearer alight. Each view says where a goblin stands and how things knocked loose fly (a `HitView`).
 */
import { BOW } from '../shared/watchtune';
import { scoreHit, scoreKill } from './watchscore';
import type { Arrow, At, Bit, Gob, Part, WatchState } from './watchtypes';

export type Loose = 'glance' | 'plank' | 'shed' | 'torch' | 'helmet' | 'drop';
export interface HitView {
  /** Where the goblin's feet are (the arrows stuck in it are kept from there). */
  feet(g: Gob): At;
  /** The angle an arrow is stuck at. */
  ang(a: Arrow): number;
  /** Something knocked loose at (x, y): a glanced arrow, the `i`th plank of a shield, an arrow shed with it, a torch, a helmet, a torch let fall. */
  bit(what: Loose, g: Gob, x: number, y: number, i: number, a?: Arrow): Omit<Bit, 't' | 'rest'>;
}

/** An arrow lands on a goblin's `part` at (x, y). */
export function land(s: WatchState, v: HitView, a: Arrow, g: Gob, part: Part, x: number, y: number): void {
  const f = v.feet(g), ang = v.ang(a), ev = { x, y, d: f.d, gob: g.id };
  const fly = (what: Loose, bx: number, by: number, i = 0) => s.bits.push({ ...v.bit(what, g, bx, by, i, a), t: s.t, rest: false });
  scoreHit(s);
  if (part === 'shield') {
    g.shieldHp--;
    g.stuck.push({ dx: x - f.x, dy: y - f.y, ang, on: 'shield' });
    if (g.shieldHp > 0) return void s.events.push({ k: 'splinter', ...ev });
    // Broken: its planks fall, and the arrows in it with them.
    for (let i = 0; i < 3; i++) fly('plank', x, y, i);
    for (const k of g.stuck.filter((q) => q.on === 'shield')) fly('shed', f.x + k.dx, f.y + k.dy);
    g.stuck = g.stuck.filter((q) => q.on !== 'shield');
    return void s.events.push({ k: 'shieldbreak', ...ev });
  }
  if (part === 'torch') {
    g.torch = false;
    g.burning = s.t;
    g.at = s.t;
    fly('torch', x, y);
    return void s.events.push({ k: 'torch', ...ev });
  }
  if (part === 'head' && g.helmet) {
    // The first head hit takes the helmet, spinning off; the arrow glances.
    g.helmet = false;
    fly('helmet', x, y);
    fly('glance', x, y);
    return void s.events.push({ k: 'helmet', ...ev });
  }
  g.stuck.push({ dx: x - f.x, dy: y - f.y, ang, on: 'gob' });
  s.events.push({ k: 'hit', part, ...ev });
  const hard = a.power >= BOW.hard ? 2 : 1;
  const dmg = part === 'head' ? hard * 2 : part === 'legs' ? BOW.legDmg : hard;
  if (part === 'legs') g.limp = true;
  g.hp -= dmg;
  if (g.hp <= 0) kill(s, v, g, part);
}

/** A goblin falls: points (the streak as it stands), and it lies there a while with the arrows in it. */
export function kill(s: WatchState, v: HitView, g: Gob, how: Part | 'fire'): void {
  const f = v.feet(g);
  g.state = 'dead';
  g.at = s.t;
  g.how = how;
  const pts = scoreKill(s, g, how);
  if (g.torch) (g.torch = false), s.bits.push({ ...v.bit('drop', g, f.x, f.y, 0), t: s.t, rest: false });
  s.events.push({ k: 'kill', ...f, y: s.field === 'deep' ? f.y + 1.6 : f.y - 16, gob: g.id, pts, head: how === 'head', how });
}
