/** Two players trading (docs/design/trading.md, step 3): the words between them, the server's swap, each save settled once. */
import { describe, expect, it } from 'vitest';
import { memoryLedgerStore, type LedgerStore } from '../api/_ledger';
import { cleanItem, settle, type Pending, type TradeState } from '../src/shared/trade';
import { uniqueItem } from '../src/shared/uniques';
import type { Item } from '../src/shared/loot';
import { Trade, type TradeIO } from '../src/client/trade';

const A = 'habcdefgh234', B = 'hzyxwvuts987';
const piece = (ledger: string): Item => ({ ...uniqueItem('haulpick'), ledger });

/** A hero's keeping, its save's pending trade, and a Trade wired to the other one and the store. */
function side(me: string, store: LedgerStore, bag: Item[], gold: number) {
  const hero = { bag, gold, stash: [] as Item[] }, box: { pending?: Pending; settled: number; t?: Trade; other?: { t?: Trade } } = { settled: 0 };
  const io: TradeIO = {
    say: (d) => queue.push(() => box.other!.t!.word(d, 0)),
    call: async (b) => {
      const q = b as { accept?: Pending['t']; withdraw?: string; hero: string };
      if (q.accept) return { state: await store.accept(q.accept, q.hero) };
      return { state: await store.withdraw(q.withdraw!, q.hero) };
    },
    hold: (p) => (box.pending = p),
    end: (s: TradeState) => {
      if (s === 'done' && box.pending) (settle(hero, box.pending, 10), box.settled++);
      if (s !== 'wait') delete box.pending;
    },
  };
  return { hero, box, io };
}
const queue: (() => void)[] = [];
const flush = () => { while (queue.length) queue.shift()!(); };
const settleAll = async (...ts: Trade[]) => { for (let i = 0; i < 6; i++) { for (const t of ts) t.tick(i * 3); await new Promise((r) => setTimeout(r, 0)); flush(); } };

async function pair() {
  const store = memoryLedgerStore();
  await store.claim([['x:1', A], ['y:1', B]]);
  const a = side(A, store, [piece('x:1')], 100), b = side(B, store, [piece('y:1')], 20);
  a.box.other = b.box;
  b.box.other = a.box;
  a.box.t = new Trade('tr4de0001', 'pb', 'BRAN', A, a.io);
  b.box.t = new Trade('tr4de0001', 'pa', 'ASH', B, b.io);
  a.io.say({ t: 'ask', h: A });
  flush();
  return { store, a, b, ta: a.box.t, tb: b.box.t };
}

describe('a trade between two players', () => {
  it('both offer, both accept: the server swaps, each save settles once, the gold goes both ways', async () => {
    const { store, a, b, ta, tb } = await pair();
    expect([ta.phase, tb.phase]).toEqual(['open', 'open']);
    ta.put([a.hero.bag[0]], 30);
    tb.put([b.hero.bag[0]], 0);
    flush();
    expect(tb.theirs.items[0].ledger).toBe('x:1');
    ta.accept(0);
    tb.accept(0);
    flush();
    expect([ta.phase, tb.phase]).toEqual(['sending', 'sending']);
    await settleAll(ta, tb);
    expect([ta.phase, tb.phase]).toEqual(['done', 'done']);
    expect(a.hero.bag.map((i) => i.ledger)).toEqual(['y:1']);
    expect(b.hero.bag.map((i) => i.ledger)).toEqual(['x:1']);
    expect([a.hero.gold, b.hero.gold]).toEqual([70, 50]);
    expect([a.box.settled, b.box.settled]).toEqual([1, 1]);
    expect(await store.owners(['x:1', 'y:1'])).toEqual([B, A]);
  });

  it('a change after one ACCEPT clears both', async () => {
    const { a, ta, tb } = await pair();
    ta.put([a.hero.bag[0]], 0);
    flush();
    tb.accept(0);
    flush();
    expect(ta.okTheirs).toBe(true);
    ta.put([], 5);
    flush();
    expect([ta.okTheirs, tb.okMine]).toEqual([false, false]);
    ta.accept(0);
    flush();
    expect(tb.phase).toBe('open');
  });

  it('called off while open: nothing moves, nothing is kept', async () => {
    const { store, a, b, ta, tb } = await pair();
    ta.put([a.hero.bag[0]], 0);
    flush();
    ta.callOff(0);
    flush();
    expect([ta.phase, tb.phase]).toEqual(['off', 'off']);
    expect(await store.owners(['x:1'])).toEqual([A]);
    expect([a.box.pending, b.box.pending]).toEqual([undefined, undefined]);
  });

  it('a piece offered that is not yours anymore: the server refuses, nothing moves', async () => {
    const { store, a, ta, tb } = await pair();
    await store.claim([['z:9', B]]);
    ta.put([a.hero.bag[0], piece('z:9')], 0);
    flush();
    ta.accept(0);
    tb.accept(0);
    flush();
    await settleAll(ta, tb);
    expect([ta.phase, tb.phase]).toEqual(['bad', 'bad']);
    expect(await store.owners(['x:1', 'z:9'])).toEqual([A, B]);
    expect(a.hero.bag.map((i) => i.ledger)).toEqual(['x:1']);
  });
});

describe('what comes from another browser', () => {
  it('an item is rebuilt from its own fields only, and hungry gear is turned away', () => {
    const it = cleanItem({ ...piece('x:1'), extra: '<b>' });
    expect(it && 'extra' in it).toBe(false);
    expect(cleanItem({ slot: 'weapon', kit: 'sword', quality: 'hungry', traits: [], ledger: 'x:2' })).toBeNull();
    expect(cleanItem({ slot: 'weapon', kit: 'nope', quality: 'fine', traits: [], ledger: 'x:2' })).toBeNull();
    expect(cleanItem({ slot: 'weapon', kit: 'sword', quality: 'fine', traits: [] })).toBeNull();
  });
});
