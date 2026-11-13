/**
 * The runner (docs/design/town-quests.md section 1): a few seconds after a new hero first walks into
 * Wickhold's street, someone runs up, says who wants them (a strip, as the wood's talk is: the world
 * doesn't stop), and runs off again. Who comes depends on the class (Kyle, 2026-11-12; errandwords.ts):
 * Wat from his whetstone for a Warrior, Tam from the square for a Rogue, Oswin for a Healer, Lis for a
 * Mage, and for a Ranger Maeve's own hound with her note. Someone who already stands in the street
 * is gone from their spot while they're out (and comes from it, if it's near). Only on this player's screen: puppetry, nothing the
 * room decides. Once they've said it, the first two errands are the hero's (shared/errands.ts).
 */
import type { GameMap, Npc } from '../shared/arena';
import { runnerDue, told } from '../shared/errands';
import type { Profile } from '../shared/progress';
import { RUNNERS } from './errandwords';

/** Seconds in the street before they come; how fast they run (tiles a second); how near they stop. */
const WAIT = 3, SPEED = 4.2, HOUND_SPEED = 6, STOP = 1.3, FAR = 9;
/** How long the line stays up: a base and a little a letter (a tap ends it sooner). */
const SAY = (text: string) => 3 + text.length / 22;

interface Run { phase: 'in' | 'say' | 'out'; x: number; y: number; fx: number; from: { x: number; y: number }; until: number; npc?: Npc; hidden?: Npc; map: GameMap; who: string; text: string; hound: boolean }

/** What a frame needs from the game. */
export interface RunnerWorld { street: GameMap | null; hero: { x: number; y: number } | null; profile: Profile; busy: boolean; keep: () => void }

export class Runner {
  private waited = 0;
  private run: Run | null = null;

  /** Maeve's hound running in, for the views to draw (null: none). */
  hound(): { x: number; y: number; fx: number; moving: boolean } | null {
    const r = this.run;
    return r?.hound ? { x: r.x, y: r.y, fx: r.fx, moving: r.phase !== 'say' } : null;
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
      if (!w.street || !w.hero || w.busy || !runnerDue(w.profile)) return void (this.waited = 0);
      if ((this.waited += dt) >= WAIT) this.start(w.street, w.hero, w.profile, now);
      return;
    }
    const me = w.hero!;
    if (r.phase === 'in') {
      if (this.step(r, me.x + Math.sign(r.x - me.x || 1) * 0.4, me.y + 0.2, dt) <= STOP) {
        r.phase = 'say';
        r.until = now + SAY(r.text);
        r.fx = me.x >= r.x ? 1 : -1;
        told(w.profile);
        w.keep();
      }
    } else if (r.phase === 'say') {
      if (now >= r.until) r.phase = 'out';
    } else if (this.step(r, r.from.x, r.from.y, dt) < 0.15) this.end();
    if (r.npc) Object.assign(r.npc, { x: r.x, y: r.y, fx: r.fx, walking: r.phase !== 'say' });
  }

  /** Run toward (tx, ty); the distance left. */
  private step(r: Run, tx: number, ty: number, dt: number): number {
    const dx = tx - r.x, dy = ty - r.y, d = Math.hypot(dx, dy), go = Math.min(d, (r.hound ? HOUND_SPEED : SPEED) * dt);
    if (d > 0.01) (r.x += (dx / d) * go), (r.y += (dy / d) * go), Math.abs(dx) > 0.05 && (r.fx = Math.sign(dx));
    return d - go;
  }

  private start(map: GameMap, me: { x: number; y: number }, p: Profile, now: number): void {
    const who = RUNNERS[p.cls], npcs = map.npcs ?? [];
    // Someone already in the street (Wat at his whetstone, Tam in the square) comes from where they stand.
    const hidden = who.hound ? undefined : npcs.find((n) => n.name === who.who || n.name.endsWith(' ' + who.who));
    const from = hidden && Math.hypot(hidden.x - me.x, hidden.y - me.y) < FAR * 1.25 ? { x: hidden.x, y: hidden.y } : startAt(map, me);
    const run: Run = { phase: 'in', x: from.x, y: from.y, fx: me.x >= from.x ? 1 : -1, from, until: now, map, who: who.who, text: who.text, hound: !!who.hound };
    // (Coming from further off, they're away from their spot all the same while they're out.)
    if (hidden) (run.hidden = hidden), npcs.splice(npcs.indexOf(hidden), 1);
    if (!who.hound) {
      run.npc = { name: who.who, x: from.x, y: from.y, talk: 'runner', look: hidden?.look ?? who.look, mute: true, walking: true, fx: run.fx };
      npcs.push(run.npc);
      map.npcs = npcs;
    }
    this.run = run;
  }

  private end(): void {
    const r = this.run;
    this.run = null;
    this.waited = 0;
    if (!r) return;
    const npcs = r.map.npcs ?? [];
    if (r.npc && npcs.includes(r.npc)) npcs.splice(npcs.indexOf(r.npc), 1);
    if (r.hidden && !npcs.includes(r.hidden)) npcs.push(r.hidden);
  }
}

/** Somewhere about FAR tiles off with a clear run in to the hero (no building in the way), else the nearest clear spot. */
function startAt(map: GameMap, me: { x: number; y: number }): { x: number; y: number } {
  const inside = (x: number, y: number) => x < 1 || y < 1 || x > map.w - 1 || y > map.h - 1 || map.blocks.some((b) => x > b.x - 0.3 && x < b.x + b.w + 0.3 && y > b.y - 0.3 && y < b.y + b.h + 0.3);
  const clear = (x: number, y: number) => {
    for (let k = 0; k <= 1; k += 0.05) if (inside(me.x + (x - me.x) * k, me.y + (y - me.y) * k) && k > 0.02) return false;
    return true;
  };
  for (const far of [FAR, FAR * 0.7, FAR * 0.45]) {
    for (let i = 0; i < 16; i++) {
      const a = Math.PI / 2 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8), x = me.x + Math.cos(a) * far, y = me.y + Math.sin(a) * far;
      if (clear(x, y)) return { x, y };
    }
  }
  return { x: me.x, y: Math.min(map.h - 1.5, me.y + 3) };
}

/** The one runner, for the game's frame and the views. */
export const runner = new Runner();

/** Maeve's hound as the views draw it (a Hound shape for drawHound), or null. */
export function runnerHound(): { d: import('../sim/types').Hound; x: number; y: number; moving: boolean } | null {
  const h = runner.hound();
  if (!h) return null;
  return { x: h.x, y: h.y, moving: h.moving, d: { x: h.x, y: h.y, fx: h.fx, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: h.moving } };
}
