/**
 * Parties at the board, over the town's own connection (townfolk.ts). A player gathering a party
 * says so with where they stand (their `pt`: the job and who's in), so everyone in town sees it.
 * Others ask to join; the one gathering takes them in (up to PARTY_MAX); and when they set out,
 * each member is told the run's room and the job, and goes. No codes.
 */
import type { Job } from '../shared/jobs';
import type { Townfolk } from './townfolk';

export const PARTY_MAX = 4;
/** What a gathering party says about itself: the job, and who's in (id, name), the leader first. */
interface Offer { j: Job; m: [string, string][] }
export interface Party { lead: string; job: Job; members: [string, string][]; mine: boolean; in: boolean; asked: boolean }

const isOffer = (v: unknown): v is Offer => !!v && typeof v === 'object' && !!(v as Offer).j && Array.isArray((v as Offer).m);
const code = () => 'P' + Math.random().toString(36).slice(2, 10).toUpperCase();

export class Parties {
  /** The party I'm gathering, if I am. */
  private mine: Offer | null = null;
  /** The leader I've asked to take me (and am with, once their party lists me). */
  joined: string | null = null;
  /** Set out with a party: the run's room, the job, who leads and who's in. */
  onGo: (room: string, job: Job, lead: string, members: [string, string][]) => void = () => {};
  onChange: () => void = () => {};

  constructor(private town: Townfolk, private me: () => { id: string; name: string }) {
    town.offer = () => this.mine ?? undefined;
    town.onWord = (from, d) => this.word(from, d);
    town.onOffers = () => this.onChange();
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

  get leading(): boolean {
    return !!this.mine;
  }

  /** Put up a party for this job. */
  gather(job: Job): void {
    this.quit();
    const me = this.me();
    this.mine = { j: job, m: [[me.id, me.name]] };
    this.changed();
  }

  /** Ask a party's leader to take me. */
  join(lead: string): void {
    this.quit();
    this.joined = lead;
    this.town.say(lead, { k: 'join', n: this.me().name });
    this.changed();
  }

  /** Leave the party I'm in, or take mine down. */
  quit(): void {
    if (this.mine) for (const [id] of this.mine.m.slice(1)) this.town.say(id, { k: 'disband' });
    if (this.joined) this.town.say(this.joined, { k: 'quit' });
    this.mine = null;
    this.joined = null;
    this.changed();
  }

  /** The leader sets out: everyone in is told where to go. Returns the run's room and who's in. */
  setOut(): { room: string; job: Job; members: [string, string][] } | null {
    if (!this.mine) return null;
    const room = code(), { j, m } = this.mine;
    for (const [id] of m.slice(1)) this.town.say(id, { k: 'go', room, j, m });
    this.mine = null;
    this.changed();
    return { room, job: j, members: m };
  }

  private word(from: string, d: Record<string, unknown>): void {
    const m = this.mine;
    if (d.k === 'join' && m && m.m.length < PARTY_MAX && !m.m.some(([id]) => id === from)) {
      m.m.push([from, String(d.n ?? '').toUpperCase().replace(/[^A-Z0-9 '-]/g, '').slice(0, 14) || 'STRANGER']);
      return this.changed();
    }
    if (d.k === 'quit' && m) return (m.m = m.m.filter(([id]) => id !== from)), this.changed();
    if (d.k === 'disband' && this.joined === from) return (this.joined = null), this.changed();
    if (d.k === 'go' && this.joined === from && typeof d.room === 'string' && isOffer({ j: d.j, m: d.m })) {
      this.joined = null;
      this.onGo(d.room, d.j as Job, from, d.m as [string, string][]);
    }
  }

  private changed(): void {
    this.town.soon();
    this.onChange();
  }
}
