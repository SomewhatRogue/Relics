/**
 * The step in Hew's clearing for each class's own button (Kyle, 2026-11-05; shared/woodsigns.ts), after
 * the clearing's lesson, as the Mage's element step is (sim/woodelement.ts). The Rogue: two goblins with
 * their backs to you across the clearing, SHADOW STEP behind one and stab it. The Ranger: MARK one of two
 * and shoot it down. The Healer: Hew is shot, and once the goblins are down you MEND him (sim/woodheal.ts).
 * The button is given with the card. The way on opens once the step is done and its goblins are down
 * (all of them down without it does too, so they never come again).
 */
import { SIGN_KEY, isMarked, signOf, type SignId } from '../shared/signs';
import { CLEARING, MARK_FOES, SIGN_LINES, SIGN_STEP } from '../shared/woodsigns';
import { isDead } from './damage';
import { HERO_ID, say, spawn } from './woodkit';
import { startHeal, stepHeal } from './woodheal';
import { LINES } from '../shared/wood';
import type { ArenaRoom } from './room';
import type { FightEvent } from './types';
import type { WoodState } from './wood';

/** The step under way: whose, when it began, its phase (the Healer's), the last step taken, the button given. */
export interface SignStep { id: SignId; at: number; phase?: 'aim' | 'fight' | 'card'; stepAt: number; taught: boolean }

/** Does this hero's wood go on to it now (a Rogue, Ranger or Healer, the clearing's lesson done)? */
export const wantsSign = (w: WoodState) => !!signOf(w.cls) && w.stage === 2 && !w.sign;
/** Has the wood given this hero their button yet? */
export const signTaught = (w: WoodState) => !!signOf(w.cls) && (w.stage > 2 || !!w.sign?.taught);

const card = (w: WoodState, id: 'shadow' | 'mark', need: 'continue' | 'sign') =>
  (w.hold = { kind: 'card', who: 'HEW', text: SIGN_LINES.teach[id], how: SIGN_LINES.how[id], move: id, need, t: 0, until: 0 });

export function startSign(w: WoodState, room: ArenaRoom, ev: FightEvent[]): void {
  const id = signOf(w.cls)!, s: SignStep = { id, at: room.time, stepAt: -9, taught: id !== 'heal' };
  Object.assign(w, { sign: s, count: 0, praised: 0, drilled: 0, moreSaid: false, ids: [] });
  if (id === 'heal') return startHeal(w, s, room, ev);
  if (id === 'mark') {
    w.ids = MARK_FOES.map((f) => Object.assign(spawn(room, f), { hp: SIGN_STEP.hp, maxHp: SIGN_STEP.hp }).id);
    // (The press goes on and marks as the world restarts.)
    return void card(w, 'mark', 'sign');
  }
  // The Rogue's two: across the clearing from you, backs turned, going through Hew's sacks.
  const h = room.heroes.find((x) => x.id === HERO_ID)!, c = CLEARING;
  let dx = c.x - h.x, dy = c.y - h.y, d = Math.hypot(dx, dy);
  if (d < 1.5) (dx = 1), (dy = 0), (d = 1);
  const fx = dx / d, fy = dy / d, clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  w.ids = [-1, 1].map((k) => {
    const x = clamp(h.x + fx * c.across - fy * c.apart * k, c.minX, c.maxX), y = clamp(h.y + fy * c.across + fx * c.apart * k, c.minY, c.maxY);
    return Object.assign(spawn(room, { kind: 'scrapper', variant: 'looter', x, y }), { hp: SIGN_STEP.hp, maxHp: SIGN_STEP.hp, feeding: true, alert: false, fx, fy }).id;
  });
  // (A tap goes on: a SHADOW STEP pressed on the card would go with nobody in reach.)
  card(w, 'shadow', 'continue');
}

/** Each frame of the step. True once it's done and its goblins are down. */
export function stepSignLesson(w: WoodState, room: ArenaRoom, ev: FightEvent[]): boolean {
  const s = w.sign!, mine = room.enemies.filter((e) => w.ids.includes(e.id)), was = w.count;
  if (s.id === 'heal') return stepHeal(w, s, room, ev);
  const h = room.heroes.find((x) => x.id === HERO_ID);
  for (const e of ev) {
    // The Rogue: a SHADOW STEP, then a stab in the back of one of them soon after. In the wood the step is back in a moment.
    if (s.id === 'shadow' && e.k === 'shadow' && h) (s.stepAt = room.time), (h.signReady = Math.min(h.signReady ?? 0, room.time + SIGN_STEP.stepAgain));
    if (s.id === 'shadow' && e.k === 'hit' && e.on === 'enemy' && e.backstab && room.time - s.stepAt <= SIGN_STEP.stabWithin && mine.some((o) => Math.hypot(o.x - e.x, o.y - e.y) < 1)) w.count = 1;
    // The Ranger: one of them dies marked.
    if (s.id === 'mark' && e.k === 'death' && mine.some((o) => isDead(o) && isMarked(o, room.time) && Math.hypot(o.x - e.x, o.y - e.y) < 1)) w.count = 1;
  }
  if (w.count > was && w.praised < 1 && w.hewAlive) w.praised++, say(w, room, 'HEW', LINES.praise[2], 1.8);
  return mine.every(isDead);
}

/** What the step shows over the field: its move and control, how far along. */
export function signGoal(w: WoodState, touch: boolean): { title: string; text: string } {
  const s = w.sign!, g = SIGN_LINES.goal, name = { shadow: 'SHADOW STEP', mark: 'MARK', heal: 'MEND' }[s.id];
  const title = `${name}: ${touch ? 'TAP ' + name : SIGN_KEY}`;
  if (s.id === 'heal') return s.phase === 'card' ? { title, text: g.heal } : { title: g.hit, text: g.fight };
  return { title, text: w.count >= 1 ? g.clear : `${s.id === 'shadow' ? g.shadow : g.mark} 0 / 1` };
}
