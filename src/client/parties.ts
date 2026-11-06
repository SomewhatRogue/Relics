/**
 * Parties over the town's own connection (townfolk.ts). Whoever gathers one says so with where they
 * stand (their `pt`, an Offer: shared/lobby.ts), so everyone in Wickhold sees it, and they're free to
 * walk anywhere in town while it's up. Others ask to join; the leader takes them in (up to PARTY_MAX);
 * when they set out, each member is told the run's room and the whole job, wherever they are, and goes.
 *
 * Kept steady online: a reload on either side comes back to the party (partykeep.ts); someone quiet
 * past the party's grace is let go (a member) or the party's given up (the leader); a member not yet
 * listed asks again every few seconds, so one lost word never strands anyone.
 */
import type { Job } from '../shared/jobs';
import { PARTY_GRACE, PARTY_MAX, admit, changes, cleanName, drop, isOffer, post, quiet, standing, type JobTag, type Member, type Offer } from '../shared/lobby';
import { keepParty, keptParty } from './partykeep';
import type { Townfolk } from './townfolk';
import { HOSTPICK, pickHost, sayAgain, type Link } from '../shared/hostpick';
import { myLink } from './netq';

export { PARTY_MAX };
export interface Party { lead: string; job: JobTag; members: Member[]; mine: boolean; in: boolean; asked: boolean }
/** Something to tell the player (a toast: partytoast.ts). */
export type News = { k: 'posted'; lead: string; name: string; job: JobTag } | { k: 'joined' | 'left' | 'in' | 'off' | 'quiet' | 'full'; name: string };

const code = () => 'P' + Math.random().toString(36).slice(2, 10).toUpperCase();
const ASK_EVERY = 3, OFF_AFTER = 2;
/** `?pick=lead`: the leader always hosts (the Florida replay, scripts/florida-online.cjs LEAD_HOSTS=1). */
const PICK_OFF = typeof location !== 'undefined' && new URLSearchParams(location.search).get('pick') === 'lead';
const isLink = (q: unknown): q is [number, number] => Array.isArray(q) && q.length === 2 && q.every((v) => typeof v === 'number' && isFinite(v));

export class Parties {
  /** The party I lead, and its whole job. */
  private mine: Offer | null = null;
  private job: Job | null = null;
  /** The leader I've asked to take me (and am with, once their party lists me). */
  joined: string | null = null;
  /** Setting out: no more joins, no more changes. */
  hold = false;
  private heard = new Map<string, number>();
  private seen = new Set<string>();
  private was: { lead: string; m: Member[] } | null = null;
  private askedAt = -99;
  /** The leader of the party I asked into, as last seen (for the news once they've gone). */
  private leadName = '';
  private offSince = -1;
  private keptAt = -99;
  private now = 0;
  /** Leading: each member's link as they last said it (riding on their join word), and when. */
  private links = new Map<string, { l: Link; at: number }>();
  /** A member: my link as I last said it to the leader. */
  private saidLink: { l: Link; at: number } | null = null;
  /** My link now (the town socket's trip, my frame time: netq.ts). */
  link: () => Link = () => myLink(this.town.rtt);
  /** `host`: who runs the job's room (the one with the best link: shared/hostpick.ts), maybe not the leader. */
  onGo: (room: string, job: Job, lead: string, members: Member[], host: string) => void = () => {};
  onChange: () => void = () => {};
  onNews: (n: News) => void = () => {};

  constructor(private town: Townfolk, private me: () => { id: string; name: string }) {
    town.offer = () => this.mine ?? undefined;
    town.onWord = (from, d) => this.word(from, d);
    town.onOffers = () => this.onChange();
    // Back after a reload: the party you were in, if it's still within the grace.
    const k = keptParty(me().id), t = performance.now() / 1000;
    if (k?.mine && k.job && isOffer(k.mine)) (this.mine = k.mine), (this.job = k.job);
    else if (k?.joined) this.joined = k.joined;
    for (const id of [...(this.mine?.m.map(([x]) => x) ?? []), this.joined ?? '']) this.heard.set(id, t);
  }

  /** Every party in town: mine first. */
  list(): Party[] {
    const me = this.me().id, out: Party[] = [];
    if (this.mine) out.push({ lead: me, job: this.mine.j, members: this.mine.m, mine: true, in: true, asked: false });
    for (const o of this.town.others()) {
      if (!isOffer(o.pt)) continue;
      const inIt = o.pt.m.some(([id]) => id === me);
      out.push({ lead: o.id, job: o.pt.j, members: o.pt.m, mine: false, in: inIt, asked: this.joined === o.id && !inIt });
    }
    return out;
  }

  /** The party I'm in or asked into (leading or not), if any. */
  current(): Party | null {
    return this.list().find((q) => q.mine || q.lead === this.joined) ?? null;
  }

  get leading(): boolean {
    return !!this.mine;
  }

  /** The whole job of the party I lead. */
  get myJob(): Job | null {
    return this.mine ? this.job : null;
  }

  /** Put up a party for this job. */
  gather(job: Job): void {
    this.quit();
    const me = this.me();
    this.mine = post(job, me.id, me.name, Math.floor(Math.random() * 1e6));
    this.job = job;
    this.changed();
  }

  /** Ask a party's leader to take me. */
  join(lead: string): void {
    this.quit();
    this.joined = lead;
    this.saidLink = null;
    this.leadName = this.town.where(lead)?.hero.tag ?? '';
    this.heard.set(lead, this.now);
    this.ask();
    this.changed();
  }

  /** Leave the party I'm in, or take mine down. */
  quit(): void {
    if (this.mine) for (const [id] of this.mine.m.slice(1)) this.town.say(id, { k: 'disband' });
    if (this.joined) this.town.say(this.joined, { k: 'quit' });
    this.mine = this.job = this.joined = null;
    this.hold = false;
    this.changed();
  }

  /**
   * The leader sets out: everyone in is told where to go, with the whole job, and who hosts its room:
   * the member with the best link, if they beat mine by enough (shared/hostpick.ts). Picked once, here.
   */
  setOut(): { room: string; job: Job; members: Member[]; host: string } | null {
    if (!this.mine || !this.job) return null;
    const room = code(), job = this.job, m = this.mine.m, host = this.pick(m);
    for (const [id] of m.slice(1)) this.town.say(id, { k: 'go', room, j: job, m, h: host });
    this.mine = this.job = null;
    this.hold = false;
    this.links.clear();
    this.changed();
    return { room, job, members: m, host };
  }

  /** Who'd host this party best, by the links the members said (fresh ones only) and mine. */
  private pick(m: Member[]): string {
    const links: Record<string, Link | undefined> = { [m[0][0]]: this.link() };
    for (const [id] of m.slice(1)) {
      const s = this.links.get(id);
      if (s && this.now - s.at <= HOSTPICK.stale) links[id] = s.l;
    }
    return PICK_OFF ? m[0][0] : pickHost(m.map(([id]) => id), links);
  }

  /** Leading: the links my members have said (tests and the online scripts). */
  heardLinks(): Record<string, Link> {
    return Object.fromEntries([...this.links].map(([id, s]) => [id, s.l]));
  }

  /** Each frame: out of town lets the party go; in town, who's quiet, who came and went, what's new. */
  step(inTown: boolean, now: number): void {
    this.now = now;
    if (!inTown) return void ((this.mine || this.joined) && this.quit());
    const me = this.me().id;
    for (const [id] of this.mine?.m ?? []) if (this.town.where(id)) this.heard.set(id, now);
    if (this.joined && this.town.where(this.joined)) this.heard.set(this.joined, now);
    // Leading: anyone quiet past the grace is let go.
    if (this.mine && !this.hold) for (const id of quiet(this.mine, this.heard, now, me)) drop(this.mine, id) && this.changed();
    if (this.joined) this.follow(me, now);
    this.news(me);
    // Kept for a reload, now and then while in one.
    if ((this.mine || this.joined) && now - this.keptAt > 4) this.keep();
  }

  /** A member: still in, still asking, or the party's gone. */
  private follow(me: string, now: number): void {
    const lead = this.joined!, o = this.town.others().find((x) => x.id === lead)?.pt, offer = isOffer(o) ? o : undefined;
    if (offer) this.leadName = offer.m[0][1];
    const s = standing(offer, me, this.heard.get(lead) ?? now, now), name = this.leadName || cleanName('');
    // Not there just now (a reload, a moment's lag): wait, within the grace.
    if (s === 'off' && !this.town.where(lead)) return;
    if (s === 'off' && this.offSince < 0) this.offSince = now;
    if (s !== 'off') this.offSince = -1;
    if (s === 'asked' && now - this.askedAt > ASK_EVERY) this.ask();
    // In: my link said again only when it's first known or has moved (a few words a party, not a tick's).
    else if (s === 'in' && sayAgain(this.link(), this.saidLink, now)) this.ask();
    if (s === 'quiet' || s === 'full' || (s === 'off' && now - this.offSince > OFF_AFTER)) {
      this.joined = null;
      this.offSince = -1;
      this.onNews({ k: s, name });
      this.changed();
    }
  }

  /** Toasts: a party posted somewhere in town; someone in or out of mine; me taken in. */
  private news(me: string): void {
    for (const q of this.list()) {
      const key = q.lead + ':' + q.job.id;
      if (q.mine || this.seen.has(key)) continue;
      this.seen.add(key);
      if (!q.in && !q.asked) this.onNews({ k: 'posted', lead: q.lead, name: q.members[0][1], job: q.job });
    }
    const cur = this.current(), is = cur?.in ? { lead: cur.lead, m: cur.members.map((x) => [...x] as Member) } : null;
    if (is && this.was?.lead === is.lead) {
      const d = changes(this.was.m, is.m, me);
      for (const name of d.joined) this.onNews({ k: 'joined', name });
      for (const name of d.left) this.onNews({ k: 'left', name });
    } else if (is && !cur!.mine) this.onNews({ k: 'in', name: is.m[0][1] });
    this.was = is;
  }

  /** Ask the leader to take me (again), with my link if I know it (who hosts: shared/hostpick.ts). */
  private ask(): void {
    this.askedAt = this.now;
    if (!this.joined) return;
    const l = this.link(), q = l.r > 0 ? { q: [l.r, l.f] } : {};
    if (l.r > 0) this.saidLink = { l, at: this.now };
    this.town.say(this.joined, { k: 'join', n: this.me().name, ...q });
  }

  private word(from: string, d: Record<string, unknown>): void {
    const m = this.mine;
    if (d.k === 'join' && m) {
      const took = !this.hold && admit(m, from, d.n);
      if (isLink(d.q) && m.m.some(([id]) => id === from)) this.links.set(from, { l: { r: d.q[0], f: d.q[1] }, at: this.now });
      return void (took && (this.heard.set(from, this.now), this.changed()));
    }
    if (d.k === 'quit' && m && !this.hold) return void (drop(m, from) && this.changed());
    if (d.k === 'disband' && this.joined === from) {
      this.joined = null;
      this.onNews({ k: 'off', name: this.town.where(from)?.hero.tag ?? (this.leadName || cleanName('')) });
      return this.changed();
    }
    if (d.k === 'go' && this.joined === from && typeof d.room === 'string' && d.j && typeof d.j === 'object' && Array.isArray(d.m)) {
      this.joined = null;
      this.was = null;
      keepParty(null);
      const m = d.m as Member[], host = typeof d.h === 'string' && m.some((x) => Array.isArray(x) && x[0] === d.h) ? d.h : from;
      this.onGo(d.room, d.j as Job, from, m, host);
    }
  }

  private keep(): void {
    this.keptAt = this.now;
    keepParty({ hero: this.me().id, ...(this.mine ? { mine: this.mine, job: this.job! } : {}), ...(this.joined ? { joined: this.joined } : {}) });
  }

  private changed(): void {
    this.keep();
    this.town.soon();
    this.onChange();
  }
}

export { PARTY_GRACE };
