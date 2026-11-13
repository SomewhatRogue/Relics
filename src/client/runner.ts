/**
 * A new hero's arrival in Wickhold, and their runner (docs/design/town-quests.md section 1; the scene
 * as Kyle asked for it, 2026-11-13). The first time a new hero stands in the street, a short scene:
 * the frame held a moment on them in the north gate, then they walk in; the camera cuts to their
 * trainer's hall, the runner comes out of its door, and the camera follows them running up; they say
 * who wants the hero (on the wood's strip, the letterbox bars in); then it's the player's again, and the
 * runner heads home. Who comes depends on the class (Kyle, 2026-11-12; errandwords.ts): Wat out of the
 * barracks, Oswin out of the church, Tam out of the Drowned Rat, Lis out of the tower, and for a
 * Ranger Maeve's own hound out of the lodge with her note. Someone who also stands in the street (Wat at
 * his whetstone, Tam in the square) is gone from their spot while they're out. Only on this player's
 * screen: puppetry and the camera; the walk in is the hero's own steps. Once they've said it, the first
 * two errands are the hero's (shared/errands.ts); leaving before that, they come again next time.
 */
import { doorAt, type GameMap, type Npc } from '../shared/arena';
import { TRAINER_DOOR, runnerDue, told } from '../shared/errands';
import type { Profile } from '../shared/progress';
import { RUNNERS } from './errandwords';
import { wayThrough } from './runnerpath';
import type { HeroClass } from '../shared/weapons';

type P = { x: number; y: number };
/** The held frame, the walk in (at most), the beat before the cut (seconds); how fast they run; how near they stop. */
const HOLD = 0.9, WALK = 2.6, BEAT = 0.5, SPEED = 5.2, HOUND_SPEED = 6.5, STOP = 0.12;
/** How long the line stays up: a base and a little a letter (a tap ends it sooner). */
const SAY = (text: string) => 3 + text.length / 22;

type Phase = 'hold' | 'walk' | 'beat' | 'in' | 'say' | 'out';
interface Run { cls: HeroClass; phase: Phase; t: number; x: number; y: number; fx: number; way: P[]; at: number; cut: boolean; until: number; npc?: Npc; hidden?: Npc; map: GameMap; who: string; text: string; hound: boolean; stopY: number }

/** What a frame needs from the game. `place` puts the hero somewhere (null when this screen doesn't run the room). */
export interface RunnerWorld { street: GameMap | null; hero: P | null; profile: Profile; busy: boolean; keep: () => void; gate: P | null; place: ((x: number, y: number) => void) | null }

export class Runner {
  private run: Run | null = null;

  /** The arrival scene is on: the cutscene look, no HUD, the hero the scene's. */
  scene(): boolean {
    const r = this.run;
    return !!r && r.phase !== 'out';
  }

  /** Where the camera looks (`snap`: cut, don't ease), or null: the hero, as ever. */
  focus(hero: P | null): (P & { snap?: boolean }) | null {
    const r = this.run;
    if (!r || r.phase === 'out' || !hero) return null;
    if (r.phase === 'in') return { x: r.x, y: r.y - 0.4, snap: r.cut };
    if (r.phase === 'say') return { x: (r.x + hero.x) / 2, y: (r.y + hero.y) / 2 - 0.4 };
    return { x: hero.x, y: hero.y - 0.4 };
  }

  /** The hero's stick while the scene has them: still, or walking in through the gate. */
  walk(): { mx: number; my: number } | null {
    const r = this.run;
    return !r || r.phase === 'out' ? null : r.phase === 'walk' ? { mx: 0, my: 0.5 } : { mx: 0, my: 0 };
  }

  /** Maeve's hound running in, for the views to draw (null: none). */
  hound(): { x: number; y: number; fx: number; moving: boolean } | null {
    const r = this.run;
    return r?.hound && (r.phase === 'in' || r.phase === 'say' || r.phase === 'out') ? { x: r.x, y: r.y, fx: r.fx, moving: r.phase !== 'say' } : null;
  }

  /** The line on the strip while it's being said. */
  caption(now: number): { who: string; text: string } | null {
    const r = this.run;
    return r?.phase === 'say' && now < r.until ? { who: r.who, text: r.text } : null;
  }

  /** A tap on the strip: that's said. */
  skip(now: number): void {
    if (this.run?.phase === 'say') this.run.until = Math.min(this.run.until, now);
  }

  frame(w: RunnerWorld, now: number, dt: number): void {
    const r = this.run;
    // Out of the street (a hall, a job): whoever was running is back where they were; if they never said it, they come again next time.
    if (r && (w.street !== r.map || !w.hero)) return this.end();
    if (!r) {
      if (w.street && w.hero && !w.busy && runnerDue(w.profile)) this.start(w, now);
      return;
    }
    const me = w.hero!;
    r.t += dt;
    if (r.phase === 'hold' && r.t >= HOLD) (r.phase = 'walk'), (r.t = 0);
    else if (r.phase === 'walk' && (r.t >= WALK || me.y >= r.stopY)) (r.phase = 'beat'), (r.t = 0);
    else if (r.phase === 'beat' && r.t >= BEAT) this.go(r, me);
    else if (r.phase === 'in') {
      r.cut = false;
      if (this.follow(r, dt)) {
        r.phase = 'say';
        r.until = now + SAY(r.text);
        r.fx = me.x >= r.x ? 1 : -1;
        told(w.profile);
        w.keep();
      }
    } else if (r.phase === 'say') {
      if (now >= r.until) (r.phase = 'out'), (r.way = r.way.slice().reverse()), (r.at = 0);
    } else if (r.phase === 'out' && this.follow(r, dt)) return this.end();
    if (r.npc) Object.assign(r.npc, { x: r.x, y: r.y, fx: r.fx, walking: r.phase === 'in' || r.phase === 'out' });
  }

  /** On along the way; true at its end. */
  private follow(r: Run, dt: number): boolean {
    let go = (r.hound ? HOUND_SPEED : SPEED) * dt;
    while (r.at < r.way.length) {
      const p = r.way[r.at], dx = p.x - r.x, dy = p.y - r.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.05) r.fx = Math.sign(dx);
      if (d > go) return (r.x += (dx / d) * go), (r.y += (dy / d) * go), false;
      (r.x = p.x), (r.y = p.y), (go -= d), r.at++;
    }
    return Math.hypot(r.x - r.way[r.way.length - 1].x, r.y - r.way[r.way.length - 1].y) <= STOP;
  }

  private start(w: RunnerWorld, now: number): void {
    const map = w.street!, me = w.hero!, who = RUNNERS[w.profile.cls], npcs = map.npcs ?? [];
    const run: Run = { cls: w.profile.cls, phase: 'beat', t: 0, x: me.x, y: me.y, fx: 1, way: [], at: 0, cut: false, until: now, map, who: who.who, text: who.text, hound: !!who.hound, stopY: me.y };
    // Just come through the north gate: the frame held on them in the gateway, then they walk in.
    if (w.gate && w.place && Math.hypot(me.x - w.gate.x, me.y - (w.gate.y + 1.6)) < 2.5) {
      w.place(w.gate.x, w.gate.y + 0.35);
      Object.assign(run, { phase: 'hold', stopY: w.gate.y + 3.6 });
    }
    // Someone who also stands in the street is away from their spot while they're out.
    const hidden = who.hound ? undefined : npcs.find((n) => n.name === who.who || n.name.endsWith(' ' + who.who));
    if (hidden) (run.hidden = hidden), npcs.splice(npcs.indexOf(hidden), 1);
    this.run = run;
  }

  /** The cut: the runner in their hall's doorway, the way to the hero worked out, and the camera on them. */
  private go(r: Run, me: P): void {
    const map = r.map, b = map.blocks.find((x) => x.door === TRAINER_DOOR[r.cls]);
    const step = b ? doorAt(b) : { x: me.x, y: Math.min(map.h - 1.5, me.y + 6) }, inDoor = b ? { x: step.x, y: b.y + b.h - 0.1 } : step;
    const d = Math.hypot(step.x - me.x, step.y - me.y) || 1, stand = { x: me.x + ((step.x - me.x) / d) * 1.1, y: me.y + ((step.y - me.y) / d) * 0.6 + 0.15 };
    Object.assign(r, { phase: 'in', t: 0, x: inDoor.x, y: inDoor.y, way: [inDoor, ...wayThrough(map, step, stand)], at: 1, cut: true, fx: me.x >= step.x ? 1 : -1 });
    if (!r.hound) {
      const npcs = map.npcs ?? [];
      r.npc = { name: r.who, x: r.x, y: r.y, talk: 'runner', look: r.hidden?.look ?? RUNNERS[r.cls].look, mute: true, walking: true, fx: r.fx };
      npcs.push(r.npc);
      map.npcs = npcs;
    }
  }

  private end(): void {
    const r = this.run;
    this.run = null;
    if (!r) return;
    const npcs = r.map.npcs ?? [];
    if (r.npc && npcs.includes(r.npc)) npcs.splice(npcs.indexOf(r.npc), 1);
    if (r.hidden && !npcs.includes(r.hidden)) npcs.push(r.hidden);
  }
}

/** The one runner, for the game's frame and the views. */
export const runner = new Runner();

/** Maeve's hound as the views draw it (a Hound shape for drawHound), or null. */
export function runnerHound(): { d: import('../sim/types').Hound; x: number; y: number; moving: boolean } | null {
  const h = runner.hound();
  if (!h) return null;
  return { x: h.x, y: h.y, moving: h.moving, d: { x: h.x, y: h.y, fx: h.fx, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: h.moving } };
}
