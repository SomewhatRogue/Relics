/**
 * The income targets (docs/design/economy.md slice 2), measured by playing the board's ordinary jobs
 * (scripts/incomebot.ts): a medium job brings in about 1s 50c, and the job's own pay is most of it. Prices
 * (slice 3) are set in jobs from this number, so it's held here.
 */
import { describe, expect, it } from 'vitest';
import { playJob, plainJobs } from '../scripts/incomebot';
import { JOB_COPPER as MEDIUM_JOB } from '../src/shared/coins';

describe('income', () => {
  const takes = plainJobs(3).map((j) => playJob(j, 5));
  const sum = (k: 'pay' | 'total', t = takes) => t.reduce((s, x) => s + x[k], 0);
  it('a medium job brings in about 1s 50c', () => {
    const med = takes.filter((t) => t.size === 'medium');
    const avg = sum('total', med) / med.length;
    expect(avg).toBeGreaterThan(MEDIUM_JOB * 0.8);
    expect(avg).toBeLessThan(MEDIUM_JOB * 1.25);
  });
  it("the job's pay is most of it, not the kills", () => expect(sum('pay') / sum('total')).toBeGreaterThan(0.58));
}, 120000);
