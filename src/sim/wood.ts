/**
 * The prologue's running order (shared/wood.ts has the map, the lessons and the lines): spawn each
 * lesson's goblins when you walk into its area, count what it teaches, open the way on, walk Hew ahead,
 * pick you up when you fall, run the cutscene at the hut, then the Stoker, the relic and the road.
 * Plain data, stepped after the room each frame by whoever runs the room.
 */
import { attackCovers } from './combat';
import { AREAS, FEEDING, GATES, GOBLIN_DEAD, LINES, ROAD_OUT, STOKER, STOKER_CALLS, areaAt, lessonsFor, type Lesson, type Teach } from '../shared/wood';
import type { HeroClass } from '../shared/weapons';
import { inArea } from '../shared/arena';
import type { Foe } from '../shared/terrain';
import { isDead } from './damage';
import { newEnemy } from './enemies';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent, Hero } from './types';

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
  /** How many times the Stoker has bellowed for help. */
  helped: number;
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
  /** Hew's said there's more coming this lesson (he doesn't say it every wave). */
  moreSaid?: boolean;
  /** How many of Hew's waking lines have been said, and when you were on your feet. */
  said: number;
  upAt: number;
  /** The hero's class: its own lessons, and what Hew makes of you. */
  cls: HeroClass;
  /** Where you stood up: walking a little away starts the first lesson. */
  from: { x: number; y: number } | null;
}
/** What the world is held for, and what lets it go on. */
export type Move = 'move' | Teach;
export interface Hold { kind: 'card' | 'act' | 'praise' | 'talk' | 'relic'; who: string; text: string; how?: string; move?: Move; need: 'continue' | 'move' | 'attack' | 'roll' | 'block' | 'time'; t: number; until: number }

const HERO_ID = 'me';
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
export const WAKE = { fade: 2.5, arrive: 5.2, standing: 0.8 };
/** Hew's way in at the waking: out of the trees west of you, round under the cart, slow and low. */
const SNEAK = { round: [4.2, 36.4] as [number, number], speed: 1.45 };
/** Tutorial pacing: drilled goblins wind up this much slower; one at a time comes at you. */
export const DRILL = { windup: 1.5, wheels: 2, praise: 1, praiseFor: 1.1 };

export function newWood(room: ArenaRoom, cls: HeroClass = 'WARRIOR'): WoodState {
  const w: WoodState = { stage: 0, entered: false, count: 0, ids: [], more: false, cut: -1, caption: null, stoker: 0, helped: 0, hewAlive: true, relic: false, done: false, wake: 0, hold: null, drilled: 0, praised: 0, drillAt: -1, from: null, said: 0, upAt: -1, cls };
  const h = room.heroes.find((x) => x.id === HERO_ID);
  if (h) Object.assign(h, { act: 'down', actT: 0, actDur: 999, lying: true });
  // The field as you come round: goblins dead among the column's dead, and the looters already at them.
  for (const [x, y, how] of GOBLIN_DEAD) Object.assign(spawn(room, { kind: 'scrapper', x, y }), { act: 'dead', hp: 0, death: how, actT: 0, actDur: 1e9, alert: false, drill: false });
  w.ids = lessonsFor(cls)[0].foes.map((f, i) => {
    const [x, y] = FEEDING[i % FEEDING.length], e = spawn(room, { ...f, x, y, awake: false });
    return Object.assign(e, { feeding: true, fx: 1, fy: 0.3 }).id;
  });
  return w;
}

/** You lie still; the screen comes up; Hew creeps out of the trees, keeping low and wide of the goblins
 *  at the dead, checks you over crouched beside you, and stands only to haul you up. */
function stepWake(w: WoodState, room: ArenaRoom, dt: number): void {
  const t = (w.wake += Math.max(0, dt)), n = hew(room), h = room.heroes.find((x) => x.id === HERO_ID);
  if (n && h && w.said < 3 + ([] as string[]).concat(LINES.notice[w.cls]).length) {
    n.sneak = true;
    // Round the back of the field, out of the looters' sight, then in at your side.
    const [tx, ty] = n.x < SNEAK.round[0] - 0.2 ? SNEAK.round : [h.x - 1.0, h.y + 0.3], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    n.walking = d > 0.05;
    if (d > 0.05) (n.x += (dx / d) * Math.min(d, SNEAK.speed * dt)), (n.y += (dy / d) * Math.min(d, SNEAK.speed * dt));
  }
  if (t < WAKE.arrive) return;
  // He talks, one line at a time, each waiting for a tap (the world held); the last as he hauls you up.
  // His checking-over, then what he makes of you, then the boots and up.
  const lines = [LINES.waking[0], LINES.waking[1], ...([] as string[]).concat(LINES.notice[w.cls]), LINES.waking[2], LINES.waking[3]];
  if (w.said < lines.length) {
    if (w.said === lines.length - 1) {
      if (h) Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, hp: h.maxHp, fx: -1, fy: 0 });
      if (n) Object.assign(n, { sneak: false, walking: false });
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

/** This hero's lesson now. */
export const lessonOf = (w: WoodState): Lesson => lessonsFor(w.cls)[Math.min(w.stage, 4)];
/** Does this event count for the lesson? */
const counts = (kind: Lesson['count'], e: FightEvent): boolean =>
  kind === 'kills' ? e.k === 'death' : kind === 'grab' ? e.k === 'hurl' : kind === 'backstab' ? e.k === 'hit' && e.on === 'enemy' && !!e.backstab : kind === 'heavy' ? e.k === 'hit' && e.on === 'enemy' && e.heavy : e.k === kind;

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
function drill(w: WoodState, e: Enemy | null, parryWindow: number, h: Hero): void {
  const a = e?.attack, kind = lessonOf(w).count;
  if (!a || a.t >= a.windup || w.drilled >= DRILL.wheels || w.drillAt === e!.id * 1000 + Math.round(a.windup * 100) + Math.round(a.ox * 10)) return;
  // Already answered it (rolling, or moved out of where it'll land): no need to stop the world.
  if (h.act === 'roll' || !attackCovers(a, h)) return;
  const left = a.windup - a.t;
  const ready = kind === 'dodge' ? a.unblockable && left <= 0.16 : kind === 'block' ? left <= 0.4 : kind === 'parry' ? !a.unblockable && left <= parryWindow * 0.6 : kind === 'slip' ? a.kind !== 'shot' && left <= 0.08 : false;
  if (!ready) return;
  w.drilled++;
  w.drillAt = e!.id * 1000 + Math.round(a.windup * 100) + Math.round(a.ox * 10);
  const move: Move = kind === 'dodge' ? 'roll' : kind === 'block' ? 'block' : kind === 'slip' ? 'slip' : 'parry';
  w.hold = { kind: 'act', who: '', text: LINES.now[move as 'roll' | 'block' | 'parry' | 'slip'], move, need: move === 'roll' || move === 'slip' ? 'roll' : 'block', t: 0, until: 0 };
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

/** Hew's death, beat by beat (seconds): he walks round the hut; the ground shakes; the Stoker rises
 *  behind the cordwood, looks, and runs him down; lifts him off his feet; bites; throws the body; and
 *  bellows at you. Hew and the Stoker are puppeted here (the Stoker's own mind is held still). */
export const CUT = { walk: 0.4, rumble: 2.6, rise: 3.4, run: 4.3, grab: 5.0, last: 5.3, bite: 7.9, toss: 8.5, land: 9.2, bellow: 9.8, line: 10.4, end: 12.8 };
const BACK = { x: 55.5, y: 7.4 };

function stepCut(w: WoodState, room: ArenaRoom, ev: FightEvent[], dt: number): void {
  const t0 = w.cut, t = (w.cut += dt), at = (s: number) => t0 < s && t >= s, n = hew(room);
  const ease = (k: number) => k * k * (3 - 2 * k), span = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  let s = room.enemies.find((e) => e.id === w.stoker);
  // (If he's somehow behind, he's at his door when it starts.)
  if (n && t0 === 0 && Math.hypot(n.x - 52, n.y - 10) > 4) (n.x = 52), (n.y = 10);
  // He goes round the side of the hut to the cordwood, at an old man's pace.
  if (at(CUT.walk)) say(w, room, 'HEW', LINES.round, 2.2);
  if (n && t < CUT.rise) {
    const dx = BACK.x - n.x, dy = BACK.y - n.y, d = Math.hypot(dx, dy);
    n.walking = d > 0.05;
    if (d > 0.05) (n.x += (dx / d) * Math.min(d, 1.6 * dt)), (n.y += (dy / d) * Math.min(d, 1.6 * dt));
  }
  if (at(CUT.rumble)) ev.push({ k: 'rumble', x: STOKER.x, y: STOKER.y });
  if (at(CUT.rise)) {
    s = spawn(room, STOKER);
    w.stoker = s.id;
    Object.assign(s, { fx: -1, fy: 0.6 });
    if (n) n.walking = false;
    ev.push({ k: 'spotted', x: s.x, y: s.y });
  }
  if (s) s.hitstop = 1;
  // It looks at him a breath, then runs him down.
  if (s && n && t >= CUT.run && t < CUT.grab) {
    const k = ease(span(CUT.run, CUT.grab)), tx = n.x + 0.9, ty = n.y - 0.4;
    s.x = STOKER.x + (tx - STOKER.x) * k;
    s.y = STOKER.y + (ty - STOKER.y) * k;
    s.moving = true;
    const l = Math.hypot(n.x - s.x, n.y - s.y) || 1;
    (s.fx = (n.x - s.x) / l), (s.fy = (n.y - s.y) / l);
  }
  if (at(CUT.grab) && s) (s.moving = false), ev.push({ k: 'impact', x: s.x, y: s.y, kind: 'cleave' });
  // Off his feet, held up at its mouth; he gets his last words out.
  if (n && t >= CUT.grab && t < CUT.toss) n.lift = 22 * ease(span(CUT.grab, CUT.grab + 0.5)) + (t > CUT.grab + 0.5 && t < CUT.bite ? Math.sin(t * 30) * 0.8 : 0);
  if (at(CUT.last)) say(w, room, 'HEW', LINES.last, 2);
  if (at(CUT.bite) && n) {
    n.pose = 'headless';
    ev.push({ k: 'bite', x: n.x, y: n.y });
    w.hewAlive = false;
  }
  // Thrown up onto its own cordwood pile, like a log: kept, not wasted.
  if (n && t >= CUT.toss && t < CUT.land) {
    const k = span(CUT.toss, CUT.land), from = { x: (s?.x ?? 56) - 0.9, y: (s?.y ?? 7) + 0.4 }, to = { x: 59.3, y: 6.7 };
    n.x = from.x + (to.x - from.x) * k;
    n.y = from.y + (to.y - from.y) * k;
    n.lift = 22 * (1 - k) + 40 * Math.sin(Math.PI * k) + 6 * k;
  }
  if (at(CUT.land) && n) (n.lift = 6), (n.pose = 'body'), ev.push({ k: 'thud', x: n.x, y: n.y });
  // Then it turns on you, and bellows.
  if (s && t >= CUT.land) {
    const h = room.heroes.find((x) => x.id === HERO_ID), l = h ? Math.hypot(h.x - s.x, h.y - s.y) || 1 : 1;
    if (h) (s.fx = (h.x - s.x) / l), (s.fy = (h.y - s.y) / l);
  }
  if (at(CUT.bellow) && s) ev.push({ k: 'bellow', x: s.x, y: s.y });
  if (at(CUT.line)) say(w, room, 'THE STOKER', LINES.stoker, 2.2);
  if (t >= CUT.end) {
    if (n) Object.assign(n, { pose: 'body', lift: 6, walking: false, name: '', talk: 'hewdead' }, n.pose === 'body' ? {} : { x: 59.3, y: 6.7 });
    w.hewAlive = false;
    const e = room.enemies.find((x) => x.id === w.stoker) ?? spawn(room, STOKER);
    w.stoker = e.id;
    Object.assign(e, { alert: true, cooldown: 1.2, hitstop: 0, moving: false });
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
    w.helped = 0;
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
  const n = hew(room), lesson = lessonOf(w);
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
    Object.assign(w, { entered: true, count: 0, drilled: 0, praised: 0, moreSaid: false });
    if (w.stage === 4) {
      w.cut = 0;
      say(w, room, 'HEW', LINES.hut, 2);
      return;
    }
    // (The field's looters are already there, at the dead: they look up now.)
    if (w.stage === 0 && w.ids.length) {
      for (const e of room.enemies) if (w.ids.includes(e.id)) Object.assign(e, { feeding: false, alert: true });
    } else w.ids = lesson.foes.map((f) => spawn(room, f).id);
    const move: Teach = lesson.card ?? (['attack', 'roll', 'block', 'parry'] as const)[w.stage];
    const said = move === 'backstab' ? LINES.teach.backstab : move === 'slip' ? LINES.teach.slip : move === 'heavy' ? (w.cls === 'MAGE' ? LINES.teach.charge : LINES.teach.heavy) : [LINES.attack, LINES.dodge, LINES.block, LINES.parry][w.stage];
    const light = lessonsFor(w.cls)[3].count === 'slip';
    w.hold = card('HEW', said, move, 'continue', move === 'roll' && light ? LINES.how.rollLight : LINES.how[move as keyof typeof LINES.how]);
    return;
  }
  if (!w.entered) return;
  const kind = lesson.count;
  let good = false;
  for (const e of ev) if (counts(kind, e)) (w.count += kind === 'kills' ? 0 : 1), (good = true);
  // Done it right: the fight stops a moment for a word from Hew.
  // Done it right: a word from Hew in passing (once a lesson; the fight doesn't stop for it).
  if (good && w.praised < DRILL.praise && w.hewAlive) {
    w.praised++;
    say(w, room, 'HEW', LINES.praise[w.stage % LINES.praise.length], 1.8);
  }
  drill(w, oneAtATime(w, room, h.x, h.y), parryWindow, h);
  if (w.hold) return;
  const left = room.enemies.filter((e) => w.ids.includes(e.id) && !isDead(e));
  // The Stoker: two more come at half its health; the relic comes out of it.
  if (w.stage === 4) {
    const s = room.enemies.find((e) => e.id === w.stoker);
    // It bellows into the trees for help: at two thirds of its health, then at one third.
    const call = STOKER_CALLS[w.helped];
    if (s && call && s.hp < s.maxHp * call.at) {
      w.helped++;
      ev.push({ k: 'bellow', x: s.x, y: s.y });
      w.ids.push(...call.foes.map((f) => spawn(room, f).id));
    }
    if (s && isDead(s) && !w.relic) {
      w.relic = true;
      // Everything stops: you hold it up, the light comes, and the card says what it is.
      w.hold = { kind: 'relic', who: '', text: LINES.relic, how: LINES.how.relic, move: 'relic', need: 'continue', t: 0, until: 0 };
      ev.push({ k: 'fanfare', x: h.x, y: h.y });
      openGate(room, 4);
      Object.assign(w, { stage: 5, entered: true });
    }
    return;
  }
  // The field: two more looters run in when the first three are down.
  if (w.stage === 0 && !left.length && !w.more && lesson.more) {
    w.more = true;
    w.ids.push(...lesson.more.map((f) => spawn(room, f).id));
    // A Warrior: the next two are for throwing.
    if (lesson.count === 'grab') w.hold = card('HEW', LINES.teach.grab, 'grab', 'continue', LINES.how.grab);
    return;
  }
  // Cleared them before the lesson took: they come again.
  if (!left.length && w.count < lesson.need) {
    w.ids = lesson.foes.map((f) => spawn(room, { ...f, awake: true }).id);
    if (!w.moreSaid) (w.moreSaid = true), say(w, room, 'HEW', LINES.more, 3);
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
  if (w.stage === 5) return { title: 'THE ROAD', text: 'Follow the arrow west, to Wickhold' };
  if (w.stage === 4 && w.entered && w.cut < 0) return { title: 'KILL THE STOKER', text: 'Roll out of anything striped' };
  // On the way to the hut, and while Hew's there: no skill to teach a hero who has none yet.
  if (w.stage === 4) return { title: "HEW'S HUT", text: w.entered ? 'Wait for Hew' : 'Follow Hew' };
  const l = lessonOf(w), key: Record<string, string> = touch
    ? { GRAB: 'HIT IT, TAP GRAB, AGAIN TO THROW', ATTACK: 'TAP ATTACK', DODGE: 'TAP ROLL', BLOCK: 'HOLD BLOCK', PARRY: 'TAP BLOCK ON THE WHITE FLASH', SKILL: 'TAP SKILL', BACKSTAB: 'GET BEHIND, TAP ATTACK', 'FULL DRAW': 'HOLD ATTACK, LET GO', 'FULL CHARGE': 'HOLD ATTACK, LET GO', 'LAST SECOND': 'TAP ROLL AS IT LANDS' }
    : { GRAB: 'HIT IT, F, F AGAIN TO THROW', ATTACK: 'CLICK', DODGE: 'SPACE', BLOCK: 'HOLD RIGHT CLICK', PARRY: 'TAP RIGHT CLICK ON THE WHITE FLASH', SKILL: 'E', BACKSTAB: 'GET BEHIND, CLICK', 'FULL DRAW': 'HOLD LEFT CLICK, LET GO', 'FULL CHARGE': 'HOLD LEFT CLICK, LET GO', 'LAST SECOND': 'SPACE AS IT LANDS' };
  if (w.wake >= 0) return { title: '', text: '' };
  if (!w.entered) return { title: l.name, text: w.stage ? 'Follow Hew' : 'Walk' };
  const what = { kills: '', dodge: 'DODGES', block: 'BLOCKS', parry: 'PARRIES', slip: 'LAST-SECOND DODGES', backstab: 'FROM BEHIND', heavy: 'FULL SHOTS', grab: 'THROWN', none: '' }[l.count];
  // A Warrior's field: hit them first; the throwing comes with the second pair.
  if (l.count === 'grab') return w.more ? { title: `GRAB: ${key.GRAB}`, text: `${what} ${Math.min(w.count, l.need)} / ${l.need}` } : { title: `ATTACK: ${key.ATTACK}`, text: 'Clear them' };
  return { title: `${l.teach}: ${key[l.teach]}`, text: what ? `${what} ${Math.min(w.count, l.need)} / ${l.need}` : w.stage === 4 ? 'Kill it' : 'Clear them' };
}
export { AREAS };
