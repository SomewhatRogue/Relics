/**
 * Prices set by time (docs/design/economy.md section 3): each target in medium jobs of copper, the unit
 * scripts/income.ts measures (JOB_COPPER, held by tests/income.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { JOB_COPPER } from '../src/shared/coins';
import { POTIONS } from '../src/shared/potions';
import { RECHARGE } from '../src/shared/church';
import { DRILLS, STAT_DRILLS, SKILL_STEPS, TEACHES, drillPrice, fitRanks } from '../src/shared/drills';
import { PRICE } from '../src/shared/prices';
import { PLUS_GOLD } from '../src/shared/forgeplus';

const inJobs = (copper: number) => copper / JOB_COPPER;

describe('prices set by time', () => {
  it('a Bitter and a relic charge: a part of a job', () => {
    expect(inJobs(POTIONS.bitter.price)).toBeLessThan(0.34);
    expect(inJobs(RECHARGE.perCharge)).toBeLessThan(0.34);
    for (const p of Object.values(POTIONS)) expect(inJobs(p.price)).toBeLessThan(0.5);
  });
  it('the next stat rank: one or two jobs early, four or five late', () => {
    for (const id of STAT_DRILLS) {
      expect(inJobs(drillPrice(id, 0))).toBeGreaterThanOrEqual(1);
      expect(inJobs(drillPrice(id, 0))).toBeLessThanOrEqual(2);
      expect(inJobs(drillPrice(id, DRILLS[id].max - 1))).toBeGreaterThanOrEqual(4);
      expect(inJobs(drillPrice(id, DRILLS[id].max - 1))).toBeLessThanOrEqual(5);
    }
  });
  it('a new skill from the trainer: an evening, five or six jobs (the first, at level 3, sooner)', () => {
    expect(inJobs(TEACHES.skill.price)).toBeLessThan(5);
    for (const s of SKILL_STEPS.slice(1)) {
      expect(inJobs(s.price)).toBeGreaterThanOrEqual(5);
      expect(inJobs(s.price)).toBeLessThanOrEqual(6);
    }
  });
  it('a FORGED piece three or four jobs, a TOLMOUTH piece a couple of evenings', () => {
    expect(inJobs(PRICE.forged)).toBeGreaterThanOrEqual(3);
    expect(inJobs(PRICE.forged)).toBeLessThanOrEqual(4);
    expect(inJobs(PRICE.tolmouth)).toBeGreaterThanOrEqual(10);
    expect(inJobs(PRICE.tolmouth)).toBeLessThanOrEqual(12);
  });
  it("Halvard's +4 and +5: weeks (a week of an hour a day is about 40 jobs), the low ones a job or a few", () => {
    expect(inJobs(PLUS_GOLD[1])).toBeLessThanOrEqual(1);
    expect(inJobs(PLUS_GOLD[4])).toBeGreaterThanOrEqual(25);
    expect(inJobs(PLUS_GOLD[4] + PLUS_GOLD[5])).toBeGreaterThanOrEqual(80);
  });
});

describe('fewer, bigger stat ranks (economy.md section 4)', () => {
  it('three ranks a stat, each about twice what a rank was, the top total about the same', () => {
    const old = { power: 0.05, health: 8, speed: 0.03, crit: 0.04, wind: 0.08 } as const;
    for (const id of STAT_DRILLS) {
      expect(DRILLS[id].max).toBe(3);
      expect(DRILLS[id].per / old[id as keyof typeof old]).toBeGreaterThan(1.55);
      expect(Math.abs(DRILLS[id].per * 3 - old[id as keyof typeof old] * 5) / (old[id as keyof typeof old] * 5)).toBeLessThan(0.06);
    }
  });
  it('an old hero\'s five small ranks become the nearest big rank, once; other drills untouched', () => {
    const h = { drills: { power: 5, health: 2, speed: 1, crit: 0, skill: 2 } };
    fitRanks(h, {});
    expect(h.drills).toEqual({ power: 3, health: 1, speed: 1, crit: 0, skill: 2 });
    fitRanks(h, { ranks: 1 });
    expect(h.drills.power).toBe(3);
    const fresh = { drills: { power: 2 }, ranks: 1 };
    fitRanks(fresh, fresh);
    expect(fresh.drills.power).toBe(2);
  });
});
