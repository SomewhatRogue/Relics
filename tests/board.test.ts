/** A shield-bearer's board against shots (sim/board.ts): plain shots from the front stop dead, from the side or back they land, a full draw or a perfect shot punches through for less, bursts go round. */
import { describe, expect, it } from 'vitest';
import { TICK, VARIANTS, WEAPONS } from '../src/shared/tuning';
import { blast, shoot, stepBolt } from '../src/sim/bolts';
import { newEnemy } from '../src/sim/enemies';
import { type World } from '../src/sim/elements';
import { newHero } from '../src/sim/hero';
import type { Enemy, FightEvent, Hero } from '../src/sim/types';

type KitId = keyof typeof WEAPONS;

/** A shield-bearer at (9, 7) facing (fx, fy), with health to spare, and a Ranger at (9, 10) aiming up at it. */
function setup(fx: number, fy: number, weapon: KitId = 'longbow') {
  const h: Hero = Object.assign(newHero('me', 9, 10), { fx: 0, fy: -1, weapon });
  const e: Enemy = Object.assign(newEnemy(1, 'scrapper', 9, 7), { variant: 'shield', hp: 999, maxHp: 999, alert: true, fx, fy, cooldown: 99 });
  const ev: FightEvent[] = [], w: World = { heroes: [h], enemies: [e], javelins: [], props: [], now: 1, ev };
  return { h, e, ev, w };
}

/** Loose `weapon`'s shot (`charge`: a full draw; `perfect`: on the flash); what it took off and the events. */
function shot(fx: number, fy: number, o: { weapon?: KitId; charge?: boolean; perfect?: boolean } = {}) {
  const { h, e, ev, w } = setup(fx, fy, o.weapon);
  Object.assign(h, { heavy: !!(o.charge || o.perfect), power: o.charge || o.perfect ? 1 : 0.4, perfect: !!o.perfect });
  const s = WEAPONS[o.weapon ?? 'longbow'].heavy;
  const b = shoot(h, { ...s, dmg: 20 }, '');
  for (let i = 0; i < 60 && stepBolt(b, w, TICK); i++);
  return { took: 999 - e.hp, ev, b };
}

describe("a shield-bearer's board against shots", () => {
  it('a plain arrow into its front is stopped dead with a BLOCKED; the same arrow in its back lands', () => {
    const front = shot(0, 1), back = shot(0, -1);
    expect(front.took).toBe(Math.round(20 * VARIANTS.shield.shot));
    expect(front.took).toBe(0);
    expect(front.ev.some((x) => x.k === 'deflect')).toBe(true);
    expect(back.took).toBe(20);
    expect(back.ev.some((x) => x.k === 'deflect')).toBe(false);
  });

  it('from the side it lands in full', () => {
    expect(shot(1, 0).took).toBe(20);
    // Turned past the board's cone (it covers 60 degrees either side of its facing).
    const a = Math.acos(VARIANTS.shield.cone) + 0.05;
    expect(shot(Math.sin(a), Math.cos(a)).took).toBe(20);
  });

  it('a full draw or a perfect arrow punches through for less', () => {
    expect(shot(0, 1, { charge: true }).took).toBe(Math.round(20 * VARIANTS.shield.through));
    const sure = shot(0, 1, { perfect: true });
    expect(sure.took).toBeGreaterThan(0);
    expect(sure.ev.some((x) => x.k === 'deflect')).toBe(false);
  });

  it("a plain crossbow bolt is stopped; a glinted one gets through", () => {
    expect(shot(0, 1, { weapon: 'crossbow' }).took).toBe(0);
    expect(shot(0, 1, { weapon: 'crossbow', perfect: true }).took).toBeGreaterThan(0);
  });

  it('caught unaware or held fast, the board is down', () => {
    const { h, e, w } = setup(0, 1);
    Object.assign(e, { act: 'stunned', actDur: 9, actT: 0 });
    const b = shoot(Object.assign(h, { heavy: false, power: 0 }), { ...WEAPONS.longbow.heavy, dmg: 20 }, '');
    for (let i = 0; i < 60 && stepBolt(b, w, TICK); i++);
    expect(e.hp).toBeLessThan(999);
  });

  it('a burst goes round the board', () => {
    const { h, e, w } = setup(0, 1);
    const b = shoot(h, { ...WEAPONS.longbow.heavy, dmg: 20, burst: 1.5 }, 'fire');
    blast(w, b, e.x, e.y + 0.5);
    expect(e.hp).toBeLessThan(999);
  });
});
