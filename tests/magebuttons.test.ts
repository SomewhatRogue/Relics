/** The Mage's ELEMENT button (sim/channel.ts), its class skill GRASP (sim/grasp.ts), and old saves (Kyle, 2026-11-04). */
import { describe, expect, it } from 'vitest';
import { CHANNEL, CLASS_SKILL, GRASP, HERO, SKILL_CHOICES, abilitiesOf } from '../src/shared/tuning';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { knowsSkill } from '../src/shared/skillteach';
import { graspShare } from '../src/sim/grasp';
import type { FightEvent } from '../src/sim/types';
import { lost, mageArena } from './magearena';

describe('the ELEMENT button', () => {
  it('turns the spellbook at once, waits out its cooldown, primes the next spell, and goes round', () => {
    const a = mageArena('wand', [[2, 2]]);
    // Not taught any skill yet: the element is the spellbook, so it switches all the same.
    a.h.learned = [];
    let ev = a.run(0.1, { elementSeq: 1 });
    expect(ev.find((x) => x.k === 'channeled')).toMatchObject({ el: 'frost' });
    expect(a.h.primed).toBe(true);
    expect(a.h.act).toBe('idle');
    // Pressed again inside the cooldown: it waits, then turns once.
    ev = a.run(0.3, { elementSeq: 2 });
    expect(a.h.augments.channel).toBe('frost');
    ev = a.run(CHANNEL.cooldown, { elementSeq: 2 });
    expect(a.h.augments.channel).toBe('storm');
    expect(ev.filter((x) => x.k === 'channeled').length).toBe(1);
    a.run(CHANNEL.cooldown + 0.1, { elementSeq: 3 });
    expect(a.h.augments.channel).toBe('fire');
  });

  it('the first spell after a turn is primed (x1.5), and only the first', () => {
    const a = mageArena('wand', [[9, 5]], 'storm');
    a.run(0.1, { elementSeq: 1 });
    expect(a.h.augments.channel).toBe('fire');
    const first = a.tap(0.6, { elementSeq: 1 }).find((x): x is Extract<FightEvent, { k: 'shoot' }> => x.k === 'shoot');
    expect(first?.primed).toBe(true);
    const second = a.tap(0.6, { elementSeq: 1 }).find((x): x is Extract<FightEvent, { k: 'shoot' }> => x.k === 'shoot');
    expect(second?.primed).toBeUndefined();
  });

  it("does nothing for anyone but a Mage", () => {
    const a = mageArena('sword', [[2, 2]]);
    const ev = a.run(0.3, { elementSeq: 1 });
    expect(ev.some((x) => x.k === 'channeled')).toBe(false);
  });
});

describe('GRASP', () => {
  it("is the Mage's class skill, first of its three", () => {
    expect(CLASS_SKILL.MAGE).toBe('grasp');
    expect(SKILL_CHOICES.MAGE).toEqual(['grasp', 'firering', 'tether']);
  });

  it('drags goblins in the cone in front to just ahead of you, staggered; not those behind or wide; costs magic', () => {
    const a = mageArena('wand', [[9, 5], [10.2, 5.4], [9, 12], [14, 9]], 'fire', true);
    const ev = a.run(0.6, { relicSeq: 1 });
    expect(ev.find((x) => x.k === 'magic')).toMatchObject({ n: GRASP.cost });
    expect(a.h.stamina).toBeLessThanOrEqual(HERO.stamina - GRASP.cost + 1);
    const spot = { x: 9, y: 9 - GRASP.to };
    for (const e of a.es.slice(0, 2)) expect(Math.hypot(e.x - spot.x, e.y - spot.y)).toBeLessThan(1.3);
    expect(ev.filter((x) => x.k === 'grasped').length).toBe(2);
    // (Those two only walked toward you, as goblins do.)
    expect(a.es[2].y).toBeGreaterThan(10.5);
    expect(a.es[3].x).toBeGreaterThan(12);
    expect(a.h.relicReady.grasp - a.room.time).toBeGreaterThan(GRASP.cooldown - 1);
  });

  it('a butcher or a shield-bearer barely moves', () => {
    const a = mageArena('wand', [[9, 4.5]], 'fire', true, 'butcher');
    const g = a.run(0.6, { relicSeq: 1 }).find((x): x is Extract<FightEvent, { k: 'grasped' }> => x.k === 'grasped')!;
    expect(g.y2 - g.y).toBeLessThan((9 - GRASP.to - 4.5) * GRASP.heavy + 0.01);
    expect(graspShare(a.e)).toBe(GRASP.heavy);
    expect(lost(a.e)).toBe(0);
  });

  it('short of magic, it fizzles: nothing moves, nothing spent, no cooldown', () => {
    const a = mageArena('wand', [[9, 5]], 'fire', true);
    Object.assign(a.h, { stamina: GRASP.cost - 5, staminaAt: 99 });
    const ev = a.run(0.4, { relicSeq: 1 });
    expect(ev.some((x) => x.k === 'fizzle')).toBe(true);
    expect(ev.some((x) => x.k === 'grasp')).toBe(false);
    expect(a.h.stamina).toBe(GRASP.cost - 5);
    expect(a.h.relicReady.grasp).toBe(0);
  });
});

describe('old saves', () => {
  it('a Mage taught the Elemental Channel knows GRASP, and carries it', () => {
    const old = { ...newProfile('MAGE', 'VELL'), learned: ['skill' as const], skill: 'channel' as never, augments: { channel: 'storm' as const } };
    const s = fromJson({ heroes: [old], current: 0, world: newWorld() })!;
    const p = s.heroes[0];
    expect(p.skill).toBe('grasp');
    expect(knowsSkill(p, 'grasp')).toBe(true);
    expect(p.augments.channel).toBe('storm');
    expect(abilitiesOf('MAGE', '', p.skill)).toEqual(['grasp']);
    // Even a hero saved with the channel in hand some other way still gets GRASP.
    expect(abilitiesOf('MAGE', 'javelin', 'channel')).toEqual(['grasp', 'javelin']);
    // One not yet taught it doesn't know it.
    expect(knowsSkill({ ...newProfile('MAGE'), learned: [] }, 'grasp')).toBe(false);
  });
});
