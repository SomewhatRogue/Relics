import { beforeEach, describe, expect, it } from 'vitest';
import { HUNGRY, TICK, rollHungry, type HungryId, type Item } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { heals, onKill, wears } from '../src/sim/hungry';
import { stepPickups } from '../src/sim/pickups';
import { applyGear, GEAR } from '../src/sim/pack';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};
const piece = (id: HungryId): Item => ({ slot: HUNGRY[id].slot, kit: HUNGRY[id].kit, armor: HUNGRY[id].armor, quality: 'hungry', traits: [], mods: [], level: 0, hungry: id });
function wear(h: Hero, id: HungryId): void {
  const it = piece(id);
  if (it.slot === 'weapon') (h.weapon = it.kit!), (h.arms = { [it.kit!]: it });
  else if (it.slot === 'armor') h.armor = it;
  else h.rings.push(it);
}
function onTarget(kind: 'scrapper' | 'butcher' = 'scrapper') {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const t = room.enemies.find((e) => e.kind === kind)!;
  room.enemies.forEach((e) => e !== t && Object.assign(e, { x: 1, y: 1, cooldown: 99, act: 'stunned', actDur: 99 }));
  Object.assign(t, { x: 9, y: 8, cooldown: 99, act: 'stunned', actDur: 99, fx: 0, fy: 1 });
  Object.assign(h, { x: 9, y: 9.1 });
  return { room, h, t };
}

describe('hungry gear', () => {
  it('rolls only pieces for the class, and a named butcher favours its own', () => {
    const rng = new Rng(9);
    for (let i = 0; i < 30; i++) {
      const it = rollHungry(rng, 'MAGE');
      expect(it.quality).toBe('hungry');
      if (it.slot === 'weapon') expect(it.hungry).toBe('jealous');
      expect(it.hungry).not.toBe('cleaver');
    }
    expect(Array.from({ length: 20 }, () => rollHungry(rng, 'WARRIOR', 'SKARN').hungry)).toContain('cleaver');
  });

  it("Skarn's Cleaver heals you on hits and refuses anyone else's healing", () => {
    const { room, h } = onTarget();
    wear(h, 'cleaver');
    h.hp = 50;
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(room, 0.8);
    expect(h.hp).toBeGreaterThan(50);
    const healer = { ...h, id: 'q', arms: {}, rings: [], armor: null } as Hero;
    expect(heals(h, healer, 10)).toBe(0);
    expect(heals(h, h, 10)).toBe(10);
  });

  it('the Larder Pike grows with kills and bites when it goes hungry', () => {
    const { room, h, t } = onTarget();
    wear(h, 'pike');
    const before = h.hp;
    onKill(h, 0, []);
    onKill(h, 0, []);
    expect(h.fed).toBe(2);
    t.alert = true;
    t.respawns = false;
    h.lastKill = -20;
    run(room, 1.2);
    expect(h.hp).toBeLessThan(before);
  });

  it('Spendthrift costs a gold an arrow and will not draw on an empty purse', () => {
    const { room, h } = onTarget();
    wear(h, 'spendthrift');
    h.purse = 1;
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    const ev = run(room, 0.8);
    expect(ev.some((e) => e.k === 'spend')).toBe(true);
    expect(h.purse).toBe(0);
    room.setIntent('me', intent({ attackSeq: 2, ay: -1 }));
    expect(run(room, 0.8).some((e) => e.k === 'shoot')).toBe(false);
  });

  it("Mother Rust's Needles kill a small goblin from behind", () => {
    const { room, h, t } = onTarget();
    wear(h, 'needles');
    Object.assign(t, { hp: 300, maxHp: 300, fy: -1 });
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(room, 0.5);
    expect(t.hp).toBeLessThanOrEqual(0);
  });

  it("the Butcher's Apron halves every blow; the Keeping Mace halves heals on others", () => {
    const room = new ArenaRoom(1);
    const h = room.join('me');
    wear(h, 'apron');
    expect(wears(h, 'apron')).toBe(true);
    const other = room.join('you');
    wear(other, 'keeping');
    expect(heals(h, other, 10)).toBe(5);
    expect(heals(other, other, 10)).toBe(20);
  });

  it('the Ransom Coat pays 50 gold for a killing blow, once a room', () => {
    const { room, h } = onTarget('butcher');
    wear(h, 'ransom');
    h.purse = 60;
    h.hp = 1;
    const b = room.enemies.find((e) => e.kind === 'butcher')!;
    Object.assign(b, { act: 'chase', cooldown: 0, actDur: 0, x: h.x, y: h.y - 1.2, alert: true });
    const ev = run(room, 3);
    expect(ev.some((e) => e.k === 'ransom')).toBe(true);
    expect(h.purse).toBe(10);
  });

  it("Someone's Wedding Ring doubles every coin and won't come off; the Tooth Ring takes the party's gold near it", () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const a = room.join('me'), b = room.join('you');
    wear(a, 'wedding');
    const ev: FightEvent[] = [];
    stepPickups([{ id: 1, x: b.x, y: b.y, life: 9, gold: 10 }], room.heroes, ev, TICK);
    expect(ev.find((e) => e.k === 'gold' && e.id === 'me')).toMatchObject({ n: 10 });
    applyGear(a, GEAR.off, 0, []);
    expect(a.rings.length).toBe(1);
    wear(b, 'tooth');
    const ev2: FightEvent[] = [];
    stepPickups([{ id: 2, x: b.x, y: b.y, life: 9, gold: 10 }], room.heroes, ev2, TICK);
    expect(ev2.filter((e) => e.k === 'gold').map((e) => (e as { id: string }).id)).toEqual(['you']);
    expect(ev2.some((e) => e.k === 'tooth')).toBe(true);
  });

  it('the Want grows with jobs in hungry gear and falls at the church', () => {
    const g = new Game();
    g.create('WARRIOR', 'greed');
    g.skipWood();
    const it = piece('cleaver');
    g.profile.bag.push(it);
    g.hero.bag.push(it);
    g.step(0.1, { ...NO_INTENT, gearSeq: 1, gearOp: 1, gearArg: g.profile.bag.length - 1 });
    expect(g.hungryWorn().length).toBe(1);
    g.startJob(g.jobs()[1]);
    (g as unknown as { finish(w: boolean): void }).finish(true);
    expect(g.profile.want).toBeGreaterThanOrEqual(5);
    g.giveUp(g.hungryWorn()[0]);
    expect(g.hungryWorn().length).toBe(0);
    expect(g.profile.want).toBe(0);
    expect(g.profile.weapon).toBe('sword');
  });
});
