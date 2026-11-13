import { describe, expect, it } from 'vitest';
import { memoryNameStore } from '../api/_names';
import { cleanName } from '../api/names';
import { NAME_OK, drawNames, normName } from '../src/shared/names';
import { NAME_POOL } from '../src/shared/namepool';

describe('hero names, one hero each (2026-11-13)', () => {
  it('a name is held once: the same hero may take it again, another may not, and only its holder gives it up', async () => {
    const s = memoryNameStore();
    expect(await s.free(['WREN', 'ODO'])).toEqual([true, true]);
    expect(await s.claim('WREN', 'haaaaaaa1')).toBe(true);
    expect(await s.claim('WREN', 'haaaaaaa1')).toBe(true);
    expect(await s.claim('WREN', 'hbbbbbbb2')).toBe(false);
    expect(await s.free(['WREN', 'ODO'])).toEqual([false, true]);
    await s.release('WREN', 'hbbbbbbb2');
    expect(await s.claim('WREN', 'hbbbbbbb2')).toBe(false);
    await s.release('WREN', 'haaaaaaa1');
    expect(await s.claim('WREN', 'hbbbbbbb2')).toBe(true);
  });
  it('names compare in capitals with spaces closed up; letters only, two to twelve', () => {
    expect(normName('  wren   of  the  fold ')).toBe('WREN OF THE');
    expect(cleanName('wren')).toBe('WREN');
    for (const bad of ['W', 'WR3N', '<b>', "WREN''", 'A-']) expect(cleanName(bad)).toBeNull();
    for (const ok of ["O'DELL", 'ANNE-MAY', 'OLD TOM']) expect(NAME_OK.test(ok)).toBe(true);
  });
  it('the pool is all good names, none twice, and a draw skips what you have', () => {
    expect(NAME_POOL.every((n) => NAME_OK.test(n) && normName(n) === n)).toBe(true);
    expect(new Set(NAME_POOL).size).toBe(NAME_POOL.length);
    const d = drawNames(3, [NAME_POOL[0]]);
    expect(d).not.toContain(NAME_POOL[0]);
  });
});
