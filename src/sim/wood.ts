/**
 * The prologue's running order (shared/wood.ts has the map, the lessons and the lines): spawn each
 * lesson's goblins when you walk into its area, count what it teaches, open the way on, walk Hew ahead,
 * pick you up when you fall, run the cutscene at the hut, then the Stoker, the relic and the road.
 * Plain data, stepped after the room each frame by whoever runs the room.
 */
import { AREAS, GATES, LESSONS, LINES, ROAD_OUT, STOKER, STOKER_HELP, areaAt } from '../shared/wood';
import { inArea } from '../shared/arena';
import type { Foe } from '../shared/terrain';
import { isDead } from './damage';
import { newEnemy } from './enemies';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent } from './types';

export interface Caption { who: string; text: string; until: number }
export interface WoodState {
  /** 0 to 4: the lesson areas; 5: the road out. */
  stage: number;
  /** Walked into this stage's area (its goblins are out). */
  entered: boolean;
  count: number;
  ids: number[];
  more: boolean;
  /** Seconds into the cutscene (-1: none playing). */
  cut: number;
  caption: Caption | null;
  stoker: number;
  helped: boolean;
  hewAlive: boolean;
  /** The relic is out of the Stoker (the game gives it); then walk the road. */
  relic: boolean;
  done: boolean;
  /** Seconds into waking up (-1: up and about): you lie still while he comes over. */
  wake: number;
  /** The world stops for this: a lesson's card, a freeze-frame on the blow to answer, a word of praise. */
  hold: Hold | null;
  /** This lesson's freeze-frames and praise so far (training wheels come off after two). */
  drilled: number;
  praised: number;
  drillAt: number;
  /** How many of Hew's waking lines have been said, and when you were on your feet. */
  said: number;
  upAt: number;
  /** Where you stood up: walking a little away starts the first lesson. */
  from: { x: number; y: number } | null;
}
/** What the world is held for, and what lets it go on. */
export type Move = 'move' | 'attack' | 'roll' | 'block' | 'parry' | 'skill';
export interface Hold { kind: 'card' | 'act' | 'praise' | 'talk'; who: string; text: string; how?: string; move?: Move; need: 'continue' | 'move' | 'attack' | 'roll' | 'block' | 'time'; t: number; until: number }

const HERO_ID = 'me', CUT = { stoker: 2, round: 2.4, draw: 3.6, drag: 4.4, last: 4.6, behind: 5.6, blow: 6.4, line: 7.6, end: 9.6 };
const hew = (room: ArenaRoom) => room.map.npcs?.find((n) => n.talk === 'hew');
/** A caption, up long enough to read (about a third of a second a word, never less than asked). */
const say = (w: WoodState, room: ArenaRoom, who: string, text: string, s = 5) => (w.caption = { who, text, until: room.time + Math.max(s, 1.2 + text.split(' ').length * 0.32) });

function spawn(room: ArenaRoom, f: Foe & { variant?: Enemy['variant'] }): Enemy {
  const e = newEnemy(Math.max(0, ...room.enemies.map((o) => o.id)) + 1, f.kind, f.x, f.y);
  if (f.variant === 'looter' || f.variant === 'lunger' || f.variant === 'heavy') e.hp = e.maxHp = { looter: 14, lunger: 30, heavy: 110 }[f.variant];
  if (f.variant === 'stoker') e.hp = e.maxHp = 520;
  // Every goblin in the wood but the Stoker is drilled: slower wind-ups, one at a time.
  Object.assign(e, { respawns: false, name: f.name, bow: f.bow, variant: f.variant, alert: f.awake ?? false, drill: f.variant !== 'stoker' });
  room.enemies.push(e);
  return e;
}

/** Waking, in seconds: the fade in, his slow walk over; then his lines wait for a tap; a breath on your feet. */
export const WAKE = { fade: 2.5, arrive: 4.6, standing: 0.8 };
/** Tutorial pacing: drilled goblins wind up this much slower; one at a time comes at you. */
export const DRILL = { windup: 1.5, wheels: 2, praise: 3, praiseFor: 1.1 };

export function newWood(room: ArenaRoom): WoodState {
  const w: WoodState = { stage: 0, entered: false, count: 0, ids: [], more: false, cut: -1, caption: null, stoker: 0, helped: false, hewAlive: true, relic: false, done: false, wake: 0, hold: null, drilled: 0, praised: 0, drillAt: -1, from: null, said: 0, upAt: -1 };
  const h = room.heroes.find((x) => x.id === HERO_ID);
  if (h) Object.assign(h, { act: 'down', actT: 0, actDur: 999, lying: true });
  return w;
}

/** You lie still; the screen comes up; Hew walks over slowly, checks you, hauls you up. */
function stepWake(w: WoodState, room: ArenaRoom, dt: number): void {
  const t = (w.wake += Math.max(0, dt)), n = hew(room), h = room.heroes.find((x) => x.id === HERO_ID);
  if (n && h && t < WAKE.arrive) {
    const tx = h.x + 1.1, ty = h.y - 0.3, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    if (d > 0.05) (n.x += (dx / d) * Math.min(d, 1.8 * dt)), (n.y += (dy / d) * Math.min(d, 1.8 * dt));
  }
  if (t < WAKE.arrive) return;
  // He talks, one line at a time, each waiting for a tap (the world held); the last as he hauls you up.
  const lines = LINES.waking;
  if (w.said < lines.length) {
    if (w.said === lines.length - 1) {
      if (h) Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, hp: h.maxHp, fx: 1, fy: 0 });
      w.upAt = t;
    }
    w.hold = talk('HEW', lines[w.said++]);
    return;
  }
  if (t >= w.upAt + WAKE.standing) {
    w.wake = -1;
    w.hold = card('HEW', LINES.walk, 'move', 'move', LINES.how.move);
    if (h) w.from = { x: h.x, y: h.y };
  }
}

const card = (who: string, text: string, move: Move, need: Hold['need'], how?: string): Hold => ({ kind: 'card', who, text, how, move, need, t: 0, until: 0 });
const talk = (who: string, text: string): Hold => ({ kind: 'talk', who, text, need: 'continue', t: 0, until: 0 });

/** Release a hold (the game calls this when its condition is met). */
export function release(w: WoodState): void {
  w.hold = null;
}

/** One goblin at a time comes at you, and it does come; the rest hang back. */
function oneAtATime(w: WoodState, room: ArenaRoom, hx: number, hy: number): Enemy | null {
  const up = room.enemies.filter((e) => w.ids.includes(e.id) && !isDead(e) && e.drill && e.alert !== false);
  if (!up.length) return null;
  const near = up.reduce((a, b) => (Math.hypot(a.x - hx, a.y - hy) <= Math.hypot(b.x - hx, b.y - hy) ? a : b));
  for (const e of up) if (e !== near && e.act !== 'attack') e.cooldown = Math.max(e.cooldown, 0.8);
  if (near.act !== 'attack' && near.cooldown > 1.2) near.cooldown = 1.2;
  return near;
}

/** The first blows of a lesson stop just before they land: the moment to answer, and what to press. */
function drill(w: WoodState, e: Enemy | null, parryWindow: number): void {
  const a = e?.attack, kind = LESSONS[w.stage].count;
  if (!a || a.t >= a.windup || w.drilled >= DRILL.wheels || w.drillAt === e!.id * 1000 + Math.round(a.windup * 100) + Math.round(a.ox * 10)) return;
  const left = a.windup - a.t;
  const ready = kind === 'dodge' ? a.unblockable && left <= 0.16 : kind === 'block' ? left <= 0.4 : kind === 'parry' ? !a.unblockable && left <= parryWindow * 0.6 : false;
  if (!ready) return;
  w.drilled++;
  w.drillAt = e!.id * 1000 + Math.round(a.windup * 100) + Math.round(a.ox * 10);
  const move: Move = kind === 'dodge' ? 'roll' : kind === 'block' ? 'block' : 'parry';
  w.hold = { kind: 'act', who: '', text: LINES.now[move as 'roll' | 'block' | 'parry'], move, need: move === 'roll' ? 'roll' : 'block', t: 0, until: 0 };
}

/** Skip the cutscene (the game offers it once it has been seen). */
export function skipCut(w: WoodState, room: ArenaRoom): void {
  if (w.cut < 0) return;
  w.cut = CUT.end;
  stepCut(w, room, [], 0);
}

function openGate(room: ArenaRoom, i: number): void {
  const g = GATES[i].block;
  room.map.blocks = room.map.blocks.filter((b) => b.x !== g.x || b.y !== g.y || b.kind !== g.kind);
}

function stepCut(w: WoodState, room: ArenaRoom, ev: FightEvent[], dt: number): void {
  const t0 = w.cut, t = (w.cut += dt), at = (s: number) => t0 < s && t >= s, n = hew(room);
  if (at(CUT.stoker)) {
    const e = spawn(room, STOKER);
    w.stoker = e.id;
    e.fx = -1;
    e.fy = 0;
    ev.push({ k: 'spotted', x: e.x, y: e.y });
  }
  if (at(CUT.round) && n) (n.x = 55), (n.y = 8.5), say(w, room, 'HEW', LINES.round, 2);
  const s = room.enemies.find((e) => e.id === w.stoker);
  if (at(CUT.draw) && s) ev.push({ k: 'windup', x: s.x, y: s.y, kind: 'draw' });
  // Hooked and dragged across the yard to it.
  if (n && t >= CUT.drag && t < CUT.behind) {
    const k = (t - CUT.drag) / (CUT.behind - CUT.drag);
    n.x = 55 + (58.4 - 55) * k;
    n.y = 8.5 + (5.6 - 8.5) * k;
  }
  if (at(CUT.last)) say(w, room, 'HEW', LINES.last, 2.4);
  if (at(CUT.blow) && n) {
    ev.push({ k: 'impact', x: n.x, y: n.y, kind: 'slam' });
    room.map.npcs = room.map.npcs?.filter((x) => x !== n);
    w.hewAlive = false;
  }
  if (at(CUT.line)) say(w, room, 'THE STOKER', LINES.stoker, 3);
  if (t >= CUT.end) {
    if (n) room.map.npcs = room.map.npcs?.filter((x) => x !== n);
    w.hewAlive = false;
    const e = room.enemies.find((x) => x.id === w.stoker) ?? spawn(room, STOKER);
    w.stoker = e.id;
    Object.assign(e, { alert: true, cooldown: 1.2 });
    w.cut = -1;
  }
}

/** Fall in the wood and Hew hauls you up; fall to the Stoker and the fight starts again. */
function fallen(w: WoodState, room: ArenaRoom): void {
  const h = room.heroes.find((x) => x.id === HERO_ID)!, n = hew(room);
  Object.assign(h, { hp: h.maxHp, act: 'idle', actT: 0, stamina: 100, kvx: 0, kvy: 0 });
  if (w.stage === 4 && w.stoker) {
    const s = room.enemies.find((e) => e.id === w.stoker)!;
    Object.assign(s, { hp: s.maxHp, x: STOKER.x, y: STOKER.y, attack: null, act: 'chase', cooldown: 2 });
    room.enemies = room.enemies.filter((e) => e === s || !w.ids.includes(e.id) || e.kind === 'butcher');
    w.helped = false;
    Object.assign(h, { x: 52, y: 10 });
    say(w, room, '', LINES.cometo, 4);
    return;
  }
  if (n) (h.x = n.x + 0.8), (h.y = n.y);
  say(w, room, 'HEW', LINES.up[Math.floor(room.time) % LINES.up.length], 3);
}

/** After each frame of the room: the prologue's own rules. */
export function stepWood(w: WoodState, room: ArenaRoom, ev: FightEvent[], dt: number, parryWindow = 0.3): void {
  if (w.done || w.hold) return;
  if (w.wake >= 0) return stepWake(w, room, dt);
  if (w.cut >= 0) return stepCut(w, room, ev, dt);
  const h = room.heroes.find((x) => x.id === HERO_ID);
  if (!h) return;
  if (ev.some((e) => e.k === 'down' && Math.abs(e.x - h.x) < 0.01 && Math.abs(e.y - h.y) < 0.01)) fallen(w, room);
  // Hew walks ahead to wait by the next lesson.
  const n = hew(room), lesson = LESSONS[w.stage];
  if (n && lesson) {
    const [tx, ty] = lesson.hew, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    if (d > 0.1) (n.x += (dx / d) * Math.min(d, 3 * dt)), (n.y += (dy / d) * Math.min(d, 3 * dt));
  }
  if (w.stage === 5) {
    if (inArea(ROAD_OUT, h.x, h.y)) w.done = true;
    return;
  }
  // Walk into the area: the world stops while Hew says his piece and shows you the control; then its
  // goblins come out. (The first lesson waits until you've walked a few steps on your own.)
  const walked = !w.from || Math.hypot(h.x - w.from.x, h.y - w.from.y) > 2.5;
  if (!w.entered && areaAt(h.x, h.y) === lesson.area && (w.stage > 0 || walked)) {
    Object.assign(w, { entered: true, count: 0, drilled: 0, praised: 0 });
    if (w.stage === 4) {
      w.cut = 0;
      say(w, room, 'HEW', LINES.hut, 2);
      return;
    }
    w.ids = lesson.foes.map((f) => spawn(room, f).id);
    const move = (['attack', 'roll', 'block', 'parry'] as const)[w.stage];
    w.hold = card('HEW', [LINES.attack, LINES.dodge, LINES.block, LINES.parry][w.stage], move, 'continue', LINES.how[move]);
    return;
  }
  if (!w.entered) return;
  const kind = lesson.count;
  let good = false;
  for (const e of ev) if ((kind === 'dodge' && e.k === 'dodge') || (kind === 'block' && e.k === 'block') || (kind === 'parry' && e.k === 'parry') || (kind === 'kills' && e.k === 'death')) (w.count += kind === 'kills' ? 0 : 1), (good = true);
  // Done it right: the fight stops a moment for a word from Hew.
  if (good && w.praised < DRILL.praise && w.hewAlive) {
    w.praised++;
    w.hold = { kind: 'praise', who: 'HEW', text: LINES.praise[(w.stage + w.praised) % LINES.praise.length], need: 'time', t: 0, until: DRILL.praiseFor };
    return;
  }
  drill(w, oneAtATime(w, room, h.x, h.y), parryWindow);
  if (w.hold) return;
  const left = room.enemies.filter((e) => w.ids.includes(e.id) && !isDead(e));
  // The Stoker: two more come at half its health; the relic comes out of it.
  if (w.stage === 4) {
    const s = room.enemies.find((e) => e.id === w.stoker);
    if (s && !w.helped && s.hp < s.maxHp / 2) (w.helped = true), w.ids.push(...STOKER_HELP.map((f) => spawn(room, f).id));
    if (s && isDead(s) && !w.relic) {
      w.relic = true;
      say(w, room, '', LINES.relic, 8);
      openGate(room, 4);
      Object.assign(w, { stage: 5, entered: true });
    }
    return;
  }
  // The field: two more looters run in when the first three are down.
  if (w.stage === 0 && !left.length && !w.more && lesson.more) {
    w.more = true;
    w.ids.push(...lesson.more.map((f) => spawn(room, f).id));
    return;
  }
  // Cleared them before the lesson took: they come again.
  if (!left.length && w.count < lesson.need) {
    w.ids = lesson.foes.map((f) => spawn(room, { ...f, awake: true }).id);
    say(w, room, 'HEW', LINES.more, 3);
    return;
  }
  if (!left.length && w.count >= lesson.need) {
    openGate(room, w.stage);
    if (w.stage === 1) say(w, room, 'HEW', LINES.north, 5);
    Object.assign(w, { stage: w.stage + 1, entered: false, count: 0, ids: [] });
  }
}

/** What to show over the field: the lesson, the control, how far along. */
export function woodGoal(w: WoodState, touch: boolean): { title: string; text: string } {
  if (w.stage === 5) return { title: 'THE ROAD', text: 'West, to Wickhold' };
  const l = LESSONS[w.stage], key: Record<string, string> = touch ? { ATTACK: 'TAP ATTACK', DODGE: 'TAP ROLL', BLOCK: 'HOLD BLOCK', PARRY: 'TAP BLOCK ON THE WHITE FLASH', SKILL: 'TAP SKILL' } : { ATTACK: 'CLICK', DODGE: 'SPACE', BLOCK: 'HOLD RIGHT CLICK', PARRY: 'TAP RIGHT CLICK ON THE WHITE FLASH', SKILL: 'E' };
  if (w.wake >= 0) return { title: '', text: '' };
  if (!w.entered) return { title: l.name, text: w.stage ? 'Follow Hew' : 'Walk' };
  const what = { kills: '', dodge: 'DODGES', block: 'BLOCKS', parry: 'PARRIES', none: '' }[l.count];
  return { title: `${l.teach}: ${key[l.teach]}`, text: what ? `${what} ${Math.min(w.count, l.need)} / ${l.need}` : w.stage === 4 ? 'Kill it' : 'Clear them' };
}
export { AREAS };
