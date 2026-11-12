/**
 * Trading between two players (docs/design/trading.md, step 3), as this browser sees it. Words go over the
 * town's room (`k: 'trade'`, beside chat and petting):
 *   ask {id, h, n}  I'd trade with you (my hero's id and name). Both asking at once: the lower id is kept.
 *   yes {id, h}     so would I. The window is open on both sides
 *   offer {id, o}   my offer as it stands (items, gold, and a count that goes up with each change)
 *   ok {id, a, b}   ACCEPT: my offer as of a, yours as of b. Any change to an offer clears both accepts
 *   no {id}         called off
 * With both accepts, each side keeps the trade in its save (tradesave.ts) and sends its ACCEPT to the server
 * (api/ledger.ts) until the server swaps the owners ('done') or refuses ('bad'). The server decides; the
 * words only agree the terms.
 */
import { HERO_ID } from '../shared/ledger';
import { TRADE_ID, cleanOffer, terms, type Offer, type Pending, type TradeState } from '../shared/trade';
import type { Item } from '../shared/loot';

export type Phase = 'asking' | 'open' | 'sending' | 'done' | 'bad' | 'off';
export interface TradeIO {
  /** A word to the other player. */
  say(d: Record<string, unknown>): void;
  /** The server (ledger.ts ledgerCall). */
  call(body: unknown): Promise<Record<string, unknown> | null>;
  /** Keep it in the save, before the first ACCEPT (tradesave.ts holdTrade). */
  hold(p: Pending): void;
  /** How it ended, into the save (tradesave.ts endTrade). */
  end(state: TradeState): void;
}

/** Seconds between ACCEPTs to the server while the other's is on its way, and how long before giving up. */
const RETRY = 2.5, GIVE_UP = 90;

export class Trade {
  phase: Phase = 'asking';
  mine: Offer = { items: [], gold: 0, rev: 0 };
  theirs: Offer = { items: [], gold: 0, rev: 0 };
  okMine = false;
  okTheirs = false;
  theirHero = '';
  /** Called off by the other player (their word, or gone from town), not by me. */
  byThem = false;
  onChange = () => {};
  private next = 0;
  private since = 0;
  private busy = false;

  constructor(readonly id: string, readonly peer: string, public name: string, readonly me: string, private io: TradeIO) {}

  get closed(): boolean {
    return this.phase === 'done' || this.phase === 'bad' || this.phase === 'off';
  }

  word(d: Record<string, unknown>, now: number): void {
    if (this.closed) return;
    if (d.t === 'ask' || d.t === 'yes') {
      if (typeof d.h !== 'string' || !HERO_ID.test(d.h) || d.h === this.me) return;
      this.theirHero = d.h;
      if (this.phase === 'asking') {
        this.phase = 'open';
        if (d.t === 'ask') this.io.say({ t: 'yes', h: this.me });
        this.io.say({ t: 'offer', o: this.mine });
      }
    } else if (d.t === 'offer' && this.phase === 'open') {
      const o = cleanOffer(d.o);
      if (!o || o.rev < this.theirs.rev) return;
      this.theirs = o;
      this.okMine = this.okTheirs = false;
    } else if (d.t === 'ok' && this.phase === 'open') {
      if (d.a === this.theirs.rev && d.b === this.mine.rev) this.okTheirs = true;
      this.maybeSend(now);
    } else if (d.t === 'no') return this.callOff(now, false);
    this.onChange();
  }

  /** My offer changed: both accepts clear. */
  put(items: Item[], gold: number): void {
    if (this.phase !== 'open') return;
    this.mine = { items: [...items], gold, rev: this.mine.rev + 1 };
    this.okMine = this.okTheirs = false;
    this.io.say({ t: 'offer', o: this.mine });
    this.onChange();
  }

  accept(now: number): void {
    if (this.phase !== 'open' || this.okMine) return;
    this.okMine = true;
    this.io.say({ t: 'ok', a: this.mine.rev, b: this.theirs.rev });
    this.maybeSend(now);
    this.onChange();
  }

  /** The terms both have accepted, and what comes in. */
  pending(): Pending {
    const side = (h: string, o: Offer) => ({ h, give: o.items.map((i) => i.ledger!), gold: o.gold });
    return { id: this.id, me: this.me, t: terms(this.id, side(this.me, this.mine), side(this.theirHero, this.theirs)), got: this.theirs.items };
  }

  private maybeSend(now: number): void {
    if (!this.okMine || !this.okTheirs || this.phase !== 'open') return;
    this.phase = 'sending';
    this.io.hold(this.pending());
    this.next = this.since = now;
  }

  /** Each frame: while both have accepted, ACCEPT to the server till it answers. */
  tick(now: number): void {
    if (this.phase !== 'sending' || this.busy || now < this.next) return;
    if (now - this.since > GIVE_UP) return this.callOff(now, true);
    this.busy = true;
    void this.io.call({ accept: this.pending().t, hero: this.me }).then((r) => {
      this.busy = false;
      const s = r?.state;
      if (s === 'done' || s === 'bad') return this.finish(s);
      this.next = now + RETRY;
    });
  }

  /** Called off, by me (`tell` the other) or them. After an ACCEPT went out, the server says how it ended. */
  callOff(_now: number, tell = true): void {
    if (this.closed) return;
    if (tell) this.io.say({ t: 'no' });
    else this.byThem = true;
    if (this.phase !== 'sending') return void ((this.phase = 'off'), this.onChange());
    this.phase = 'off';
    void this.io.call({ withdraw: this.id, hero: this.me }).then((r) => {
      // No answer (offline): it stays in the save, and the next load asks.
      if (!r) return this.onChange();
      const s = r.state as TradeState;
      if (s === 'done') return this.finish('done');
      this.io.end(s === 'bad' ? 'bad' : 'none');
      this.onChange();
    });
    this.onChange();
  }

  private finish(s: 'done' | 'bad'): void {
    this.phase = s;
    this.io.end(s);
    this.onChange();
  }
}

/** A fresh trade id. */
export const tradeId = (rand: () => number = Math.random): string => {
  let s = '';
  for (let i = 0; i < 12; i++) s += 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(rand() * 32)];
  return s;
};

/** Is this a trade word, and its id? */
export const tradeWord = (d: Record<string, unknown>): string | null => (d.k === 'trade' && typeof d.id === 'string' && TRADE_ID.test(d.id) ? d.id : null);
