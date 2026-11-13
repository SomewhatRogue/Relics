import { describe, expect, it } from 'vitest';
import { coinCol, coinParts, coins, coinsHtml, COIN_COL } from '../src/shared/coins';

describe('coins', () => {
  it('splits copper into gold, silver and copper at 100 to 1, zero parts left out', () => {
    expect(coins(0)).toBe('0c');
    expect(coins(7)).toBe('7c');
    expect(coins(100)).toBe('1s');
    expect(coins(250)).toBe('2s 50c');
    expect(coins(30420)).toBe('3g 4s 20c');
    expect(coins(10005)).toBe('1g 5c');
    expect(coins(-50)).toBe('-50c');
  });
  it('rounds stray fractions', () => expect(coinParts(99.6)).toEqual([[1, 's']]));
  it('marks each part with its coin', () => {
    expect(coinsHtml(30420)).toContain('<span class="cn cg">3g</span>');
    expect(coinsHtml(30420)).toContain('<span class="cn cc">20c</span>');
  });
  it('colours a floating number by its biggest coin', () => {
    expect(coinCol(40)).toBe(COIN_COL.c);
    expect(coinCol(140)).toBe(COIN_COL.s);
  });
});
