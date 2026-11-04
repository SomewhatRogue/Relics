/**
 * Hew's death at his hut (Kyle, 2026-11-04: "the big monster grab Hew and he starts screaming and
 * dies... his head exploded and is thrown against a wall and slides down it, then the monster
 * bellows and attacks you"). Beat by beat, in seconds: he goes round the side of the hut; the ground
 * shakes; the Stoker comes up from behind the cordwood and runs him down; it has him off his feet;
 * he shouts the one thing he wants done, then screams; his head goes; it throws him into the front
 * of his own hut and he slides down the wall, leaving it red; it bellows, no words, and comes for
 * you. Hew and the Stoker are puppeted here (the Stoker's own mind is held still till the end).
 */
import { LINES, STOKER } from '../shared/wood';
import type { ArenaRoom } from './room';
import type { FightEvent } from './types';
import { HERO_ID, hew, say, spawn } from './woodkit';
import type { WoodState } from './wood';

export const CUT = { walk: 0.4, rumble: 2.6, rise: 3.4, run: 4.3, grab: 5.0, last: 5.15, scream: 6.35, cutoff: 7.05, burst: 7.5, toss: 7.75, wall: 8.1, slid: 8.9, bellow: 9.15, end: 9.8 };
/** Where he goes round to (by the cordwood), and where he hits the hut's front wall (and how high up it, in pixels). */
const BACK = { x: 55.5, y: 7.4 }, WALL = { x: 54.2, y: 6.2, up: 13 };

/** Skip the cutscene (the game offers it once it has been seen). */
export function skipCut(w: WoodState, room: ArenaRoom): void {
  if (w.cut < 0) return;
  w.cut = CUT.end;
  stepCut(w, room, [], 0);
}

export function stepCut(w: WoodState, room: ArenaRoom, ev: FightEvent[], dt: number): void {
  const t0 = w.cut, t = (w.cut += dt), at = (s: number) => t0 < s && t >= s, n = hew(room);
  const ease = (k: number) => k * k * (3 - 2 * k), span = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const shout = (text: string, until: number) => (w.caption = { who: 'HEW', text, until: room.time + until });
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
  // Off his feet, held up at its mouth, kicking; harder once he's screaming.
  if (n && t >= CUT.grab && t < CUT.toss) n.lift = 22 * ease(span(CUT.grab, CUT.grab + 0.5)) + (t > CUT.grab + 0.5 && t < CUT.burst ? Math.sin(t * (t > CUT.scream ? 44 : 30)) * (t > CUT.scream ? 1.6 : 0.8) : 0);
  // What he wants done, shouted at you; then he screams, and it's cut off.
  if (at(CUT.last)) shout(LINES.last, CUT.scream - CUT.last);
  if (at(CUT.scream)) shout(LINES.screams[0], CUT.cutoff - CUT.scream);
  if (at(CUT.cutoff)) shout(LINES.scream, CUT.burst - CUT.cutoff);
  if (at(CUT.burst)) w.caption = null;
  if (at(CUT.burst) && n) {
    n.pose = 'headless';
    ev.push({ k: 'bite', x: n.x, y: n.y });
    w.hewAlive = false;
  }
  // Thrown into the front of his own hut, high up the wall.
  if (n && t >= CUT.toss && t < CUT.wall) {
    const k = span(CUT.toss, CUT.wall), fx = (s?.x ?? 56) - 0.9, fy = (s?.y ?? 7) + 0.4;
    n.x = fx + (WALL.x - fx) * k;
    n.y = fy + (WALL.y - fy) * k;
    n.lift = 22 * (1 - k) + 16 * Math.sin(Math.PI * k) + WALL.up * k;
  }
  if (at(CUT.wall) && n) (n.smear = WALL.up), ev.push({ k: 'thud', x: WALL.x, y: WALL.y });
  // Down the wall, slowly, then over onto his side at the foot of it.
  if (n && t >= CUT.wall && t < CUT.slid) n.lift = WALL.up * (1 - span(CUT.wall, CUT.slid) ** 1.6);
  if (at(CUT.slid) && n) Object.assign(n, { lift: 0, pose: 'body' });
  // Then it turns on you, and bellows: no words.
  if (s && t >= CUT.wall) {
    const h = room.heroes.find((x) => x.id === HERO_ID), l = h ? Math.hypot(h.x - s.x, h.y - s.y) || 1 : 1;
    if (h) (s.fx = (h.x - s.x) / l), (s.fy = (h.y - s.y) / l);
  }
  if (at(CUT.bellow) && s) ev.push({ k: 'bellow', x: s.x, y: s.y });
  if (t >= CUT.end) {
    if (n) Object.assign(n, { pose: 'body', lift: 0, walking: false, name: '', talk: 'hewdead', x: WALL.x, y: WALL.y, smear: WALL.up });
    w.hewAlive = false;
    const e = room.enemies.find((x) => x.id === w.stoker) ?? spawn(room, STOKER);
    w.stoker = e.id;
    // Straight at you.
    Object.assign(e, { alert: true, cooldown: 0.4, hitstop: 0, moving: false });
    w.cut = -1;
  }
}
