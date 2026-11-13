/**
 * Copper, silver and gold (docs/design/economy.md section 1). The purse and every price are kept in copper
 * (the save's `gold` field counts copper); 100 copper is a silver, 100 silver a gold. Shown as coins with
 * the zero parts left out: `3g 4s 20c`. One formatter for every price, reward, pay line and board.
 */
export const COPPER_PER_SILVER = 100;
export const COPPER_PER_GOLD = 100 * COPPER_PER_SILVER;

export type Coin = 'g' | 's' | 'c';
/** Each coin's colour: the text, the coin mark and the floating numbers in a run. */
export const COIN_COL: Record<Coin, string> = { g: '#ffd24a', s: '#d8e0ea', c: '#d98a4e' };

/** A copper count as its coins, biggest first, the zero parts left out (nothing at all: one `0c`). */
export function coinParts(copper: number): [number, Coin][] {
  const n = Math.max(0, Math.round(Math.abs(copper)));
  const parts: [number, Coin][] = [[Math.floor(n / COPPER_PER_GOLD), 'g'], [Math.floor(n / COPPER_PER_SILVER) % 100, 's'], [n % 100, 'c']];
  const kept = parts.filter(([v]) => v > 0);
  return kept.length ? kept : [[0, 'c']];
}

/** Plain text, for the canvas and anywhere markup can't go: `3g 4s 20c`, `-50c`. */
export const coins = (copper: number): string =>
  (copper < 0 ? '-' : '') + coinParts(copper).map(([v, k]) => `${v}${k}`).join(' ');

/** For panels and buttons: each part in its own colour with a small coin mark (client/coins.css). */
export const coinsHtml = (copper: number): string =>
  `<span class="coins">${copper < 0 ? '-' : ''}${coinParts(copper).map(([v, k]) => `<span class="cn c${k}">${v}${k}</span>`).join(' ')}</span>`;

/** The colour of the biggest coin in an amount, for a floating number. */
export const coinCol = (copper: number): string => COIN_COL[coinParts(copper)[0][1]];

/** What a medium job (about 10 minutes) brings in, in copper, as scripts/income.ts measures it: the unit
 *  every price is set against (economy.md section 3; tests/income.test.ts holds it). */
export const JOB_COPPER = 150;
/** A price of `n` medium jobs, in copper, to the nearest 5 (economy.md section 3: prices set by time). */
export const jobs = (n: number): number => Math.round((JOB_COPPER * n) / 5) * 5;

/**
 * The purse carried over (economy.md section 6): a hero saved before the three coins had a purse in the old
 * gold, kept as copper one for one through slices 1 and 2; prices moved by about this much (the geometric
 * mean over 64 prices, scripts/income.ts era, docs/decisions/economy.md), so the purse moves by it once and
 * buys what it did. `coin` on the hero marks it done, so it never runs twice.
 */
export const PURSE_RATIO = 1.45;
export const COIN_VERSION = 1;
/** Convert `out`'s purse if the hero as saved (`saved`) predates the coins. */
export function fitPurse(out: { gold: number; coin?: number }, saved: { coin?: number }): void {
  if ((saved.coin ?? 0) < COIN_VERSION) out.gold = Math.round(Math.max(0, Number(out.gold) || 0) * PURSE_RATIO);
  out.coin = COIN_VERSION;
}
