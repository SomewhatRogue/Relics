/**
 * Flanking (docs/design/foe-patterns.md, slice 2; Kyle, 2026-11-27, "I like flanking attacks"). Round one hero, the
 * pack shares the work: the goblin nearest their front keeps them busy, and the others walk round to their back and
 * sides before they strike. A goblin already in reach and off the hero's front strikes from where it is. Pure of
 * the room: what it reads is the goblins and the hero now, so it's the same on every screen.
 */
import { FLANK_PACK as F } from '../shared/foepatterns';
import type { Enemy, Hero } from './types';

/** Goblins that go round: the plain sorts on foot, awake and up (not the wood's drilled ones, bosses, the big ones). */
const goesRound = (e: Enemy) => e.kind === 'scrapper' && (!e.variant || e.variant === 'looter') && !e.drill && !e.boss && !e.bow && e.hp > 0 && e.act !== 'dead' && e.alert !== false;

/** How far round from the hero's front a point is: 1 dead ahead, -1 dead behind. */
const frontOf = (t: Hero, x: number, y: number) => {
  const dx = x - t.x, dy = y - t.y, l = Math.hypot(dx, dy) || 1, fl = Math.hypot(t.fx, t.fy) || 1;
  return (dx * t.fx + dy * t.fy) / (l * fl);
};

/**
 * Where goblin `e` should walk to get round hero `t` (null: go at them as ever). `reach` its blow's reach; `others`
 * the room's goblins.
 */
export function flankSpot(e: Enemy, t: Hero, d: number, reach: number, others: Enemy[]): { x: number; y: number } | null {
  if (!goesRound(e) || d > F.pack) return null;
  // Off their front and in reach: strike from here.
  if (d <= reach && frontOf(t, e.x, e.y) < F.front) return null;
  const pack = others.filter((o) => goesRound(o) && Math.hypot(o.x - t.x, o.y - t.y) <= F.pack);
  if (!pack.includes(e)) pack.push(e);
  if (pack.length < 2) return null;
  // The one nearest their front (then the nearest, then by id) keeps them busy; whoever kept them busy last keeps it
  // a while, so the work doesn't flip between two goblins each tick.
  const score = (o: Enemy) => frontOf(t, o.x, o.y) * 2 - Math.hypot(o.x - t.x, o.y - t.y) * 0.25 + (o.busy === t.id ? F.keep : 0) - o.id * 1e-6;
  const order = [...pack].sort((a, b) => score(b) - score(a));
  for (const o of pack) o.busy = o === order[0] ? t.id : undefined;
  if (order[0] === e) return null;
  // The rest, by that order, to the places round them: behind first, then the sides. Round the hero, not through
  // them: the next step along the arc, a little wider than their reach, till it's there.
  const i = Math.min(order.indexOf(e) - 1, F.slots.length - 1), face = Math.atan2(t.fy, t.fx), want = face + (F.slots[i] * Math.PI) / 180, r = reach * F.ring;
  const have = Math.atan2(e.y - t.y, e.x - t.x), turn = Math.atan2(Math.sin(want - have), Math.cos(want - have));
  if (Math.abs(turn) < 0.35) return { x: t.x + Math.cos(want) * r, y: t.y + Math.sin(want) * r };
  const next = have + Math.sign(turn) * Math.min(Math.abs(turn), F.step), wide = Math.max(reach * F.wide, Math.min(d, F.pack * 0.6));
  return { x: t.x + Math.cos(next) * wide, y: t.y + Math.sin(next) * wide };
}
