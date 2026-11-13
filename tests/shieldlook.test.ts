import { describe, expect, it } from 'vitest';
import { DEVICES, FIELDS, SHAPES, TRIMS, defaultShield, fitShield, packShield, unpackShield } from '../src/shared/shieldlook';

describe('a Warrior shield look', () => {
  it('fits anything heard to a real look, the red heater with the gold chevron by default', () => {
    expect(fitShield(undefined)).toEqual(defaultShield());
    expect(fitShield({ shape: 'tower', field: 99, device: 'skull', trim: 'jade' })).toEqual({ ...defaultShield(), field: FIELDS - 1 });
    expect(fitShield({ shape: 'kite', field: 2.7, device: 'lantern', trim: 'iron' })).toEqual({ shape: 'kite', field: 2, device: 'lantern', trim: 'iron' });
  });
  it('packs small and comes back the same, every combination', () => {
    for (const shape of SHAPES) for (let field = 0; field < FIELDS; field++) for (const device of DEVICES) for (const trim of TRIMS) {
      const s = { shape, field, device, trim };
      expect(unpackShield(JSON.parse(JSON.stringify(packShield(s))))).toEqual(s);
    }
    expect(unpackShield('nope')).toBeUndefined();
    expect(unpackShield([9, -3, 'x', null])).toEqual({ ...defaultShield(), field: 0 });
  });
});
