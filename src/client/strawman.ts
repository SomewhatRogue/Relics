/**
 * The yard's practice foes are straw men in hungry kit (shared/practice.ts), worked by Corporal Brisk's
 * watch: each fights exactly as the goblin it plays (the same silhouette, so practice reads as a real
 * fight), with straw sticking out at its head and hands, painted eyes that don't glow, and when it's put
 * down it slumps into a heap of straw rather than a body. Its hits throw straw, not blood (`strawFx`).
 * Drawn the same in both views: the flat scene and the 2.5D view's cards call `drawFoe`.
 */
import type { Enemy, FightEvent } from '../sim/types';
import type { Ctx } from './draw';
import { drawEnemy } from './foes';
import type { Fx } from './fx';
import { STRAW, drawStrawHeap } from './rackdraw';
import { toPx } from './world';
import { drawPerchRope } from './wooddraw';
import { drawPaceDust, drawPaceOver, paceOffset } from './pacedraw';
import { drawElite } from './elitedraw';
import { MEATY_DRAW, meatySort } from '../shared/meaty';
import { drawKeeper } from './doordraw';

/** A goblin, or (in the yard: `straw`) a straw man playing one. The plain dummies are themselves either way. */
export function drawFoe(c: Ctx, e: Enemy, x: number, y: number, sleeping: boolean, straw: boolean): void {
  // A dropper up a tree in Hangman's Wood: its rope up into the branches (wooddraw.ts).
  if (e.task?.k === 'perch') drawPerchRope(c, e, x, y);
  if (!straw || e.kind === 'dummy' || e.kind === 'swingDummy') return paced(c, e, x, y, sleeping);
  if (e.act === 'dead') return drawStrawHeap(c.lit, x, y, e.id);
  drawEnemy(c, e, x, y, sleeping);
  const big = e.kind === 'butcher' || e.variant === 'heavy' || e.variant === 'ironhide', h = big ? 24 : e.kind === 'spider' ? 9 : 14, w = big ? 11 : 7;
  // Painted eyes: the glow over the head goes (what's lit stays, so they show dim).
  c.glow.clearRect(Math.round(x - w), Math.round(y - h - 1), w * 2, Math.round(h * 0.55));
  const g = c.lit, r = (dx: number, dy: number, ww: number, hh: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), ww, hh));
  // Straw out of the top of the head, at the hands and at the feet.
  r(-2, -h - 1, 1, 2, STRAW.pale), r(0, -h - 2, 1, 2, STRAW.body), r(2, -h - 1, 1, 2, STRAW.pale);
  r(-w + 1, -Math.round(h * 0.45), 1, 2, STRAW.pale), r(w - 2, -Math.round(h * 0.45), 1, 2, STRAW.pale);
  r(-3, -1, 1, 1, STRAW.pale), r(3, -1, 1, 1, STRAW.pale);
}

/**
 * A goblin as the pacing rules show it (pacedraw.ts): hopping while held, leaning into a sprint, a BIG ONE
 * bigger; the new meaty sorts bigger too (MEATY_DRAW), and an elite's affixes on its body (elitedraw.ts).
 */
function paced(c: Ctx, e: Enemy, x: number, y: number, sleeping: boolean): void {
  // A boss of the kit: a Doorkeeper behind its door (doordraw.ts). (Hempen is drawn as the butcher it is.)
  if (e.boss && e.boss.who !== 'hempen') return drawKeeper(c, e, x, y, sleeping);
  const meat = meatySort(e);
  if (!e.held && !e.big && !e.sprintAt && !e.elite && !meat) return drawEnemy(c, e, x, y, sleeping);
  const o = paceOffset(c, e), bx = x + o.dx, by = y + o.dy, k = o.k * (meat ? MEATY_DRAW : 1);
  if (k === 1) drawEnemy(c, e, bx, by, sleeping), drawElite(c, e, bx, by);
  else {
    // Bigger from its feet up, on both layers.
    for (const g of [c.lit, c.glow]) g.save(), g.translate(bx, by), g.scale(k, k), g.translate(-bx, -by);
    drawEnemy(c, e, bx, by, sleeping);
    drawElite(c, e, bx, by);
    for (const g of [c.lit, c.glow]) g.restore();
  }
  drawPaceDust(c, e, x, y);
  drawPaceOver(c, e, bx, by);
}

const BITS = [STRAW.body, STRAW.pale, STRAW.shade, STRAW.rag];

/**
 * In the yard, a straw man hit or put down throws straw (that lies on the floor a while) where a goblin
 * would bleed. True: handled here (the event isn't given to Fx as well).
 */
export function strawFx(fx: Fx, ev: FightEvent): boolean {
  if (ev.k === 'hit' && ev.on !== 'hero') {
    const [x, y] = toPx(ev.x, ev.y);
    fx.burst(x, y - 8, ev.heavy ? 10 : 6, ['#ffffff', '#fff1b0'], ev.heavy ? 60 : 45, true);
    fx.gore.fling(x, y, 8, ev.heavy ? 12 : 7, BITS, ev.heavy ? 60 : 45, 80, 1);
    if (!ev.tick || Math.random() < 0.3) fx.say(x, y - 22, String(ev.n), ev.heavy ? '#ffe070' : '#ffffff');
    fx.shake = Math.max(fx.shake, ev.heavy ? 2 : 1);
    return true;
  }
  if (ev.k === 'death') {
    const [x, y] = toPx(ev.x, ev.y);
    fx.gore.fling(x, y, 6, 22, BITS, 70, 110, 1, ev.dx, ev.dy);
    fx.burst(x, y - 6, 10, [STRAW.pale, STRAW.body], 60, false);
    return true;
  }
  return false;
}
