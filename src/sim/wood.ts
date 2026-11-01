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
}

const HERO_ID = 'me', CUT = { stoker: 2, round: 2.4, draw: 3.6, drag: 4.4, last: 4.6, behind: 5.6, blow: 6.4, line: 7.6, end: 9.6 };
const hew = (room: ArenaRoom) => room.map.npcs?.find((n) => n.talk === 'hew');
const say = (w: WoodState, room: ArenaRoom, who: string, text: string, s = 5) => (w.caption = { who, text, until: room.time + s });

function spawn(room: ArenaRoom, f: Foe & { variant?: Enemy['variant'] }): Enemy {
  const e = newEnemy(Math.max(0, ...room.enemies.map((o) => o.id)) + 1, f.kind, f.x, f.y);
  if (f.variant === 'looter' || f.variant === 'lunger' || f.variant === 'heavy') e.hp = e.maxHp = { looter: 14, lunger: 30, heavy: 110 }[f.variant];
  if (f.variant === 'stoker') e.hp = e.maxHp = 520;
  Object.assign(e, { respawns: false, name: f.name, bow: f.bow, variant: f.variant, alert: f.awake ?? false });
  room.enemies.push(e);
  return e;
}

export function newWood(room: ArenaRoom): WoodState {
  const w: WoodState = { stage: 0, entered: false, count: 0, ids: [], more: false, cut: -1, caption: null, stoker: 0, helped: false, hewAlive: true, relic: false, done: false };
  say(w, room, 'HEW', LINES.wake, 6);
  return w;
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
    say(w, room, '', 'Again. It remembers you, too.', 3);
    return;
  }
  if (n) (h.x = n.x + 0.8), (h.y = n.y);
  say(w, room, 'HEW', LINES.up[Math.floor(room.time) % LINES.up.length], 3);
}

/** After each frame of the room: the prologue's own rules. */
export function stepWood(w: WoodState, room: ArenaRoom, ev: FightEvent[], dt: number): void {
  if (w.done) return;
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
  // Walk into the area: its goblins come out and Hew says his piece.
  // (The first lesson waits for Hew to finish getting you up.)
  if (!w.entered && areaAt(h.x, h.y) === lesson.area && (w.stage > 0 || room.time > 5)) {
    w.entered = true;
    w.count = 0;
    if (w.stage === 4) {
      w.cut = 0;
      say(w, room, 'HEW', LINES.hut, 2);
      return;
    }
    w.ids = lesson.foes.map((f) => spawn(room, f).id);
    say(w, room, 'HEW', [LINES.attack, LINES.dodge, LINES.block, LINES.parry][w.stage], 5);
  }
  if (!w.entered) return;
  const kind = lesson.count;
  for (const e of ev) if ((kind === 'dodge' && e.k === 'dodge') || (kind === 'block' && e.k === 'block') || (kind === 'parry' && e.k === 'parry')) w.count++;
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
    say(w, room, 'HEW', 'Again. Properly, this time.', 3);
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
  if (!w.entered) return { title: l.name, text: 'Follow Hew' };
  const what = { kills: '', dodge: 'DODGES', block: 'BLOCKS', parry: 'PARRIES', none: '' }[l.count];
  return { title: `${l.teach}: ${key[l.teach]}`, text: what ? `${what} ${Math.min(w.count, l.need)} / ${l.need}` : w.stage === 4 ? 'Kill it' : 'Clear them' };
}
export { AREAS };
