/**
 * Rows for things a trainer teaches in order, one a rank of a drill: a class's three techniques (the
 * `technique` drill) and its three movement rungs (the `ladder` drill). Each is learned, the next (its
 * level and price, or the lesson it waits on), or still to come (its level, or the one before it).
 */
import { LEAVES, drillLevel, drillPrice, type DrillId } from './drills.js';
import { drillState, type TrainState } from './training.js';
import type { Profile } from './progress.js';
import type { TrainGroup, TrainRow } from './trainrows.js';
import { coinsHtml } from './coins.js';

const tagFor = (s: TrainState, price: number, level: number, needs: string) =>
  s === 'max' ? 'LEARNED' : s === 'locked' ? `LEVEL ${level}` : s === 'needs' ? `NEEDS ${needs}` : coinsHtml(price);

/** `ids` in the order they're taught as ranks of drill `id`, named and described by `words`. `mark`
 *  tags each row with what it is (`tech` or `rung`) so the screen knows what to buy. */
export function stepRows<T extends string>(p: Profile, id: DrillId, ids: T[], words: Record<T, { name: string; text: string }>, group: TrainGroup, mark: 'tech' | 'rung'): TrainRow[] {
  const r = p.drills?.[id] ?? 0;
  return ids.map((t, i) => {
    const level = drillLevel(id, i, p.cls), price = drillPrice(id, i), have = i < r, w = words[t];
    // The next one says what it waits on; a later one waits on its level, or on the one before it.
    const state: TrainState = have ? 'max' : i === r ? drillState(p, id) : p.level < level ? 'locked' : 'needs';
    const needs = state !== 'needs' ? '' : i === r ? LEAVES[p.cls]?.short ?? 'SKILL' : words[ids[i - 1]].name;
    return {
      id: t as TrainRow['id'], key: `${mark}:${t}`, [mark]: t, group, lesson: true, name: w.name, text: w.text, rank: have ? 1 : 0, max: 1,
      pips: [have ? 'on' : p.level < level ? 'lock' : 'off'], gain: have ? '' : w.text, now: have ? w.text : '', next: have ? '' : w.text,
      state, price: have ? 0 : price, level: have ? 0 : level, needs, tag: tagFor(state, price, level, needs),
      ladder: [{ rank: 1, gain: w.text, level, price, have }],
    } as TrainRow;
  });
}
