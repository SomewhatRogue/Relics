/**
 * Prices set by time (docs/design/economy.md section 3): each target in medium jobs of copper, the unit
 * scripts/income.ts measures (JOB_COPPER, held by tests/income.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { JOB_COPPER } from '../src/shared/coins';
import { POTIONS } from '../src/shared/potions';
import { RECHARGE } from '../src/shared/church';
import { DRILLS, DRILL_ORDER, SKILL_STEPS, TEACHES, drillPrice } from '../src/shared/drills';
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
    for (const id of DRILL_ORDER.filter((d) => DRILLS[d].max === 5)) {
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
