/**
 * Everyone else in Wickhold. The town has no host: each browser runs Wickhold itself (its guards and
 * carts walk on the clock, so everyone sees the same), and each only tells the others where its own
 * hero is, through a peer room on the relay (`want=peer`). Nobody leaving can break the town.
 *
 * What goes out is small and rare: your name, weapon, which place you're in, and where you stand,
 * at most 4 times a second while you move and every 3 s while you don't. Someone new says `hi` and
 * everyone answers with where they are. Silent 12 s (a crashed tab says nothing) and they're gone.
 */
import { newHero } from '../sim/hero';
import type { Hero } from '../sim/types';
import { WEAPONS, type WeaponId } from '../shared/tuning';
import { RelaySocket, type RelayMsg } from './relay';

/** The town's peer room. (Busy one day, it splits into WICKHOLD2 and on, like a channel.) */
export const TOWN_ROOM = 'WICKHOLD1';
const SEND_EVERY = 0.25, KEEP = 3, GONE = 12;

/** One player about themselves: name, weapon, the place they're in, and x, y, facing, moving. */
export interface Me { n: string; w: string; at: string; p: [number, number, number, number, number]; pt?: unknown }
type Said = Me & { k: 'me' | 'hi' };
interface Folk { hero: Hero; to: [number, number]; at: string; heard: number; pt?: unknown }

const NAME = /[^A-Z0-9 '-]/g;
const r2 = (v: number) => Math.round(v * 100) / 100;

export class Townfolk {
  private sock: RelaySocket | null = null;
  private folk = new Map<string, Folk>();
  private sentAt = -99;
  private said = '';
  private me: Me | null = null;
  private now = 0;
  /** What a player says that isn't about where they stand (parties: parties.ts), and what goes out with you (your party). */
  onWord: (from: string, d: Record<string, unknown>) => void = () => {};
  offer: () => unknown = () => undefined;

  constructor(readonly id: string) {}

  /** Each frame: in town or not (the socket opens while you're in, and closes when you go). */
  step(me: Me | null, now: number, dt: number): void {
    this.now = now;
    if (!me) return this.leave();
    this.me = { ...me, p: [r2(me.p[0]), r2(me.p[1]), r2(me.p[2]), r2(me.p[3]), me.p[4]], pt: this.offer() };
    if (!this.sock) {
      this.sock = new RelaySocket(TOWN_ROOM, this.id, 'peer');
      this.sock.onMessage = (m) => this.heard(m);
    }
    const key = JSON.stringify(this.me);
    if ((key !== this.said && now - this.sentAt >= SEND_EVERY) || now - this.sentAt >= KEEP) this.tell('*', 'me');
    for (const [id, f] of this.folk) {
      if (now - f.heard > GONE) {
        this.folk.delete(id);
        continue;
      }
      // Walk each toward where they last said they were: smooth between their few words a second.
      const h = f.hero, dx = f.to[0] - h.x, dy = f.to[1] - h.y, d = Math.hypot(dx, dy);
      if (d > 4) (h.x = f.to[0]), (h.y = f.to[1]);
      else if (d > 0.01) {
        const step = Math.min(d, Math.max(4.5, d * 6) * dt);
        (h.x += (dx / d) * step), (h.y += (dy / d) * step);
      }
    }
  }

  /** The others standing in this place. */
  here(at: string): Hero[] {
    return [...this.folk.values()].filter((f) => f.at === at).map((f) => f.hero);
  }

  /** Everyone else, by id: their name and what they offer (a party). */
  others(): { id: string; name: string; pt: unknown }[] {
    return [...this.folk].map(([id, f]) => ({ id, name: f.hero.tag ?? '', pt: f.pt }));
  }

  /** A word to one player (or everyone). */
  say(to: string, d: Record<string, unknown>): void {
    if (this.sock?.open_) this.sock.send(to, d);
  }

  /** Send where you are now, not at the next beat (your party changed). */
  soon(): void {
    this.sentAt = -99;
  }

  /** How many others are in Wickhold right now. */
  get count(): number {
    return this.folk.size;
  }

  private tell(to: string, k: Said['k']): void {
    if (!this.me || !this.sock?.open_) return;
    this.sock.send(to, { k, ...this.me });
    if (to === '*') (this.sentAt = this.now), (this.said = JSON.stringify(this.me));
  }

  private heard(m: RelayMsg): void {
    if (m.t === 'role' && m.role === 'peer') return this.tell('*', 'hi');
    if (m.t === 'left') return void this.folk.delete(m.id);
    if (m.t !== 'msg') return;
    const d = m.d as Partial<Said> | null;
    if (d && typeof d === 'object' && d.k !== 'me' && d.k !== 'hi') return this.onWord(m.from, d as Record<string, unknown>);
    if (!d || (d.k !== 'me' && d.k !== 'hi') || !Array.isArray(d.p) || d.p.length !== 5 || !d.p.every((v) => typeof v === 'number' && isFinite(v))) return;
    const weapon = (typeof d.w === 'string' && d.w in WEAPONS ? d.w : 'sword') as WeaponId;
    const [x, y, fx, fy, moving] = d.p;
    let f = this.folk.get(m.from);
    if (!f) this.folk.set(m.from, (f = { hero: newHero('o:' + m.from, x, y), to: [x, y], at: '', heard: 0 }));
    Object.assign(f, { to: [x, y], at: String(d.at ?? '').slice(0, 40), heard: this.now, pt: d.pt });
    Object.assign(f.hero, { weapon, fx, fy, moving: !!moving, tag: String(d.n ?? '').toUpperCase().replace(NAME, '').slice(0, 14) || 'STRANGER' });
    // Someone new: tell them where you are, just them.
    if (d.k === 'hi') this.tell(m.from, 'me');
  }

  /** Out of town (or this hero put away): the socket closes and the others are forgotten. */
  leave(): void {
    if (!this.sock) return;
    this.sock.close();
    this.sock = null;
    this.folk.clear();
    this.said = '';
    this.sentAt = -99;
  }
}
