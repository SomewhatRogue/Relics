/**
 * The Healer's MEND step in the wood (Kyle, 2026-11-05): a goblin archer at the clearing's edge shoots
 * Hew. He takes the arrow, goes down on one knee and calls out; it can't kill him (he's scripted to live).
 * Two more come out of the trees. Once they're all down the card shows MEND, and a MEND that reaches Hew
 * finishes it. The archer goes on shooting at you, so a scratch shows the MEND on yourself too.
 */
import { ARCHER } from '../shared/tuning';
import { HEAL_FOES, HEW_ARCHER, HEW_AT, SIGN_LINES, SIGN_STEP } from '../shared/woodsigns';
import { begin } from './enemies';
import { isDead } from './damage';
import { hew, say, spawn } from './woodkit';
import type { ArenaRoom } from './room';
import type { FightEvent, Hero } from './types';
import type { WoodState } from './wood';
import type { SignStep } from './woodsign';

/** The archer comes out and looses at Hew (the telegraph you see is the shot: a hero in its line takes it). */
export function startHeal(w: WoodState, s: SignStep, room: ArenaRoom, ev: FightEvent[]): void {
  const a = spawn(room, HEW_ARCHER), n = hew(room);
  a.hp = a.maxHp = SIGN_STEP.hp;
  w.ids = [a.id];
  s.phase = 'aim';
  // (He's waited by the clearing's way out all its lesson; if he's somehow still on his way, he's there now.)
  if (n && Math.hypot(n.x - HEW_AT[0], n.y - HEW_AT[1]) > 1) Object.assign(n, { x: HEW_AT[0], y: HEW_AT[1], walking: false });
  if (n) begin(a, 'shot', ARCHER.shot, { id: 'hew', x: n.x, y: n.y } as Hero, ev);
}

/** Hew takes it: down on one knee, the arrow in his leg, hurt; he calls out, and two more come. */
function struck(w: WoodState, s: SignStep, room: ArenaRoom, ev: FightEvent[]): void {
  const n = hew(room);
  s.phase = 'fight';
  if (n) Object.assign(n, { hp: SIGN_STEP.hewHp, maxHp: SIGN_STEP.hewMax, kneel: true, arrow: true, walking: false }), ev.push({ k: 'hewshot', x: n.x, y: n.y });
  say(w, room, 'HEW', SIGN_LINES.hewHit, 3);
  w.ids.push(...HEAL_FOES.map((f) => Object.assign(spawn(room, f), { hp: SIGN_STEP.hp, maxHp: SIGN_STEP.hp }).id));
}

/** Each frame of the step. True once Hew has been mended (the way on opens). */
export function stepHeal(w: WoodState, s: SignStep, room: ArenaRoom, ev: FightEvent[]): boolean {
  const mine = room.enemies.filter((e) => w.ids.includes(e.id)), n = hew(room);
  if (s.phase === 'aim') {
    // The shot lands when its wind-up is out; killed or knocked off it first, he's hit all the same (scripted).
    const a = mine[0]?.attack;
    if ((a && a.aimed === 'hew' && a.done) || !a || a.aimed !== 'hew' || room.time - s.at > SIGN_STEP.shotBy) struck(w, s, room, ev);
    return false;
  }
  if (s.phase === 'fight') {
    if (!mine.every(isDead)) return false;
    s.phase = 'card';
    s.taught = true;
    w.hold = { kind: 'card', who: 'HEW', text: SIGN_LINES.teach.heal, how: SIGN_LINES.how.heal, move: 'heal', need: 'sign', t: 0, until: 0 };
    return false;
  }
  // A MEND that reaches him: he's up, the arrow out.
  const got = n && ev.some((e) => e.k === 'mended' && !e.self && Math.hypot(e.x2 - n.x, e.y2 - n.y) < 0.3);
  if (!got || !n) return false;
  Object.assign(n, { kneel: false, arrow: false, hp: undefined, maxHp: undefined });
  w.count = 1;
  say(w, room, 'HEW', SIGN_LINES.healed, 2.5);
  return true;
}
