import { describe, expect, it } from 'vitest';
import { SHADOWSTEP, SKEWER, TICK, VENOM, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { renameKits } from '../src/shared/oldkits';
import { fromJson } from '../src/client/save';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { shadowstep } from '../src/sim/relics';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';

/** A Rogue with `weapon` at (9, 9) facing up, one goblin at (9, y) facing away, kept in place. */
function arena(weapon: WeaponId, kind: Enemy['kind'] = 'scrapper', y = 4) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1 });
  const e = Object.assign(newEnemy(10, kind, 9, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: -1, respawns: false });
  room.enemies = [e];
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      Object.assign(e, { x: 9, y, kvx: 0, kvy: 0, cooldown: 99 });
    }
    return out;
  };
  /** Hold to `hold` seconds, let go, and watch `after`. */
  let seq = 0;
  const loose = (hold: number, after: number) => (seq++, [...run(hold, { attackSeq: seq, attack: true }), ...run(after, { attackSeq: seq, attack: false })]);
  return { room, h, e, run, loose };
}
const ticks = (ev: FightEvent[], src: string) => ev.filter((x) => x.k === 'hit' && x.tick && x.src === src).map((x) => (x as { n: number }).n);

describe('Shadowstep', () => {
  it('stuns the goblin you land behind for a second', () => {
    const { h, e } = arena('daggers', 'scrapper', 6);
    const ev: FightEvent[] = [];
    shadowstep(h, [e], ev);
    expect(e.act).toBe('stunned');
    expect(e.actDur).toBe(SHADOWSTEP.stun);
    expect(ev.some((x) => x.k === 'stunned')).toBe(true);
  });
  it("doesn't stop a butcher mid striped blow", () => {
    const { h, e } = arena('daggers', 'butcher', 6);
    Object.assign(e, { act: 'attack', attack: { kind: 'cleave', t: 0.2, windup: 1, unblockable: true } });
    shadowstep(h, [e], []);
    expect(e.act).toBe('attack');
  });
});

describe('the rapier skewer', () => {
  it('a lunge loosed on the white flash skewers: it staggers and bleeds over a few seconds', () => {
    const { e, loose } = arena('rapier', 'scrapper', 7.2);
    const ev = loose(WEAPONS.rapier.draw! + 0.1, SKEWER.time + 0.5);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'skewer')).toBe(true);
    const bled = ticks(ev, 'bleed');
    expect(bled.length).toBeGreaterThanOrEqual(SKEWER.time / SKEWER.every - 1);
    expect(bled.every((n) => n === SKEWER.dmg)).toBe(true);
    expect(e.bleedUntil).toBeLessThan(999);
  });
  it('held too long, the lunge only lunges', () => {
    const { loose } = arena('rapier', 'scrapper', 7.2);
    const ev = loose(WEAPONS.rapier.draw! + 0.6, 1);
    expect(ev.some((x) => x.k === 'skewer')).toBe(false);
    expect(ticks(ev, 'bleed')).toEqual([]);
  });
});

describe("the poisoner's dart", () => {
  const perfect = WEAPONS.poisoner.draw! + 0.1, late = WEAPONS.poisoner.draw! + 0.5;
  it('poisons: a stack that ticks for a few seconds, then wears off', () => {
    const { e, loose, run } = arena('poisoner');
    const ev = [...loose(late, 1), ...run(VENOM.time)];
    expect(ev.some((x) => x.k === 'puke')).toBe(false);
    const n = ticks(ev, 'poison');
    expect(n.length).toBeGreaterThanOrEqual(VENOM.time / VENOM.every - 2);
    expect(n.every((v) => v === VENOM.dmg)).toBe(true);
    expect(e.venom).toBe(0);
  });
  it('stacks a little: a second dart ticks twice as hard', () => {
    const { e, loose } = arena('poisoner');
    loose(late, 0.6);
    const ev = loose(late, 1.2);
    expect(e.venom).toBe(2);
    expect(ticks(ev, 'poison')).toContain(VENOM.dmg * 2);
  });
  it('a goblin retches at most once every pukeEvery seconds, however many perfect darts', () => {
    const { loose } = arena('poisoner');
    const first = loose(perfect, 1.2), again = loose(perfect, 1.2);
    expect(first.some((x) => x.k === 'puke')).toBe(true);
    expect(again.some((x) => x.k === 'puke')).toBe(false);
  });
  it('loosed on the flash, the goblin retches (helpless) first, and its poison ticks harder', () => {
    const { e, loose, run } = arena('poisoner');
    const ev = loose(perfect, 0.4);
    expect(ev.some((x) => x.k === 'puke')).toBe(true);
    expect(e.act).toBe('stunned');
    expect(e.pukeUntil).toBeGreaterThan(0);
    ev.push(...run(0.8));
    expect(ticks(ev, 'poison')).toContain(VENOM.dmg * VENOM.hard);
  });
  it('butchers take half and say RESIST; spiders and nests take none', () => {
    const big = arena('poisoner', 'butcher');
    const ev = big.loose(perfect, 1.5);
    expect(ev.some((x) => x.k === 'resist')).toBe(true);
    expect(ticks(ev, 'poison').every((n) => n === Math.round(VENOM.dmg * VENOM.hard * 0.5))).toBe(true);
    for (const kind of ['spider', 'nest'] as const) {
      const s = arena('poisoner', kind);
      const out = s.loose(late, 1.5);
      expect(out.some((x) => x.k === 'resist')).toBe(true);
      expect(ticks(out, 'poison')).toEqual([]);
      expect(s.e.venom ?? 0).toBe(0);
    }
  });
});

describe('old saves', () => {
  it('a hand crossbow, in hand, in the pack, the vault or the buyback, comes back as the poisoner\'s kit', () => {
    const bow = { slot: 'weapon', kit: 'handbow', quality: 'fine', traits: [], mods: [{ id: 'damage', v: 3 }], level: 2 };
    const old = { weapon: 'handbow', cls: 'ROGUE', arms: { handbow: bow }, bag: [bow], stash: [bow], buyback: [{ item: bow, price: 9, runs: 0 }] };
    const p = renameKits(old as never) as typeof old;
    expect(p.weapon).toBe('poisoner');
    expect(Object.keys(p.arms)).toEqual(['poisoner']);
    for (const it of [(p.arms as Record<string, typeof bow>).poisoner, p.bag[0], p.stash[0], p.buyback[0].item]) expect(it).toMatchObject({ kit: 'poisoner', quality: 'fine', level: 2 });
    const save = fromJson({ heroes: [old as never], current: 0, world: {} as never });
    expect(save!.heroes[0].weapon).toBe('poisoner');
    expect(save!.heroes[0].arms.poisoner?.kit).toBe('poisoner');
  });
});
