import { describe, expect, it } from 'vitest';
import { newProfile } from '../src/shared/progress';
import { ERRAND_PAY, newKit, trainerGift } from '../src/shared/errandpay';
import { metNettle, openErrands, relicDone, sendToNettle, talkedTo, told, yardDone } from '../src/shared/errands';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';
import { CLASS_KITS, CLASS_ORDER } from '../src/shared/weapons';
import { ERRANDW } from '../src/client/errandwords';

const fresh = (cls: Parameters<typeof newProfile>[0] = 'WARRIOR') => ({ ...newProfile(cls, 'PAY'), prologue: true });

describe('small quests pay (Kyle, 2026-11-24)', () => {
  it('the church 20c, the yard 40c, each once, into the purse and the COIN EARNED tally', () => {
    const p = fresh();
    told(p);
    expect(relicDone(p)).toBe(true);
    expect(p.gold).toBe(ERRAND_PAY.relic);
    expect(relicDone(p)).toBe(false);
    talkedTo(p, 'trainer', 0);
    expect(yardDone(p)).toBe(40);
    expect(yardDone(p)).toBe(0);
    expect(p.gold).toBe(60);
    expect(p.stats.gold).toBe(60);
  });

  it('Nettle pays too, once', () => {
    const p = fresh('MAGE');
    told(p), sendToNettle(p);
    const was = p.gold;
    expect(metNettle(p)).toBe(true);
    expect(metNettle(p)).toBe(false);
    expect(p.gold - was).toBe(ERRAND_PAY.nettle);
  });

  it("the trainer's gift: a plain weapon of a kind you hold nothing for, into the pack, the same for the same hero", () => {
    for (const cls of CLASS_ORDER) {
      const p = fresh(cls);
      const it = trainerGift(p)!;
      expect(it.quality).toBe('plain');
      expect(it.kit).not.toBe(p.weapon);
      expect(CLASS_KITS[cls]).toContain(it.kit);
      expect(p.bag).toContain(it);
      // The next is another kind; then there's none left to give.
      const next = newKit(p);
      expect(next).not.toBe(it.kit);
      trainerGift(p);
      expect(newKit(p)).toBeNull();
      expect(trainerGift(p)).toBeNull();
      expect(trainerGift(fresh(cls))).toEqual(it);
    }
  });

  it('nothing into a full pack', () => {
    const p = fresh();
    p.bag = Array.from({ length: 8 }, () => ({ ...(p.armor as object) }) as never);
    expect(trainerGift(p)).toBeNull();
  });

  it('the words: a gift line for every class, never naming a weapon kind, and no em dashes', () => {
    for (const c of CLASS_ORDER) {
      expect(ERRANDW.firstGift[c]).toMatch(/yard|back/);
      expect(ERRANDW.firstGift[c]).toMatch(/javelin/);
      expect(ERRANDW.firstGift[c]).not.toMatch(/\bbow\b|sword|spear|dagger|rapier|wand|staff|mace|flail|censer|—/i);
    }
    expect(ERRANDW.giftNote + ERRANDW.todo('yard', 'WARRIOR')).not.toMatch(/—/);
  });

  it('the yard\'s place in the chain survives a save', () => {
    const p = fresh();
    told(p), relicDone(p), talkedTo(p, 'trainer', 0);
    const back = fromJson(JSON.parse(JSON.stringify({ heroes: [p], current: 0, world: newWorld() })))!.heroes[0];
    expect(back.errands?.yard).toBe(1);
    expect(openErrands(back)).toEqual(['yard']);
  });
});
