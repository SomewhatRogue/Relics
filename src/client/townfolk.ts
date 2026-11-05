/**
 * Everyone else in Wickhold. The town has no host: each browser runs Wickhold itself (its guards and
 * carts walk on the clock, so everyone sees the same), and each only tells the others where its own
 * hero is, through a peer room on the relay (`want=peer`). Nobody leaving can break the town.
 *
 * What goes out is small and rare, since every word a player says may be a Redis command (the town
 * is where every open tab sits, all day: docs/DECISIONS.md 2026-11-04): your name, weapon, which
 * place you're in, where you stand and how fast you're going (reckon.ts: the others carry you on
 * along it, so you speak again only when you start, stop, turn or drift half a tile), at most 5
 * times a second, and once every 2 minutes while you stand still (in case a goodbye went missing).
 * Nothing at all with nobody else in town. Someone new says `hi` and everyone answers with where they are; a
 * player who goes is announced by the relay (`left`), and anyone silent 5 minutes is let go too.
 *
 * A tab out of sight a minute (another tab, a phone in a pocket) leaves the town's room, and so does
 * a player who hasn't touched anything in 3 minutes (unless they're in a party); either comes back
 * the moment they're looked at or touched, and says `hi` again.
 */
import { newHero } from '../sim/hero';
import type { Hero } from '../sim/types';
import { HERO, WEAPONS, type WeaponId } from '../shared/tuning';
import { RelaySocket, type RelayMsg } from './relay';
import { Pace, RECKON, heardV, reckoned, type Sent } from './reckon';

/** The town's peer room. (Busy one day, it splits into WICKHOLD2 and on, like a channel.) */
export const TOWN_ROOM = 'WICKHOLD1';
const KEEP = 120, GONE = 300;
const hook = (k: string, d: number) => Number(typeof location === 'undefined' ? NaN : new URLSearchParams(location.search).get(k)) || d;
/** Out of sight this long (seconds), and untouched this long, and the town's room is left. (`?hide=`, `?idle=`: tests.) */
export const AWAY = { hidden: hook('hide', 60), idle: hook('idle', 180) };

/** One player about themselves: name, weapon, the place they're in, and x, y, facing, moving. */
export interface Me { n: string; w: string; l?: number; at: string; p: [number, number, number, number, number]; pt?: unknown; /** Velocity, tiles a second. */ v?: [number, number] }
type Said = Me & { k: 'me' | 'hi' };
interface Folk { hero: Hero; to: [number, number]; v: [number, number]; at: string; heard: number; pt?: unknown }

const NAME = /[^A-Z0-9 '-]/g;
const r2 = (v: number) => Math.round(v * 100) / 100;

export class Townfolk {
  private sock: RelaySocket | null = null;
  private folk = new Map<string, Folk>();
  private sentAt = -99;
  /** What everyone heard last: all but the position and facing, and where and how fast. */
  private said = '';
  private sent: Sent | null = null;
  private pace = new Pace();
  private me: Me | null = null;
  private now = 0;
  /** What a player says that isn't about where they stand (parties: parties.ts), and what goes out with you (your party). */
  onWord: (from: string, d: Record<string, unknown>) => void = () => {};
  offer: () => unknown = () => undefined;
  /** Someone's party went up, changed or came down (the board redraws). */
  onOffers: () => void = () => {};
  /** Last touched (a key, a tap, the mouse), on the clock `step` is given. */
  private touchedAt = performance.now() / 1000;
  private hiddenTimer = 0;
  /** Out of the room for being idle or out of sight (back at a touch, or a look). */
  dozing = false;

  constructor(readonly id: string) {
    const touched = () => ((this.touchedAt = performance.now() / 1000), (this.dozing = false));
    for (const ev of ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel']) addEventListener(ev, touched, { passive: true, capture: true });
    document.addEventListener('visibilitychange', () => {
      clearTimeout(this.hiddenTimer);
      // (No frames run while hidden, so a timer does it.)
      if (document.visibilityState === 'hidden') this.hiddenTimer = window.setTimeout(() => ((this.dozing = true), this.leave()), AWAY.hidden * 1000);
      else touched();
    });
  }

  /** Each frame: in town or not (the socket opens while you're in, and closes when you go). */
  step(me: Me | null, now: number, dt: number): void {
    this.now = now;
    if (!me) return this.leave();
    const pt = this.offer();
    // Idle a while, and not in a party: out of the room till touched.
    if (!pt && now - this.touchedAt > AWAY.idle) this.dozing = true;
    if (this.dozing) return this.leave();
    const [x, y, fx, fy, moving] = me.p, v = moving ? this.pace.at(now, x, y, [fx * HERO.speed, fy * HERO.speed]) : (this.pace.stop(), [0, 0]);
    this.me = { ...me, p: [r2(x), r2(y), r2(me.p[2]), r2(me.p[3]), me.p[4]], v: [r2(v[0]), r2(v[1])], pt };
    if (!this.sock) {
      this.sock = new RelaySocket(TOWN_ROOM, this.id, 'peer');
      this.sock.onMessage = (m) => this.heard(m);
    }
    // Only with someone to tell: when something they see changed (not the facing of someone standing
    // still), or they'd have me half a tile off, at most every RECKON.gap s; and now and then.
    const at = this.sent && reckoned(this.sent, now), off = at ? Math.hypot(at[0] - x, at[1] - y) : Infinity;
    const due = this.gist() !== this.said || off > RECKON.err;
    if (this.folk.size && ((due && now - this.sentAt >= RECKON.gap) || now - this.sentAt >= KEEP)) this.tell('*', 'me');
    for (const [id, f] of this.folk) {
      if (now - f.heard > GONE) {
        this.folk.delete(id);
        if (f.pt) this.onOffers();
        continue;
      }
      // Walk each toward where they are by now (where they said, carried on as fast as they said).
      const k = Math.min(RECKON.ahead, now - f.heard), h = f.hero, dx = f.to[0] + f.v[0] * k - h.x, dy = f.to[1] + f.v[1] * k - h.y, d = Math.hypot(dx, dy);
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

  /** One player by id: their hero and the place they're in (chat: who's near enough to hear). */
  where(id: string): { hero: Hero; at: string } | null {
    const f = this.folk.get(id);
    return f ? { hero: f.hero, at: f.at } : null;
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

  /** In the town's room now (tests). */
  get open(): boolean {
    return !!this.sock;
  }

  /** How many others are in Wickhold right now. */
  get count(): number {
    return this.folk.size;
  }

  private tell(to: string, k: Said['k']): void {
    if (!this.me || !this.sock?.open_) return;
    this.sock.send(to, { k, ...this.me });
    // (What everyone has heard: the last `me` or `hi` to all.)
    if (to !== '*') return;
    const [x, y] = this.me.p, [vx, vy] = this.me.v ?? [0, 0];
    this.sentAt = this.now;
    this.said = this.gist();
    this.sent = { x, y, vx, vy, t: this.now };
  }

  /** All that others see of me but where I am and which way I face. */
  private gist(): string {
    const m = this.me;
    return m ? JSON.stringify([m.n, m.w, m.l, m.at, m.p[4], m.pt]) : '';
  }

  private heard(m: RelayMsg): void {
    // Arrived: everyone answers with where they are. (A socket swapped in for an old one isn't new.)
    if (m.t === 'role' && m.role === 'peer') return m.swap ? undefined : this.tell('*', 'hi');
    if (m.t === 'left') return void (this.folk.get(m.id)?.pt && this.onOffers(), this.folk.delete(m.id));
    if (m.t !== 'msg') return;
    const d = m.d as Partial<Said> | null;
    if (d && typeof d === 'object' && d.k !== 'me' && d.k !== 'hi') return this.onWord(m.from, d as Record<string, unknown>);
    if (!d || (d.k !== 'me' && d.k !== 'hi') || !Array.isArray(d.p) || d.p.length !== 5 || !d.p.every((v) => typeof v === 'number' && isFinite(v))) return;
    const weapon = (typeof d.w === 'string' && d.w in WEAPONS ? d.w : 'sword') as WeaponId;
    const [x, y, fx, fy, moving] = d.p;
    let f = this.folk.get(m.from);
    if (!f) this.folk.set(m.from, (f = { hero: newHero('o:' + m.from, x, y), to: [x, y], v: [0, 0], at: '', heard: 0 }));
    const had = JSON.stringify(f.pt ?? null), has = JSON.stringify(d.pt ?? null);
    Object.assign(f, { to: [x, y], v: moving ? heardV(d.v) : [0, 0], at: String(d.at ?? '').slice(0, 40), heard: this.now, pt: d.pt });
    if (had !== has) this.onOffers();
    Object.assign(f.hero, { weapon, look: typeof d.l === 'number' ? Math.max(0, Math.min(2, Math.floor(d.l))) : 0, fx, fy, moving: !!moving, tag: String(d.n ?? '').toUpperCase().replace(NAME, '').slice(0, 14) || 'STRANGER' });
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
    this.sent = null;
    this.sentAt = -99;
  }
}
