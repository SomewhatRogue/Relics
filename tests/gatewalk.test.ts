import { describe, expect, it } from 'vitest';
import { watchBack } from '../src/client/gatewalk';

describe('walking back in at the gate', () => {
  const home = { x: 10, y: 40 };
  it('does not ask on arrival', () => expect(watchBack(false, { x: 10, y: 39 }, home).ask).toBe(false));
  it('asks once back after being far', () => {
    const far = watchBack(false, { x: 10, y: 20 }, home);
    expect(far.far).toBe(true);
    expect(watchBack(far.far, { x: 10, y: 38.5 }, home)).toEqual({ far: false, ask: true });
  });
  it('does not ask again until far again', () => expect(watchBack(false, { x: 10, y: 39 }, home).ask).toBe(false));
});
