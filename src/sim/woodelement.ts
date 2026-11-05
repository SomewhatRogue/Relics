/**
 * The Mage's element step in the wood (Kyle, 2026-11-05: "have the Mage tutorial explain the elements in
 * the full charge place"). Once the full charge is learned and its goblins are down, three more come out
 * of Hew's clearing, each weak to one element and shrugging off another (shared/wood.ts ELEMENT_FOES,
 * shared/weakness.ts). The card shows the ELEMENT button; the count is a weak hit on each of them. The way
 * on opens once they're down, with the count full or not (killing them any way you like is the fallback,
 * so they never come again the way a lesson's goblins do).
 */
import { ELEMENT_FOES, LINES, WEAK_TO } from '../shared/wood';
import { STORM } from '../shared/tuning';
import { isDead, sayWeak } from './damage';
import { streaming } from './stream';
import { wet } from './wet';
import { HERO_ID, say, spawn } from './woodkit';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent } from './types';
import type { WoodState } from './wood';

/** The step under way: which of its goblins have taken a weak hit (each needs another element, so that's switching too). */
export interface ElementStep { hit: number[] }

/** Does this hero's wood go on to the element step now (a Mage, the full charge done)? */
export const wantsElement = (w: WoodState) => w.cls === 'MAGE' && w.stage === 2 && !w.element;

/** Has the wood given this hero the ELEMENT button yet? */
export const elementTaught = (w: WoodState) => w.cls === 'MAGE' && (w.stage > 2 || !!w.element);

/** Out they come, and the card: Hew's word on them, the ELEMENT button lit, a press of it to go on. */
export function startElement(w: WoodState, room: ArenaRoom): void {
  w.ids = ELEMENT_FOES.map((f) => spawn(room, f).id);
  Object.assign(w, { element: { hit: [] }, count: 0, praised: 0, drilled: 0, moreSaid: false });
  w.hold = { kind: 'card', who: 'HEW', text: LINES.teach.element, how: LINES.how.element, move: 'element', need: 'element', t: 0, until: 0 };
}

const weakTo = (e: Enemy) => WEAK_TO[e.variant as keyof typeof WEAK_TO];

/** Each frame of the step: count the weak hits. True once its goblins are all down. */
export function stepElementLesson(w: WoodState, room: ArenaRoom, ev: FightEvent[]): boolean {
  const s = w.element!, mine = room.enemies.filter((e) => w.ids.includes(e.id)), was = s.hit.length;
  const mark = (e: Enemy | undefined) => e && !s.hit.includes(e.id) && s.hit.push(e.id);
  // WEAK over one of them, in the element it's weak to (dead or alive: the blow may have killed it).
  for (const k of ev) if (k.k === 'weak') mark(mine.find((e) => weakTo(e) === k.el && Math.hypot(e.x - k.x, e.y - k.y) < 1));
  // The wand's storm tap is a stream of ticks, which say nothing of their own: held on the wet one, it
  // counts, and says WEAK as any storm on a wet goblin does.
  const h = room.heroes.find((x) => x.id === HERO_ID);
  if (h?.stream && streaming(h, room.time)) {
    const e = mine.find((o) => o.id === h.stream!.id && !isDead(o) && weakTo(o) === 'storm' && wet(o));
    if (e) sayWeak(e, STORM.wet, room.time, ev, 'storm'), mark(e);
  }
  w.count = s.hit.length;
  if (w.count > was && w.praised < 1 && w.hewAlive) w.praised++, say(w, room, 'HEW', LINES.praise[w.count % LINES.praise.length], 1.8);
  return mine.every(isDead);
}
