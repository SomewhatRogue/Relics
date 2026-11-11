/** The item ledger (docs/design/trading.md): minted once, owned on the server, checked on load, GONE on a mismatch; boss drops stamped with `<run>:<boss>`. */
import { describe, expect, it } from 'vitest';
import { checkHeld, memoryLedgerStore } from '../api/_ledger';
import { cleanCheck, cleanMint } from '../api/ledger';
import { dropLedger, ledgered, prune, runTag } from '../src/shared/ledger';
import { Rng } from '../src/shared/rng';
import { uniqueItem } from '../src/shared/uniques';
import type { Item } from '../src/shared/loot';
import { newEnemy } from '../src/sim/enemies';
import { stepRolls } from '../src/sim/lootroll';
import { ArenaRoom } from '../src/sim/room';
import { uniqueDrops } from '../src/sim/uniquedrop';
import { NO_INTENT, type Enemy } from '../src/sim/types';

const A = 'habcdefgh234', B = 'hzyxwvuts987';
const piece = (ledger: string): Item => ({ ...uniqueItem('haulpick'), ledger });
const plain = (): Item => ({ slot: 'armor', armor: 'heavy', quality: 'plain', traits: [], mods: [], level: 0 });

describe('the ledger store', () => {
  it('mints an id once: a second mint keeps the first owner', async () => {
    const s = memoryLedgerStore();
    expect(await s.claim([['ABC.2.xk4m:17', A]])).toEqual([A]);
    expect(await s.claim([['ABC.2.xk4m:17', B]])).toEqual([A]);
    expect(await s.owners(['ABC.2.xk4m:17', 'none:1'])).toEqual([A, null]);
  });

  it('a check keeps what is yours, takes an unseen id for its holder, and gives back the rest as GONE', async () => {
    const s = memoryLedgerStore();
    await s.claim([['r:1', A], ['r:2', B]]);
    const gone = await checkHeld(s, { [A]: ['r:1', 'r:2', 'r:3'] });
    expect(gone).toEqual({ [A]: ['r:2'] });
    expect(await s.owners(['r:3'])).toEqual([A]);
  });

  it('one id held by two heroes of a save: the first keeps it, the second loses it', async () => {
    const gone = await checkHeld(memoryLedgerStore(), { [A]: ['r:9'], [B]: ['r:9'] });
    expect(gone).toEqual({ [B]: ['r:9'] });
  });
});

describe('the endpoint turns away what it can not trust', () => {
  it('mints: sound ids and hero ids only', () => {
    expect(cleanMint([['r.1.ab:7', A]])).toEqual([['r.1.ab:7', A]]);
    expect(cleanMint([['r.1.ab:7', 'squire']])).toBeNull();
    expect(cleanMint([['bad id!', A]])).toBeNull();
    expect(cleanMint([])).toBeNull();
  });
  it('checks: heroes to lists of ids, not too many', () => {
    expect(cleanCheck({ [A]: ['r:1'] })).toEqual({ [A]: ['r:1'] });
    expect(cleanCheck({ [A]: Array.from({ length: 121 }, (_, i) => `r:${i}`) })).toBeNull();
    expect(cleanCheck({})).toBeNull();
  });
});

describe('a save', () => {
  it('finds ledgered pieces wherever a hero keeps them', () => {
    const k = { arms: { greatsword: piece('a:1') }, armor: piece('a:2'), rings: [piece('a:3')], bag: [piece('a:4'), uniqueItem('cartlink')], stash: [piece('a:5')], buyback: [{ item: piece('a:6') }] };
    expect(ledgered(k).map((i) => i.ledger)).toEqual(['a:1', 'a:2', 'a:3', 'a:4', 'a:5', 'a:6']);
  });

  it('a GONE piece leaves; worn armor goes back to plain; a twin goes too, keeping the one in use', () => {
    const k = { arms: { greatsword: piece('a:1') }, armor: piece('a:2'), rings: [], bag: [piece('a:1'), piece('a:3')] };
    const out = prune(k, new Set(['a:2']), plain);
    expect(out.map((i) => i.ledger)).toEqual(['a:2', 'a:1']);
    expect(k.armor.quality).toBe('plain');
    expect(k.arms.greatsword?.ledger).toBe('a:1');
    expect(k.bag.map((i) => i.ledger)).toEqual(['a:3']);
  });

  it('a run tag is a sound ledger id part', () => {
    const t = runTag('solo-mh3k2x9ab', 4, () => 0.5);
    expect(t).toMatch(/^solo-mh3k2x9ab\.4\.[a-z0-9]{4}$/);
    expect(dropLedger(t, 17)).toBe(`${t}:17`);
    expect(dropLedger('', 17)).toBeUndefined();
  });
});

describe('boss drops through the ledger (step 2)', () => {
  const deep = (party = 1) => {
    const r = new ArenaRoom(5, { scrappers: false });
    r.floor = 3;
    r.ledgerRun = 'PARTY.2.k3x9';
    r.join('a').weapon = 'sword';
    if (party > 1) r.join('b').weapon = 'greatsword';
    return r;
  };
  const fall = (r: ArenaRoom, patch: Partial<Enemy>) => {
    const e = Object.assign(newEnemy(900 + r.enemies.length, 'butcher', 4, 4), { act: 'dead' as const, hp: 0 }, patch);
    r.enemies.push(e);
    return e;
  };

  it('a drop alone carries its run and boss', () => {
    const r = deep(), e = fall(r, { name: 'SKARN' });
    uniqueDrops(r, [e], new Rng(1));
    expect(r.drops[0].item.ledger).toBe(`PARTY.2.k3x9:${e.id}`);
  });

  it('a rolled drop carries the same id into the winner\'s pack', () => {
    const r = deep(2), e = fall(r, { name: 'SKARN' });
    uniqueDrops(r, [e], new Rng(1));
    const roll = r.rolls[0];
    for (const id of ['a', 'b']) r.setIntent(id, { ...NO_INTENT, loot: { [roll.id]: 'greed' } });
    stepRolls(r, new Rng(2));
    const w = r.heroes.find((h) => h.id === roll.winner)!;
    expect(w.bag.at(-1)?.ledger).toBe(`PARTY.2.k3x9:${e.id}`);
  });

  it('the same boss dropping again (a handover replaying it) gets the same id', () => {
    const r1 = deep(), r2 = deep(), e1 = fall(r1, { name: 'SKARN' }), e2 = fall(r2, { name: 'SKARN' });
    uniqueDrops(r1, [e1], new Rng(1));
    uniqueDrops(r2, [e2], new Rng(9));
    expect(r1.drops[0].item.ledger).toBe(r2.drops[0].item.ledger);
  });

  it('a room with no run tag stamps nothing (practice, the solo build before a job)', () => {
    const r = deep();
    r.ledgerRun = '';
    uniqueDrops(r, [fall(r, { name: 'SKARN' })], new Rng(1));
    expect(r.drops[0].item.ledger).toBeUndefined();
  });
});
