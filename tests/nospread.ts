/**
 * For a test of some other rule that checks exact hit numbers: every weapon's spread off while its file runs, so each
 * hit is today's hit (docs/design/damage-ranges.md). Call once at the top of the file.
 */
import { afterAll, beforeAll } from 'vitest';
import { SPREAD } from '../src/shared/tuning';

export function noSpread(): void {
  const saved = { ...SPREAD };
  beforeAll(() => void Object.keys(SPREAD).forEach((k) => (SPREAD[k] = 0)));
  afterAll(() => void Object.assign(SPREAD, saved));
}
