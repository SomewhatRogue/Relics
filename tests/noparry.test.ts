/**
 * Parry is gone (Kyle, 2026-11-05: "Parry in general is getting pushback as noisy, confusing, and hard to
 * land with a lot of enemies at once and latency"). The Warrior and Healer block; the Ranger, Rogue and
 * Mage dodge. Nobody parries; old saves with PARRY on their gear load with BLOCK or DODGE in its place;
 * the gaffer's hook and Hempen's noose are met by a block or a dodge; every striped blow can be dodged;
 * and the same fight plays the same way twice.
 */
import { describe, expect, it } from 'vitest';
import * as T from '../src/shared/tuning';
import { CLASS_DODGES, CLASS_GUARD, CLASS_KITS, CLASS_ORDER, GAFFER, HEMPEN, HERO, MODS, TICK, WEAPONS, guardOf, modPoints, type EnemyAttackSpec, type Item, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { NO_INTENT, type EnemyAttack, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { noParry } from '../src/shared/oldparry';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

/** A hero with `weapon` at (9, 9) facing up, a goblin above it at (9, 7.6). */
function duel(weapon: WeaponId) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1 });
  const e = Object.assign(newEnemy(10, 'scrapper', 9, 7.6), { cooldown: 99, alert: true, fx: 0, fy: 1, respawns: false });
  room.enemies = [e];
  const run = (s: number, i: Partial<Intent> = {}) => {
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) room.step();
  };
  return { room, h, e, run };
}
/** A blow from (9, 7.6) down onto (9, 9): `spec`'s numbers, swung as `kind`. */
const blowOf = (spec: Partial<EnemyAttackSpec>, more: Partial<EnemyAttack> = {}): EnemyAttack => ({
  kind: 'swing', t: 1, windup: 1, active: 0.1, recover: 0.3, dmg: 10, knock: 2, unblockable: false, range: 2.2, arc: 90,
  ...spec, dx: 0, dy: 1, ox: 9, oy: 7.6, cx: 9, cy: 9, radius: Math.max(1, (spec as { radius?: number }).radius ?? 1), done: false, ...more,
} as EnemyAttack);

describe('no class can parry', () => {
  it('a tap of block just before a blow, for every kit of every class: nothing stunned, no PARRY, no counter', () => {
    for (const c of CLASS_ORDER) for (const w of CLASS_KITS[c]) {
      const { room, h, e, run } = duel(w);
      run(TICK, { blockSeq: 1 });
      const ev: FightEvent[] = [];
      hitHero(e, blowOf({ dmg: 10 }), h, room.time, ev);
      expect(ev.some((x) => (x.k as string) === 'parry'), w).toBe(false);
      expect(e.act, w).not.toBe('stunned');
      expect(h.counterUntil, w).toBeLessThan(room.time);
      expect('parryOpenAt' in h, w).toBe(false);
    }
  });

  it('no kit carries a parry window, a parry-only flag or a riposte', () => {
    for (const w of Object.keys(WEAPONS) as WeaponId[]) {
      const k = WEAPONS[w] as unknown as Record<string, unknown>;
      for (const f of ['parryWindow', 'parryOnly', 'ripostes']) expect(k[f], `${w}.${f}`).toBeUndefined();
    }
    expect('parry' in MODS).toBe(false);
    expect('parry' in T.HITSTOP).toBe(false);
    expect('RIPOSTE' in T).toBe(false);
  });
});

describe('each class has the right guard', () => {
  it('the Warrior and Healer block; the Ranger, Rogue and Mage dodge, every kit as its class', () => {
    expect(CLASS_GUARD).toEqual({ WARRIOR: 'full', HEALER: 'full', RANGER: 'none', ROGUE: 'none', MAGE: 'none' });
    for (const c of CLASS_ORDER) {
      expect(CLASS_DODGES[c], c).toBe(CLASS_GUARD[c] === 'none');
      for (const w of CLASS_KITS[c]) expect(guardOf(WEAPONS[w]), w).toBe(CLASS_GUARD[c]);
    }
  });

  it('a held block works for every Warrior and Healer kit and for nobody else', () => {
    for (const c of CLASS_ORDER) for (const w of CLASS_KITS[c]) {
      const { room, h, e, run } = duel(w);
      run(0.1, { block: true, blockSeq: 1 });
      const ev: FightEvent[] = [];
      hitHero(e, blowOf({ dmg: 10 }), h, room.time, ev);
      const blocked = ev.some((x) => x.k === 'block');
      expect(blocked, w).toBe(CLASS_GUARD[c] === 'full');
      if (blocked) expect(h.hp, w).toBe(HERO.hp), expect(h.counterUntil, w).toBeGreaterThan(room.time);
    }
  });

  it("a heavy's crushing blow is blocked, dearer than a plain one, and shoves further", () => {
    const plain = duel('sword'), crush = duel('sword');
    for (const d of [plain, crush]) d.run(0.1, { block: true, blockSeq: 1 });
    const y0 = crush.h.y;
    hitHero(plain.e, blowOf({ dmg: 18, knock: 8 }), plain.h, plain.room.time, []);
    hitHero(crush.e, blowOf({ dmg: 18, knock: 8 }, { crush: true }), crush.h, crush.room.time, []);
    expect([plain.h.hp, crush.h.hp]).toEqual([HERO.hp, HERO.hp]);
    expect(crush.h.stamina).toBeLessThan(plain.h.stamina);
    expect(crush.h.act).not.toBe('stun');
    expect(crush.h.y + crush.h.kvy * 0.1).toBeGreaterThanOrEqual(y0);
  });
});

describe('old saves', () => {
  it('PARRY on gear loads as BLOCK for a block class and DODGE for a dodge class, worth the same', () => {
    const parry = (v: number) => ({ id: 'parry', v }) as unknown as NonNullable<Item['mods']>[number];
    const w = newProfile('WARRIOR', 'OLD'), r = newProfile('RANGER', 'OLDER');
    const sword: Item = { slot: 'weapon', kit: 'sword', quality: 'forged', traits: [], mods: [parry(0.04), { id: 'arc', v: 0.1 }], level: 1 };
    const both: Item = { slot: 'weapon', kit: 'spear', quality: 'forged', traits: [], mods: [parry(0.03), { id: 'guard', v: 0.06 }], level: 0 };
    const ring: Item = { slot: 'ring', quality: 'fine', traits: [], mods: [parry(0.02)], level: 0 };
    const bow: Item = { slot: 'weapon', kit: 'longbow', quality: 'fine', traits: [], mods: [parry(0.03)], level: 0 };
    Object.assign(w, { arms: { sword }, bag: [both], rings: [ring], perks: ['w_parry'], level: 3, picks: 1 });
    Object.assign(r, { bag: [bow], stash: [ring], buyback: [{ item: ring, price: 5, runs: 0 }] });
    const s = fromJson(JSON.parse(JSON.stringify({ heroes: [w, r], current: 0, world: newWorld() })))!;
    const [W, R] = s.heroes;
    const ids = (it: Item | undefined | null) => (it?.mods ?? []).map((m) => m.id);
    expect(ids(W.arms.sword)).toEqual(['guard', 'arc']);
    expect(ids(W.bag[0])).toEqual(['guard']);
    expect(ids(W.rings[0])).toEqual(['guard']);
    expect(ids(R.bag[0])).toEqual(['dodge']);
    expect(ids(R.stash![0])).toEqual(['dodge']);
    expect(ids(R.buyback![0].item)).toEqual(['dodge']);
    // Worth what it was: 0.04 s of parry was 8 points; BLOCK at 0.67 a point is 12%.
    expect(modPoints(W.arms.sword!.mods![0])).toBeCloseTo(8, 0);
    // Merged with the BLOCK already on it: both their points.
    expect(modPoints(W.bag[0].mods![0])).toBeCloseTo(6 + 0.06 * 100 * MODS.guard.per, 0);
    // WIDE PARRY is WIDE GUARD on the same step, no pick lost.
    expect(W.perks).toEqual(['w_wide']);
    // Nothing anywhere still says PARRY.
    expect(JSON.stringify(s)).not.toMatch(/"parry"/);
  });

  it('a piece with no PARRY comes back as it was (the very same object)', () => {
    const it: Item = { slot: 'weapon', kit: 'sword', quality: 'fine', traits: [], mods: [{ id: 'arc', v: 0.1 }], level: 0 };
    expect(noParry(it, 'WARRIOR')).toBe(it);
    expect(noParry(null, 'MAGE')).toBeNull();
  });
});

describe('the gaffer and the noose are met by a block or a dodge', () => {
  /** The hook (a gaffer's) or the noose (Hempen's) on `weapon`'s hero: `how` it's met. */
  function meet(weapon: WeaponId, noose: boolean, how: 'block' | 'dodge' | 'nothing') {
    const { room, h, run } = duel(weapon);
    const g = Object.assign(newEnemy(20, noose ? 'butcher' : 'scrapper', 9, 6), { cooldown: 99, alert: true, fx: 0, fy: 1, respawns: false, ...(noose ? { noose: true } : { variant: 'gaffer' as const }) });
    room.enemies = [g];
    if (how === 'block') run(0.1, { block: true, blockSeq: 1 });
    if (how === 'dodge') Object.assign(h, { act: 'roll', actT: 0.05 });
    const spec = noose ? HEMPEN.noose : GAFFER.hook, ev: FightEvent[] = [];
    const x0 = h.x, y0 = h.y;
    hitHero(g, blowOf(spec, { kind: 'hook', ox: 9, oy: 6, aimed: h.id }), h, room.time, ev, room.heroes);
    return { h, ev, moved: Math.hypot(h.x - x0, h.y - y0) > 0.3 };
  }

  it('let land, the hook hauls you and the noose hoists you (the control)', () => {
    expect(meet('sword', false, 'nothing').ev.some((x) => x.k === 'hooked')).toBe(true);
    expect(meet('sword', true, 'nothing').h.hoisted).toBeTruthy();
  });

  it('blocked by a Warrior or Healer, or dodged by a Ranger, Rogue or Mage: nothing comes of it', () => {
    for (const noose of [false, true]) {
      for (const w of ['sword', 'greatsword', 'mace'] as const) {
        const m = meet(w, noose, 'block');
        expect(m.ev.some((x) => x.k === 'block'), w).toBe(true);
        expect(m.ev.some((x) => x.k === 'hooked'), w).toBe(false);
        expect(m.h.hoisted, w).toBeFalsy();
      }
      for (const w of ['longbow', 'daggers', 'wand', 'spellblade'] as const) {
        const m = meet(w, noose, 'dodge');
        expect(m.ev.some((x) => x.k === 'dodge'), w).toBe(true);
        expect(m.ev.some((x) => x.k === 'hooked'), w).toBe(false);
        expect(m.h.hoisted, w).toBeFalsy();
        expect(m.h.hp, w).toBe(HERO.hp);
      }
    }
  });

  it('nothing snaps the hook any more (that was the parry)', () => {
    expect('snapped' in GAFFER).toBe(false);
  });
});

describe('every striped blow in the roster can be dodged', () => {
  /** Every attack spec the tuning exports (a goblin's, a butcher's, a named one's), with its path. */
  function specs(): [string, EnemyAttackSpec][] {
    const out: [string, EnemyAttackSpec][] = [], seen = new Set<unknown>();
    const walk = (v: unknown, path: string, depth: number) => {
      if (!v || typeof v !== 'object' || seen.has(v) || depth > 3) return;
      seen.add(v);
      const o = v as Record<string, unknown>;
      if (typeof o.windup === 'number' && typeof o.dmg === 'number' && 'unblockable' in o) out.push([path, o as unknown as EnemyAttackSpec]);
      else for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`, depth + 1);
    };
    for (const [k, v] of Object.entries(T)) walk(v, k, 0);
    return out;
  }

  it('finds the striped ones (the butcher slam, the lunger stab and more)', () => {
    const striped = specs().filter(([, s]) => s.unblockable);
    expect(striped.length).toBeGreaterThanOrEqual(3);
  });

  it('each one, round or long, rolled, jumped, dashed or blinked through: no health lost; walked out of by a Warrior or Healer: none either', () => {
    for (const [name, s] of specs().filter(([, x]) => x.unblockable)) {
      for (const kind of ['swing', 'slam'] as const) {
        for (const w of ['longbow', 'daggers', 'wand', 'spellblade'] as const) {
          const { room, h, e } = duel(w);
          Object.assign(h, { act: 'roll', actT: WEAPONS[w].dodge.iFrom + 0.01 });
          const ev: FightEvent[] = [];
          hitHero(e, blowOf(s, { kind }), h, room.time, ev);
          expect(h.hp, `${name} as ${kind} on ${w}`).toBe(HERO.hp);
          expect(ev.some((x) => x.k === 'dodge'), `${name} on ${w}`).toBe(true);
        }
        // No dodge button: out of its reach on foot, it misses, and counts as the dodge if it was meant for you.
        for (const w of ['sword', 'mace'] as const) {
          const { room, h, e } = duel(w);
          Object.assign(h, { x: 15, y: 15 });
          hitHero(e, blowOf(s, { kind, aimed: h.id }), h, room.time, []);
          expect(h.hp, `${name} walked out of on ${w}`).toBe(HERO.hp);
        }
      }
    }
  });

  it("the heavy's and the butcher's blows are dodgeable by every dodge class, and blockable (a striped one in part)", () => {
    for (const s of [T.VARIANTS.heavy.swing, T.BUTCHER.cleave, T.BUTCHER.slam]) {
      for (const w of ['longbow', 'daggers', 'wand'] as const) {
        const { room, h, e } = duel(w);
        Object.assign(h, { act: 'roll', actT: 0.05 });
        hitHero(e, blowOf(s), h, room.time, []);
        expect(h.hp).toBe(HERO.hp);
      }
      const { room, h, e, run } = duel('sword');
      run(0.1, { block: true, blockSeq: 1 });
      const ev: FightEvent[] = [];
      hitHero(e, blowOf(s), h, room.time, ev);
      expect(ev.some((x) => x.k === 'block' && !!x.striped === s.unblockable)).toBe(true);
    }
  });
});

describe('online', () => {
  it("an old guest's intent with fields that are gone (a parry press) is read, and the extra ignored", () => {
    const { room, h, e, run } = duel('sword');
    room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1, parrySeq: 3, parry: true } as unknown as Intent);
    for (let k = 0; k < 4; k++) room.step();
    const ev: FightEvent[] = [];
    hitHero(e, blowOf({ dmg: 10 }), h, room.time, ev);
    expect(ev.some((x) => x.k === 'block')).toBe(true);
    run(0.1);
  });
});

describe('determinism', () => {
  /** A Warrior blocking and a Ranger jumping in one room against the butcher, the same seed twice. */
  function play(): string {
    const room = new ArenaRoom(7, { scrappers: false });
    const a = room.join('aaaa'), b = room.join('bbbb'), butcher = room.enemies[0];
    for (const e of room.enemies.slice(1)) Object.assign(e, { x: 0.5, y: 15.5 });
    Object.assign(butcher, { x: 9, y: 6, cooldown: 0 });
    Object.assign(a, { weapon: 'sword' as WeaponId, x: 9, y: 7.6, fx: 0, fy: -1 });
    Object.assign(b, { weapon: 'longbow' as WeaponId, x: 14, y: 10 });
    const log: string[] = [];
    for (let i = 0; i < Math.round(30 / TICK); i++) {
      room.setIntent('aaaa', { ...NO_INTENT, block: i % 200 < 150, blockSeq: Math.floor(i / 200), attackSeq: Math.floor(i / 200), ay: -1 });
      room.setIntent('bbbb', { ...NO_INTENT, rollSeq: Math.floor(i / 70), mx: i % 140 < 70 ? 1 : -1, attackSeq: Math.floor(i / 33) });
      for (const h of [a, b] as Hero[]) if (h.act === 'down') h.hp = h.maxHp;
      a.x = 9, a.y = 7.6;
      room.step();
      for (const ev of room.events) if (ev.k === 'block' || ev.k === 'dodge' || ev.k === 'slip' || ev.k === 'guardbreak' || ev.k === 'hit') log.push(`${i}:${ev.k}`);
    }
    return JSON.stringify({ log, heroes: [a, b].map((h) => [h.x, h.y, h.hp, h.stamina]), foes: room.enemies.map((e) => [e.x, e.y, e.hp, e.act]) });
  }

  it('the same fight plays the same way twice, blocks and dodges and all', () => {
    const one = play();
    expect(one).toMatch(/:block/);
    expect(play()).toBe(one);
  });
});
