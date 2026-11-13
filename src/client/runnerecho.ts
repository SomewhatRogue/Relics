/**
 * Other players' runners, as this screen sees them (runner.ts; Kyle, 2026-11-13: it freezes nothing
 * for anyone else in town, they just see the runner and can't talk to them). Each is heard as a short
 * word (townfolk.ts: the class, where they stop, the phase, how long into it) and played here along the
 * same way as on the arriving player's screen (runnerpath.ts): out of their hall, round to the hero,
 * standing there while they say it, and home. No strip, no camera, no TALK (mute). Drawing only.
 */
import type { GameMap, Npc } from '../shared/arena';
import { TRAINER_DOOR } from '../shared/errands';
import { CLASS_ORDER } from '../shared/weapons';
import { RUNNERS } from './errandwords';
import { HOUND_SPEED, SPEED, runner, type RunnerWord } from './runner';
import { runnerWay } from './runnerpath';

type P = { x: number; y: number };
export interface HeardRunner { id: string; w: RunnerWord; heard: number }
interface Echo { key: string; map: GameMap; way: P[]; hound: boolean; npc?: Npc; hidden?: Npc; at: { x: number; y: number; fx: number; moving: boolean } | null }

/** The point `d` tiles along `way`, which way it's heading, and whether it's run out. */
function along(way: P[], d: number): { x: number; y: number; fx: number; done: boolean } {
  let fx = 1;
  for (let i = 1; i < way.length; i++) {
    const a = way[i - 1], b = way[i], l = Math.hypot(b.x - a.x, b.y - a.y);
    if (Math.abs(b.x - a.x) > 0.05) fx = Math.sign(b.x - a.x);
    if (d <= l) return { x: a.x + ((b.x - a.x) * d) / (l || 1), y: a.y + ((b.y - a.y) * d) / (l || 1), fx, done: false };
    d -= l;
  }
  const e = way[way.length - 1];
  return { x: e.x, y: e.y, fx, done: true };
}

export class RunnerEchoes {
  private live = new Map<string, Echo>();

  /** Each frame: the runners heard of for this street (`street` null: not in it, and none are shown). */
  frame(street: GameMap | null, heard: HeardRunner[], now: number): void {
    const want = new Set<string>();
    for (const h of street ? heard : []) {
      const [ci, sx, sy, phase, age] = h.w, cls = CLASS_ORDER[ci];
      if (!cls) continue;
      const key = `${h.id}:${ci}:${sx}:${sy}`;
      let e = this.live.get(h.id);
      if (e && (e.key !== key || e.map !== street)) this.drop(h.id), (e = undefined);
      if (!e) this.live.set(h.id, (e = this.make(key, street!, cls, { x: sx, y: sy })));
      want.add(h.id);
      const go = (age + Math.max(0, now - h.heard)) * (e.hound ? HOUND_SPEED : SPEED);
      const p = phase === 0 ? along(e.way, go) : phase === 1 ? { ...along(e.way, 1e9), done: false } : along(e.way.slice().reverse(), go);
      if (phase === 1) p.fx = Math.sign(e.way[e.way.length - 1].x - e.way[0].x) || 1;
      // Home again: gone from the street (what they're told next takes them out of the list).
      e.at = phase === 2 && p.done ? null : { x: p.x, y: p.y, fx: p.fx, moving: phase !== 1 };
      if (e.npc) this.place(e);
    }
    for (const id of [...this.live.keys()]) if (!want.has(id)) this.drop(id);
  }

  /** Maeve's hound, each one out on another's errand. */
  hounds(): { x: number; y: number; fx: number; moving: boolean }[] {
    return [...this.live.values()].filter((e) => e.hound && e.at).map((e) => e.at!);
  }

  private make(key: string, map: GameMap, cls: (typeof CLASS_ORDER)[number], stand: P): Echo {
    const who = RUNNERS[cls], e: Echo = { key, map, way: runnerWay(map, TRAINER_DOOR[cls], stand), hound: !!who.hound, at: null };
    if (who.hound) return e;
    const npcs = (map.npcs ??= []);
    // Someone who also stands in the street is away from their spot while they're out, here as there.
    const hidden = npcs.find((n) => !n.mute && (n.name === who.who || n.name.endsWith(' ' + who.who)));
    if (hidden) (e.hidden = hidden), npcs.splice(npcs.indexOf(hidden), 1);
    e.npc = { name: who.who, x: e.way[0].x, y: e.way[0].y, talk: 'runner', look: hidden?.look ?? who.look, mute: true, walking: true, fx: 1 };
    return e;
  }

  private place(e: Echo): void {
    const npcs = (e.map.npcs ??= []), on = npcs.includes(e.npc!);
    if (!e.at) return void (on && npcs.splice(npcs.indexOf(e.npc!), 1));
    if (!on) npcs.push(e.npc!);
    Object.assign(e.npc!, { x: e.at.x, y: e.at.y, fx: e.at.fx, walking: e.at.moving });
  }

  private drop(id: string): void {
    const e = this.live.get(id);
    this.live.delete(id);
    if (!e) return;
    const npcs = e.map.npcs ?? [];
    if (e.npc && npcs.includes(e.npc)) npcs.splice(npcs.indexOf(e.npc), 1);
    if (e.hidden && !npcs.includes(e.hidden)) npcs.push(e.hidden);
  }
}

/** Everyone else's runners on this screen. */
export const echoes = new RunnerEchoes();

/** Every Maeve's hound out on an errand (this player's and others'), as the views draw them (drawHound's shape). */
export function runnerHounds(): { d: import('../sim/types').Hound; x: number; y: number; moving: boolean }[] {
  const mine = runner.hound();
  return [...(mine ? [mine] : []), ...echoes.hounds()].map((h) => ({ x: h.x, y: h.y, moving: h.moving, d: { x: h.x, y: h.y, fx: h.fx, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: h.moving } }));
}
