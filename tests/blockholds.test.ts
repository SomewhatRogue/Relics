/**
 * A block holds (Kyle, 2026-11-06: "Warrior block isn't great against butcher. Should mitigate all damage,
 * even unblockable. Right now tutorial is too hard unfortunately"). A red blow blocked takes no health,
 * however hard; its stamina is capped (GUARD.knee, past, most). A striped blow blocked facing it lets 25%
 * through for a Warrior, 40% for a Healer (whose ward meets it from any side), costs more stamina and shoves
 * harder, and stepping out of it is still better. A Warrior who blocks can stand in front of a butcher a good
 * while; the wood is gentler, and each class gets through it.
 */
import { describe, expect, it } from 'vitest';
import { CLASS_KITS, CLASS_ORDER, GUARD, HERO, TICK, VARIANTS, WEAPONS, WOOD_EASE, type EnemyAttackSpec, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { blockBreath } from '../src/sim/blockhold';
import { NO_INTENT, type EnemyAttack, type FightEvent, type Intent } from '../src/sim/types';
import { standBlock } from './butcherbot';
import { woodRun } from './woodbot';

/** A hero with `weapon` at (9, 9) facing up (or down: `back`), blocking, a goblin above it at (9, 7.6). */
function duel(weapon: WeaponId, back = false) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: back ? 1 : -1, safeT: 0 });
  const e = Object.assign(newEnemy(10, 'scrapper', 9, 7.6), { cooldown: 99, alert: true, fx: 0, fy: 1, respawns: false });
  room.enemies = [e];
  const run = (s: number, i: Partial<Intent> = {}) => {
    room.setIntent('me', { ...NO_INTENT, ay: back ? 1 : -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) room.step();
  };
  run(0.1, { block: true });
  return { room, h, e, run };
}
const blowOf = (spec: Partial<EnemyAttackSpec>): EnemyAttack => ({
  kind: 'swing', t: 1, windup: 1, active: 0.1, recover: 0.3, dmg: 10, knock: 2, unblockable: false, range: 2.2, arc: 90,
  ...spec, dx: 0, dy: 1, ox: 9, oy: 7.6, cx: 9, cy: 9, radius: 1, done: false,
} as EnemyAttack);
const blockers = [...CLASS_KITS.WARRIOR, ...CLASS_KITS.HEALER];

describe('a red blow blocked', () => {
  it('takes no health for any Warrior or Healer kit, however hard it hits', () => {
    for (const w of blockers) for (const dmg of [8, 30, 60]) {
      const { room, h, e } = duel(w);
      const ev: FightEvent[] = [];
      hitHero(e, blowOf({ dmg, knock: 8 }), h, room.time, ev);
      expect(h.hp, `${w} ${dmg}`).toBe(HERO.hp);
      expect(ev.some((x) => x.k === 'block' || x.k === 'guardbreak'), w).toBe(true);
    }
  });

  it('costs stamina on a curve: a scrapper as before, a butcher\'s cleave far less, never more than GUARD.most', () => {
    const { h } = duel('sword');
    expect(blockBreath(h, 8)).toBeCloseTo(8 * GUARD.staminaPerDmg);
    expect(blockBreath(h, 30)).toBeCloseTo(46.08);
    expect(blockBreath(h, 30)).toBeLessThan(30 * GUARD.staminaPerDmg);
    expect(blockBreath(h, 200)).toBe(GUARD.most);
    expect(blockBreath(h, 18, true)).toBeGreaterThan(blockBreath(h, 18));
  });

  it('a full bar always holds one blow; the guard breaks only once stamina runs out', () => {
    for (const w of blockers) {
      const { room, h, e } = duel(w);
      const ev: FightEvent[] = [];
      hitHero(e, blowOf({ dmg: 90 }), h, room.time, ev);
      expect(ev.some((x) => x.k === 'guardbreak'), w).toBe(false);
      expect(h.stamina, w).toBeGreaterThan(0);
      h.stamina = 5;
      hitHero(e, blowOf({ dmg: 90 }), h, room.time, ev);
      expect(ev.some((x) => x.k === 'guardbreak'), w).toBe(true);
      expect(h.hp, w).toBe(HERO.hp);
    }
  });
});

describe('a striped blow blocked', () => {
  const striped = blowOf({ dmg: 40, knock: 14, unblockable: true });
  it('lets 25% through a Warrior\'s block and 40% through a Healer\'s, for more stamina and a bigger shove', () => {
    for (const w of blockers) {
      const { room, h, e } = duel(w), ev: FightEvent[] = [];
      const st = h.stamina;
      hitHero(e, { ...striped }, h, room.time, ev);
      const share = WEAPONS[w].cls === 'WARRIOR' ? 0.25 : 0.4;
      expect(HERO.hp - h.hp, w).toBe(Math.round(40 * share));
      expect(ev.some((x) => x.k === 'block' && x.striped), w).toBe(true);
      expect(st - h.stamina, w).toBeCloseTo(blockBreath(h, 40) * GUARD.striped.cost);
      // No counter from a striped block.
      expect(h.counterUntil, w).toBeLessThan(room.time);
      // The shove: harder than a red block's.
      const red = duel(w);
      hitHero(red.e, blowOf({ dmg: 40, knock: 14 }), red.h, red.room.time, []);
      expect(Math.abs(h.kvy ?? 0), w).toBeGreaterThan(Math.abs(red.h.kvy ?? 0));
    }
  });

  it('only facing it for a Warrior (from behind it lands whole); a Healer\'s ward meets it from any side', () => {
    const war = duel('sword', true);
    hitHero(war.e, { ...striped }, war.h, war.room.time, []);
    expect(HERO.hp - war.h.hp).toBe(40);
    const heal = duel('mace', true);
    hitHero(heal.e, { ...striped }, heal.h, heal.room.time, []);
    expect(HERO.hp - heal.h.hp).toBe(16);
  });

  it('a dodge class is unchanged: it can\'t block, and takes the striped blow whole', () => {
    for (const w of ['daggers', 'longbow', 'wand'] as WeaponId[]) {
      const { room, h, e } = duel(w);
      hitHero(e, { ...striped }, h, room.time, []);
      expect(HERO.hp - h.hp, w).toBe(40);
    }
  });
});

describe('a Warrior in front of a butcher', () => {
  it('blocking a butcher for 40 s: no guard break, never down, only the striped slams\' share lost', () => {
    const s = standBlock('sword', 40);
    expect(s.breaks).toBe(0);
    expect(s.downs).toBe(0);
    expect(s.blocks).toBeGreaterThanOrEqual(10);
    expect(s.lost).toBeLessThanOrEqual(80);
  });

  it('every Warrior kit holds 40 s against an ordinary butcher; a harder one presses the dear guards on stamina', () => {
    for (const w of CLASS_KITS.WARRIOR) expect(standBlock(w, 40).downs, w).toBe(0);
    const big = standBlock('greatsword', 40, 1.35);
    expect(big.breaks).toBeGreaterThan(0);
    expect(standBlock('sword', 40, 1.35).breaks).toBe(0);
  });

  it('stepping out of the slam is still better than blocking it', () => {
    const block = standBlock('sword', 40), walk = standBlock('sword', 40, 1, true);
    expect(walk.lost).toBeLessThan(block.lost);
  });
});

describe('the wood is gentler', () => {
  it('its numbers: slower, softer drilled goblins; a softer, slower Stoker', () => {
    expect(WOOD_EASE.dmg).toBeLessThan(1);
    expect(WOOD_EASE.stoker).toBeGreaterThan(1);
    expect(VARIANTS.stoker.hp).toBeLessThan(520);
  });

  it('a first run per class, answering half the blows: through every lesson and the Stoker killed, down twice at most', () => {
    for (const c of CLASS_ORDER) {
      const r = woodRun(c, 0.5);
      expect(r.forced[4], `${c} beat the Stoker`).toBe(false);
      expect(r.downs.reduce((a, b) => a + b, 0), c).toBeLessThanOrEqual(2);
      expect(r.downs.slice(0, 4).every((d) => d === 0), c).toBe(true);
    }
  }, 120000);
});
