import { describe, expect, it } from 'vitest';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { fireHook, stepHook } from '../src/sim/hook';
import type { FightEvent } from '../src/sim/types';

const hookAt = (weapon: 'sword' | 'longbow') => {
  const h = newHero('me', 5, 5), b = newEnemy(1, 'butcher', 9, 5);
  Object.assign(h, { weapon, fx: 1, fy: 0 });
  const k = fireHook(h), ev: FightEvent[] = [];
  for (let i = 0; i < 20 && k.state === 'fly'; i++) stepHook(k, [h], [b], 1, 0.05, ev);
  return k.state;
};

describe('the hook pulls by weight', () => {
  it('a Warrior hauls a butcher in; a Ranger is pulled to it instead', () => {
    expect(hookAt('sword')).toBe('yank');
    expect(hookAt('longbow')).toBe('zip');
  });
});
