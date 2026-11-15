/**
 * Rarity, measured (docs/design/gear-levels.md section 2): the board's ordinary jobs played alone
 * (scripts/incomebot.ts), every tier roll's exact odds summed (scripts/rarity.ts), an hour being six
 * jobs. A row per tier, at levels 1 and 10, and the level lean kept gentle.
 */
import { describe, expect, it } from 'vitest';
import { perHour } from '../scripts/rarity';
import { plainJobs } from '../scripts/incomebot';

describe('rarity', () => {
  const jobs = plainJobs(3), at = { 1: perHour(1, jobs), 10: perHour(10, jobs) };
  const each = (f: (h: (typeof at)[1]) => void) => Object.values(at).forEach(f);
  it('FINE: a few a job', () => each((h) => (expect(h.fine / 6).toBeGreaterThan(1), expect(h.fine / 6).toBeLessThan(5))));
  it('FORGED: one or two a job', () => each((h) => (expect(h.forged / 6).toBeGreaterThan(0.9), expect(h.forged / 6).toBeLessThan(2.2))));
  it('PRE-WAR: one every hour or two', () => each((h) => (expect(h.tolmouth).toBeGreaterThan(0.45), expect(h.tolmouth).toBeLessThan(1.05))));
  it('TOUCHED: about one a week of play (six hours)', () => each((h) => (expect(1 / h.touched).toBeGreaterThan(4), expect(1 / h.touched).toBeLessThan(9))));
  it('TURNING: one in a few weeks', () => each((h) => (expect(1 / h.turning).toBeGreaterThan(14), expect(1 / h.turning).toBeLessThan(40))));
  it('HUNGRY: rarer still', () => each((h) => (expect(h.hungry).toBeGreaterThan(0), expect(h.hungry).toBeLessThan(h.turning / 2))));
  it('leans up only a little with the level: a level-10 party finds the rare three under a quarter more often', () => {
    for (const t of ['touched', 'turning', 'hungry'] as const) expect(at[10][t] / at[1][t]).toBeLessThan(1.25);
  });
}, 240000);
