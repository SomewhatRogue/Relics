// Plate slows only those not made for it (Kyle, 2026-11-27): a Warrior or Cleric walks at full pace in it.
import { describe, expect, it } from 'vitest';
import { gearStats } from '../src/shared/gear';
import { ARMOR } from '../src/shared/budget';
import type { Item } from '../src/shared/loot';

const plate = { name: 'PLATE', slot: 'armor', armor: 'heavy', mods: [] } as unknown as Item;

describe('armour and pace', () => {
  it('a Warrior and a Cleric walk unslowed in plate; a Ranger, Rogue or Mage is slowed', () => {
    expect(gearStats(undefined, plate, [], null, 'WARRIOR').speed).toBe(1);
    expect(gearStats(undefined, plate, [], null, 'HEALER').speed).toBe(1);
    for (const c of ['RANGER', 'ROGUE', 'MAGE'] as const) expect(gearStats(undefined, plate, [], null, c).speed).toBeCloseTo(ARMOR.heavy.speed);
  });
});
