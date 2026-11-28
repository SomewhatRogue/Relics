import { describe, expect, it } from 'vitest';
import { folkIcons } from '../src/client/folkicons';
import type { Npc } from '../src/shared/arena';

const n = (name: string, talk: string, arg?: number, extra: Partial<Npc> = {}): Npc => ({ name, x: 5, y: 5, talk, look: 'villager', arg, ...extra });

describe('folk icons', () => {
  const folk = [n('PENNOCK', 'fish'), n('ABEL', 'range'), n('MOLL', 'dice'), n('WATCH', 'arm'), n('SHARP', 'knives'), n('COLE', 'trainer', 0), n('MAEVE', 'trainer', 1), n('WENNA', 'chat'), n('SHOP', 'vendor')];
  it('gives each pastime giver its own icon and every trainer the trainer one', () => {
    expect(folkIcons(folk, 0, null, []).map((f) => f.kind)).toEqual(['fish', 'range', 'dice', 'arm', 'knives', 'trainer', 'trainer']);
  });
  it('brightens only your own class trainer', () => {
    expect(folkIcons(folk, 0, 'RANGER', []).filter((f) => f.mine).length).toBe(1);
    expect(folkIcons(folk, 0, 'RANGER', []).find((f) => f.mine)?.y).toBe(5);
    expect(folkIcons(folk, 0, null, []).some((f) => f.mine)).toBe(false);
  });
  it('skips muted folk and folk sent home', () => {
    expect(folkIcons([n('A', 'fish', 0, { mute: true }), n('B', 'range')], 0, null, [], (x) => x.name === 'B')).toEqual([]);
  });
  it('lifts the icon over someone with a quest diamond, and follows walkers', () => {
    const walker = n('W', 'arm', 0, { path: [[0, 0], [10, 0]], speed: 1 });
    expect(folkIcons([n('A', 'fish')], 0, null, [{ x: 5.2, y: 5, kind: 'folk' }])[0].raised).toBe(true);
    expect(folkIcons([n('A', 'fish')], 0, null, [{ x: 9, y: 5, kind: 'folk' }])[0].raised).toBe(false);
    expect(folkIcons([walker], 4, null, [])[0].x).toBeCloseTo(4);
  });
});
