/**
 * Trading in town (docs/design/trading.md, step 3): who asked, the one trade open at a time (trade.ts), and its
 * window. Walk up to another player and TRADE (or tap TRADE on their ask). Each side puts in items from the
 * pack and gold, sees both offers, and presses ACCEPT; any change clears both. Then the server swaps.
 * Only the pack trades (not what you wear or hold, not the vault); hungry gear never does. A piece that
 * isn't ledgered yet is minted to you as you offer it.
 */
import { bagSize, vaultSize } from '../shared/bags';
import { escapeHtml } from '../shared/chatrules';
import { tradeable } from '../shared/trade';
import { TRADE_GOLD, TRADE_ITEMS } from '../shared/trade';
import { itemName, type Item } from '../shared/tuning';
import { card, compare } from './card';
import { itemIcon } from './itemicons';
import { itemPop } from './shopui';
import type { Game } from './game';
import { ledgerCall } from './ledger';
import type { Panel } from './panels';
import { toast } from './partytoast';
import { Trade, tradeId, tradeWord } from './trade';
import { endTrade, holdTrade } from './tradesave';
import { TRADEW } from './tradewords';
import type { Townfolk } from './townfolk';
import { itemCol } from './uniquelook';

/** How long someone's ask stands, and how long the other may be out of sight before it's called off, s. */
const ASK_FOR = 120, LOST_FOR = 4;

export class Trades {
  cur: Trade | null = null;
  private town: Townfolk | null = null;
  private asks = new Map<string, { id: string; name: string; at: number }>();
  private showing = false;
  private lostAt = -1;
  private why = '';

  constructor(private g: Game, private panel: Panel) {}

  /** Listen on the town's room: trade words come here, everything else goes on. */
  attach(town: Townfolk): void {
    if (this.town === town) return;
    this.town = town;
    const rest = town.onWord;
    town.onWord = (from, d) => (tradeWord(d) ? this.heard(from, d) : rest(from, d));
  }

  /** TRADE with this player: answers their ask, or asks them. */
  open(peer: string, name: string): void {
    const now = performance.now() / 1000;
    if (this.cur && !this.cur.closed) return this.cur.peer === peer ? this.show() : undefined;
    const ask = this.asks.get(peer);
    this.asks.delete(peer);
    if (ask && now - ask.at < ASK_FOR) {
      this.start(peer, ask.id, name);
      this.cur!.word({ t: 'ask', h: peer }, now);
    } else {
      this.start(peer, tradeId(), name);
      this.town?.say(peer, { k: 'trade', id: this.cur!.id, t: 'ask', h: this.g.profile.id, n: this.g.profile.name });
    }
    this.show();
  }

  /** Each frame: the server's answer while both have accepted, and the other gone from town calls it off. */
  tick(now: number): void {
    const t = this.cur;
    if (!t || t.closed) return;
    t.tick(now);
    if (this.town?.where(t.peer)) this.lostAt = -1;
    else if (this.lostAt < 0) this.lostAt = now;
    else if (now - this.lostAt > LOST_FOR) t.callOff(now, false);
  }

  private start(peer: string, id: string, name: string): void {
    const me = this.g.profile.id;
    this.why = '';
    this.lostAt = -1;
    const t = (this.cur = new Trade(id, peer, name, me, {
      say: (d) => this.town?.say(peer, { k: 'trade', id, ...d }),
      call: ledgerCall,
      hold: (p) => holdTrade(this.g.save, p, () => this.g.keep()),
      end: (s) => void (endTrade(this.g.save, id, s, () => this.g.refit()) && toast(TRADEW.status.done)),
    }));
    t.onChange = () => {
      const looking = this.showing && this.panel.open;
      if (t.phase === 'off' && t.byThem && this.cur === t && !looking) toast(TRADEW.calledOff(name));
      if (looking) this.show();
    };
  }

  private heard(from: string, d: Record<string, unknown>): void {
    const id = tradeWord(d)!, now = performance.now() / 1000, c = this.cur;
    if (d.t === 'ask') {
      // A trade word speaks for the hero it comes from, and no other.
      if (d.h !== from) return;
      const name = String(d.n ?? '').toUpperCase().replace(/[^A-Z0-9 '-]/g, '').slice(0, 14) || 'STRANGER';
      if (c && !c.closed && c.peer === from) {
        // Both asked at once: the lower id is the trade (the other side keeps it too).
        if (c.phase === 'asking' && id < c.id) (this.start(from, id, c.name), this.cur!.word(d, now));
        return;
      }
      this.asks.set(from, { id, name, at: now });
      toast(TRADEW.asks(name), { act: { label: TRADEW.button, go: () => this.open(from, name) } });
      return;
    }
    if (c && c.peer === from && c.id === id) c.word(d.h === undefined || d.h === from ? d : { ...d, h: '' }, now);
  }

  private async put(items: Item[], gold: number): Promise<void> {
    const t = this.cur;
    if (!t || t.phase !== 'open') return;
    // A piece not ledgered yet: an id of its own, minted to you, before anyone sees it offered.
    const fresh = items.filter((i) => !i.ledger);
    if (fresh.length) {
      for (const i of fresh) i.ledger = 'x.' + tradeId();
      this.g.keep();
      const r = await ledgerCall({ mint: fresh.map((i) => [i.ledger, t.me]) });
      const owners = (r?.owners ?? []) as string[];
      if (!fresh.every((_, k) => owners[k] === t.me)) return void ((this.why = TRADEW.noLink), this.show());
    }
    this.why = '';
    t.put(items, gold);
  }

  /** Room in the pack and the vault for what they offer, once what you offer has gone. */
  private roomFor(t: Trade): boolean {
    const p = this.g.profile, free = bagSize(p) - p.bag.length + t.mine.items.length + vaultSize(p) - (p.stash?.length ?? 0);
    return t.theirs.items.length <= free;
  }

  show(): void {
    const t = this.cur;
    if (!t) return;
    this.showing = true;
    const p = this.g.profile, s = TRADEW.status, name = escapeHtml(t.name), open = t.phase === 'open', room = this.roomFor(t);
    if (open && !room) this.why = TRADEW.noRoom(name);
    else if (this.why === TRADEW.noRoom(name)) this.why = '';
    const status = t.phase === 'open' ? (t.okMine ? s.youOk(name) : t.okTheirs ? s.theyOk(name) : s.open) : t.phase === 'asking' ? s.asking(name) : t.phase === 'off' && t.byThem ? TRADEW.calledOff(name) : s[t.phase];
    // Rows as the shops have them: tap one for its card (and COMPARE), with what you can do with it.
    const rows: { it: Item; label?: string; act?: () => void }[] = [];
    const list = (items: Item[], head: string, act?: (it: Item, k: number) => { label: string; act: () => void } | null) =>
      `<div class="shop"><h3 class="gh">${head}</h3>` + (items.length ? `<div class="goods">` + items.map((it, k) => {
        const a = act?.(it, k) ?? null;
        rows.push({ it, ...(a ?? {}) });
        return `<button class="good" data-trow="${rows.length - 1}"><img src="${itemIcon(it)}" alt=""><span class="gn" style="color:${itemCol(it)}">${escapeHtml(itemName(it))}</span><em>${a ? a.label : ''}</em></button>`;
      }).join('') + `</div>` : `<p class="dim">${TRADEW.nothing}</p>`) + `</div>`;
    const offered = new Set(t.mine.items);
    const pack = p.bag.filter((it) => tradeable(it) && !offered.has(it));
    const gold = (d: number) => `<button data-gold="${d}" ${!open || t.mine.gold + d < 0 || t.mine.gold + d > Math.min(p.gold, TRADE_GOLD) ? 'disabled' : ''}>${d > 0 ? '+' : ''}${d}</button>`;
    const html =
      `<div class="trade"><p>${status}</p>${this.why ? `<p class="dim">${this.why}</p>` : ''}` +
      list(t.theirs.items, TRADEW.theirs(name)) + `<p>${TRADEW.gold(t.theirs.gold)}</p>` +
      list(t.mine.items, TRADEW.mine, (_, k) => (open ? { label: TRADEW.back, act: () => void this.put(t.mine.items.filter((__, j) => j !== k), t.mine.gold) } : null)) +
      `<p>${TRADEW.gold(t.mine.gold)} ${open ? gold(-100) + gold(-10) + gold(10) + gold(100) : ''}</p>` +
      (open ? (pack.length ? list(pack, TRADEW.pack, (it) => (t.mine.items.length < TRADE_ITEMS ? { label: TRADEW.offer, act: () => void this.put([...t.mine.items, it], t.mine.gold) } : null)) : `<p class="dim">${TRADEW.emptyPack}</p>`) + `<p class="dim">${TRADEW.have(p.gold)}</p>` : '') +
      `</div>`;
    const canAccept = open && !t.okMine && (t.mine.items.length + t.theirs.items.length + t.mine.gold + t.theirs.gold > 0) && room;
    const closed = t.closed;
    this.panel.show(TRADEW.title(t.name), html, [
      ...(closed ? [] : [{ label: TRADEW.accept, act: () => t.accept(performance.now() / 1000), primary: true, disabled: !canAccept }]),
      { label: closed ? TRADEW.close : TRADEW.callOff, act: () => ((this.showing = false), t.callOff(performance.now() / 1000), this.panel.hide()) },
    ], true);
    const on = (sel: string, f: (v: number) => void) => document.querySelectorAll<HTMLElement>(`#panel [${sel}]`).forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      f(Number(b.getAttribute(sel)));
    }));
    on('data-gold', (d) => void this.put(t.mine.items, Math.max(0, Math.min(p.gold, t.mine.gold + d))));
    on('data-trow', (k) => {
      const r = rows[k];
      if (!r) return;
      itemPop({ icon: itemIcon(r.it), name: escapeHtml(itemName(r.it)), col: itemCol(r.it), body: card(r.it, this.g.hero, true), cmp: () => compare(this.g.hero, r.it),
        acts: r.act ? [{ label: r.label!, act: () => void r.act!(), primary: true }] : [], again: () => this.show() });
    });
  }
}
