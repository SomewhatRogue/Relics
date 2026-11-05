/**
 * Rats on the blood: a few small ones at a job's stains and bodies, and in Wickhold's alleys and by
 * the Drowned Rat's grate. Walk within 2.5 tiles (1.8 creeping: a phone's half-pushed stick creeps, and rats should still go before you're on them) and they scatter, low and jittery,
 * away from you to the nearest wall, edge or shadow, and are gone; after 15 to 25 s with nobody near,
 * they come back one at a time. At most `RATS.cap` at once, the nearest spots first.
 *
 * Cosmetic and this screen's own (Math.random is fine): the room never knows about them, they wake
 * nobody (that's the crows', which are in the room), and a friend's screen has its own rats.
 */
import type { GameMap } from '../shared/arena';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';
import { StainSpots, TOWN_HAUNTS, blocked, bolthole, type Haunt } from './ratspots';

export const RATS = { scare: 2.5, creep: 1.8, back: [15, 25], gap: [1.5, 3.5], cap: 8, reach: 18, flee: 7, walk: 1.6, quiet: 4 } as const;

export type RatState = 'idle' | 'in' | 'flee' | 'gone';
export interface Rat { x: number; y: number; hx: number; hy: number; tx: number; ty: number; state: RatState; t: number; face: number; seed: number; spot: Spot }
interface Spot extends Haunt { key: string; quiet: number; due: number; next: number; rats: Rat[] }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class Rats {
  rats: Rat[] = [];
  private spots = new Map<string, Spot>();
  private room: ArenaRoom | null = null;
  private stains = new StainSpots();
  private readAt = -9;
  private last = -1;
  /** Some scattered (how many, and the nearest one's distance from you): a squeak and a patter. */
  onScatter: (n: number, dist: number) => void = () => {};

  /** Once a frame from whichever view is drawing (a second call with the same `now` does nothing). */
  frame(room: ArenaRoom, stains: { x: number; y: number; col: string }[], heroes: readonly Hero[], meId: string, now: number): void {
    if (now === this.last) return;
    const dt = this.last < 0 ? 0 : Math.min(0.1, Math.max(0, now - this.last));
    this.last = now;
    if (room !== this.room) this.reset(room);
    if (now - this.readAt > 1) (this.readAt = now), this.look(room, stains, heroes.find((h) => h.id === meId) ?? heroes[0]);
    this.step(room.map, heroes, meId, dt);
  }

  reset(room: ArenaRoom | null): void {
    this.room = room;
    this.rats = [];
    this.spots.clear();
    this.stains.reset();
    this.readAt = -9;
  }

  /** Which spots have rats now: Wickhold's, or the job's blood; the nearest few, within reach. */
  private look(room: ArenaRoom, stains: { x: number; y: number; col: string }[], me: Hero | undefined): void {
    const town = room.map.name === 'WICKHOLD';
    let found: (Haunt & { rats?: number })[];
    if (town) found = TOWN_HAUNTS;
    else this.stains.read(stains), (found = this.stains.haunts(room.enemies));
    const at = me ?? { x: room.map.w / 2, y: room.map.h / 2 };
    const want = found.filter((h) => !blocked(room.map, h.x, h.y) && Math.hypot(h.x - at.x, h.y - at.y) < RATS.reach)
      .sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y));
    const keep = new Set<string>();
    let left = RATS.cap;
    for (const h of want) {
      if (left <= 0) break;
      const key = `${Math.round(h.x * 2)},${Math.round(h.y * 2)}`, had = this.spots.get(key);
      const n = Math.min(left, had ? had.rats.length : h.rats ?? (h.weight > 60 ? 3 : h.weight > 25 ? 2 : 1));
      left -= n;
      keep.add(key);
      if (!had) this.spots.set(key, this.spot(room.map, h, key, n, !!town));
    }
    for (const [k, s] of this.spots) if (!keep.has(k)) this.spots.delete(k);
    this.rats = [...this.spots.values()].flatMap((s) => s.rats);
  }

  /** A new spot: in town the rats are already at it; on a job they come once it's quiet. */
  private spot(m: GameMap, h: Haunt, key: string, n: number, there: boolean): Spot {
    const s: Spot = { ...h, key, quiet: 0, due: rnd(RATS.back[0], RATS.back[1]), next: 0, rats: [] };
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35, hx = h.x + Math.cos(a) * r, hy = h.y + Math.sin(a) * r * 0.6;
      const hole = bolthole(m, hx, hy, Math.cos(a + Math.PI), Math.sin(a + Math.PI), rnd(3, 5));
      s.rats.push({ x: there ? hx : hole.x, y: there ? hy : hole.y, hx, hy, tx: hole.x, ty: hole.y, state: there ? 'idle' : 'gone', t: Math.random() * 3, face: Math.random() < 0.5 ? -1 : 1, seed: Math.random() * 100, spot: s });
    }
    return s;
  }

  private step(m: GameMap, heroes: readonly Hero[], meId: string, dt: number): void {
    const me = heroes.find((h) => h.id === meId);
    let fled = 0, nearest = 99;
    const scared = (x: number, y: number) => {
      let best: Hero | null = null, bd = 99;
      for (const h of heroes) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d < (h.sneaking ? RATS.creep : RATS.scare) && d < bd) (bd = d), (best = h);
      }
      return best;
    };
    for (const s of this.spots.values()) {
      const near = heroes.some((h) => Math.hypot(h.x - s.x, h.y - s.y) < RATS.quiet);
      s.quiet = near ? 0 : s.quiet + dt;
      if (near) s.next = 0;
      for (const r of s.rats) {
        r.t += dt;
        if (r.state === 'idle' || r.state === 'in') {
          const h = scared(r.x, r.y);
          if (h) {
            // Away from them, to the nearest cover that way, with a little swerve.
            const a = Math.atan2(r.y - h.y, r.x - h.x) + rnd(-0.6, 0.6), hole = bolthole(m, r.x, r.y, Math.cos(a), Math.sin(a), rnd(3, 5.5));
            Object.assign(r, { state: 'flee', t: 0, tx: hole.x, ty: hole.y });
            fled++;
            if (me) nearest = Math.min(nearest, Math.hypot(me.x - r.x, me.y - r.y));
            continue;
          }
        }
        if (r.state === 'idle') this.nose(r, dt);
        else if (r.state === 'in') this.creep(r, dt);
        else if (r.state === 'flee') this.bolt(r, dt);
      }
      // Quiet long enough: back they come, one at a time.
      if (s.quiet >= s.due) {
        s.next -= dt;
        const out = s.rats.find((r) => r.state === 'gone');
        if (!out) s.due = rnd(RATS.back[0], RATS.back[1]);
        else if (s.next <= 0) Object.assign(out, { state: 'in', t: 0, x: out.tx, y: out.ty }), (s.next = rnd(RATS.gap[0], RATS.gap[1]));
      }
    }
    if (fled) this.onScatter(fled, nearest);
  }

  /** At the blood: little darts about the spot, nose down, still a while between. */
  private nose(r: Rat, dt: number): void {
    if (r.t > 0.7 + (r.seed % 1.3)) {
      r.t = 0;
      const s = r.spot, a = Math.random() * Math.PI * 2, k = Math.random() * 0.35;
      (r.tx = s.x + Math.cos(a) * k), (r.ty = s.y + Math.sin(a) * k * 0.6);
    }
    this.move(r, r.tx, r.ty, RATS.walk * 0.6, dt);
  }

  /** Coming back: a few steps, a stop to sniff, a few more. */
  private creep(r: Rat, dt: number): void {
    if (r.t % 0.8 < 0.45 && this.move(r, r.hx, r.hy, RATS.walk, dt)) Object.assign(r, { state: 'idle', t: 0, tx: r.hx, ty: r.hy });
  }

  /** Bolting: fast and low, zigzagging; gone once it's there (or a moment on, wherever it got to). */
  private bolt(r: Rat, dt: number): void {
    const there = this.move(r, r.tx, r.ty, RATS.flee, dt, Math.sin(r.t * 40 + r.seed) * 1.6);
    if (there || r.t > 1.6) r.state = 'gone';
  }

  /** Toward (x, y) at `speed`, with `wobble` tiles a second sideways; true once there. */
  private move(r: Rat, x: number, y: number, speed: number, dt: number, wobble = 0): boolean {
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy);
    if (d < 0.06) return true;
    const step = Math.min(d, speed * dt), ux = dx / d, uy = dy / d;
    r.x += ux * step - uy * wobble * dt;
    r.y += uy * step + ux * wobble * dt;
    if (Math.abs(ux) > 0.2) r.face = ux < 0 ? -1 : 1;
    return false;
  }
}

/** The one this page draws (the flat view and the 2.5D view share it). */
export const rats = new Rats();
