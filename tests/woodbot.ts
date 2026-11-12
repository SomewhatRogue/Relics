/**
 * A first run through the wood, played by Intent like a new player (not a test on its own:
 * tests/blockholds.test.ts uses it). Each lesson the hero is put in its area (the gates and the walk between
 * are not the point), every card is read and dismissed, every freeze-frame answered with the move it asks
 * for, and then it fights: up to the nearest goblin, quick blows. A blow coming at it is answered as its
 * class would (a block for a Warrior or Healer, walking out of a striped one; a dodge for the rest) only
 * `skill` of the time, by a fixed draw per blow, so a run plays the same way twice. A lesson whose count the
 * bot can't make on its own (a grab, a backstab, a full draw, a last second, an element, a class button) has
 * its count made for it once the bot has fought a while, as a player would get there in the end. Health lost
 * and times down are counted per lesson; the Stoker is fought until it's dead or `most` seconds pass.
 */
import { TICK, WEAPONS, CLASS_DODGES, type HeroClass } from '../src/shared/tuning';
import { lessonsFor } from '../src/shared/wood';
import { attackCovers } from '../src/sim/combat';
import { isDead, isDummy } from '../src/sim/damage';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage ??= { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

export interface WoodRun { lost: number[]; downs: number[]; secs: number[]; forced: boolean[]; hits: number[]; blocks: number[]; breaks: number[] }
const SPOTS = [[8, 33], [32, 36], [32, 18], [53, 20], [52, 10]];

/** A fixed draw for one blow: the same blow gets the same answer every run. */
const draw = (e: Enemy) => {
  const a = e.attack!;
  let x = (e.id * 2654435761 + Math.round(a.ox * 97) * 40503 + Math.round(a.oy * 89) * 9973 + Math.round(a.windup * 1000)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
  return ((x ^ (x >>> 13)) >>> 0) / 4294967296;
};

export function woodRun(cls: HeroClass, skill = 1, most = 240): WoodRun {
  store.clear();
  const g = new Game();
  g.create(cls, 'bot');
  Object.assign(g.wood!, { wake: -1, hold: null, from: null });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
  const out: WoodRun = { lost: [], downs: [], secs: [], forced: [], hits: [], blocks: [], breaks: [] };
  let seq = 1;
  const it: Intent = { ...NO_INTENT };
  for (let stage = 0; stage < 5; stage++) {
    const w = g.wood!;
    Object.assign(g.hero, { x: SPOTS[stage][0], y: SPOTS[stage][1] });
    let hits = 0, blocks = 0, breaks = 0, lost = 0, downs = 0, t = 0, forced = false, hp = g.hero.hp;
    const cap = stage === 4 ? most : 120;
    for (; t < cap && w.stage === stage && !w.relic; t += TICK) {
      Object.assign(it, { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false });
      const h = g.hero, hold = w.hold;
      if (hold) {
        if (hold.need === 'roll') it.rollSeq = ++seq;
        else if (hold.need === 'block') (it.block = true), (it.blockSeq = ++seq);
        else if (hold.need === 'move') (it.mx = 1), g.continueHold();
        else if (hold.need === 'potion') it.potionSeq = ++seq;
        else g.continueHold();
      } else if (w.cut < 0) {
        // Past a while on a count it can't make itself: made for it (it still fights what's there).
        const l = lessonsFor(cls)[stage];
        if (t > 25 && !w.after && w.count < l.need && !['block', 'dodge', 'kills'].includes(l.count)) (w.count = l.need), (forced = true);
        if (t > 60 && stage < 4) {
          for (const e of g.room.enemies) if (w.ids.includes(e.id) && !isDead(e)) e.hp = 0;
          if (w.count < l.need) w.count = l.need;
          if (w.element) (w.element as { count?: number }).count = 99;
          if (w.sign) (w.sign as { count?: number }).count = 99;
          forced = true;
        }
        // Still held up (a class button's step it can't do): on to the next lesson, as onward() does.
        if (t > 90 && stage < 4) Object.assign(w, { stage: stage + 1, entered: false, count: 0, ids: [], element: undefined, sign: undefined, after: undefined });
        play(g, it, cls, skill, () => ++seq);
      }
      const ev: FightEvent[] = g.step(TICK, it);
      if (g.hero.hp < hp) lost += hp - g.hero.hp;
      hp = g.hero.hp;
      for (const e of ev) if (e.k === 'down' && (e as { id?: string }).id === h.id) downs++;
      for (const e of ev) if (e.k === 'hit' && e.on === 'hero') hits++;
      for (const e of ev) if (e.k === 'block') blocks++;
      for (const e of ev) if (e.k === 'guardbreak') breaks++;
    }
    out.lost.push(lost), out.downs.push(downs), out.secs.push(Math.round(t)), out.forced.push(forced || t >= cap), out.hits.push(hits), out.blocks.push(blocks), out.breaks.push(breaks);
  }
  return out;
}

/** One frame of fighting. */
function play(g: Game, it: Intent, cls: HeroClass, skill: number, next: () => number): void {
  const h = g.hero, blocker = !CLASS_DODGES[cls];
  const foes = g.room.enemies.filter((e) => !isDead(e) && !isDummy(e) && e.alert !== false && !e.escaped);
  if (!foes.length) return;
  const d = (e: Enemy) => Math.hypot(e.x - h.x, e.y - h.y);
  const near = foes.reduce((a, b) => (d(a) <= d(b) ? a : b));
  // A blow coming at it: answered `skill` of the time.
  const blow = foes.find((e) => e.attack && !e.attack.done && e.attack.t < e.attack.windup && attackCovers(e.attack, h) && draw(e) < skill);
  if (blow) {
    const a = blow.attack!, left = a.windup - a.t;
    const ux = (blow.x - h.x) / (d(blow) || 1), uy = (blow.y - h.y) / (d(blow) || 1);
    if (blocker && !a.unblockable) return void Object.assign(it, { block: true, ax: ux, ay: uy });
    // Out of a striped one sideways (a Warrior or Healer walks; the rest dodge as it comes).
    const sx = -a.dy || -uy, sy = a.dx || ux;
    if (blocker) return void Object.assign(it, { mx: sx, my: sy });
    if (left <= 0.22) return void Object.assign(it, { mx: sx, my: sy, rollSeq: next() });
    return void Object.assign(it, { ax: ux, ay: uy });
  }
  const dn = d(near), ux = (near.x - h.x) / (dn || 1), uy = (near.y - h.y) / (dn || 1);
  const reach = WEAPONS[h.weapon].combo?.[0]?.range ?? 1.4;
  if (dn > Math.max(1.1, reach * 0.85)) Object.assign(it, { mx: ux, my: uy, ax: ux, ay: uy });
  else Object.assign(it, { ax: ux, ay: uy });
  if (dn <= reach + 0.3 && h.act === 'idle' && Math.floor(g.room.time * 4) % 2 === 0) it.attackSeq = next();
}
