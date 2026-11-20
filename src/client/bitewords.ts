/**
 * A hungry piece's bites on its card (shared/hunger.ts): each one's share, and how many jobs until it bites
 * harder, or bites twice. Read by client/card.ts under the piece's GIFT and COST.
 * Words through the lore keeper and the line editor, 2026-11-19.
 */
import { barWords } from '../shared/barword';
import { bitesOf, HUNGER, type BiteId } from '../shared/hunger';
import type { HeroClass, Item } from '../shared/tuning';

export const BITEW = {
  label: 'BITE',
  text: {
    frail: (n: number) => `You have ${n}% less health.`,
    winded: (n: number) => `Stamina recovers ${n}% slower.`,
    clumsy: (n: number) => `Each dodge costs ${n}% more stamina.`,
    starved: (n: number) => `Healing on you is ${n}% weaker.`,
    noticed: (n: number) => `Goblins notice you from ${n}% further off.`,
    greedy: (n: number) => `You pick up ${n}% less coin.`,
  } satisfies Record<BiteId, (n: number) => string>,
  /** About how many medium jobs until it bites harder; `twice` when the next step is the second bite. */
  next: (jobs: number, twice: boolean) => (twice ? `It gains a second bite ${when(jobs)}.` : `It bites harder ${when(jobs)}.`),
  worst: "It can't bite any harder.",
};
const when = (jobs: number) => (jobs <= 1 ? 'after your next job' : `in about ${jobs} jobs`);

/** The card's rows: BITE and its words, one a bite. None for a piece that isn't hungry. */
export function biteLines(it: Item, cls?: HeroClass): [string, string][] {
  const all = bitesOf(it, cls);
  return all.map((b) => {
    const twice = b.next !== null && b.share + HUNGER.step >= HUNGER.top && all.length === 1;
    const tail = b.next === null ? BITEW.worst : BITEW.next(Math.max(1, Math.ceil(b.next)), twice);
    return [BITEW.label, barWords(`${BITEW.text[b.id](Math.round(b.share * 100))} ${tail}`, cls)];
  });
}
